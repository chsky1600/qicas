import { useState } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface ScribeGroup {
  title: string
  items: string[]
  embedUrl: string | null
}

const ADMIN_GROUPS: ScribeGroup[] = [
  {
    title: "Assigning and unassigning sections",
    items: [
      "Assign a course section to an instructor",
      "Unassign a section",
    ],
    embedUrl: "https://scribehow.com/embed/Assigning_And_Unassigning_Sections_In_The_Schedule__O0_csFZEQ4-azQqXoInHFw",
  },
  {
    title: "View and interpret violation messages",
    items: ["View and interpret violation messages"],
    embedUrl: "https://scribehow.com/embed/View_and_Interpret_Violation_Messages__CuA9X4QTQy2FI-vNvuzWxw",
  },
  {
    title: "Use the validation toggle",
    items: ["Use the validation toggle"],
    embedUrl: "https://scribehow.com/embed-preview/Use_the_Validation_Toggle__hHoHliCNQE6uuMVPawyE9g",
  },

  {
    title: "Manage instructors",
    items: ["Manage instructors", "Adjust workload modifier"],
    embedUrl: "https://scribehow.com/embed-preview/Update_and_Save_Instructor_Properties__7dvn9lWXTLWWidh_r2LD0A",
  },
  {
    title: "Set designated courses for adjuncts",
    items: ["Set designated courses for adjuncts"],
    embedUrl: "https://scribehow.com/embed-preview/Set_Designated_Courses_for_Adjuncts__tCZdgVJ6Rt-VJ9mlr0O2Uw",
  },
  {
    title: "Manage courses",
    items: ["Manage courses"],
    embedUrl: "https://scribehow.com/embed-preview/Managing_Course_Properties__aKqq0SMuTl-eDh71czHEfQ",
  },
]

const SUPPORT_GROUPS: ScribeGroup[] = [
  {
    title: "View schedule and assignments",
    items: ["View schedule and assignments"],
    embedUrl: null,
  },
  {
    title: "View and interpret violation warnings",
    items: ["View and interpret violation warnings"],
    embedUrl: null,
  },
  {
    title: "View and switch between schedules",
    items: ["View and switch between schedules"],
    embedUrl: null,
  },
]

interface Props {
  open: boolean
  onClose: () => void
  isAdmin: boolean
}

export default function HowToDialog({ open, onClose, isAdmin }: Props) {
  const groups = isAdmin ? ADMIN_GROUPS : SUPPORT_GROUPS
  const [selected, setSelected] = useState<number>(0)
  const active = groups[selected]

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent
        showCloseButton={false}
        className="w-[1000px] h-[85vh] p-0 gap-0 border border-black rounded-md grid-rows-[auto_1fr]"
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
            {groups.map((group, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`w-full text-left px-4 py-2.5 text-sm border-b border-gray-100 transition-colors ${
                  i === selected ? "bg-black text-white" : "hover:bg-gray-100"
                }`}
              >
                {group.title}
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
                  allow="fullscreen"
                  style={{ aspectRatio: "1 / 1", minHeight: 480 }}
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
