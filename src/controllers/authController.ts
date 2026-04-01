import {NextFunction, Request, Response} from "express"

import * as jose from 'jose'
import * as mongoose from 'mongoose'
import { JOSEError, JWTClaimValidationFailed } from "jose/errors"
import { FacultyModel } from "../db/models/faculty"
import { User, UserRole } from "../types/user"

// JWT signing/verifying secret.
// Falls back to the historical default if `JWT_SECRET` is not provided.
const secret: Uint8Array = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "queensuniversity"
);

const alg = 'HS256'
const TOKEN_MAX_AGE_MS = 2 * 60 * 60 * 1000 // 2 hours, matches JWT exp

const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: TOKEN_MAX_AGE_MS,
  path: "/",
}

type SessionClaims = {
    faculty_id: string
    user_id: string
    role: UserRole
}

type SessionResponse = SessionClaims & {
    name: string
    email: string
    must_change_password: boolean
    exp: number
}

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

const fetchUserByFacultyAndId = async (
    faculty_id: string,
    user_id: string
): Promise<User | undefined> => {
    try {
        const faculty = await FacultyModel.findOne(
            { id: faculty_id },
            { _id: 0, users: 1 }
        ).lean();

        if (!faculty) return undefined;
        return faculty.users.find((u: any) => u.id === user_id) as User | undefined;
    } catch (err) {
        console.log(err);
        return undefined;
    }
}

const getCurrentUserDoc = async (faculty_id: string, user_id: string) => {
    const faculty = await FacultyModel.findOne({ id: faculty_id });
    if (!faculty) return null;

    const userIndex = faculty.users.findIndex((user: any) => user.id === user_id);
    if (userIndex === -1) return null;

    const userDoc = faculty.users[userIndex] as User & {
        toObject?: () => User;
        password?: string;
    };

    return { faculty, userDoc, userIndex };
}

const materializeUser = (user: User | (User & { toObject?: () => User })) => {
    return typeof (user as { toObject?: () => User }).toObject === "function"
        ? (user as { toObject: () => User }).toObject()
        : (user as User);
}

