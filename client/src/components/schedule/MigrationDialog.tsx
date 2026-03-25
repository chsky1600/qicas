import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { Year, Schedule } from "@/features/schedule/types"

interface Props {
  open: boolean
  onClose: () => void
  years: Year[]
  loadedYearId: string
  schedules: Schedule[]
  onMigrateYear: (source_year_id: string, new_year_id: string, name: string, schedule_ids: string[]) => Promise<void>
  /*activeSchedule: Schedule | null
  schedules: Schedule[]
  courses: Course[]
  courseRules: CourseRule[]
  onAddSchedule: () => Promise<Schedule | undefined>
  onCopySchedule: (schedule: Schedule) => Promise<Schedule | undefined>
  onDeleteSavedSchedule: (id: string) => Promise<void>
  onSwitchSchedule: (id: string) => Promise<void>
  onRenameSchedule: (scheduleId: string, newName: string)  => Promise<void>*/
}


function mustBeLatestYear(latestYearName: string, onClose: () => void) {
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 bg-red-400 rounded-t-lg">          
          <h2 className="text-white font-semibold text-base">Please switch years</h2>       
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          To migrate your schedule to the next, you will need to load the latest year.

          please open {latestYearName}
        </div>
      </div>
    </div>
  )
}

export default function MigrationDialog({
  open, onClose, years, loadedYearId, schedules, onMigrateYear
  //activeSchedule, schedules, courses, courseRules,
  //onAddSchedule, onCopySchedule, onDeleteSavedSchedule, onSwitchSchedule,
  //onRenameSchedule,
}: Props) {
  const [scheduleIds, setScheduleIds] = useState(new Set<string>());
  const latestYear = years.reduce((max, obj) => obj.start_year > max.start_year ? obj : max)

  useEffect(() => {
    if (open) {
      // we check the above^ to prove that schedules is for the latest schedule
      // convert them into a set for fast and easy iterability
      setScheduleIds(new Set(schedules.map(s => s.id)));      
    }
  }, [open])

  if (!open) return null
  // if loadedYearId is not latest, inform user they must switch to latest year
  if (loadedYearId !== latestYear.id) return mustBeLatestYear(latestYear.name, onClose)
  
  function toggle(id: string){
    setScheduleIds(prev => {
      const next = new Set(prev);
      if (next.has(id)){
        next.delete(id)
      } else{
        next.add(id)
      }
      return next;
    })
  }
  
  const newYear = latestYear.start_year + 1
  const newName = newYear + "-" + (newYear + 1)
  const newId = "Y" + newYear

  function handleMigration(){
    const migratingSchedules = Array.from(scheduleIds.values())
    onMigrateYear(latestYear.id, newId, newName, migratingSchedules)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 bg-black rounded-t-lg">          
          <h2 className="text-white font-semibold text-base">Migrating to {newName} Academic year</h2>       
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <ul className="space-y-2">
            {schedules.map(schedule => (
              <li
                key={schedule.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <span className="text-gray-700 dark:text-gray-200">
                  {schedule.name}
                </span>
            
                <input
                  type="checkbox"
                  checked={scheduleIds.has(schedule.id)}
                  onChange={() => toggle(schedule.id)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </li>
            ))}
            <button onClick={handleMigration} className="w-full text-md bg-gray-800 text-white px-10 py-1 rounded hover:bg-gray-700">
              Begin Migration
            </button>
          </ul>          
        </div>
      </div>
    </div>
  )
}
