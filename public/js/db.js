const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://Sheida:FnSLGNFFZnmKqnrL@serverlessinstance0.d5cy7rs.mongodb.net/?retryWrites=true&w=majority";

async function connectToMongoDB() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB!");
        return client.db("location"); // Return the database instance
    } catch (err) {
        console.error("Error connecting to MongoDB:", err);
        throw err;
    }
}

async function insertPositionIntoDB(position) {
    
    const client = new MongoClient(uri);
    console.log('position in insert:', position);
    
    try {
        await client.connect();
        const database = client.db("location");
        const positionCollection = database.collection("positions");
        const result = await positionCollection.insertOne({
            time: position.time,
            lat: position.lat,
            long: position.long,
            color: position.color
        });
        console.log(`Inserted position with ID ${result.insertedId}`);
    } catch (err) {
        console.error("Error inserting position into MongoDB:", err);
    } finally {
        await client.close();
    }
}

// Function to fetch all markers from the database
async function getAllMarkersFromDB() {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const database = client.db("location");
        const positionCollection = database.collection("positions");
        const markers = await positionCollection.find({}).toArray();
        console.log('markers in getAllMarkersFromDB in db.js:', markers);

        return markers;
    } catch (err) {
        console.error("Error fetching markers from MongoDB:", err);
        throw err;
    } finally {
        await client.close();
    }
}


module.exports = { connectToMongoDB, insertPositionIntoDB, getAllMarkersFromDB};
