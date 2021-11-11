const express = require('express');
const app = express();
const cors = require('cors');
const ObjectId = require("mongodb").ObjectId;
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
        const orderCollection = database.collection('orders');
        const userCollection = database.collection('users');

        // get fixed items from collection
        app.get('/bikes', async (req, res) => {
            const cursor = bikeCollection.find({});
            const items = await cursor.limit(6).toArray();
            res.send(items);
        });

        // get single item
        app.get('/bike/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const event = await bikeCollection.findOne(query);
            res.json(event);
        });

        // get individual orders
        app.get('/myOrders/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: { $regex: email } };
            const result = await orderCollection.find(query).toArray();
            console.log(result);
            res.send(result);
        });

        // get all Orders
        app.get('/orders', async (req, res) => {
            const result = await orderCollection.find({}).toArray();
            res.send(result);
        });

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

        // PUT order Status
        app.put('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: "Shipped"
                },
            };
            const result = await orderCollection.updateOne(filter, updateDoc, options);
            console.log(result);
            res.json(result);
        })

        // post order
        app.post('/order', async (req, res) => {
            const result = await orderCollection.insertOne(req.body);
            res.send(result);
        });

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

        // delete order
        app.delete('/myOrders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
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