const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ygq6chl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();

        const allBooksCollection = client.db('libraryManagerDB').collection('allBooks');

        // Get all Books
        app.get('/allBooks', async (req, res) => {
            const cursor = allBooksCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        });

        // Get a single book by ID
        app.get('/allBooks/:id', async (req, res) => {
            const { id } = req.params;
            const book = await allBooksCollection.findOne({ _id: new ObjectId(id) });
            if (book) {
                res.send(book);
            } else {
                res.status(404).send({ message: 'Book not found' });
            }
        });


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Library Manager server is Running')
});

app.listen(port, () => {
    console.log(`Library Manager is running on Port: ${port}`)
});

