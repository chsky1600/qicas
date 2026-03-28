import { useState, useEffect } from "react"
import { X } from "lucide-react"
import type { Year, Schedule } from "@/features/schedule/types"
import * as icon from '@/assets/index'
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"

interface Props {
  open: boolean
  onClose: () => void
  years: Year[]
  loadedYearId: string
  activeSchedule: Schedule | null
  schedules: Schedule[]
  onMigrateYear: (source_year_id: string, new_year_id: string, name: string, schedule_ids: string[]) => Promise<void>
}

export default function MigrationDialog({
  open, onClose, years, loadedYearId, activeSchedule, schedules, onMigrateYear
}: Props) {
  const [confirmMigration, setConfirmMigration] = useState(false);
  const [scheduleIds, setScheduleIds] = useState(new Set<string>());
  const latestYear = years.reduce((max, obj) => obj.start_year > max.start_year ? obj : max)
  

  useEffect(() => {
    if(open && loadedYearId !== latestYear.id){
      toast.warning(`To create a new academic year you must have the latest year open.`, {
        duration: 8000,
        description: <span>Please open <b>{latestYear.name}</b> and try again.</span>,
        descriptionClassName: '!text-black',
      })
    }
    onClose()
  }, [open, loadedYearId, latestYear.id])

  if (!open || loadedYearId !== latestYear.id) return null
  
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

  function handleSelectAll() { 
    setScheduleIds(new Set(schedules.map(s => s.id)));
  }

  function handleDeselectAll(){
    setScheduleIds(new Set());
  }

  function handleMigration(){
    const migratingSchedules = Array.from(scheduleIds.values())
    onMigrateYear(latestYear.id, newId, newName, migratingSchedules)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
    <DialogContent
        id="saved-schedules-dialog"
        showCloseButton={false}
        onInteractOutside={(e) => {
          const target = e.target as Element
          if (target.closest?.("#driver-popover-content")) e.preventDefault()
        }}
        className="p-0 gap-0 w-1/2 h-auto flex flex-col rounded-lg overflow-hidden"
      >
      <div className="bg-white rounded-lg shadow-xl flex flex-col">
        <DialogTitle className="flex items-center justify-between px-5 py-4 bg-black rounded-t-lg">
          <span className="text-white font-semibold text-base">Creating {newName} Academic year</span>       
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <X size={18} />
          </button>
        </DialogTitle>
        { !confirmMigration ?
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          <h4><span className="text-red-700 font-bold">Important!</span> You are about to create academic year <b>{newName}</b></h4>
          <p>
            Once created, academic years <span className="text-red-700 font-bold">cannot be deleted</span>.
            You will still be able to view and edit all previous academic years.
          </p>
          <div className="text-blue-400">Optionally, select the schedule(s) from <b>{latestYear.name}</b> you would like to copy over to <b>{newName}</b>:
          </div>

          <div className="border-b-3 border-gray-500 my-1 flex justify-between">
            <span>
              {latestYear.name} Schedule(s)
            </span>

            <div>
              <button onClick={handleSelectAll} className="text-xs bg-gray-300 text-black m-1 px-1.5 py-0.5 rounded hover:bg-gray-400">
                Select All
              </button>
              <button onClick={handleDeselectAll} className="text-xs bg-gray-300 text-black m-1 px-1.5 py-0.5 rounded hover:bg-gray-400">
                Deselect All
              </button>
            </div>            
          </div>
          <ul className="space-y-2">
            {schedules.map(s => (
              <li
                key={s.id}
                className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                onClick={() => toggle(s.id)}
              >
                <div>
                  <span className="m-1 text-gray-700 dark:text-gray-200">
                    {s.name}              
                  </span>
                  <span className="m-1 text-xs text-gray-400">                    
                    {"created: " + new Date(s.date_created).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {s.is_rc && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">RC</span>}
                  {s.id === activeSchedule?.id && <span className="ml-2 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">Active</span>}
                              
                  <img src={scheduleIds.has(s.id) ? icon.checkedBox: icon.checkBox} alt="All Saved!" className="w-6 h-6" />
                </div>
              </li>
            ))}
            <button onClick={() => setConfirmMigration(true)} className="w-full text-md bg-gray-800 text-white px-10 py-1 rounded hover:bg-gray-500">
              Create new academic year
            </button>
          </ul>
        </div>
        :
        <div className="mx-auto overflow-y-auto p-3 px-10">
          <span><b>Confirm creation of academic year <b>{newName}</b>?</b></span>
          <div className="flex mx-auto my-1 justify-center ">            
            <button onClick={handleMigration} className="w-fit text-md bg-green-500 text-white mx-5 px-5 py-1 rounded hover:bg-green-700">
              Confirm
            </button>
            <button onClick={() => setConfirmMigration(false)} className="w-fit text-md bg-gray-800 text-white mx-5 px-5 py-1 rounded hover:bg-gray-500">
              Return
            </button>
          </div>
        </div>
        }
      </div>
    </DialogContent>
    </Dialog>
  )
}
