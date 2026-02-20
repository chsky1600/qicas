import {NextFunction, Request, Response} from "express"

import * as jose from 'jose'
import * as mongoose from 'mongoose'
import { UserModel } from "../db/models/user"
import { JOSEError, JWTClaimValidationFailed } from "jose/errors"

// change to something 
const secret : Uint8Array = new TextEncoder().encode('queensuniversity')

const alg = 'HS256'

// ------------TO REMOVE------------
// await mongoose.connect("mongodb://127.0.0.1:27017/mongoose-app");
await mongoose.connect("mongodb://localhost:27017/qicas");

const testUser = await UserModel.create({
    id: "Test-Id-1",
    faculty_id: "F001",
    name: "Test-Name",
    email: "Test-Email",
    password: "Test-Password",
    role: "Test-Role"
});

await mongoose.disconnect();
// ------------REMOVE------------

// change to lookup users in all faculty docs?
const fetchUser = async (email : String): Promise<UserModel | undefined> => {
    try {
        const user = await UserModel.findOne({email : email});
        return new Promise<UserModel | undefined>((resolve) => {
            resolve(user ? user : undefined)})
    } catch(err) {
        console.log(err)
        return new Promise<UserModel | undefined>((resolve) => {
            resolve(undefined)})
    }
}

export const getToken = async (req : Request, res : Response) => {

    const email : string | undefined = req.body.email
    const password : string | undefined = req.body.password

    if(email && password) {
        const user = await fetchUser(email)
        if(user){
            if(user.password === password) {

                const jwt = await new jose.SignJWT({'faculty_id': user.faculty_id})
                    .setProtectedHeader({alg})
                    .setIssuedAt()
                    .setIssuer('qicas')
                    .setExpirationTime('2h')
                    .sign(secret)
                
                res.cookie("token",jwt)
                res.sendStatus(200)
            } else {
                res.send('Invalid password.')
            }
        } else { 
            console.log("user not found.")
            res.sendStatus(404)
        }
    } else {
        res.sendStatus(400)
    }
}

// verification middleware 
export const verifyToken = async (req : Request, res : Response, next: NextFunction) => {

    const tokenFromCookies = (req as any).cookies?.token as string | undefined;
    const tokenFromHeader = req.headers.cookie
        ?.split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("token="))
        ?.split("=")[1];
    const token : string | undefined = tokenFromCookies || tokenFromHeader;

    console.log("Verifying Token")

    if(token) {
        try {
            const { payload, protectedHeader } = await jose.jwtVerify(token, secret, {
                issuer: 'qicas',
                maxTokenAge: 6000000000
            });
            console.log(payload)
            console.log(protectedHeader)
            if (!req.body) req.body = {};
            req.body.faculty_id = payload.faculty_id;
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