const issueSessionCookie = async (res: Response, claims: SessionClaims, user: User): Promise<SessionResponse> => {
    const jwt = await new jose.SignJWT(claims)
        .setProtectedHeader({alg})
        .setIssuedAt()
        .setIssuer('qicas')
        .setExpirationTime('2h')
        .sign(secret)

    res.cookie("token", jwt, cookieOpts)
    const payload = JSON.parse(atob(jwt.split(".")[1]!))
    return {
        ...claims,
        name: user.name,
        email: user.email,
        must_change_password: user.must_change_password,
        exp: payload.exp,
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
                const session = await issueSessionCookie(res, {
                    faculty_id: user.faculty_id,
                    user_id: user.id,
                    role: user.role,
                }, user)
                res.status(200).json(session)
            } else {
                res.status(401).json({ error: "Invalid password" })
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
        const user_id: string = req.body.user_id;
        const current_password: string | undefined = req.body.current_password;
        const new_password: string | undefined = req.body.new_password;

        if (!faculty_id || !user_id || !new_password) {
            res.status(400).json({ error: "Missing authenticated user or new password" });
            return;
        }

        if (new_password.length < 8) {
            res.status(400).json({ error: "New password must be at least 8 characters" });
            return;
        }

        const current = await getCurrentUserDoc(faculty_id, user_id);
        if (!current) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const { faculty, userDoc, userIndex } = current;
        const user = materializeUser(userDoc);

        if (current_password) {
            const match = await Bun.password.verify(current_password, user.password);
            if (!match) {
                res.status(400).json({ error: "Current password is incorrect" });
                return;
            }
        } else if (!user.must_change_password) {
            res.status(400).json({ error: "Current password is required" });
            return;
        }

        const isSame = await Bun.password.verify(new_password, user.password);
        if (isSame) {
            res.status(400).json({ error: "New password must be different from current password" });
            return;
        }

        const hashed = await Bun.password.hash(new_password);
        const storedUser = faculty.users[userIndex];
        if (!storedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        storedUser.password = hashed;
        storedUser.must_change_password = false;
        await faculty.save();

        const updatedUser = materializeUser(storedUser as User & { toObject?: () => User });

        const session = await issueSessionCookie(res, {
            faculty_id,
            user_id,
            role: updatedUser.role,
        }, updatedUser);

        res.status(200).json({ message: "Password updated", session });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export const updateAccount = async (req: Request, res: Response) => {
    try {
        const faculty_id: string = req.body.faculty_id;
        const user_id: string = req.body.user_id;
        const name: string | undefined = req.body.name;
        const email: string | undefined = req.body.email;

        if (!faculty_id || !user_id) {
            res.status(400).json({ error: "Missing authenticated user" });
            return;
        }

        if (name === undefined && email === undefined) {
            res.status(400).json({ error: "Missing update body" });
            return;
        }

        const current = await getCurrentUserDoc(faculty_id, user_id);
        if (!current) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        const { faculty, userIndex } = current;
        const storedUser = faculty.users[userIndex];
        if (!storedUser) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        if (name !== undefined) storedUser.name = name;
        if (email !== undefined) storedUser.email = email;
        await faculty.save();

        const updatedUser = materializeUser(storedUser as User & { toObject?: () => User });

        res.status(200).json({
            id: updatedUser.id,
            faculty_id: updatedUser.faculty_id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            must_change_password: updatedUser.must_change_password,
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export const refreshToken = async (req : Request, res : Response) => {
    const faculty_id = req.body.faculty_id
    const user_id = req.body.user_id
    if (!faculty_id || !user_id) {
        res.sendStatus(401)
        return
    }

    try {
        const user = await fetchUserByFacultyAndId(faculty_id, user_id)
        if (!user) {
            res.sendStatus(401)
            return
        }

        const session = await issueSessionCookie(res, {
            faculty_id,
            user_id,
            role: user.role,
        }, user)
        res.json(session)
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
            const { payload } = await jose.jwtVerify(token, secret, {
                issuer: 'qicas',
                maxTokenAge: '2h'
            });
            if (!req.body) req.body = {};
            req.body.faculty_id = payload.faculty_id;
            req.body.role = payload.role;
            req.body.user_id = payload.user_id;
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

// blocks normal app usage until a temporary password has been replaced
// must be chained after verifyToken
export const requirePasswordChangeSatisfied = async (req: Request, res: Response, next: NextFunction) => {
    const { faculty_id, user_id } = req.body
    if (!faculty_id || !user_id) {
        res.sendStatus(401)
        return
    }

    const user = await fetchUserByFacultyAndId(faculty_id, user_id)
    if (!user) {
        res.sendStatus(401)
        return
    }

    if (user.must_change_password) {
        res.status(403).json({ error: "Password change required" })
        return
    }

    next()
}

// returns session metadata so the frontend never needs to parse the JWT itself
// must be chained after verifyToken
export const getSession = async (req: Request, res: Response) => {
    const { faculty_id, user_id } = req.body
    if (!faculty_id || !user_id) {
        res.sendStatus(401)
        return
    }

    const user = await fetchUserByFacultyAndId(faculty_id, user_id)
    console.log("[getSession] DB returned must_change_password:", user?.must_change_password)
    if (!user) {
        res.sendStatus(401)
        return
    }

    try {
        const session = await issueSessionCookie(res, {
            faculty_id,
            user_id,
            role: user.role,
        }, user)
        res.json(session)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
}

// clears the httpOnly auth cookie
// must match the same options used when setting it (except maxAge/expires)
export const logout = (_req: Request, res: Response) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: "/",
    })
    res.sendStatus(200)
}

// role authorization middleware (must be chained after verifyToken)
export const requireRole = (...allowed: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const role = req.body.role;
        if (!role || !allowed.includes(role)) {
            res.status(403).json({ error: "Insufficient permissions" });
            return;
        }
        next();
    };
};
