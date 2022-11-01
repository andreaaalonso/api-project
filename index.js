import express from "express";
import mongoose from "mongoose";
import axios from "axios";
import cors from "cors";

// Creates dictionary containing required mongoose configurations
let mongooseConfig = {
  useNewUrlParser: true,
  useUnifiedTopology: true
}

// Connects to a local mongodb using the previously defined configurations
const url = process.env.MONGO_URL || "mongodb://localhost:27017/test4"

mongoose.connect(url , mongooseConfig)

// Creates new express object
const app = express();
app.use(cors());

// Create variable storing the port that express will connect via
let PORT = 3001

// Starts up the express server via the port previously defined
const port = process.env.PORT || 3001

app.listen(port, () => console.log(`app listening on port ${port}`))


// Creates an array containing all possible endpoints
let excuseEndpointsArr = ['family', 'office', 'children', 'college', 'party', 'funny', 'unbelievable', 'developers', 'gaming'];

// Creates a new Mongoose schema, this will contain the required key/value pairs for the API
const excuseSchema = new mongoose.Schema({
  excuseType: String,
  id: Number,
  excuse: String,
});

// Creates a new mongoose model using the previously defined schema.
const ExcuseModel = mongoose.model("ExcuseModel", excuseSchema);

// Creates a boolean to be used for later
let defaultArrRetrieved = false;

// Used for debug
console.log('app started');

// Async function used to retrieve all the data from our external API and store it into our local mongoose db
async function getExcuse(excuseString) {
  console.log(excuseString);
  let idCounter = 1;
  try {
    const response = await axios.get("https://excuser.herokuapp.com/v1/excuse/" + excuseString + "/100");

    for (const onlineExcuse in response.data) {
      console.log(response.data[onlineExcuse]['excuse']);
      let newExcuse = new ExcuseModel({
        excuseType: excuseString,
        id: idCounter,
        excuse: response.data[onlineExcuse]['excuse']
      });
      newExcuse.save(function (err, result) {
        if (err) {
          console.log(err);
        }
        else {
          console.log(result);
        }
      });
      idCounter++;
    }
  } catch (error) {
    console.error(error);
  }
}

// Default endpoint, calls the getExcuse function which will grab the initial value and store it.
app.get("/", (req, res) => {

  if (defaultArrRetrieved == false) {
    console.log('hit default boolean');
    defaultArrRetrieved = true;
    for (const excuses in excuseEndpointsArr) {
      getExcuse(excuseEndpointsArr[excuses]);
    }
  }

  res.json({
    message: "Welcome to Andrea's Random Excuse API!",
    description: "This API allows you to retrieve a random excuse for various different forms of events and people. Never again struggle with coming up with a bad excuse!",
    endpoints: "/family /office /children /college /party /funny /unbelievable /developers /gaming",
  });
});

// Async function which takes in a parameter of type requestedExcuse and checks the mongoose db to check if the key exists, if it does retrieve all of the data, and using a random numnber generator, grabs a random excuse object out of it.
async function getExcuseFromDb(requestedExcuse) {
  console.log('------------------');

  let currentExcuse = "";
  let randomIndex = 0;

  await ExcuseModel.find({ excuseType: requestedExcuse }).then(tempExcuse => {
    randomIndex = Math.floor(Math.random() * tempExcuse.length);
    console.log(tempExcuse[randomIndex].excuse);
    currentExcuse = tempExcuse[randomIndex].excuse;
  });

  return [currentExcuse, randomIndex];
}

// Endpoint which will call the async function above depending if the user input value is part of the list of available keywords, if it isnt, return a generic error
app.get("/:endpoints", (req, res) => {
  let currentEndpoint = req.params.endpoints;
  if (excuseEndpointsArr.includes(currentEndpoint)) {
    getExcuseFromDb(currentEndpoint).then(output => {
      let endpointResult = output;
      console.log(endpointResult);
      res.json({
        message: "successful",
        excuse: endpointResult[0],
        excuseId: endpointResult[1]
      });
    });
  }
  else {
    res.json({
      message: "You have hit an non-existent endpoint, please go back to home page",
      link: `http://localhost:${PORT}/`,
    })
  }
})