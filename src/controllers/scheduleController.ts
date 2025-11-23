import { Request, Response } from "express";

export const getScheduleByID = async (req : Request, res : Response) => {

}

// takes in a schedule, and overrides the currently saved one with the same ID
export const saveSchedule = async (req : Request, res : Response) => {

}

// effectively "picking" a new snapshot to work on as the current schedule
// set a given schedule to be the current working schedule ("the one the user will be saving to")
export const setWorkingSchedule = async (req : Request, res : Response) => {

}

// duplicates the given schedule and gives it a new ID and sets it to the current schedule?
export const saveSnapshot = async (req : Request, res : Response) => {

}