const { MongoClient } = require('mongodb');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

const mongoURI =
    'mongodb+srv://wardendbuser:wardendbpassword@warden.ue8wuic.mongodb.net/?retryWrites=true&w=majority';

// Enable CORS, probably insecure?
app.use(cors());

app.get('/api/reports', async (req, res) => {
    try {
        const client = await MongoClient.connect(mongoURI);
        const db = client.db('reports');
        const collection = db.collection('reports');

        const reports = await collection.find({}).toArray();
        res.json(reports);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('Client connected');
    socket.on('disconnect', () => console.log('Client disconnected'));
    socket.on('message', (message) => {


        // Punish logic (from web)
        if (message.action === "punish") {
            console.log("would punish + " + message.username)
        }

        // New report logic (from source)
        if (message.action === "newReport") {
            addReport(message).then(r => console.log("added report"));
        }
        console.log('received:', message);
    });
});

// Start the server
server.listen(8000, () => {
    console.log('Server is running on port 8000');
});

// Handle MongoDB connection errors
server.on('listening', async () => {
    try {
        const client = await MongoClient.connect(mongoURI);
        client.close();
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
});

// MongoDB Functions

async function addReport(message) {
    // New report logic (from source)
    if (message.action === "newReport") {
        try {
            const client = await MongoClient.connect(mongoURI);
            const db = client.db('reports'); // Replace with your MongoDB database name
            const collection = db.collection('reports'); // Replace with your collection name

            // Assuming the message object contains the report data
            const newReport = {

                username: message.username,
                reason: message.reason,

            };

            const result = await collection.insertOne(newReport);
            console.log('New report added:', result.insertedId);

            io.emit('newReport', newReport);

            client.close();
        } catch (error) {
            console.error('Failed to insert new report:', error);
        }
    }

}