import express from "express";
import { MongoClient,ObjectId} from "mongodb";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import cors from "cors";
import Stripe from 'stripe';
import {auth} from "./middleware/auth.js"
// import {adminAuth} from "./middleware/adminAuth.js"
const stripe = new Stripe('sk_test_51LUTLESGF1FrCVyXfcqAb9tWYSEm6Sg40rEfNPA0eHhW2AHupepjRcoVSFsFEHsOSolnpsGcgC8mS8JoBl3qepJ700rRwHjugT');

import { v4 as uuidv4 } from 'uuid';
uuidv4();

import fileupload from "express-fileupload"



dotenv.config();
export const app = express();
console.log(process.env.PORT)
const PORT =process.env.PORT

app.use(express.json());
app.use(fileupload())


const mongo_URL = process.env.MONGO_URL;

app.use(cors({
  origin:"*",
  methods:["GET","PUT","POST","DELETE","OPTIONS"]
  
}))




// function to connect to mongodb
async function createConnection() {
  const client = new MongoClient(mongo_URL); 
  await client.connect();
  console.log("Mongodb is connected");
  return client;
}

export const client = await createConnection();

// welcome app
app.get("/",function(request,response){
  response.send({message:"this is welcome page ,This is CORS-enabled for all origins!"})
})

// -----------------------FOOD ------------

