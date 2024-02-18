const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectToMongoDB, insertPositionIntoDB } = require("./public/js/db.js");

const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.json());

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post("/", async function(req, res) {
  const position = req.body;
  console.log('position in app.js:', position);
  try {
       await insertPositionIntoDB(position);
        res.send(position);
    } catch (error) {
      console.error('Error inserting position into database:', error);
      // Send the error message with status code 500
      res.status(500).send(error.message);
  }
});


connectToMongoDB().then(() => {
    app.listen(3000, function () {
        console.log("The server is running on port 3000");
    });
}).catch(err => {
    console.error("Error starting the server:", err);
});
