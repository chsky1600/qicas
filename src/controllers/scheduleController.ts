import { Request, Response } from "express";
import { Assignment, Schedule } from "../types";
import { validateAssignment } from "../services";
import { FacultyModel } from "../db/models/faculty";

const fetchScheduleByFacultyIdScheduleIdAndYear = async (faculty_id : string, schedule_id : string, year_id : string): Promise<Schedule | undefined> => {
    try {
        const faculty = await FacultyModel.findOne(
        {
            id: faculty_id,
            "academic_years.id": year_id,
            "academic_years.schedules.id": schedule_id,
        },
        { _id: 0, academic_years: 1 }
        ).lean();
        if(faculty){
            const year = faculty.academic_years.find((y: any) => y.id === year_id);
            const schedule = year?.schedules.find((s: any) => s.id === schedule_id) as Schedule;
            return new Promise<Schedule | undefined>((resolve) => {
                resolve(schedule)})
        } else {
            throw Error("No faculty...")
        }
    } catch(err) {
        console.log(err)
        return new Promise<Schedule | undefined>((resolve) => {
            resolve(undefined)})
    }
}

export const getScheduleByID = async (req : Request, res : Response) => {

    const year_id : string = req.params.year as string;
    const faculty_id : string = req.body.faculty_id;
    const schedule_id : string = req.params.schedule_id as string;

    const doc = await FacultyModel.findOne(
        {
            id: faculty_id,
            "academic_years.id": year_id,
        },
        {
            _id: 0,
            academic_years: { $elemMatch: { id: year_id } },
        }
    ).lean();

    if (!doc) return res.json(null);

    const year = doc.academic_years[0];
    const schedule = year?.schedules?.find(
        (s: any) => s.id === schedule_id
    );

    res.json(schedule ?? null);
    }

export const getSchedules = async (req : Request, res : Response) => {
    const year_id : string = req.params.year as string;
    const faculty_id : string = req.body.faculty_id;

    const doc = await FacultyModel.findOne(
        {
            id: faculty_id,
            "academic_years.id": year_id,
        },
        {
            _id: 0,
            academic_years: { $elemMatch: { id: year_id } },
        }
    ).lean();

    res.json(doc?.academic_years?.[0]?.schedules ?? []);
}

// takes in a schedule, and overrides the currently saved one with the same ID
// router.put("/schedule/:year",saveSchedule)
export const saveSchedule = async (req : Request, res : Response) => {
    const year_id : string = req.params.year as string;
    const faculty_id : string = req.body.faculty_id;
    const updatedSchedule : Schedule = req.body.schedule as Schedule;

    const result = await FacultyModel.updateOne(
        { id: faculty_id },
        {
            $set: {
                "academic_years.$[year].schedules.$[schedule]": updatedSchedule,
            },
        },
        {
            arrayFilters: [
                { "year.id": year_id },
                { "schedule.id": updatedSchedule.id },
            ],
        }
    );

    if(result.modifiedCount > 0) {
        res.sendStatus(201)
    } else {
        res.sendStatus(200)
    }
}

// effectively "picking" a new snapshot to work on as the current schedule
// set a given schedule to be the current working schedule ("the one the user will be saving to")
export const setWorkingSchedule = async (req : Request, res : Response) => {

}

// duplicates the given schedule and gives it a new ID and sets it to the current schedule?
// router.post("/schedule/:year", createSnapshot)
export const createSnapshot = async (req : Request, res : Response) => {

    const year_id : string = req.params.year as string;
    const faculty_id : string = req.body.faculty_id;
    const schedule : Schedule = req.body.schedule as Schedule;

    const newScheduleId = crypto.randomUUID();

    // Create duplicated schedule object
    const duplicated: Schedule = {
        ...schedule,
        id: newScheduleId,
        year_id: year_id,                 
        date_created: new Date(),        
        name: `${schedule.name} (Copy)`,
    };

    const result = await FacultyModel.updateOne(
        {
            id: faculty_id,
            "academic_years.id": year_id,
            "academic_years.schedules.id": { $ne: newScheduleId },
        },
        {
            $push: {
                "academic_years.$.schedules": duplicated,
            },
        }
    );

    if (result.modifiedCount === 0) {
        res.sendStatus(404);
    } else {
        res.json(duplicated); // plain JSON object
    }
}

// router.post("/schedule/:year/:schedule_id/validate",validateSchedule)
export const validateSchedule = async (req : Request, res : Response) => {
    
    // assume sched id exists, probably shouldn't call this otherwise...
    const schedule_id : string = req.params.schedule_id as string;
    const year_id : string = req.params.year as string;
    const assignment : Assignment = req.body.assignment as Assignment;
    const faculty_id : string = req.body.faculty_id;

    const schedule : Schedule | undefined = await fetchScheduleByFacultyIdScheduleIdAndYear(faculty_id, schedule_id ,year_id);

    if(assignment && schedule){
        console.log(schedule)
        const validationResult = await validateAssignment(schedule,assignment)
        res.json({validationResult : validationResult})

    } else if (!assignment){
        res.status(400)
        res.json({error: "No assignment found"})
        console.log("No assignment found.")
    } else {
        res.status(404)
        res.json({error: "No schedule found"})
        console.log("No schedule found.")
    }

}
