import { useState } from "react"
import * as Popover from "@radix-ui/react-popover"
import { SlidersHorizontal } from "lucide-react"
import type { InstructorRank } from "@/features/schedule/types"
import { RANK_DISPLAY } from "@/features/schedule/types"

export type SortBy =
  | "name-asc" | "name-desc"
  | "workload-asc" | "workload-desc"
  | "fulfillment-asc" | "fulfillment-desc"
  | null

interface Props {
  onChange: (search: string, sortBy: SortBy, rankFilter: Set<InstructorRank>) => void
}

export default function InstructorFilters({ onChange }: Props) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<SortBy>(null)
  const [rankFilter, setRankFilter] = useState<Set<InstructorRank>>(new Set())

  const isFiltered = sortBy !== null || rankFilter.size > 0

  function updateSort(val: SortBy) {
    const next = sortBy === val ? null : val
    setSortBy(next)
    onChange(search, next, rankFilter)
  }

  function toggleRank(rank: InstructorRank) {
    const next = new Set(rankFilter)
    next.has(rank) ? next.delete(rank) : next.add(rank)
    setRankFilter(next)
    onChange(search, sortBy, next)
  }

  function updateSearch(val: string) {
    setSearch(val)
    onChange(val, sortBy, rankFilter)
  }

  function clearAll() {
    setSortBy(null)
    setRankFilter(new Set())
    onChange(search, null, new Set())
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`p-1 rounded border ${isFiltered ? "border-gray-800 bg-gray-800 text-white" : "border-gray-300 text-gray-500 hover:border-gray-500"}`}
        >
          <SlidersHorizontal size={12} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          className="z-50 w-56 rounded-md border border-gray-200 bg-white shadow-lg p-3 text-sm"
        >
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Search instructors..."
                value={search}
                onChange={e => updateSearch(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:border-gray-400"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Sort by Name</p>
              <div className="flex gap-1">
                <button onClick={() => updateSort("name-asc")}
                  className={`flex-1 px-2 py-1 rounded text-xs border ${sortBy === "name-asc" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:border-gray-400"}`}>
                  A → Z
                </button>
                <button onClick={() => updateSort("name-desc")}
                  className={`flex-1 px-2 py-1 rounded text-xs border ${sortBy === "name-desc" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:border-gray-400"}`}>
                  Z → A
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Sort by Workload</p>
              <div className="flex gap-1">
                <button onClick={() => updateSort("workload-desc")}
                  className={`flex-1 px-2 py-1 rounded text-xs border ${sortBy === "workload-desc" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:border-gray-400"}`}>
                  High → Low
                </button>
                <button onClick={() => updateSort("workload-asc")}
                  className={`flex-1 px-2 py-1 rounded text-xs border ${sortBy === "workload-asc" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:border-gray-400"}`}>
                  Low → High
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Sort by Fulfillment</p>
              <div className="flex gap-1">
                <button onClick={() => updateSort("fulfillment-desc")}
                  className={`flex-1 px-2 py-1 rounded text-xs border ${sortBy === "fulfillment-desc" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:border-gray-400"}`}>
                  High → Low
                </button>
                <button onClick={() => updateSort("fulfillment-asc")}
                  className={`flex-1 px-2 py-1 rounded text-xs border ${sortBy === "fulfillment-asc" ? "bg-gray-800 text-white border-gray-800" : "border-gray-200 hover:border-gray-400"}`}>
                  Low → High
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Filter by Position</p>
              <div className="space-y-1">
                {(Object.keys(RANK_DISPLAY) as InstructorRank[]).map(rank => (
                  <label key={rank} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rankFilter.has(rank)}
                      onChange={() => toggleRank(rank)}
                      className="rounded"
                    />
                    <span className="text-xs">{RANK_DISPLAY[rank].long}</span>
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
