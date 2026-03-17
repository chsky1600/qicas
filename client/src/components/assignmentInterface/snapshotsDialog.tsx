import * as React from "react"
import * as ReactDOM from "react-dom"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell
} from "@/components/ui/table"
import type { Snapshot, SectionState, InstructorState } from "@/features/assignment/assignment.types"
import { ViolationDegree } from "@/features/assignment/assignment.types"
import { useSnapshots } from "@/features/assignment/useSnapshots"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SnapshotsDialogProps {
  isOpen: boolean
  onClose: () => void
  sectionState: SectionState
  instructorState: InstructorState
  onApplyLoad: (sectionState: SectionState, instructorState: InstructorState) => void
}

type SortDirection = "asc" | "desc"

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Progress = number of assigned active sections / total active sections
function calcProgress(sectionState: SectionState): { assigned: number; total: number } {
  let assigned = 0
  let total = 0
  for (const id of sectionState.allIds) {
    const section = sectionState.byId[id]
    if (!section.dropped) {
      total++
      if (section.assigned_to !== null) assigned++
    }
  }
  return { assigned, total }
}

// Returns the highest violation severity found across sections and instructors
function getHighestViolation(
  sectionState: SectionState,
  instructorState: InstructorState
): ViolationDegree | null {
  let highest: ViolationDegree | null = null

  for (const id of sectionState.allIds) {
    const v = sectionState.byId[id].in_violation
    if (v === ViolationDegree.E) return ViolationDegree.E
    if (v === ViolationDegree.W) highest = ViolationDegree.W
    else if (v && highest === null) highest = v
  }

  for (const id of instructorState.allIds) {
    const { details_col_violations, fall_col_violations, wint_col_violations } =
      instructorState.byId[id].violations
    for (const v of [...details_col_violations, ...fall_col_violations, ...wint_col_violations]) {
      if (v.degree === ViolationDegree.E) return ViolationDegree.E
      if (v.degree === ViolationDegree.W) highest = ViolationDegree.W
      else if (highest === null) highest = v.degree
    }
  }

  return highest
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Shows a warning icon (⚠) if the snapshot has any rule violations.
// Red = hard violation (E), orange = soft violation (W).
function ViolationIcon({ snap }: { snap: Snapshot }) {
  const severity = getHighestViolation(snap.sectionState, snap.instructorState)
  if (severity === ViolationDegree.E) {
    return (
      <span title="Hard rule violation" className="text-red-600 text-sm font-bold leading-none">
        &#9888;
      </span>
    )
  }
  if (severity === ViolationDegree.W) {
    return (
      <span title="Soft rule violation" className="text-orange-500 text-sm font-bold leading-none">
        &#9888;
      </span>
    )
  }
  return null
}

// Renders a green fill bar showing assigned/total active sections for a snapshot.
function ProgressBar({ snap }: { snap: Snapshot }) {
  const { assigned, total } = calcProgress(snap.sectionState)
  const pct = total === 0 ? 0 : Math.round((assigned / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="w-28 h-3 bg-gray-300 rounded-full overflow-hidden border border-black">
        <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-10">{assigned}/{total}</span>
    </div>
  )
}

// Per-row 3-dot context menu. The dropdown is rendered via a React portal into
// document.body so it escapes the table's overflow-hidden clipping.
function ContextMenu({
  snapshotId,
  onRename,
  onLoad,
  onDelete,
}: {
  snapshotId: string
  onRename: (id: string) => void
  onLoad: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [menuPos, setMenuPos] = React.useState({ top: 0, right: 0 })
  const btnRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close when clicking outside both the button and the floating menu
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!open && btnRef.current) {
      // Capture button position so the portal can align the menu below it
      const r = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: r.bottom + 4, right: window.innerWidth - r.right })
    }
    setOpen((o) => !o)
  }

  return (
    <div>
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="px-2 py-1 text-gray-500 hover:text-black rounded hover:bg-gray-200 font-bold"
      >
        •••
      </button>
      {open && ReactDOM.createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, right: menuPos.right, pointerEvents: "auto" }}
          className="bg-white border border-gray-300 rounded shadow-lg z-[9999] text-sm min-w-[100px]"
        >
          <button
            onClick={(e) => { e.stopPropagation(); onRename(snapshotId); setOpen(false) }}
            className="!block !w-full !text-left !px-4 !py-2 hover:!bg-gray-100"
          >
            Rename
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onLoad(snapshotId); setOpen(false) }}
            className="!block !w-full !text-left !px-4 !py-2 hover:!bg-gray-100"
          >
            Load
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(snapshotId); setOpen(false) }}
            className="!block !w-full !text-left !px-4 !py-2 hover:!bg-gray-100 !text-red-600"
          >
            Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SnapshotsDialog({
  isOpen,
  onClose,
  sectionState,
  instructorState,
  onApplyLoad,
}: SnapshotsDialogProps) {

  const { snapshotState, updateActiveSnapshot, saveSnapshots, loadSnapshot, renameSnapshot, deleteSnapshot } = useSnapshots();

  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc")
  const [renamingId, setRenamingId] = React.useState<string | null>(null)
  const [renameValue, setRenameValue] = React.useState("")
  const [savingMode, setSavingMode] = React.useState(false)
  const [saveName, setSaveName] = React.useState("")

  // When Snapshot menu switches to 'isOpen = true' update Active Snapshot with data from assignment interface
  React.useEffect(() => {
    if (isOpen) updateActiveSnapshot(sectionState, instructorState);
  }, [isOpen, sectionState, instructorState, updateActiveSnapshot]);

  // Reset saving state on close so re-opening the dialog starts fresh.
  const handleClose = () => {
    setSavingMode(false)
    setSaveName("")
    onClose()
  }

  // Keep a counter so auto-names stay unique even after deletions
  const snapshotCounter = React.useRef(0)

  // Sort snapshots by date
  const sortedSnapshots = React.useMemo(() => {
    return [...snapshotState.allIds].sort((a, b) => {
      const cmp = snapshotState.byId[a].date.localeCompare(snapshotState.byId[b].date)
      return sortDirection === "asc" ? cmp : -cmp
    })
  }, [snapshotState, sortDirection])

  // "Save Current as Snapshot" — auto-names with incrementing counter
  const handleSaveCurrent = () => {
    snapshotCounter.current += 1
    setSaveName(`${snapshotCounter.current} - `)
    setSavingMode(true)
  }

  // Confirm the save with the given name
  const confirmSave = () => {
    if (saveName.trim()) {
      saveSnapshots(saveName.trim(), sectionState, instructorState)
      setSavingMode(false)
    }
  }

  // Load the selected row (header button)
  const handleLoadSelected = () => {
    if (!selectedId) return
    handleLoad(selectedId)
  }

  // Load from context menu or header button
  const handleLoad = (snapshotId: string) => {
    const result = loadSnapshot(snapshotId)
    if (result) {
      onApplyLoad(result.sectionState, result.instructorState)
      onClose()
    }
  }

  // Deselect row if the deleted snapshot was selected.
  const handleDelete = (snapshotId: string) => {
    deleteSnapshot(snapshotId)
    if (selectedId === snapshotId) setSelectedId(null)
  }

  // Swap the name cell to an inline text input pre-filled with the current name.
  const startRename = (snapshotId: string) => {
    const snap = snapshotState.byId[snapshotId]
    if (snap) {
      setRenamingId(snapshotId)
      setRenameValue(snap.name)
    }
  }

  // Commit on Enter or blur; no-op if blank.
  const commitRename = (snapshotId: string) => {
    if (renameValue.trim()) renameSnapshot(snapshotId, renameValue.trim())
    setRenamingId(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent
        showCloseButton={false}
        className="w-[800px] h-[520px] p-0 gap-0 overflow-hidden border border-black rounded-md bg-[#f4f4f4] flex flex-col"
      >
        {/* ── Header bar ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between bg-black text-white h-13 px-4 gap-4">
          <div className="text-sm font-semibold opacity-80">Snapshots</div>

          <div className="flex gap-2 items-center">
            {savingMode ? (
              <>
                <input
                  autoFocus
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") confirmSave() }}
                  className="bg-white text-black text-sm px-3 py-1.5 rounded border border-gray-400 w-52"
                />
                <button
                  onClick={confirmSave}
                  className="!bg-white !text-black text-sm font-semibold px-4 py-1.5 rounded border border-gray-400 hover:!bg-gray-100"
                >
                  Confirm Save
                </button>
                <button
                  onClick={() => setSavingMode(false)}
                  className="!bg-transparent !text-white text-sm px-2 py-1.5 hover:opacity-70"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveCurrent}
                  className="!bg-white !text-black text-sm font-semibold px-4 py-1.5 rounded border border-gray-400 hover:!bg-gray-100"
                >
                  Save Current as Snapshot
                </button>
                <button
                  onClick={handleLoadSelected}
                  disabled={!selectedId}
                  className="!bg-white !text-black text-sm font-semibold px-4 py-1.5 rounded border border-gray-400 hover:!bg-gray-100"
                >
                  Load Snapshot
                </button>
              </>
            )}
          </div>

          <button onClick={handleClose} className="text-lg leading-none hover:opacity-80 ml-auto">
            ×
          </button>
        </div>

        {/* ── Table ───────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow className="!bg-[#e0e0e0] hover:!bg-[#e0e0e0]">
                <TableHead className="w-[280px]">Name</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => setSortDirection((d) => (d === "asc" ? "desc" : "asc"))}
                >
                  Date {sortDirection === "asc" ? "↑" : "↓"}
                </TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {sortedSnapshots.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-10">
                    No snapshots yet. Click "Save Current as Snapshot" to create one.
                  </TableCell>
                </TableRow>
              )}

              {sortedSnapshots.map((snapId) => (
                <TableRow
                  key={snapId}
                  onClick={() => setSelectedId(snapId)}
                  className={`cursor-pointer ${selectedId === snapId ? "!bg-gray-300 hover:!bg-gray-300" : ""}`}
                >
                  {/* Name cell */}
                  <TableCell className="max-w-[280px]">
                    {renamingId === snapId ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(snapId)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitRename(snapId) }}
                        onClick={(e) => e.stopPropagation()}
                        className="border border-black rounded px-2 py-0.5 text-sm w-full"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[220px] block" title={snapshotState.byId[snapId].name}>{snapshotState.byId[snapId].name}</span>
                        <ViolationIcon snap={snapshotState.byId[snapId]} />
                      </div>
                    )}
                  </TableCell>

                  {/* Progress cell */}
                  <TableCell>
                    <ProgressBar snap={snapshotState.byId[snapId]} />
                  </TableCell>

                  {/* Date cell */}
                  <TableCell className="text-sm text-gray-700">
                    {snapshotState.byId[snapId].date.replace(/-/g, "/")}
                  </TableCell>

                  {/* Context menu cell */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <ContextMenu
                      snapshotId={snapId}
                      onRename={startRename}
                      onLoad={handleLoad}
                      onDelete={handleDelete}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
