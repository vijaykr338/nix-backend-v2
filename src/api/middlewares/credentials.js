import { allowedOrigins } from "../../config/corsOptions.js";

export const credentials=(req,res,next)=>{
    const origin =req.headers.origin;
    if(allowedOrigins.includes(origin)){
        //add Access-Control-Allow-Credentials header to response to true
        res.header('Access-Control-Allow-Credentials',true);
    }
    next();
}