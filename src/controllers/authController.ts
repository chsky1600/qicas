import {NextFunction, Request, Response} from "express"

import * as jose from 'jose'
import * as mongoose from 'mongoose'
import { User } from "../db/schema"
import { JOSEError, JWTClaimValidationFailed } from "jose/errors"

import { connection } from "../db/connection"

// change to something 
const secret : Uint8Array = new TextEncoder().encode('queensuniversity')

const alg = 'HS256'

// ------------TO REMOVE------------
// await mongoose.connect("mongodb://127.0.0.1:27017/mongoose-app");

// const testUser = new User({
//     email: "Test",
//     password: "Password"
// });
// await testUser.save();

// await mongoose.disconnect();
// ------------REMOVE------------


const fetchUser = async (email : String): Promise<User | undefined> => {
    try {
        const user = await User.findOne({email : email});
        return new Promise<User | undefined>((resolve) => {
            resolve(user ? user : undefined)})
    } catch(err) {
        console.log(err)
        return new Promise<User | undefined>((resolve) => {
            resolve(undefined)})
    }
}

export const getToken = async (req : Request, res : Response) => {

    const email : string | undefined = req.body.username
    const password : string | undefined = req.body.password

    if(email && password) {
        const user = await fetchUser(email)
        if(user){
            if(user.password === password) {

                const jwt = await new jose.SignJWT()
                    .setProtectedHeader({alg})
                    .setIssuedAt()
                    .setIssuer('qicas')
                    .setExpirationTime('2h')
                    .sign(secret)
                
                res.cookie("token",jwt)
                res.send('Heres a token.')
            } else {
                res.send('Invalid password.')
            }
        } else { 
            res.sendStatus(404)
        }
    } else {
        res.sendStatus(400)
    }
}

export const verifyToken = async (req : Request, res : Response, next: NextFunction) => {

    const token : string | undefined = req.headers.authorization;

    if(token) {
        try {
            const { payload, protectedHeader } = await jose.jwtVerify(token, secret, {
                issuer: 'qicas',
                maxTokenAge: 6000000000
            });
            next();
            return
        } catch (err) {
            if (err instanceof JWTClaimValidationFailed) {
                console.log(err.reason)
            }
        }
    } 

    res.sendStatus(401)
}