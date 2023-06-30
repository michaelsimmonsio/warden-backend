const { MongoClient, ObjectId} = require('mongodb');
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

        if (message.action === "deleteReport") {
            console.log("would delete report" + message.id);
            // deleteReport(message);
            manualAddReports(10);
        }

        if (message.action === "rejectReport") {
            console.log("would reject report" + message.id);
            rejectReport(message);

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

            await client.close();
        } catch (error) {
            console.error('Failed to insert new report:', error);
        }
    }

}

async function deleteReport(message) {
    try {
        const client = await MongoClient.connect(mongoURI);
        const db = client.db('reports');
        const collection = db.collection('reports');

        // This is why we love Typescript!
        // Searching by "id" doesn't work, needs to be cast as an ObjectId first
        const id = new ObjectId(message.id)

        const result = await collection.deleteOne({ _id: id });
        console.log("attempting to delete: " + id)

        if (result.deletedCount === 1) {
            console.log('Report deleted');
            await manualAddReports(10);
        }

        if (result.deletedCount === 0) {
            console.log('Report not found');
        }
        await client.close();
    } catch (error) {
        console.error('Failed to delete report:', error);
    }
}

async function manualAddReports(number) {
    try {
        console.log("here 1")
        const client = await MongoClient.connect(mongoURI);
        const db = client.db('reports');
        const collection = db.collection('reports');

        let unix_timestamp = Date.now();

        const newReport = {
            username: 'TestUsername',
            uid: 'testUID',
            reportedUser: 'TestReportedUser',
            reporter: 'TestReporter',
            reason: 'TestReason',
            context: 'TestContext',
            date: 'TestDate',
            status: 'TestStatus',
            contextJson: {
                "12345": "test",
                "12345-1": "test2",
                "12345-2": "test3"
            }
        };

        // Wait for the connection to be established before proceeding
        // await new Promise((resolve, reject) => {
        //     client.on('connect', resolve);
        //     client.on('error', reject);
        // }).then(() => console.log('Connected to MongoDB'));

        for (let i = 0; i < number; i++) {
            const result = await collection.insertOne(newReport);
            console.log('New report added:', result.insertedId + ' ' + i);

            io.emit('newReport', newReport);
        }

        await client.close();
    } catch (error) {
        console.error('Failed to add reports:', error);
    }

}

async function rejectReport(message) {
    // find item in mongodb and change "status" to rejected

    try {

        const client = await MongoClient.connect(mongoURI);
        const db = client.db('reports');
        const collection = db.collection('reports');
        const id = new ObjectId(message.id)

        const result = await collection.findOneAndUpdate({ _id: id }, { $set: { status: "rejected" }});
        console.log("result: " + result)
    } catch(error) {
        console.error('Failed to reject report:', error);
    }

}
