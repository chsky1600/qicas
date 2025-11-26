import { Request, Response } from "express";


export const deleteFacultyByID = async (req : Request, res : Response) => {}
export const getFacultyByID = async (req : Request, res : Response) => {}
export const getFaculties = async (req : Request, res : Response) => {}

// create new faculties, who would have perms to do this though... any user can create a faculty? then that faculty is tied to them? this is evil asf
export const createFaculty = async (req : Request, res : Response) => {

}

// assign users to a faculty???
export const assignUserToFacultyByID = async (req : Request, res : Response) => {}
export const removeUserFromFacultyByID = async (req : Request, res : Response) => {}
export const migrateFacultyToNewYear = async (req : Request, res : Response) => {}