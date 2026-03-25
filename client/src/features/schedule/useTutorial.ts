import { useCallback, useRef } from "react"
import { driver } from "driver.js"
import type { UseScheduleResult } from "./useSchedule"

type TutorialDeps = Pick<
  UseScheduleResult,
  | "courses" | "courseRules"
  | "instructors" | "instructorRules"
  | "schedule" | "schedules"
> & {
  onOpenProperties: () => void
  onCloseProperties: () => void
  onOpenSnapshots: () => void
  onCloseSnapshots: () => void
}

// Step index constants - update these if steps are reordered or added
const STEP_OPEN_PROPERTIES    = 7   // ArrowRight - open Edit Properties dialog
const STEP_CLOSE_PROPERTIES_BACK = 8  // ArrowLeft  - close properties (go back to step 7)
const STEP_COURSES_TAB        = 9   // ArrowRight - click Courses tab inside properties
const STEP_INSTRUCTORS_TAB    = 10  // ArrowLeft  - click back to Instructors tab
const STEP_CLOSE_PROPERTIES   = 11  // ArrowRight - close Edit Properties dialog
const STEP_OPEN_SNAPSHOTS     = 12  // ArrowRight - open Saved Schedules / ArrowLeft - reopen properties
const STEP_CLOSE_SNAPSHOTS_BACK = 13 // ArrowLeft  - close snapshots (go back to step 12)
const STEP_CLOSE_SNAPSHOTS    = 15  // ArrowRight - close Saved Schedules dialog
const STEP_REOPEN_SNAPSHOTS   = 16  // ArrowLeft  - reopen snapshots (go back to step 15)

// Required DOM IDs for tutorial targeting - do not remove these from their components:
// #toolbar-year-select       - Toolbar year dropdown
// #toolbar-active-schedule   - Toolbar active schedule name
// #toolbar-edit-properties   - Toolbar Edit Properties button
// #toolbar-saved-schedules   - Toolbar Saved Schedules button
// #toolbar-export            - Toolbar Export button
// #courses-panel             - Courses panel container
// #courses-panel-search      - Courses panel search input
// #courses-panel-list        - Courses panel list
// #schedule-table            - Schedule table container
// #properties-dialog         - Edit Properties dialog
// #properties-dialog-close   - Edit Properties close button
// #properties-tab-courses    - Edit Properties tab switcher
// #saved-schedules-dialog    - Saved Schedules dialog
// #saved-schedules-dialog-close - Saved Schedules close button
// #saved-schedules-add       - Saved Schedules Add+ button

