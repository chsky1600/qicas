import { useState, useRef, useEffect } from "react"
import type { Year, Schedule, ValidationMode } from "@/features/schedule/types"
import * as icon from '@/assets/index'

interface Props {
  years: Year[]
  yearId: string
  schedule: Schedule | null
  saving: boolean
  role: "admin" | "support" | null
  onChangeYear: (yearId: string) => void
  onOpenProperties: () => void
  onOpenUsers: () => void
  onOpenAccount: () => void
  onOpenSnapshots: () => void
  onOpenHowTo: () => void
  onExportData: () => void
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
  role, onChangeYear, onOpenProperties, onOpenUsers, onOpenAccount, onOpenSnapshots, onOpenHowTo, onExportData, onStartTutorial, onOpenMigration,
  onLogout, isAdmin, userName, validationMode, setValidationMode, validateNow, validationStale
}: Props) {
  const migrate = "migrate"
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const btn = "flex items-center bg-[#1a1a1a] text-white border border-[#444] px-3 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors focus:outline-none"
  const label = "toolbar-label inline-block overflow-hidden max-w-0 opacity-0 group-hover:max-w-40 group-hover:opacity-100 group-hover:ml-2 transition-all duration-600 ease-out whitespace-nowrap"
  const menuItem = "w-full text-left px-4 py-2.5 text-sm hover:bg-[#3c3c3c] transition-colors flex items-center gap-2 whitespace-nowrap"

  return (
    <div className="flex justify-between items-center bg-[#1a1a1a] text-white px-4 sm:px-8 py-3 sm:py-4 border-b-2 border-[#2c2c2c] overflow-visible z-50 relative">
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        <div className="flex items-center gap-1.5 font-bold shrink-0">
          <span className="text-4xl leading-none">Q</span>
          <span className="text-sm leading-tight tracking-wide">IC<br/>AS</span>
        </div>
        <select
          id="toolbar-year-select"
          className="bg-[#2c2c2c] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] shrink-0"
          value={yearId}
          onChange={e => e.target.value == migrate ? onOpenMigration() : onChangeYear(e.target.value)}
        >
          {years.map(y => (
            <option key={y.id} value={y.id}>{y.name}</option>
          ))}
          {isAdmin && <option key={migrate} value={migrate}>New Year +</option>}
        </select>
        <div className="flex items-center gap-2 min-w-0">
          {schedule && <span id="toolbar-active-schedule" className="text-white text-sm truncate">{schedule.name}</span>}
          {saving ?
            <img src={icon.spin} alt="Saving..." className="w-8 h-8 animate-spin shrink-0" /> :
            <img src={icon.cloudSave} alt="All Saved!" className="w-8 h-8 shrink-0" />
          }
          {userName && <span className="text-sm text-gray-400 truncate hidden md:inline">{new Date().getHours() >= 18 ? "Bonsoir" : "Bonjour"}, {userName.split(" ")[0]}</span>}
        </div>
      </div>

      <div className="flex gap-1 shrink-0 items-center">
        {isAdmin && (
          <div className="group p-1 -m-0.5">
            <button id="toolbar-edit-properties" onClick={onOpenProperties} className={btn}>
              <img src={icon.edit} alt="Edit Properties" className="w-6 h-6"/><span className={label}>Edit Properties</span>
            </button>
          </div>
        )}
        <div className="group p-1 -m-0.5">
          <button id="toolbar-saved-schedules" onClick={onOpenSnapshots} className={btn}>
            <img src={icon.save} alt="Saved Schedules" className="w-6 h-6"/><span className={label}>Saved Schedules</span>
          </button>
        </div>
        <div className="group p-1 -m-0.5">
          <button id="toolbar-export" onClick={onExportData} className={btn}>
            <img src={icon.userExport} alt="Export" className="w-6 h-6"/><span className={label}>Export</span>
          </button>
        </div>
        {isAdmin && (validationMode === "auto" ? (
          <div id="toolbar-validation-mode" className="group p-1 -m-0.5">
            <button
              onClick={() => setValidationMode("manual")}
              className={`${btn} gap-2`}
            >
              <span className="group-hover:hidden">Validate: Auto</span>
              <span className="hidden group-hover:inline">Switch to Manual</span>
            </button>
          </div>
        ) : (
          <div id="toolbar-validation-mode" className="relative group p-1 -m-0.5">
            <button
              onClick={(e) => { (e.target as HTMLElement).blur(); validateNow() }}
              className={`flex items-center justify-center gap-2 text-white px-3 py-2 rounded text-sm cursor-pointer transition-colors bg-[#1a1a1a] border hover:bg-[#3c3c3c] focus:outline-none ${validationStale ? "border-green-500 animate-pulse" : "border-[#444]"}`}
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

        {/* More dropdown */}
        <div id="toolbar-more-wrapper" className="group relative p-1 -m-0.5" ref={moreRef}>
          <button id="toolbar-more" onClick={() => setMoreOpen(o => !o)} className={btn}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256" className="w-6 h-6 fill-white"><circle cx="128" cy="128" r="16"/><circle cx="128" cy="64" r="16"/><circle cx="128" cy="192" r="16"/></svg>
            <span className={label}>More</span>
          </button>
          {moreOpen && (
            <div className="absolute right-0 top-full mt-1 bg-[#2c2c2c] border border-[#444] rounded shadow-lg py-1 z-50 min-w-[160px]">
              {role === "admin" && (
                <button id="toolbar-users" onClick={() => { setMoreOpen(false); onOpenUsers() }} className={menuItem}>
                  <img src={icon.users} alt="Users" className="w-5 h-5"/>Users
                </button>
              )}
              {role === "support" && (
                <button onClick={() => { setMoreOpen(false); onOpenAccount() }} className={menuItem}>
                  <img src={icon.user} alt="Account" className="w-5 h-5"/>Account
                </button>
              )}
              <button id="toolbar-tutorial" onClick={() => { setMoreOpen(false); onStartTutorial() }} className={menuItem}>
                <img src={icon.tutorial} alt="Tutorial" className="w-5 h-5"/>Tutorial
              </button>
              {isAdmin && 
                <button id="toolbar-howto" onClick={() => { setMoreOpen(false); onOpenHowTo() }} className={menuItem}>
                  <img src={icon.howTo} alt="How-To's" className="w-5 h-5"/>How-To's
                </button>
              }
              <div className="border-t border-[#444] my-1" />
              <button onClick={() => { setMoreOpen(false); onLogout() }} className={menuItem}>
                <img src={icon.logout} alt="Logout" className="w-5 h-5"/>Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
