import { Request, Response } from "express";
import { Assignment, Schedule } from "../types";
import { validateAssignment, validateSchedule as validateScheduleService } from "../services";
import { FacultyModel } from "../db/models/faculty";
import { isYearRulesServiceError } from "../services/yearRulesService";

const handleError = (err: unknown, res: Response) => {
  if (isYearRulesServiceError(err)) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  res.status(500).json({ error: "Internal server error" });
};

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
    try {
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
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export const getSchedules = async (req : Request, res : Response) => {
    try {
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
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

/** takes in a schedule, and overrides the currently saved one with the same ID
*    router.put("/schedule/:year",saveSchedule)
*/
export const saveSchedule = async (req : Request, res : Response) => {
    try {
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
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// effectively "picking" a new snapshot to work on as the current schedule
// set a given schedule to be the current working schedule ("the one the user will be saving to")
// router.put("/schedule/:year/:schedule_id",setWorkingSchedule)
export const setWorkingSchedule = async (req : Request, res : Response) => {
    const schedule_id : string = req.params.schedule_id as string;
    const faculty_id : string = req.body.faculty_id;

    const result = await FacultyModel.updateOne(
        { id: faculty_id },
        {
            $set: { current_working_schedule_id: schedule_id },
        }
    );

    const currentSchedule = await getCurrentWorkingSchedule(faculty_id);
    res.json(currentSchedule);
}

export async function getCurrentWorkingSchedule(
  facultyId: string
) {
  const result = await FacultyModel.aggregate([
    { $match: { id: facultyId } },

    { $unwind: "$academic_years" },
    { $unwind: "$academic_years.schedules" },

    {
      $match: {
        $expr: {
          $eq: [
            "$academic_years.schedules.id",
            "$current_working_schedule_id",
          ],
        },
      },
    },

    { $replaceRoot: { newRoot: "$academic_years.schedules" } },
  ]);

  return result[0] ?? null;
}

export const getWorkingSchedule = async (req : Request, res : Response) => {
    const faculty_id : string = req.body.faculty_id;
    try {
        const currentWorkingSchedule = await getCurrentWorkingSchedule(faculty_id)
        res.json(currentWorkingSchedule);
    } catch (err) {
        handleError(err, res);
    }
}

// duplicates the given schedule and gives it a new ID and sets it to the current schedule?
// router.post("/schedule/:year", createSnapshot)
export const createSnapshot = async (req : Request, res : Response) => {
    try {
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
            name: schedule.name,
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
            res.json(duplicated);
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

export const deleteSchedule = async (req: Request, res: Response) => {
    try {
        const schedule_id: string = req.params.schedule_id as string;
        const faculty_id: string = req.body.faculty_id;

        const result = await FacultyModel.updateOne(
            { id: faculty_id },
            {
                $pull: {
                    "academic_years.$[].schedules": { id: schedule_id }
                }
            }
        );

        if (result.modifiedCount === 0) {
            res.status(404).json({ error: "Schedule not found" });
            return;
        }

        await FacultyModel.updateOne(
            { id: faculty_id, current_working_schedule_id: schedule_id },
            { $unset: { current_working_schedule_id: "" } }
        );

        res.sendStatus(204);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
}

// router.post("/schedule/:year/:schedule_id/assignments", addAssignment)
export const addAssignment = async (req: Request, res: Response) => {
    try {
        const year_id: string = req.params.year as string;
        const schedule_id: string = req.params.schedule_id as string;
        const faculty_id: string = req.body.faculty_id;
        const assignment: Assignment = req.body.assignment as Assignment;

        if (!assignment || !assignment.id) {
            res.status(400).json({ error: "Assignment with id is required" });
            return;
        }

        // Guard against duplicate assignment IDs
        const existing = await FacultyModel.findOne({
            id: faculty_id,
            "academic_years.schedules": {
                $elemMatch: {
                    id: schedule_id,
                    "assignments.id": assignment.id,
                },
            },
        });

        if (existing) {
            res.status(409).json({ error: "Assignment with this id already exists" });
            return;
        }

        const result = await FacultyModel.updateOne(
            {
                id: faculty_id,
                "academic_years.schedules.id": schedule_id,
            },
            {
                $push: {
                    "academic_years.$[year].schedules.$[schedule].assignments": assignment,
                },
            },
            {
                arrayFilters: [
                    { "year.id": year_id },
                    { "schedule.id": schedule_id },
                ],
            }
        );

        if (result.modifiedCount === 0) {
            res.status(404).json({ error: "Schedule not found" });
        } else {
            res.status(201).json(assignment);
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// router.delete("/schedule/:year/:schedule_id/assignments/:assignment_id", removeAssignment)
export const removeAssignment = async (req: Request, res: Response) => {
    try {
        const year_id: string = req.params.year as string;
        const schedule_id: string = req.params.schedule_id as string;
        const assignment_id: string = req.params.assignment_id as string;
        const faculty_id: string = req.body.faculty_id;

        const result = await FacultyModel.updateOne(
            {
                id: faculty_id,
                "academic_years.schedules.id": schedule_id,
            },
            {
                $pull: {
                    "academic_years.$[year].schedules.$[schedule].assignments": { id: assignment_id },
                },
            },
            {
                arrayFilters: [
                    { "year.id": year_id },
                    { "schedule.id": schedule_id },
                ],
            }
        );

        if (result.modifiedCount === 0) {
            res.status(404).json({ error: "Schedule or assignment not found" });
        } else {
            res.sendStatus(204);
        }
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// router.post("/schedule/:year/:schedule_id/validate",validateSchedule)
export const validateSchedule = async (req : Request, res : Response) => {
    
    // assume sched id exists, probably shouldn't call this otherwise...
    const schedule_id : string = req.params.schedule_id as string;
    const year_id : string = req.params.year as string;
    const assignment : Assignment = req.body.assignment as Assignment;
    const faculty_id : string = req.body.faculty_id;

    const schedule : Schedule | undefined = await fetchScheduleByFacultyIdScheduleIdAndYear(faculty_id, schedule_id ,year_id);

    if (!schedule) {
        res.status(404)
        res.json({error: "No schedule found"})
        return
    }

    try {
        if (assignment) {
            // Per-candidate validation (add/update)
            const validationResult = await validateAssignment(schedule, assignment)
            res.json({ validationResult })
        } else {
            // Schedule-wide validation (removals, full-schedule load)
            const validationResult = await validateScheduleService(schedule)
            res.json({ validationResult })
        }
    } catch (err: any) {
        res.status(400).json({ error: err.message })
    }

}
