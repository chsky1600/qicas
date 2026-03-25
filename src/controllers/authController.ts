import {NextFunction, Request, Response} from "express"

import * as jose from 'jose'
import * as mongoose from 'mongoose'
import { UserModel } from "../db/models/user"
import { JOSEError, JWTClaimValidationFailed } from "jose/errors"
import { FacultyModel } from "../db/models/faculty"
import { User } from "../types/user"

// JWT signing/verifying secret.
// Falls back to the historical default if `JWT_SECRET` is not provided.
const secret: Uint8Array = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "queensuniversity"
);

const alg = 'HS256'

// change to lookup users in all faculty docs?
const fetchUser = async (email : String): Promise<User | undefined> => {
    try {

        const faculty = await FacultyModel.findOne(
            { "users.email": email },
            { _id: 0, users: 1}            
        ).lean();

        if(faculty){
            const user = faculty.users.find((u: any) => u.email === email);
            return new Promise<User | undefined>((resolve) => {
                resolve(user ? user : undefined)})
        } else {
            throw new Error("No user found.")
        }
    } catch(err) {
        console.log(err)
        return new Promise<User | undefined>((resolve) => {
            resolve(undefined)})
    }
}

export const getToken = async (req : Request, res : Response) => {

    const email : string | undefined = req.body.email
    const password : string | undefined = req.body.password

    if(email && password) {
        const user = await fetchUser(email)
        if(user){
            const match = await Bun.password.verify(password, user.password);
            if(match) {

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

export const changePassword = async (req : Request, res : Response) => {
    try {
        const faculty_id: string = req.body.faculty_id;
        const email: string | undefined = req.body.email;
        const current_password: string | undefined = req.body.current_password;
        const new_password: string | undefined = req.body.new_password;

        if (!email || !current_password || !new_password) {
            res.status(400).json({ error: "email, current_password, and new_password are required" });
            return;
        }

        if (new_password.length < 8) {
            res.status(400).json({ error: "New password must be at least 8 characters" });
            return;
        }

        const user = await fetchUser(email);
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const match = await Bun.password.verify(current_password, user.password);
        if (!match) {
            res.status(401).json({ error: "Current password is incorrect" });
            return;
        }

        const isSame = await Bun.password.verify(new_password, user.password);
        if (isSame) {
            res.status(400).json({ error: "New password must be different from current password" });
            return;
        }

        const hashed = await Bun.password.hash(new_password);

        const result = await FacultyModel.updateOne(
            { id: faculty_id, "users.email": email },
            { $set: { "users.$.password": hashed } }
        );

        if (result.modifiedCount === 0) {
            res.status(404).json({ error: "User not found in faculty" });
        } else {
            res.status(200).json({ message: "Password updated" });
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export const refreshToken = async (req : Request, res : Response) => {
    const faculty_id = req.body.faculty_id
    if (!faculty_id) {
        res.sendStatus(401)
        return
    }

    try {
        const jwt = await new jose.SignJWT({'faculty_id': faculty_id})
            .setProtectedHeader({alg})
            .setIssuedAt()
            .setIssuer('qicas')
            .setExpirationTime('2h')
            .sign(secret)

        res.cookie("token", jwt)
        res.sendStatus(200)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
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
