import { useState } from "react"
import * as Popover from "@radix-ui/react-popover"
import { SlidersHorizontal } from "lucide-react"

export type CourseSortBy = "code-asc" | "code-desc" | "cap-asc" | "cap-desc" | null
const AVAIL_OPTIONS = ["Fall", "Winter", "Fall/Wint.", "Full Year"]

interface Props {
  onChange: (sortBy: CourseSortBy, availFilter: Set<string>) => void
}

export default function CourseFilters({ onChange }: Props) {
  const [sortBy, setSortBy] = useState<CourseSortBy>(null)
  const [availFilter, setAvailFilter] = useState<Set<string>>(new Set())

  const isFiltered = sortBy !== null || availFilter.size > 0

  function updateSort(val: CourseSortBy) {
    const next = sortBy === val ? null : val
    setSortBy(next)
    onChange(next, availFilter)
  }

  function toggleAvail(val: string) {
    const next = new Set(availFilter)
    next.has(val) ? next.delete(val) : next.add(val)
    setAvailFilter(next)
    onChange(sortBy, next)
  }

  function clearAll() {
    setSortBy(null)
    setAvailFilter(new Set())
    onChange(null, new Set())
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`p-1 rounded border ${isFiltered ? "border-gray-800 bg-gray-800 text-white" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}
        >
          <SlidersHorizontal size={14} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={6}
          className="z-50 w-52 rounded-md border border-gray-200 bg-white shadow-lg p-3 text-sm"
        >
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Sort by Course Code</p>
              <div className="flex gap-1">
                <button onClick={() => updateSort("code-asc")}
                  className={`flex-1 px-2 py-1 rounded text-xs border ${sortBy === "code-asc" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:border-gray-400"}`}>
                  A → Z
                </button>
                <button onClick={() => updateSort("code-desc")}
                  className={`flex-1 px-2 py-1 rounded text-xs border ${sortBy === "code-desc" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:border-gray-400"}`}>
                  Z → A
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Sort by Capacity</p>
              <div className="flex gap-1">
                <button onClick={() => updateSort("cap-desc")}
                  className={`flex-1 px-2 py-1 rounded text-xs border ${sortBy === "cap-desc" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:border-gray-400"}`}>
                  High → Low
                </button>
                <button onClick={() => updateSort("cap-asc")}
                  className={`flex-1 px-2 py-1 rounded text-xs border ${sortBy === "cap-asc" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:border-gray-400"}`}>
                  Low → High
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Filter by Availability</p>
              <div className="space-y-1">
                {AVAIL_OPTIONS.map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={availFilter.has(opt)}
                      onChange={() => toggleAvail(opt)}
                      className="rounded"
                    />
                    <span className="text-xs">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {isFiltered && (
              <button
                onClick={clearAll}
                className="w-full text-xs text-red-500 hover:text-red-700 text-center pt-1 border-t border-gray-100"
              >
                Clear all
              </button>
            )}
          </div>
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
