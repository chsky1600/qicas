import type { Year, Schedule, ValidationMode } from "@/features/schedule/types"
import * as icon from '@/assets/index'

interface Props {
  years: Year[]
  yearId: string
  schedule: Schedule | null
  saving: boolean
  onChangeYear: (yearId: string) => void
  onOpenProperties: () => void
  onOpenSnapshots: () => void
  onExportCSV: () => void
  onStartTutorial: () => void
  onOpenMigration: () => void
  onLogout: () => void
  isAdmin: boolean
  userName: string | null
  validationMode: ValidationMode
  setValidationMode: (mode: ValidationMode) => void
  validateNow: () => Promise<void>
  validationStale: boolean
}

export default function Toolbar({
  years, yearId, schedule, saving,
  onChangeYear, onOpenProperties, onOpenSnapshots, onExportCSV, onStartTutorial, onOpenMigration,
  onLogout, isAdmin, userName, validationMode, setValidationMode, validateNow, validationStale
}: Props) {
  const migrate = "migrate"

  return (
    <div className="flex justify-between items-center bg-[#1a1a1a] text-white px-8 py-4 border-b-2 border-[#2c2c2c] overflow-visible z-50 relative">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-4xl leading-none">Q</span>
          <span className="text-sm leading-tight tracking-wide">IC<br/>AS</span>
        </div>
        <select
          id="toolbar-year-select"
          className="bg-[#2c2c2c] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c]"
          value={yearId}
          onChange={e => e.target.value == migrate ? onOpenMigration() : onChangeYear(e.target.value)}
        >
          {years.map(y => (
            <option key={y.id} value={y.id}>{y.name}</option>
          ))}
          {isAdmin && <option key={migrate} value={migrate}>New Year +</option>}
        </select>
        <div className="flex items-center gap-2">
          {schedule && <span id="toolbar-active-schedule" className="text-white text-sm">{schedule.name}</span>}
          {saving ?
            <img src={icon.spin} alt="Saving..." className="w-8 h-8 animate-spin" /> :
            <img src={icon.cloudSave} alt="All Saved!" className="w-8 h-8" />
          }
          {userName && <span className="text-sm text-gray-400">{new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour"}, {userName.split(" ")[0]}</span>}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onStartTutorial} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors focus:outline-none">
          <img src={icon.tutorial} alt="Tutorial" className="w-6 h-6"/>Tutorial
        </button>
        {isAdmin && (
          <button id="toolbar-edit-properties" onClick={onOpenProperties} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors focus:outline-none">
            <img src={icon.edit} alt="Edit Properties" className="w-6 h-6"/>Edit Properties
          </button>
        )}
        <button id="toolbar-saved-schedules" onClick={onOpenSnapshots} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors focus:outline-none">
          <img src={icon.save} alt="Saved Schedules" className="w-6 h-6"/>Saved Schedules
        </button>
        <button id="toolbar-export" onClick={onExportCSV} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors focus:outline-none">
          <img src={icon.userExport} alt="Export" className="w-6 h-6"/>Export
        </button>
        {isAdmin && (validationMode === "auto" ? (
          <button
            onClick={() => setValidationMode("manual")}
            className="group flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors focus:outline-none"
          >
            <span className="group-hover:hidden">Validate: Auto</span>
            <span className="hidden group-hover:inline">Switch to Manual</span>
          </button>
        ) : (
          <div className="relative group">
            <button
              onClick={(e) => { (e.target as HTMLElement).blur(); validateNow() }}
              className={`flex items-center justify-center gap-2 text-white px-4 py-2 rounded text-sm cursor-pointer transition-colors bg-[#1a1a1a] border hover:bg-[#3c3c3c] focus:outline-none ${validationStale ? "border-green-500 animate-pulse" : "border-[#444]"}`}
            >
              <img src={icon.lightning} alt="Validate" className={`w-6 h-6 ${validationStale ? "hidden" : ""}`}/><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" className={`fill-green-400 shrink-0 ${validationStale ? "" : "hidden"}`}><path d="M96,240l16-80L48,136,160,16,144,96l64,24Z" opacity="0.2"/><path d="M215.79,118.17a8,8,0,0,0-5-5.66L153.18,90.9l14.66-73.33a8,8,0,0,0-13.69-7l-112,120a8,8,0,0,0,3,13l57.63,21.61L88.16,238.43a8,8,0,0,0,13.69,7l112-120A8,8,0,0,0,215.79,118.17ZM109.37,214l10.47-52.38a8,8,0,0,0-5-9.06L62,132.71l84.62-90.66L136.16,94.43a8,8,0,0,0,5,9.06l52.8,19.8Z"/></svg>Validate
            </button>
            <div className="absolute top-full left-1/2 -translate-x-1/2 pt-0.5 hidden group-hover:block whitespace-nowrap">
              <button
                onClick={() => setValidationMode("auto")}
                className="bg-[#2c2c2c] text-white border border-[#444] px-4 py-1.5 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] text-center focus:outline-none"
              >
                Switch to Auto
              </button>
            </div>
          </div>
        ))}
        <button onClick={onLogout} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors focus:outline-none">
          <img src={icon.logout} alt="Settings" className="w-6 h-6"/>Logout
        </button>
      </div>
    </div>
  )
}
