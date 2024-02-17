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
    try {
        const database = client.db("location");
        const positionCollection = database.collection("positions");
        const result = await positionCollection.insertOne(position);
        console.log(`Inserted position with ID ${result.insertedId}`);
    } catch (err) {
        console.error("Error inserting position into MongoDB:", err);
    } finally {
        await client.close();
    }
}

module.exports = { connectToMongoDB, insertPositionIntoDB };
