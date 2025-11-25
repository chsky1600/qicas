import { Request, Response } from "express";

// returns all courses in the department 
// optionally filtered by academic year or term
export const getAllCourses = async (req : Request, res : Response) => {

}

// gets a course by its ID
export const getCourseByID = async (req : Request, res : Response) => {

}

// creates a new course, not based on any existing
export const createCourse = async (req : Request, res : Response) => {

}

// updates the course details as provided in request
export const updateCourse = async (req : Request, res : Response) => {

}

// gets all schedule entries where this course is assigned
export const getCourseAssignmentsbyID = async (req : Request, res : Response) => {

}

// dupliucates some course's contents under a new course object with a new ID
export const snapshotCourse = async (req : Request, res : Response) => {

}