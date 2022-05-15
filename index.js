const express = require('express')
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

//middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.h6v6r.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function run() {
    try {
        client.connect();
        const treatmentsCollection = client.db("doctors-portal").collection("treatments");
        const bookingCollection = client.db("doctors-portal").collection("bookings");

        //get all treatments for appointment page 
        app.get('/treatments', async (req, res) => {
            const query = {}
            const cursor = treatmentsCollection.find(query);
            const treatments = await cursor.toArray()
            res.send(treatments)
        })

        // add a booking 
        app.post('/booking', async(req,res)=>{
            const booking = req.body;
            const query = {treatmentId: booking.treatmentId, date: booking.date, patientEmail: booking.patientEmail}
            const exists = await bookingCollection.findOne(query)
            if (exists) {
                return res.send({success: false, booking:exists})
            }
            const result = await bookingCollection.insertOne(booking)
            res.send({success:true,result})
        })

        //get available slot
        app.get('/available', async(req,res)=>{
            const date = req.query.date;
            //step-1 get all treatments
            const treatments = await treatmentsCollection.find().toArray();
            //step -2 get the bookings of that day 
            const query = {date:date};
            const bookings = await bookingCollection.find(query).toArray();
            // step -3 for each treatments 
            treatments.forEach(treatment=>{
                // step -4 find bookings for that treatment
                const treatmentBookings = bookings.filter(book=>book.treatmentName === treatment.name);
                // step - 5 get slots for treatment booking 
                const  bookedSlots = treatmentBookings.map(book =>book.slot);
                //step -6 get those slots that are not includes in booked slots
                const available = treatment.slots.filter(slot=> !bookedSlots.includes(slot))
                treatment.slots =available
            })
            res.send(treatments)

        })
        //get user specific booking by email 
        app.get('/booking', async(req,res)=>{
            const email = req.query.email;
            const query={patientEmail :email};
            const bookings= await bookingCollection.find(query).toArray();
            res.send(bookings)
        })





    }
    finally {
        // client.close()
    }
}

app.get('/', (req, res) => {
    res.send('Hello server!')
})

app.listen(port, () => {
    console.log(`server running on the port ${port}`)
})

run()