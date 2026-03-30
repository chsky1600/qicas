import { useState, useEffect, useMemo } from "react"
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
  onMigrateYear: (source_year_id: string, new_year_id: string, name: string, schedule_ids: string[], release_Candidate_Id?: string) => Promise<void>
  onOpenProperties: () => void
  skipYearCheck?: boolean
}

export default function MigrationDialog({
  open, onClose, years, loadedYearId, activeSchedule, schedules, onMigrateYear, onOpenProperties, skipYearCheck
}: Props) {
  type migrationStages  = "SelectSchedules" | "SelectRC" | "Confirm";
  const [migrationStage, setMigrationStage] = useState<migrationStages>("SelectSchedules");
  const [selectedScheduleIds, setSelectedScheduleIds] = useState(new Set<string>());
  const [releaseCandidateId, setReleaseCandidateId] = useState("");
  const latestYear = years.reduce((max, obj) => obj.start_year > max.start_year ? obj : max)

  const selectedSchedules = useMemo(() =>
    schedules.filter(s => selectedScheduleIds.has(s.id)),
    [schedules, selectedScheduleIds]
  )

  useEffect(() => {
    if(open && !skipYearCheck && loadedYearId !== latestYear.id){
      toast.warning(`To create a new academic year you must have the latest year open.`, {
        duration: 8000,
        description: <span>Please open <b>{latestYear.name}</b> and try again.</span>,
        descriptionClassName: '!text-black',
      })
      onClose()
    }
  }, [open, loadedYearId, latestYear.id, skipYearCheck])

  if (!open || (!skipYearCheck && loadedYearId !== latestYear.id)) return null
  
  function toggle(id: string){
    setSelectedScheduleIds(prev => {
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
    setSelectedScheduleIds(new Set(schedules.map(s => s.id)));
  }

  function handleDeselectAll(){
    setSelectedScheduleIds(new Set());
  }

  function handleSelectRC(scheduleId: string){
    if(scheduleId === releaseCandidateId) setReleaseCandidateId("")
    else setReleaseCandidateId(scheduleId)
  }

  async function handleMigration(): Promise<void> {
    const migratingSchedules = Array.from(selectedScheduleIds.values())
    onClose()
    console.log(newName)
    await onMigrateYear(latestYear.id, newId, newName, migratingSchedules, releaseCandidateId)
    await onOpenProperties()
    setTimeout(()=>{
      toast.info(`You may now make any necessary changes for the ${newName} academic year`)
    }, 500)
  }

  function handleNextStage() {
    switch (migrationStage) {
      case "SelectSchedules":
        setMigrationStage("SelectRC")
        break;
      case "SelectRC":
        setMigrationStage("Confirm")
        break;
      case "Confirm":
        handleMigration()
        break;
    }
  }

  function handlePrevStage() {
    switch (migrationStage) {
      case "SelectSchedules":
        onClose()
        break;
      case "SelectRC":
        setMigrationStage("SelectSchedules")
        break;
      case "Confirm":
        setMigrationStage("SelectRC")
        break;
    }
  }

  function SelectSchedulesStage() {
    return (
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <h4><span className="text-red-700 font-bold">Important!</span> You are about to create academic year <b>{newName}</b></h4>
        <p>
          Once created, academic years <span className="text-red-700 font-bold">cannot be deleted</span>.
          You will still be able to view and edit all previous academic years.
        </p>
        <p className="text-blue-400">Select the schedule(s) from <b>{latestYear.name}</b> you would like to copy over to <b>{newName}</b> (optional)
        </p>

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
          {schedules
            .map(s => (
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
                            
                <img src={selectedScheduleIds.has(s.id) ? icon.checkedBox: icon.checkBox} alt="All Saved!" className="w-6 h-6" />
              </div>
            </li>
          ))}
          <div className="flex mx-auto my-1 justify-center ">            
            <button onClick={handlePrevStage} className="w-full text-md bg-gray-800 text-white mx-5 px-5 py-1 rounded hover:bg-gray-500">
              X Cancel
            </button>
            <button onClick={handleNextStage} className="w-full text-md bg-green-500 text-white mx-5 px-5 py-1 rounded hover:bg-green-700">
              Continue &gt;
            </button>
          </div>
        </ul>
      </div>
    )
  }

  function SelectRCStage() {
    return (
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <p>
        Choose a schedule from <b>{latestYear.name}</b> to mark as the final “released” version:<br/>
          • Its assignments will populate the <i>Previously Taught</i> field for instructors in <b>{newName}</b><br/>
          • It will be marked with an <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">RC</span> badge
        </p>       
        <p><span className="text-red-700 font-bold">Important!</span> Changes made to the release candidate after creating <b>{newName}</b> will <span className="text-red-700 font-bold">not carry over</span>.</p>
        
        <p className="text-blue-400">Select a release candidate (optional)</p>
        <div className="border-b-3 border-gray-500 my-1 flex justify-between">
          <span>
            Selected Schedule(s)
          </span>            
        </div>
        <ul className="space-y-2">
          {selectedSchedules
            .map(s => (
            <li
              key={s.id}
              className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              onClick={() => handleSelectRC(s.id)}
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
                {s.id === releaseCandidateId && <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">RC</span>}
                {s.id === activeSchedule?.id && <span className="ml-2 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">Active</span>}
                            
                <img src={s.id === releaseCandidateId ? icon.checkedBox: icon.checkBox} alt="All Saved!" className="w-6 h-6" />
              </div>
            </li>
          ))}
      
        </ul>
        {selectedSchedules.length === 0 &&
          <div className="flex items-center justify-center my-5 text-gray-400 text-sm">
            No schedules were selected. 
          </div>
        }
        <div className="flex mx-auto my-1 justify-center ">            
          <button onClick={handlePrevStage} className="w-full text-md bg-gray-800 text-white mx-5 px-5 py-1 rounded hover:bg-gray-500">
            &lt; Return
          </button>
          <button onClick={handleNextStage} className="w-full text-md bg-green-500 text-white mx-5 px-5 py-1 rounded hover:bg-green-700">
            Continue &gt;
          </button>
        </div>
        
      </div>
    )
  }

  function ConfirmStage() {
    return (
      <div className="mx-auto overflow-y-auto p-3 px-10">
        <span><b>Confirm creation of academic year <b>{newName}</b>?</b></span>
        <div className="flex mx-auto my-1 justify-center ">            
          <button onClick={handlePrevStage} className="w-fit text-md bg-gray-800 text-white mx-5 px-5 py-1 rounded hover:bg-gray-500">
            &lt; Return
          </button>
          <button onClick={handleNextStage} className="w-fit text-md bg-green-500 text-white mx-5 px-5 py-1 rounded hover:bg-green-700">
            Confirm
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) {setMigrationStage("SelectSchedules"); onClose()} }}>
    <DialogContent
        id="migration-dialog"
        showCloseButton={false}
        onInteractOutside={(e) => {
          if (document.querySelector("#driver-popover-content")) e.preventDefault()
        }}
        className="p-0 gap-0 w-4/6 h-auto flex flex-col rounded-lg overflow-hidden"
      >
      <div className="bg-white rounded-lg shadow-xl flex flex-col max-h-[70vh]">
        <DialogTitle className="flex items-center justify-between px-5 py-4 bg-black rounded-t-lg">
          <span className="text-white font-semibold text-base">Creating {newName} Academic year</span>       
          <button id="migration-dialog-close" onClick={() => {setMigrationStage("SelectSchedules"); onClose()}} className="text-white hover:text-gray-300">
            <X size={18} />
          </button>
        </DialogTitle>
        <div className="flex-1 overflow-y-auto">
          {/* three stages of migration, selectSchedules > SelectRC > Confirm */}
          { migrationStage == "SelectSchedules" && SelectSchedulesStage()}
          { migrationStage == "SelectRC" && SelectRCStage()}
          { migrationStage == "Confirm" && ConfirmStage()}
        </div>
        
      </div>
    </DialogContent>
    </Dialog>
  )
}
