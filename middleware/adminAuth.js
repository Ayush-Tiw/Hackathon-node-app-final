import jwt from "jsonwebtoken"

export const adminAuth=(request,response,next)=>{
    // first get the token from request(token is part of request)
    try{
    const adminToken=request.header('x-auth-token');
    console.log(adminToken)
    jwt.verify(adminToken,process.env.SECRET_key)
    next();
    }catch(err){
response.status(401).send({error:err.message})
    }
}