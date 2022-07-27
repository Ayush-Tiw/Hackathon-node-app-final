import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import cors from "cors";



dotenv.config();
export const app = express();
console.log(process.env.PORT)
const PORT =process.env.PORT

app.use(express.json());


const mongo_URL = process.env.MONGO_URL;
app.use(cors())


// function to connect to mongodb
async function createConnection() {
  const client = new MongoClient(mongo_URL); 
  await client.connect();
  console.log("Mongodb is connected");
  return client;
}

export const client = await createConnection();

//food/:id
app.get("/foods/:id", async function (request, response) {
  const { id } = request.params;
  const food = await client
    .db("hackathon-node-app")
    .collection("foods")
    .findOne({ id: id });
  food
    ? response.send(food)
    : response.status(404).send({ msg: "food not found" });
});
// create food list
app.post("/foods", async function (request, response) {
  const data = request.body;
  console.log(data);

  const result = await client
    .db("hackathon-node-app")
    .collection("foods")
    .insertMany(data);
  response.send(result);
});
// get all foods
app.get("/foods", async function (request, response) {
  const result = await client
    .db("hackathon-node-app")
    .collection("foods")
    .find({})
    .toArray();
  response.send(result);
});


// signup
async function genHashedPassword(password){
  const NO_OF_ROUNDS = 10;
  const salt= await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedPassword=await bcrypt.hash(password,salt)
  // console.log(password,salt)
  return hashedPassword;
}
async function getUserByName(username){
  return await client.db("hackathon-node-app").collection("users").findOne({username:username})
}

app.post("/users/signup",async function(request,response){
  // const data=request.body;
  // console.log(data)
  const {username,password,email,mobNumber}=request.body;

 

  const userFromDB=await getUserByName(username);
  console.log(userFromDB)

  if(userFromDB){
    response.status(400).send({message:"username already exist"})
    console.log(response.body)
  }
  // else if(password.length<8){
  //   response.status(400).send({message:"password should be min 8 character"})
  // }
  else{
    const hashedPassword=await genHashedPassword(password)
    console.log(hashedPassword)
    const data={
      username:username,
      email:email,
      mobNumber:mobNumber, 
      password:hashedPassword
    }
    const result=client.db("hackathon-node-app").collection("users").insertOne(data)
    response.send(result)
  }

  
})

app.get("users/signup",async function(request,response){
  const result= await client.db("hackathon-node-app").collection("users").find({}).toArray()
  response.send(result)
})

// login
app.post("/users/login",async function(request,response){
const {username,password}=request.body;

const userFromDB=await getUserByName(username)
console.log(userFromDB)

if(!userFromDB){
  response.status(401).send({message:"User does not exist"})
}else{
  const storePassword=userFromDB.password;
  const isPasswordMatches=await bcrypt.compare(password,storePassword)
  // console.log(isPasswordMatches)
  if(isPasswordMatches){
const token=jwt.sign({id:userFromDB._id},
  process.env.SECRET_KEY)
  response.send({message:"successufll login",token:token})

  }else{
    response.status(401).send({message:"invalid credentials"})
  }
}
})

app.listen(PORT, console.log(`app started in port ${PORT}`));
