import { useState } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface Scribe {
  title: string
  embedUrl: string | null
}

const ADMIN_SCRIBES: Scribe[] = [
  { title: "Assign a course section to an instructor", embedUrl: null },
  { title: "Reassign a section to a different instructor", embedUrl: null },
  { title: "Unassign a section", embedUrl: null },
  { title: "View and interpret violation warnings", embedUrl: null },
  { title: "Use the validation toggle", embedUrl: null },
  { title: "Highlight / cross-reference sections", embedUrl: null },
  { title: "Manage instructors", embedUrl: null },
  { title: "Manage instructor notes", embedUrl: null },
  { title: "Set designated courses for adjuncts", embedUrl: null },
  { title: "Adjust workload modifier", embedUrl: null },
  { title: "Manage courses", embedUrl: null },
  { title: "Configure course rules", embedUrl: null },
  { title: "Manage sections", embedUrl: null },
  { title: "Manage schedule snapshots", embedUrl: null },
  { title: "Switch between schedules", embedUrl: null },
  { title: "Switch academic year", embedUrl: null },
  { title: "Migrate faculty to a new year", embedUrl: null },
  { title: "Filter and sort instructors", embedUrl: null },
  { title: "Filter and search courses", embedUrl: null },
  { title: "Export schedule to CSV", embedUrl: null },
  { title: "Run the in-app tutorial", embedUrl: null },
]

const SUPPORT_SCRIBES: Scribe[] = [
  { title: "View schedule and assignments", embedUrl: null },
  { title: "View and interpret violation warnings", embedUrl: null },
  { title: "Highlight / cross-reference sections", embedUrl: null },
  { title: "Manage instructor notes", embedUrl: null },
  { title: "View and switch between schedules", embedUrl: null },
  { title: "Switch academic year", embedUrl: null },
  { title: "Filter and sort instructors", embedUrl: null },
  { title: "Filter and search courses", embedUrl: null },
  { title: "Export schedule to CSV", embedUrl: null },
  { title: "Run the in-app tutorial", embedUrl: null },
]

interface Props {
  open: boolean
  onClose: () => void
  isAdmin: boolean
}

export default function HowToDialog({ open, onClose, isAdmin }: Props) {
  const scribes = isAdmin ? ADMIN_SCRIBES : SUPPORT_SCRIBES
  const [selected, setSelected] = useState<number>(0)
  const active = scribes[selected]

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="w-[900px] h-[600px] p-0 gap-0 border border-black rounded-md grid-rows-[auto_1fr]"
      >
        <DialogTitle className="flex items-center justify-between bg-black text-white px-5 py-4 rounded-t-md">
          <span className="text-white font-semibold text-base">How-To Guides</span>
          <button id="migration-dialog-close" onClick={onClose} className="text-white hover:text-gray-300">
            <X size={18} />
          </button>
        </DialogTitle>

        <div className="flex flex-1 overflow-hidden">
          {/* sidebar */}
          <div className="w-64 border-r border-gray-200 rounded-bl-md overflow-y-auto bg-gray-50">
            {scribes.map((s, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 transition-colors ${
                  i === selected ? "bg-black text-white" : "hover:bg-gray-100"
                }`}
              >
                {s.title}
              </button>
            ))}
          </div>

          {/* content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-200 bg-white">
              <h2 className="text-lg font-semibold">{active.title}</h2>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {active.embedUrl ? (
                <iframe
                  src={active.embedUrl}
                  width="100%"
                  height="100%"
                  allowFullScreen
                  className="border-0 rounded"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Guide coming soon
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
