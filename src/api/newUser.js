import {newUser} from './database.js';

export default async function handler(req,res){
    if(req.method!='POST'){
        return res.status(405).json({ message: 'Method not allowed' });
    }
    const{username,code}=req.body;
    if(!username||!code){
        return res.status(400).json({message:'Username and code are required'});
    }
    try{
        // Create a new user
        const userId = await newUser(username);
        if(userId==-1){
            return res.status(409).json({
                message:'Username already exists'
            })
        }
        return res.status(201).json({ 
            userId
         });
    }
    catch(error){
        console.error('Error creating user',error)
        res.status(500).json({
            message:'Internal Server Error'
        })
    }
}
