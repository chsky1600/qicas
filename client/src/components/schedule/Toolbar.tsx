import type { Year, Schedule } from "@/features/schedule/types"
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
  onOpenMigration: () => void
}

export default function Toolbar({
  years, yearId, schedule, saving,
  onChangeYear, onOpenProperties, onOpenSnapshots, onExportCSV, onOpenMigration
}: Props) {
  const navigate = useNavigate();

  function handleLogout() {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    navigate("/login", { replace: true });
  }
  const migrate = "migrate"

  return (
    <div className="flex justify-between items-center bg-[#1a1a1a] text-white px-8 py-4 border-b-2 border-[#2c2c2c]">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5 font-bold">
          <span className="text-4xl leading-none">Q</span>
          <span className="text-sm leading-tight tracking-wide">IC<br/>AS</span>
        </div>
        <select
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
          {schedule && <span className="text-white text-sm">{schedule.name}</span>}
          {saving ? // if saving, show spining icon, otherwise all saved icon
            <img src={icon.spin} alt="Saving..." className="w-8 h-8 animate-spin" /> :
            <img src={icon.cloudSave} alt="All Saved!" className="w-8 h-8" />
          }
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <img src={icon.tutorial} alt="Tutorial" className="w-6 h-6"/>Tutorial
        </button>
        <button onClick={onOpenProperties} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <img src={icon.edit} alt="Edit Properties" className="w-6 h-6"/>Edit Properties
        </button>
        <button onClick={onOpenSnapshots} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <img src={icon.save} alt="Saved Schedules" className="w-6 h-6"/>Saved Schedules
        </button>
        <button onClick={onExportCSV} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <img src={icon.userExport} alt="Export" className="w-6 h-6"/>Export
        </button>
        <button onClick={handleLogout} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <img src={icon.logout} alt="Settings" className="w-6 h-6"/>Logout
        </button>
      </div>
    </div>
  )
}