//food/:id
app.get("/foods/:id", async function (request, response) {
  const { id } = request.params;
  const food = await client
    .db("hackathon-node-app")
    .collection("foods")
    .findOne({ _id: ObjectId(id)});
  food
    ? response.send(food)
    : response.status(404).send({ msg: "food not found" });
});
// create food list
app.post("/foods", async function (request, response) {
  const data = request.body;
  console.log(request.body)
  
  console.log(data)

  const result = await client
    .db("hackathon-node-app")
    .collection("foods")
    .insertOne(data);
    result ?  response.send(result) :response.send({message:"data not correctly uploaded"})
 
  console.log(result)
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
// // search food by name
// app.get("/foods/:name", async function (request, response) {
//   const {name}=request.params;
//   const result = await client
//     .db("hackathon-node-app")
//     .collection("foods")
//     .find({name:name})
//     .toArray();
//     result ?response.send(result): response.status(404).send({message:"food unavailable"})
  
// })

// delete food by _id

app.delete("/food/:id",async function(request,response){
  const {id}=request.params;
  console.log(request.params,id)
  const result= await client .db("hackathon-node-app")
  .collection("foods").deleteOne({_id: ObjectId(id)})

  console.log(result)
  response.send(result)
  // result.deletedCount>0 ? response.send({message:"item Deleted SuccesFully"}) :response.status(404).send({message:"item not found"})
});

// update food by id
app.put("/foods/:id",async function (request, response) {
  const {id}=request.params;
  console.log(request.params,id)
  const data=request.body;
  const result = await client
    .db("hackathon-node-app")
    .collection("foods")
    .updateOne({_id: ObjectId(id)},{$set:data})
  response.send(result);
})




// ---------RESTAURANT---------------

// create restaurant list
app.post("/restaurants", async function (request, response) {
  const data = request.body;
  console.log(data);

  const result = await client
    .db("hackathon-node-app")
    .collection("restaurants")
    .insertMany(data);
  response.send(result);
});

// get all restaurants
app.get("/restaurants", async function (request, response) {
  const result = await client
    .db("hackathon-node-app")
    .collection("restaurants")
    .find({})
    .toArray();
  response.send(result);
});

// get restaurant by id
app.get("/restaurants/:id", async function (request, response) {
  const { id } = request.params;
  const food = await client
    .db("hackathon-node-app")
    .collection("restaurants")
    .findOne({_id:ObjectId(id)});
  food
    ? response.send(food)
    : response.status(404).send({ msg: "restaurant not found" });
});


// -----------CART-----------------

 // create items in cart 

  async function getexistingProduct(name,userId){
   return await client.db("hackathon-node-app").collection("cart").findOne({
    $and:[
      {userId:userId},
      {name:name}
      
   ]
    })
  }
app.post("/cart", async function (request, response) {
  
  const {name,image,price,quantity,userId}=request.body;
console.log(name)
  // const productFromDB=getexistingProduct(name,userId)
// console.log(productFromDB)
  // if(productFromDB){
  //   response.send({message:"product already added to cart"})
  //   console.log(response.message)
  // }else{

    const data={
      name:name,
      image:image,
      price:price,
      quantity:quantity,
      userId:userId

    }
    console.log(data)
    const result = await client
    .db("hackathon-node-app")
    .collection("cart")
    .insertOne(data);
  response.send(result);
  // response.send({message:"item added successfully"})
  // console.log(request.body)
  console.log(result)

  // }
  

  
});

// get cart
app.get("/cart", async function (request, response){
  const result = await client
  .db("hackathon-node-app")
  .collection("cart")
  .find({})
  .toArray();
response.send(result);

})

// delete cart item by id
app.delete("/cart/:id",auth,async function(request,response){
  const {id}=request.params;
  console.log(request.params,id)
  const result= await client .db("hackathon-node-app")
  .collection("cart").deleteOne({_id: ObjectId(id)})

  console.log(result)
  response.send(result)
  // result.deletedCount>0 ? response.send({message:"item Deleted SuccesFully"}) :response.status(404).send({message:"item not found"})
});

// delete all cart items after checkout
app.delete("/cart",async function(request,response){
  const result= await client .db("hackathon-node-app")
  .collection("cart").deleteMany({})
  response.send(result)
})

// -------------SIGNUP--------------
// signup(create new user)
async function genHashedPassword(password){
  const NO_OF_ROUNDS = 10;
  const salt= await bcrypt.genSalt(NO_OF_ROUNDS);
  const hashedPassword=await bcrypt.hash(password,salt)
  // console.log(password,salt)
  return hashedPassword;
}
async function getUserByEmail(email){
  return await client.db("hackathon-node-app").collection("users").findOne({email:email})
}

app.post("/users/signup",async function(request,response){
  const {username,password,email,mobNumber}=request.body;

 

  const userFromDB=await getUserByEmail(email);
  console.log(userFromDB)

  if(userFromDB){
    response.status(400).send({message:"Email already exist"})
    // console.log(response.body)
  }
  
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
    console.log(result)
    // response.send({message:"registered successfully"})
  }

  
})

// ------------users-------------------

// get all users
app.get("/users", async function (request, response) {
  const result = await client
    .db("hackathon-node-app")
    .collection("users")
    .find({})
    .toArray();
  response.send(result);
});

// get user by id
app.get("/user/:id",async function(request,response){
  const{id}=request.params;
  const result=await client.db("hackathon-node-app").collection("users").findOne({_id:ObjectId(id)})
  console.log(result)
  response.send(result)
  
})
// edit user profile by id
app.put("/user/:id",async function (request, response) {
  const {id}=request.params;
  console.log(request.params,id)
  const data=request.body;
  const result = await client
    .db("hackathon-node-app")
    .collection("users")
    .updateOne({_id: ObjectId(id)},{$set:data})
  response.send(result);
})

// delete user by _id
app.delete("/user/:id",async function(request,response){
  const {id}=request.params;
  console.log(request.params,id)
  const result= await client .db("hackathon-node-app")
  .collection("users").deleteOne({_id: ObjectId(id)})

  console.log(result)
  response.send(result)
  // result.deletedCount>0 ? response.send({message:"item Deleted SuccesFully"}) :response.status(404).send({message:"item not found"})
});

// -----------LOGIN--------------

// login
app.post("/users/login",async function(request,response){
const {email,password}=request.body;

const userFromDB=await getUserByEmail(email)
console.log(userFromDB)

if(!userFromDB){
  response.status(401).send({message:"User does not exist"})
  console.log(response.message)
}else{
  const storePassword=userFromDB.password;
  const isPasswordMatches=await bcrypt.compare(password,storePassword)
  // console.log(isPasswordMatches)
  if(isPasswordMatches){
const token=jwt.sign({id:userFromDB._id},
  process.env.SECRET_KEY)
  console.log(process.env.SECRET_KEY)
  response.send({message:"succesfull login",token:token,user:userFromDB
  })
   console.log(token,userFromDB)

  }else{
    response.status(401).send({message:"invalid credentials"})
    console.log(response.message)
  }
}
})



// create orders list
app.post("/payment",async function(request,response){
const {product,token,userId}=request.body;
console.log("product",product);
console.log("price",product.price);
console.log(token)
console.log(userId)
const data={
  userId:userId,
  address:token.card.address_line1,
  addressCity:token.card.address_city,
  price:product.price,
  
}
console.log(data)
const result = await client
.db("hackathon-node-app")
.collection("orders")
.insertOne(data);
response.send(result);
// response.send({message:"item added successfully"})
// console.log(request.body)
console.log(result)

// const idempotencyKey=uuidv4();
// return stripe.customers.create({
//   email:token.email,
//   source:token.id
// }).then((customer)=>{
//  stripe.charges.create({
//     amount:100*100,
//     currency:"inr",
//     customer:customer.id,
//     receipt_email:token.email,
//     description:`purchase of product.name`,
//     shipping:{
//       name:token.card.name,
//       address:{
//         country:token.card.address_country
//       }
//     }
//   },{idempotencyKey})
// }).then((result)=>response.status(200).json(result))
// .catch((error)=>console.log(error))

})

// --------------ADMIN--------------

// Admin signup


async function getAdminByEmail(email){
  return await client.db("hackathon-node-app").collection("admin").findOne({email:email})
}

app.post("/admin/signup",async function(request,response){
  const {username,password,email}=request.body;

 

  const adminFromDB=await getAdminByEmail(email);
  console.log(adminFromDB)

  if(adminFromDB){
    response.status(400).send({message:"Email already exist"})
    // console.log(response.body)
  }
  
  else{
    const hashedPassword=await genHashedPassword(password)
    console.log(hashedPassword)
    const data={
      username:username,
      email:email, 
      password:hashedPassword
    }
    const result=client.db("hackathon-node-app").collection("admin").insertOne(data)
    response.send(result)
    
  }

  
})

// Admin login


app.post("/admin/login",async function(request,response){
  const {email,password}=request.body;
  
  const adminFromDB=await getAdminByEmail(email)
  console.log(adminFromDB)
  
  if(!adminFromDB){
    response.status(401).send({message:"You are not an admin"})
    console.log(response.message)
  }else{
    const storePassword=adminFromDB.password;
    const isPasswordMatches=await bcrypt.compare(password,storePassword)
    // console.log(isPasswordMatches)
    if(isPasswordMatches){
  const adminToken=jwt.sign({id:adminFromDB._id},
    process.env.SECRET_KEY)
    console.log(process.env.SECRET_KEY)
    response.send({message:"succesfull login",
    // token:adminToken,
    })
     console.log(adminToken,adminFromDB)
  
    }else{
      response.status(401).send({message:"invalid credentials"})
      console.log(response.message)
    }
  }
  })
  


app.listen(PORT, console.log(`app started in port ${PORT}`));
