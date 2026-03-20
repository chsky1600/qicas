import type { Year, Schedule } from "@/features/schedule/types"

interface Props {
  years: Year[]
  yearId: string
  schedule: Schedule | null
  onChangeYear: (yearId: string) => void
  onOpenProperties: () => void
  onOpenSnapshots: () => void
  onExportCSV: () => void
}

export default function Toolbar({
  years, yearId, schedule,
  onChangeYear, onOpenProperties, onOpenSnapshots, onExportCSV
}: Props) {
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
          onChange={e => onChangeYear(e.target.value)}
        >
          {years.map(y => (
            <option key={y.id} value={y.id}>{y.name}</option>
          ))}
        </select>
        {schedule && <span className="text-gray-400 text-xs">{schedule.name}</span>}
      </div>

      <div className="flex gap-2">
        <button className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <span className="text-lg">📖</span>Tutorial
        </button>
        <button onClick={onOpenProperties} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <span className="text-lg">📄</span>Edit Properties
        </button>
        <button onClick={onOpenSnapshots} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <span className="text-lg">📸</span>Saved Schedules
        </button>
        <button onClick={onExportCSV} className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <span className="text-lg">📤</span>Export
        </button>
        <button className="flex items-center gap-2 bg-[#1a1a1a] text-white border border-[#444] px-4 py-2 rounded text-sm cursor-pointer hover:bg-[#3c3c3c] transition-colors">
          <span className="text-lg">⚙️</span>Settings
        </button>
      </div>
    </div>
  )
}
