const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sydng.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();

        const database = client.db('kbBikes');
        const bikeCollection = database.collection('bikes');
        const userCollection = database.collection('users');

        app.get('/bikes', async (req, res) => {
            console.log("bikes");
            // const email = req.query.email;
            // const date = new Date(req.query.date).toLocaleDateString();

            // const query = { email: email, date: date };
            // const cursor = bikeCollection.find(query);
            // const bikes = await cursor.toArray();
            res.json("Checking...");
        })

        // get users by email
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await userCollection.findOne(query);

            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        // add bikes 
        app.post('/bikes', async (req, res) => {
            const bikes = req.body;
            const result = await bikeCollection.insertOne(bikes);
            res.json(result);
        })

        // add users
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            console.log(result);
            res.json(result);
        })

        // 
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })

        // update user role (admin)
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

    } finally {
        //   await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('kb-bikes is Running...');
})

app.listen(port, () => {
    console.log(`kb-bikes is listening at ${port}`);
})