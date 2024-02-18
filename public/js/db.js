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
    
    const doc = 

      { time: position.time, lat: position.lat, long: position.long}

    ;
    
    try {
        await client.connect();
        const database = client.db("location");
        const positionCollection = database.collection("positions");
        const result = await positionCollection.insertOne(doc);
        console.log(`Inserted position with ID ${result.insertedId}`);
    } catch (err) {
        console.error("Error inserting position into MongoDB:", err);
    } finally {
        await client.close();
    }
}

module.exports = { connectToMongoDB, insertPositionIntoDB };