export function useTutorial({
  onOpenProperties, onCloseProperties,
  onOpenSnapshots, onCloseSnapshots,
}: TutorialDeps) {
  const keyHandlerRef = useRef<((e: KeyboardEvent) => void) | null>(null)

  const stopTutorial = useCallback(() => {
    localStorage.setItem("tutorialSeen", "true")
    if (keyHandlerRef.current) {
      window.removeEventListener("keyup", keyHandlerRef.current, true)
      keyHandlerRef.current = null
    }
    onCloseProperties()
    onCloseSnapshots()
  }, [onCloseProperties, onCloseSnapshots])

  const startTutorial = useCallback(() => {
    let propertiesClickHandler: (() => void) | null = null
    let propertiesCloseHandler: (() => void) | null = null
    let snapshotsClickHandler: (() => void) | null = null
    let snapshotsCloseHandler: (() => void) | null = null
    let coursesTabClickHandler: (() => void) | null = null

    // driverInstance is set after driver() is called below.
    // The handler is registered BEFORE driver() so our capture listener
    // is first in the queue, ensuring stopImmediatePropagation blocks driver.js.
    let driverInstance: ReturnType<typeof driver> | null = null

    const keyHandler = (e: KeyboardEvent) => {
      const d = driverInstance
      if (!d) return
      if (e.key === "Escape") {
        d.destroy()
        return
      }
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return

      const index = d.getActiveIndex()
      if (index === undefined || index === null) return

      if (e.key === "ArrowRight") {
        if (index === STEP_OPEN_PROPERTIES) {
          e.stopImmediatePropagation()
          const btn = document.querySelector<HTMLElement>("#toolbar-edit-properties")
          if (btn && propertiesClickHandler) {
            btn.removeEventListener("click", propertiesClickHandler)
            propertiesClickHandler = null
          }
          onOpenProperties()
          setTimeout(() => d.moveNext(), 150)
        } else if (index === STEP_COURSES_TAB) {
          e.stopImmediatePropagation()
          const wrapper = document.querySelector<HTMLElement>("#properties-tab-courses")
          if (wrapper && coursesTabClickHandler) {
            wrapper.removeEventListener("click", coursesTabClickHandler)
            coursesTabClickHandler = null
          }
          document.querySelector<HTMLElement>("#properties-tab-courses button:last-child")?.click()
          setTimeout(() => d.moveNext(), 50)
        } else if (index === STEP_CLOSE_PROPERTIES) {
          e.stopImmediatePropagation()
          const btn = document.querySelector<HTMLElement>("#properties-dialog-close")
          if (btn && propertiesCloseHandler) {
            btn.removeEventListener("click", propertiesCloseHandler)
            propertiesCloseHandler = null
          }
          onCloseProperties()
          setTimeout(() => d.moveNext(), 50)
        } else if (index === STEP_OPEN_SNAPSHOTS) {
          e.stopImmediatePropagation()
          const btn = document.querySelector<HTMLElement>("#toolbar-saved-schedules")
          if (btn && snapshotsClickHandler) {
            btn.removeEventListener("click", snapshotsClickHandler)
            snapshotsClickHandler = null
          }
          onOpenSnapshots()
          setTimeout(() => d.moveNext(), 150)
        } else if (index === STEP_CLOSE_SNAPSHOTS) {
          e.stopImmediatePropagation()
          const btn = document.querySelector<HTMLElement>("#saved-schedules-dialog-close")
          if (btn && snapshotsCloseHandler) {
            btn.removeEventListener("click", snapshotsCloseHandler)
            snapshotsCloseHandler = null
          }
          onCloseSnapshots()
          setTimeout(() => d.moveNext(), 50)
        }
      } else {
        if (index === STEP_CLOSE_PROPERTIES_BACK) {
          e.stopImmediatePropagation()
          onCloseProperties()
          setTimeout(() => d.movePrevious(), 50)
        } else if (index === STEP_INSTRUCTORS_TAB) {
          e.stopImmediatePropagation()
          document.querySelector<HTMLElement>("#properties-tab-courses button:first-child")?.click()
          setTimeout(() => d.movePrevious(), 50)
        } else if (index === STEP_OPEN_SNAPSHOTS) {
          e.stopImmediatePropagation()
          onOpenProperties()
          setTimeout(() => d.movePrevious(), 150)
        } else if (index === STEP_CLOSE_SNAPSHOTS_BACK) {
          e.stopImmediatePropagation()
          onCloseSnapshots()
          setTimeout(() => d.movePrevious(), 50)
        } else if (index === STEP_REOPEN_SNAPSHOTS) {
          e.stopImmediatePropagation()
          onOpenSnapshots()
          setTimeout(() => d.movePrevious(), 150)
        }
      }
    }

    // Register BEFORE driver() on window+keyup (same as driver.js) in capture
    // phase so stopImmediatePropagation blocks driver.js's bubble listener
    keyHandlerRef.current = keyHandler
    window.addEventListener("keyup", keyHandler, true)

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0,0,0,0.6)",
      onDestroyStarted: () => {
        driverInstance = null
        driverObj.destroy()
        stopTutorial()
      },
      steps: [
        // 0
        {
          popover: {
            title: "Welcome to QICAS!",
            description:
              "This quick tour will walk you through how to build a course schedule. Use the Next and Previous buttons to navigate, or press Escape to exit at any time.",
            side: "over",
            align: "center",
          },
        },
        // 1
        {
          element: "#toolbar-year-select",
          popover: {
            title: "Academic Year",
            description:
              "Use this dropdown to switch between academic years. All courses, instructors, and schedules are organised per year.",
            side: "bottom",
            align: "start",
          },
        },
        // 2
        {
          element: "#toolbar-active-schedule",
          popover: {
            title: "Active Schedule",
            description:
              "The name of your currently active schedule is shown here. You can have multiple saved schedules for the same year and switch between them freely.",
            side: "bottom",
            align: "start",
          },
        },
        // 3
        {
          element: "#courses-panel",
          popover: {
            title: "Courses Panel",
            description:
              "This panel lists all active courses for the year. Unassigned courses appear at the top, assigned courses below. Use the search bar to filter quickly.",
            side: "right",
            align: "start",
          },
        },
        // 4
        {
          element: "#courses-panel-search",
          popover: {
            title: "Search Courses",
            description:
              "Type here to filter by course code. The list updates as you type.",
            side: "right",
            align: "start",
          },
        },
        // 5
        {
          element: "#courses-panel-list",
          popover: {
            title: "Drag to Assign",
            description:
              "Drag a course chip from this panel and drop it onto an instructor's Fall or Winter cell in the table to the right to assign it.",
            side: "right",
            align: "start",
          },
        },
        // 6
        {
          element: "#schedule-table",
          popover: {
            title: "Schedule Table",
            description:
              "Each row is an instructor. Drop chips in the Fall or Winter column to assign them. You can drag a chip back to the courses panel to unassign it, or drag it to a different instructor to reassign.",
            side: "left",
            align: "start",
          },
        },
        // 7 (STEP_OPEN_PROPERTIES) - user clicks the button to open; Next hidden
        {
          element: "#toolbar-edit-properties",
          onHighlighted: () => {
            const btn = document.querySelector<HTMLElement>("#toolbar-edit-properties")
            if (!btn) return
            propertiesClickHandler = () => setTimeout(() => driverObj.moveNext(), 150)
            btn.addEventListener("click", propertiesClickHandler)
          },
          onDeselected: () => {
            const btn = document.querySelector<HTMLElement>("#toolbar-edit-properties")
            if (btn && propertiesClickHandler) {
              btn.removeEventListener("click", propertiesClickHandler)
              propertiesClickHandler = null
            }
          },
          popover: {
            title: "Edit Properties",
            description:
              "This is where you manage instructors and courses for the year. Click this button to open it.",
            side: "bottom",
            align: "end",
            showButtons: ["previous", "close"],
          },
        },
        // 8 (STEP_CLOSE_PROPERTIES_BACK) - prev closes properties
        {
          element: "#properties-dialog",
          popover: {
            title: "Edit Properties: Instructors",
            description:
              "The Instructors tab lets you add or edit instructors, set their workload limit, rank, previously taught courses, and notes. Click on an instructor to expand their details.",
            side: "left",
            align: "start",
            onPrevClick: () => {
              onCloseProperties()
              setTimeout(() => driverObj.movePrevious(), 50)
            },
          },
        },
        // 9 (STEP_COURSES_TAB) - user clicks Courses tab; Next hidden
        {
          element: "#properties-tab-courses",
          onHighlighted: () => {
            const wrapper = document.querySelector<HTMLElement>("#properties-tab-courses")
            if (!wrapper) return
            coursesTabClickHandler = () => setTimeout(() => driverObj.moveNext(), 50)
            wrapper.addEventListener("click", coursesTabClickHandler)
          },
          onDeselected: () => {
            const wrapper = document.querySelector<HTMLElement>("#properties-tab-courses")
            if (wrapper && coursesTabClickHandler) {
              wrapper.removeEventListener("click", coursesTabClickHandler)
              coursesTabClickHandler = null
            }
          },
          popover: {
            title: "Edit Properties: Switching Tabs",
            description:
              "There are two tabs: Instructors and Courses. Click between them to switch what you're editing. Click the Courses tab now to continue",
            side: "bottom",
            align: "start",
            showButtons: ["previous", "close"],
          },
        },
        // 10 (STEP_INSTRUCTORS_TAB) - explain Courses tab content
        {
          element: "#properties-dialog",
          popover: {
            title: "Edit Properties: Courses",
            description:
              "The Courses tab lets you add or edit courses, set the number of sections, mark a course as full-year, and drop it from the schedule. Click on a course in the sidebar to view and edit its details.",
            side: "right",
            align: "start",
            onPrevClick: () => {
              const instructorsBtn = document.querySelector<HTMLElement>("#properties-tab-courses button:first-child")
              instructorsBtn?.click()
              setTimeout(() => driverObj.movePrevious(), 50)
            },
          },
        },
        // 11 (STEP_CLOSE_PROPERTIES) - user clicks X to close properties
        {
          element: "#properties-dialog-close",
          onHighlighted: () => {
            const btn = document.querySelector<HTMLElement>("#properties-dialog-close")
            if (!btn) return
            propertiesCloseHandler = () => setTimeout(() => driverObj.moveNext(), 50)
            btn.addEventListener("click", propertiesCloseHandler)
          },
          onDeselected: () => {
            const btn = document.querySelector<HTMLElement>("#properties-dialog-close")
            if (btn && propertiesCloseHandler) {
              btn.removeEventListener("click", propertiesCloseHandler)
              propertiesCloseHandler = null
            }
          },
          popover: {
            title: "Closing Edit Properties",
            description:
              "Click the X to close the dialog when you're done.",
            side: "bottom",
            align: "end",
            showButtons: ["previous", "close"],
          },
        },
        // 12 (STEP_OPEN_SNAPSHOTS) - user clicks the button to open; Next hidden; prev reopens properties
        {
          element: "#toolbar-saved-schedules",
          onHighlighted: () => {
            const btn = document.querySelector<HTMLElement>("#toolbar-saved-schedules")
            if (!btn) return
            snapshotsClickHandler = () => setTimeout(() => driverObj.moveNext(), 150)
            btn.addEventListener("click", snapshotsClickHandler)
          },
          onDeselected: () => {
            const btn = document.querySelector<HTMLElement>("#toolbar-saved-schedules")
            if (btn && snapshotsClickHandler) {
              btn.removeEventListener("click", snapshotsClickHandler)
              snapshotsClickHandler = null
            }
          },
          popover: {
            title: "Saved Schedules",
            description:
              "You can save multiple versions of a schedule for the same year. Click this button to open it.",
            side: "bottom",
            align: "end",
            showButtons: ["previous", "close"],
            onPrevClick: () => {
              onOpenProperties()
              setTimeout(() => driverObj.movePrevious(), 150)
            },
          },
        },
        // 13 (STEP_CLOSE_SNAPSHOTS_BACK) - prev closes snapshots
        {
          element: "#saved-schedules-dialog",
          popover: {
            title: "Saved Schedules",
            description:
              "Each card shows a saved schedule with its completion progress. You can load a schedule to make it active, copy it as a starting point, rename it, or delete it.",
            side: "left",
            align: "start",
            onPrevClick: () => {
              onCloseSnapshots()
              setTimeout(() => driverObj.movePrevious(), 50)
            },
          },
        },
        // 14 - saved schedules add button
        {
          element: "#saved-schedules-add",
          popover: {
            title: "Adding a New Schedule",
            description:
              'Click "Add+" to create a blank schedule. You can then build it independently from your other saved versions.',
            side: "bottom",
            align: "start",
          },
        },
        // 15 (STEP_CLOSE_SNAPSHOTS) - user clicks X to close snapshots
        {
          element: "#saved-schedules-dialog-close",
          onHighlighted: () => {
            const btn = document.querySelector<HTMLElement>("#saved-schedules-dialog-close")
            if (!btn) return
            snapshotsCloseHandler = () => setTimeout(() => driverObj.moveNext(), 50)
            btn.addEventListener("click", snapshotsCloseHandler)
          },
          onDeselected: () => {
            const btn = document.querySelector<HTMLElement>("#saved-schedules-dialog-close")
            if (btn && snapshotsCloseHandler) {
              btn.removeEventListener("click", snapshotsCloseHandler)
              snapshotsCloseHandler = null
            }
          },
          popover: {
            title: "Closing Saved Schedules",
            description:
              "Click the X to close the dialog.",
            side: "left",
            align: "start",
            showButtons: ["previous", "close"],
          },
        },
        // 16 (STEP_REOPEN_SNAPSHOTS) - prev reopens snapshots
        {
          element: "#toolbar-export",
          popover: {
            title: "Export to CSV",
            description:
              "Download the current schedule as a CSV file. Instructors as rows, Fall and Winter assignments as columns.",
            side: "bottom",
            align: "end",
            onPrevClick: () => {
              onOpenSnapshots()
              setTimeout(() => driverObj.movePrevious(), 150)
            },
          },
        },
        // 17 - All done!
        {
          popover: {
            title: "You're all set!",
            description:
              "That's the full tour. You can restart the tutorial any time from the Tutorial button in the toolbar.",
            side: "over",
            align: "center",
          },
        },
      ],
    })

    // Point the closure ref at the real object, then start
    driverInstance = driverObj
    driverObj.drive()
  }, [stopTutorial, onOpenProperties, onCloseProperties, onOpenSnapshots, onCloseSnapshots])

  return { startTutorial }
}
