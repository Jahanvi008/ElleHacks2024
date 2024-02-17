const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectToMongoDB, insertPositionIntoDB } = require("./public/js/db.js");

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post("/api/position", async (req, res) => {
    const position = req.body.position;
    try {
        await insertPositionIntoDB(position);
        res.send("Position received and inserted into the database.");
    } catch (error) {
        console.error('Error inserting position into database:', error);
        res.status(500).send("Error inserting position into database");
    }
});

connectToMongoDB().then(() => {
    app.listen(3000, function () {
        console.log("The server is running on port 3000");
    });
}).catch(err => {
    console.error("Error starting the server:", err);
});
