import type { Year, Schedule, ValidationMode } from "@/features/schedule/types"
import * as icon from '@/assets/index'
import { useNavigate } from 'react-router-dom';

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
  isAdmin: boolean
  validationMode: ValidationMode
  setValidationMode: (mode: ValidationMode) => void
  validateNow: () => Promise<void>
  validationStale: boolean
}

export default function Toolbar({
  years, yearId, schedule, saving,
  onChangeYear, onOpenProperties, onOpenSnapshots, onExportCSV, onStartTutorial, onOpenMigration,
  isAdmin, validationMode, setValidationMode, validateNow, validationStale
}: Props) {
  const navigate = useNavigate();

  function handleLogout() {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login", { replace: true });
  }
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
          <option key={migrate} value={migrate}>New Year +</option>
        </select>
        <div className="flex items-center gap-2">
          {schedule && <span id="toolbar-active-schedule" className="text-white text-sm">{schedule.name}</span>}
          {saving ?
            <img src={icon.spin} alt="Saving..." className="w-8 h-8 animate-spin" /> :
            <img src={icon.cloudSave} alt="All Saved!" className="w-8 h-8" />
          }
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onStartTutorial} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <img src={icon.tutorial} alt="Tutorial" className="w-6 h-6"/>Tutorial
        </button>
        {isAdmin && (
          <button id="toolbar-edit-properties" onClick={onOpenProperties} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
            <img src={icon.edit} alt="Edit Properties" className="w-6 h-6"/>Edit Properties
          </button>
        )}
        <button id="toolbar-saved-schedules" onClick={onOpenSnapshots} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <img src={icon.save} alt="Saved Schedules" className="w-6 h-6"/>Saved Schedules
        </button>
        <button id="toolbar-export" onClick={onExportCSV} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <img src={icon.userExport} alt="Export" className="w-6 h-6"/>Export
        </button>
        {isAdmin && (validationMode === "auto" ? (
          <div className="relative group">
            <button className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
              <img src={icon.lightning} alt="Validate" className="w-6 h-6"/>Validate: Auto
            </button>
            <div className="absolute top-full left-0 w-full pt-0.5 hidden group-hover:block">
              <button
                onClick={() => setValidationMode("manual")}
                className="w-full bg-[#2c2c2c] text-white border border-[#444] px-4 py-1.5 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] text-center"
              >
                Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <button
              onClick={validateNow}
              className={`flex items-center justify-center gap-2 text-white px-4 py-2 rounded text-sm cursor-pointer transition-colors ${validationStale ? "bg-green-700 border border-green-600 hover:bg-green-600" : "bg-[#1a1a1a] border border-[#444] hover:bg-[#3c3c3c]"}`}
            >
              <img src={icon.lightning} alt="Validate" className="w-6 h-6"/>Validate
            </button>
            <div className="absolute top-full left-0 w-full pt-0.5 hidden group-hover:block">
              <button
                onClick={() => setValidationMode("auto")}
                className="w-full bg-[#2c2c2c] text-white border border-[#444] px-4 py-1.5 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] text-center"
              >
                Auto
              </button>
            </div>
          </div>
        ))}
        <button onClick={handleLogout} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <img src={icon.logout} alt="Settings" className="w-6 h-6"/>Logout
        </button>
      </div>
    </div>
  )
}
