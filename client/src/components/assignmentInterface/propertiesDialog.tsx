import * as React from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import type { SectionState, InstructorState } from "@/features/assignment/assignment.types"
import { IconControlButton } from "@/components/ui/icon-control-button"
import { FormRow } from "@/components/ui/form-row"
import { SectionBox } from "@/components/ui/section-box"
import { SidebarListItem } from "@/components/ui/sidebar-list-item"
import { ModeTogglePill } from "@/components/ui/mode-toggle-pill"

type Mode = "instructors" | "courses"
type Status = "current" | "dropped"

interface PropertiesDialogProps {
  isOpen: boolean
  onClose: () => void
  sectionState: SectionState
  instructorState: InstructorState
}

export default function PropertiesDialog({
  isOpen,
  onClose,
  sectionState,
  instructorState,
}: PropertiesDialogProps) {
  const [mode, setMode] = React.useState<Mode>("instructors")
  const [status, setStatus] = React.useState<Status>("current")
  const [selectedIndex, setSelectedIndex] = React.useState(0)

  const items = React.useMemo(() => {
    if (mode === "instructors") {
      return instructorState.allIds.map((id) => {
        const instructor = instructorState.byId[id]
        return `${instructor.positon.short} ${instructor.name}`
      })
    }

    return sectionState.allIds.map((id) => {
      const section = sectionState.byId[id]
      return `${section.code} - ${section.name}`
    })
  }, [mode, sectionState, instructorState])

  const selectedLabel = items[selectedIndex] ?? ""
  const isDropped = status === "dropped"
  const isNew = selectedLabel.toLowerCase().includes("new")

  const rightTitle = React.useMemo(() => {
    if (!selectedLabel) return ""
    if (mode === "instructors") return selectedLabel.replace(/^Prof\.\s*/i, "Professor ").trim()
    return selectedLabel
  }, [mode, selectedLabel])

  const statusTabClass = (tab: Status) =>
    `flex-1 py-2 font-semibold transition-all cursor-pointer !rounded-t-lg !rounded-b-none ${
        status === tab
        ? "!bg-[#bfbfbf] text-black"
        : "!bg-[#3a3a3a] text-white hover:!bg-[#4a4a4a]"
    }`



  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="w-[1100px] h-[620px] p-0 gap-0 overflow-hidden border border-black rounded-md bg-[#f4f4f4]"
      >
        {/* header */}
        <div className="relative flex items-center justify-center bg-black text-white h-13 px-4">
          <div className="absolute left-2 text-xs opacity-80">Edit Properties</div>

          <ModeTogglePill<Mode>
            value={mode}
            onChange={(next) => {
                setMode(next)
                setSelectedIndex(0)
            }}
            options={[
                { value: "instructors", label: "Instructors" },
                { value: "courses", label: "Courses" },
            ]}
            className="!bg-black"
            buttonClassName="!w-[400px]"
            />


          <button onClick={onClose} className="absolute right-3 text-lg leading-none hover:opacity-80">
            ×
          </button>
        </div>

        <div className="flex h-[calc(620px-44px)] bg-[#f4f4f4]">
          {/* sidebar */}
          <div className="w-80 bg-[#bfbfbf] flex flex-col border-r border-black">
            <div className="flex text-sm bg-black px-1 pt-1 gap-0.5">
                <button type="button" onClick={() => { setStatus("current"); setSelectedIndex(0) }} className={statusTabClass("current")}>
                    Current
                </button>
                <button type="button" onClick={() => { setStatus("dropped"); setSelectedIndex(0) }} className={statusTabClass("dropped")}>
                    Dropped
                </button>
            </div>


            <div className="flex-1 overflow-y-auto py-2">
              {items.map((label, i) => (
                <SidebarListItem
                  key={`${label}-${i}`}
                  active={i === selectedIndex}
                  onClick={() => setSelectedIndex(i)}
                  type="button"
                >
                  {label}
                </SidebarListItem>
              ))}
            </div>

            <div className="p-4 flex justify-center">
              <button className="px-10 py-2 rounded-md bg-[#6e6e6e] text-white font-semibold border border-black hover:opacity-90">
                New {mode === "instructors" ? "Instructor" : "Course"}
              </button>
            </div>
          </div>

          {/* right panel */}
          <div key={`${mode}-${selectedIndex}`} className="flex-1 p-6 overflow-y-auto">
            <div className="text-2xl font-bold mb-5">{rightTitle}</div>

            <div className="flex gap-8 items-center mb-5">
              <FormRow label="Name">
                <input
                  className="flex-1 border border-black rounded-md px-3 py-1 bg-white"
                  defaultValue={mode === "courses" ? selectedLabel.split(" - ").slice(1).join(" - ") : selectedLabel}
                />
              </FormRow>

              {mode === "instructors" && (
                <FormRow label="Email">
                  <input
                    className="flex-1 border border-black rounded-md px-3 py-1 bg-white"
                    defaultValue="c.welsh@queensu.ca"
                  />
                </FormRow>
              )}
            </div>

            {mode === "instructors" ? (
              <>
                <div className="flex items-center gap-10 mb-5">
                  <FormRow label="Position" labelClassName="w-auto">
                    <select className="border border-black rounded-md px-3 py-1 bg-white">
                      <option>Assistant Professor</option>
                      <option>Associate Professor</option>
                      <option>Professor</option>
                      <option>Adjunct</option>
                      <option>TA</option>
                    </select>
                  </FormRow>

                  <FormRow label="Workload" labelClassName="w-auto">
                    <input
                      className="w-12 border border-black rounded-md px-2 py-1 bg-white text-center"
                      defaultValue="4"
                    />
                  </FormRow>

                  <FormRow label="Modifier" labelClassName="w-auto">
                    <input
                      className="w-12 border border-black rounded-md px-2 py-1 bg-white text-center"
                      defaultValue="-1"
                    />
                  </FormRow>
                </div>

                <div className="flex gap-8 mb-5">
                  <SectionBox
                    title="Previously Taught"
                    className="w-80"
                    action={<IconControlButton aria-label="Add previously taught">+</IconControlButton>}
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Fren 201 - More French</span>
                        <IconControlButton aria-label="Remove Fren 201">−</IconControlButton>
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Fren 404 - Literature</span>
                        <IconControlButton aria-label="Remove Fren 404">−</IconControlButton>
                      </div>
                    </div>
                  </SectionBox>

                  <SectionBox title="Notes" className="flex-1" bodyClassName="p-0">
                    <textarea
                      className="w-full h-32 p-3 text-sm outline-none resize-none"
                      placeholder="Write here..."
                    />
                  </SectionBox>
                </div>

                <div>
                  {isDropped ? (
                    <button className="bg-blue-800 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Renew Instructor
                    </button>
                  ) : isNew ? (
                    <button className="bg-red-600 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Remove Instructor
                    </button>
                  ) : (
                    <button className="bg-[#3f4a54] text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Drop Instructor
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-6 mb-4">
                  <FormRow label="Dept." labelClassName="w-auto">
                    <input
                      className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                      defaultValue="FREN"
                    />
                  </FormRow>

                  <FormRow label="Code" labelClassName="w-auto">
                    <input
                      className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                      defaultValue="330"
                    />
                  </FormRow>

                  <FormRow label="Total Cap." labelClassName="w-auto">
                    <input
                      className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                      defaultValue="250"
                    />
                  </FormRow>

                  <FormRow label="Workload" labelClassName="w-auto">
                    <select className="border border-black rounded-md px-2 py-1 bg-white">
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                    </select>
                  </FormRow>
                </div>

                <div className="flex items-center gap-4 mb-5 text-sm">
                  <div className="font-semibold">Availability:</div>
                  <label className="flex items-center gap-2">
                    <span>Fall or Winter</span>
                    <input type="radio" name="availability" defaultChecked />
                  </label>
                  <label className="flex items-center gap-2">
                    <span>Only Fall</span>
                    <input type="radio" name="availability" />
                  </label>
                  <label className="flex items-center gap-2">
                    <span>Only Winter</span>
                    <input type="radio" name="availability" />
                  </label>
                  <label className="flex items-center gap-2">
                    <span>Fall &amp; Winter (Full year)</span>
                    <input type="radio" name="availability" />
                  </label>
                </div>

                <SectionBox
                  title="Section"
                  className="w-[360px] mb-5"
                  action={<IconControlButton aria-label="Add section">+</IconControlButton>}
                >
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="w-12 text-center">1</div>
                      <input
                        className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                        defaultValue="125"
                      />
                      <IconControlButton aria-label="Remove section 1">−</IconControlButton>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="w-12 text-center">2</div>
                      <input
                        className="w-16 border border-black rounded-md px-2 py-1 bg-white text-center"
                        defaultValue="125"
                      />
                      <IconControlButton aria-label="Remove section 2">−</IconControlButton>
                    </div>
                  </div>
                </SectionBox>

                <div>
                  {isDropped ? (
                    <button className="bg-blue-800 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Renew Course
                    </button>
                  ) : isNew ? (
                    <button className="bg-red-600 text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Remove Course
                    </button>
                  ) : (
                    <button className="bg-[#3f4a54] text-white px-6 py-2 rounded-md border border-black font-semibold">
                      Drop Course
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
