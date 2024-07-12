
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

        const borrowedBooksCollection = client.db('libraryManagerDB').collection('borrowedBooks');

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
            }
            else {
                res.status(404).send({ message: 'Book not found' });
            }
        });

        // Update book
        app.put('/update-book/:id', async (req, res) => {

            const { id } = req.params;
            const { bookName, authorName, category, rating, image } = req.body;

            const filter = { _id: new ObjectId(id) };

            const updateBook = {
                $set: {
                    bookName,
                    authorName,
                    category,
                    rating,
                    image
                }
            };

            const result = await allBooksCollection.updateOne(filter, updateBook);

            if (result.modifiedCount === 1) {
                res.status(200).json({ message: 'Book updated successfully' });
            }
            else {
                res.status(404).json({ message: 'Book not found' });
            }
        });

        // Borrow a book
        app.post('/borrow', async (req, res) => {
            const { bookId, userEmail, userName, returnDate, bookName, image } = req.body;

            // Find the book
            const book = await allBooksCollection.findOne({ _id: new ObjectId(bookId) });

            if (book && book.quantity > 0) {
                // Update the book quantity
                await allBooksCollection.updateOne(
                    { _id: new ObjectId(bookId) },
                    { $inc: { quantity: -1 } }
                );

                // Add to borrowed books
                await borrowedBooksCollection.insertOne({
                    bookId,
                    userEmail,
                    userName,
                    bookName,
                    image,
                    returnDate,
                    borrowedDate: new Date()
                });

                return res.status(200).json({ message: 'Book borrowed successfully!' });
            }

            return res.status(400).json({ message: 'Book not available for borrowing.' });
        });


        // Get borrowed books for a specific user
        app.get('/borrowedBooks', async (req, res) => {
            const { email } = req.query;
            const borrowedBooks = await borrowedBooksCollection.find({ userEmail: email }).toArray();
            res.send(borrowedBooks);
        });

        // Return book
        app.post('/return', async (req, res) => {
            const { bookId, userEmail } = req.body;

            // Find the borrowed record
            const borrowedRecord = await borrowedBooksCollection.findOne({ bookId, userEmail });

            if (borrowedRecord) {
                // Increase the book quantity
                await allBooksCollection.updateOne(
                    { _id: new ObjectId(bookId) },
                    { $inc: { quantity: 1 } }
                );

                // Remove the borrowed record
                await borrowedBooksCollection.deleteOne({ _id: borrowedRecord._id });

                return res.status(200).json({ message: 'Book returned successfully!' });
            }

            return res.status(404).json({ message: 'Borrowed record not found.' });
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

