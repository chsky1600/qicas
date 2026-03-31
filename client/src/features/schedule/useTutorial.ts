import { useCallback, useRef } from "react"
import { driver } from "driver.js"

type TutorialDeps = {
  role: "admin" | "support" | null
  onOpenProperties: () => void
  onCloseProperties: () => void
  onOpenSnapshots: () => void
  onCloseSnapshots: () => void
  onOpenUsers: () => void
  onCloseUsers: () => void
  onOpenMigration: () => void
  onCloseMigration: () => void
  onTutorialStart: () => void
  onTutorialEnd: () => void
}

// Required DOM IDs - do not remove these from their components:
// #toolbar-year-select            - Toolbar year dropdown
// #toolbar-active-schedule        - Toolbar active schedule name
// #toolbar-edit-properties        - Toolbar Edit Properties button (admin)
// #toolbar-saved-schedules        - Toolbar Saved Schedules button
// #toolbar-export                 - Toolbar Export button
// #toolbar-validation-mode        - Toolbar validation mode button (admin)
// #toolbar-more                   - Toolbar More button
// #toolbar-more-wrapper           - Toolbar More button + wrapper
// #courses-panel                  - Courses panel container
// #courses-panel-search           - Courses panel search input
// #courses-panel-list             - Courses panel list
// #schedule-table                 - Schedule table container
// #properties-dialog              - Edit Properties dialog content
// #properties-dialog-header       - Edit Properties dialog header bar
// #properties-tab-courses         - Edit Properties tab switcher container
// #users-dialog                   - Users dialog content
// #users-dialog-header            - Users dialog header bar
// #saved-schedules-dialog         - Saved Schedules dialog content
// #saved-schedules-dialog-header  - Saved Schedules dialog header bar
// #saved-schedules-add            - Saved Schedules Add+ button
// #migration-dialog               - Migration dialog content
// #migration-dialog-header        - Migration dialog header bar

// Admin step indices
const A_NEW_YEAR         = 7   // Next → open migration
const A_MIGRATION        = 8   // migration open; Prev → close migration
const A_CLOSE_MIGRATION  = 9   // Next → close migration
const A_KEYBOARD         = 10  // no element; Prev → reopen migration
const A_OPEN_PROPERTIES  = 11  // Next → open properties
const A_PROPS_INSTR      = 12  // props open; Prev → close properties
const A_SWITCH_COURSES   = 13  // Next → switch to courses tab
const A_PROPS_COURSES    = 14  // Prev → switch back to instructors
const A_CLOSE_PROPERTIES = 15  // Next → close properties
const A_OPEN_SNAPSHOTS   = 16  // Next → open snapshots; Prev → reopen properties
const A_SNAPSHOTS        = 17  // snapshots open; Prev → close snapshots
const A_SNAPSHOTS_ADD    = 18  // Add+ button
const A_CLOSE_SNAPSHOTS  = 19  // Next → close snapshots
const A_EXPORT           = 20  // Prev → reopen snapshots
const A_VALIDATION       = 21
const A_OPEN_MORE        = 22  // Next → open users
const A_USERS            = 23  // users open; Prev → close users
const A_CLOSE_USERS      = 24  // Next → close users
const A_DONE             = 25  // Prev → reopen users

// Support step indices
const S_OPEN_SNAPSHOTS  = 7
const S_SNAPSHOTS       = 8   // Prev → close snapshots
const S_CLOSE_SNAPSHOTS = 9   // Next → close snapshots
const S_EXPORT          = 10  // Prev → reopen snapshots

function tutorialExpand(el: HTMLElement, driverObj: ReturnType<typeof driver>) {
  const wrapper = el.closest<HTMLElement>(".group")
  if (wrapper) wrapper.classList.add("tutorial-expanded")
  setTimeout(() => driverObj.refresh(), 220)
}

function tutorialCollapse(el: HTMLElement) {
  const wrapper = el.closest<HTMLElement>(".group")
  if (wrapper) wrapper.classList.remove("tutorial-expanded")
}

export function useTutorial({
  role,
  onOpenProperties, onCloseProperties,
  onOpenSnapshots, onCloseSnapshots,
  onOpenUsers, onCloseUsers,
  onOpenMigration, onCloseMigration,
  onTutorialStart, onTutorialEnd,
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
    onCloseUsers()
    onCloseMigration()
    onTutorialEnd()
  }, [onCloseProperties, onCloseSnapshots, onCloseUsers, onCloseMigration, onTutorialEnd])

  const startTutorial = useCallback(() => {
    const isAdmin = role === "admin"
    onTutorialStart()

    let driverInstance: ReturnType<typeof driver> | null = null

    const click = (selector: string) => document.querySelector<HTMLElement>(selector)?.click()
    const switchToInstructors = () => click("#properties-tab-courses button:first-child")
    const switchToCourses = () => click("#properties-tab-courses button:last-child")

    const doForward = (index: number | undefined, moveNext: () => void) => {
      if (index === undefined) { moveNext(); return }
      if (isAdmin) {
        switch (index) {
          case A_NEW_YEAR:
            onOpenMigration(); setTimeout(moveNext, 150); break
          case A_CLOSE_MIGRATION:
            onCloseMigration(); setTimeout(moveNext, 100); break
          case A_OPEN_PROPERTIES:
            onOpenProperties(); setTimeout(() => { switchToInstructors(); moveNext() }, 150); break
          case A_SWITCH_COURSES:
            switchToCourses(); setTimeout(moveNext, 100); break
          case A_CLOSE_PROPERTIES:
            onCloseProperties(); setTimeout(moveNext, 100); break
          case A_OPEN_SNAPSHOTS:
            onOpenSnapshots(); setTimeout(moveNext, 150); break
          case A_CLOSE_SNAPSHOTS:
            onCloseSnapshots(); setTimeout(moveNext, 100); break
          case A_OPEN_MORE:
            onOpenUsers(); setTimeout(moveNext, 150); break
          case A_CLOSE_USERS:
            onCloseUsers(); setTimeout(moveNext, 100); break
          default:
            moveNext(); break
        }
      } else {
        switch (index) {
          case S_OPEN_SNAPSHOTS:
            onOpenSnapshots(); setTimeout(moveNext, 150); break
          case S_CLOSE_SNAPSHOTS:
            onCloseSnapshots(); setTimeout(moveNext, 100); break
          default:
            moveNext(); break
        }
      }
    }

    const doBackward = (index: number | undefined, movePrevious: () => void) => {
      if (index === undefined) { movePrevious(); return }
      if (isAdmin) {
        switch (index) {
          case A_MIGRATION:
            onCloseMigration(); setTimeout(movePrevious, 100); break
          case A_KEYBOARD:
            onOpenMigration(); setTimeout(movePrevious, 150); break
          case A_PROPS_INSTR:
            onCloseProperties(); setTimeout(movePrevious, 100); break
          case A_PROPS_COURSES:
            switchToInstructors(); setTimeout(movePrevious, 100); break
          case A_OPEN_SNAPSHOTS:
            onOpenProperties(); setTimeout(() => { switchToCourses(); setTimeout(movePrevious, 50) }, 150); break
          case A_SNAPSHOTS:
            onCloseSnapshots(); setTimeout(movePrevious, 100); break
          case A_EXPORT:
            onOpenSnapshots(); setTimeout(movePrevious, 150); break
          case A_USERS:
            onCloseUsers(); setTimeout(movePrevious, 100); break
          case A_DONE:
            onOpenUsers(); setTimeout(movePrevious, 150); break
          default:
            movePrevious(); break
        }
      } else {
        switch (index) {
          case S_SNAPSHOTS:
            onCloseSnapshots(); setTimeout(movePrevious, 100); break
          case S_EXPORT:
            onOpenSnapshots(); setTimeout(movePrevious, 150); break
          default:
            movePrevious(); break
        }
      }
    }

    const keyHandler = (e: KeyboardEvent) => {
      if (!driverInstance?.isActive()) return
      if (e.key === "Escape") { driverInstance.destroy(); return }
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
      e.stopImmediatePropagation()
      const index = driverInstance.getActiveIndex()
      if (e.key === "ArrowRight") {
        if (!driverInstance.hasNextStep()) { driverInstance.destroy(); return }
        doForward(index, () => driverInstance!.moveNext())
      } else {
        if (!driverInstance.hasPreviousStep()) return
        doBackward(index, () => driverInstance!.movePrevious())
      }
    }

    keyHandlerRef.current = keyHandler
    window.addEventListener("keyup", keyHandler, true)

    const commonSteps = [
      // 0
      {
        popover: {
          title: "Welcome to QICAS!",
          description: "This quick tour walks you through the scheduling interface. Use Next / Previous or ← → arrow keys to navigate. Press Escape to exit at any time.",
          side: "over" as const, align: "center" as const,
        },
      },
      // 1
      {
        element: "#toolbar-year-select",
        popover: {
          title: "Academic Year",
          description: "Use this dropdown to switch between academic years. All courses, instructors, and schedules are organised per year.",
          side: "bottom" as const, align: "start" as const,
        },
      },
      // 2
      {
        element: "#toolbar-active-schedule",
        popover: {
          title: "Active Schedule",
          description: "The name of your currently active schedule is shown here. You can have multiple saved schedules for the same year and switch between them freely.",
          side: "bottom" as const, align: "start" as const,
        },
      },
      // 3
      {
        element: "#courses-panel",
        popover: {
          title: "Courses Panel",
          description: "This panel lists all active courses for the year. Unassigned courses appear at the top, assigned courses below. Use the search bar to filter quickly.",
          side: "right" as const, align: "start" as const,
        },
      },
      // 4
      {
        element: "#courses-panel-search",
        popover: {
          title: "Search Courses",
          description: "Type here to filter by course code. The list updates as you type.",
          side: "right" as const, align: "start" as const,
        },
      },
      // 5
      {
        element: "#courses-panel-list",
        popover: {
          title: isAdmin ? "Drag to Assign" : "Course Chips",
          description: isAdmin
            ? "Drag a course chip from this panel and drop it onto an instructor's Fall or Winter cell to assign it. Chips with a dashed blue border are external courses paid by the faculty member rather than the department."
            : "Each chip represents a course section. Chips with a dashed blue border are external courses paid by the faculty member rather than the department.",
          side: "right" as const, align: "start" as const,
        },
      },
      // 6
      {
        element: "#schedule-table",
        popover: {
          title: "Schedule Table",
          description: isAdmin
            ? "Each row is an instructor. Drop chips in the Fall or Winter column to assign them. Drag a chip back to the courses panel to unassign, or to another row to reassign."
            : "Each row is an instructor with their Fall and Winter course assignments.",
          side: "left" as const, align: "start" as const,
        },
      },
    ]

    const adminSteps = [
      ...commonSteps,
      // 7 (A_NEW_YEAR)
      {
        element: "#toolbar-year-select",
        onHighlighted: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-year-select")
          if (el && driverInstance) tutorialExpand(el, driverInstance)
        },
        onDeselected: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-year-select")
          if (el) tutorialCollapse(el)
        },
        popover: {
          title: "Creating a New Academic Year",
          description: "Select \"New Year +\" from this dropdown to migrate to a new academic year. You must be on the latest year to do this. Click Next to see the migration dialog.",
          side: "bottom" as const, align: "start" as const,
          onNextClick: () => doForward(A_NEW_YEAR, () => driverInstance?.moveNext()),
        },
      },
      // 8 (A_MIGRATION)
      {
        element: "#migration-dialog",
        popover: {
          title: "Migration Dialog",
          description: "When creating a new academic year, this dialog lets you optionally copy schedules from the current year into the new one.",
          side: "left" as const, align: "start" as const,
          onPrevClick: () => doBackward(A_MIGRATION, () => driverInstance?.movePrevious()),
        },
      },
      // 9 (A_CLOSE_MIGRATION)
      {
        element: "#migration-dialog-header",
        popover: {
          title: "Closing a Dialog",
          description: "The X button in the top-right closes any dialog. Click Next to close this one now.",
          side: "bottom" as const, align: "end" as const,
          onNextClick: () => doForward(A_CLOSE_MIGRATION, () => driverInstance?.moveNext()),
        },
      },
      // 10 (A_KEYBOARD)
      {
        popover: {
          title: "Keyboard Shortcuts",
          description: "Use Cmd+Z (Mac) or Ctrl+Z (Windows) to undo a recent assignment or unassignment. Use Cmd+Shift+Z / Ctrl+Shift+Z to redo. Up to 20 actions are stored. Note: only assigning and unassigning courses can be undone — changes to instructor or course properties, renames, and migrations cannot.",
          side: "over" as const, align: "center" as const,
          onPrevClick: () => doBackward(A_KEYBOARD, () => driverInstance?.movePrevious()),
        },
      },
      // 11 (A_OPEN_PROPERTIES)
      {
        element: "#toolbar-edit-properties",
        onHighlighted: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-edit-properties")
          if (el && driverInstance) tutorialExpand(el, driverInstance)
        },
        onDeselected: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-edit-properties")
          if (el) tutorialCollapse(el)
        },
        popover: {
          title: "Edit Properties",
          description: "Manage instructors and courses for the year. Click Next to open it.",
          side: "bottom" as const, align: "end" as const,
          onNextClick: () => doForward(A_OPEN_PROPERTIES, () => driverInstance?.moveNext()),
        },
      },
      // 12 (A_PROPS_INSTR)
      {
        element: "#properties-dialog",
        popover: {
          title: "Edit Properties: Instructors",
          description: "The Instructors tab lets you add or edit instructors, set their workload limit, rank, and notes. Click on an instructor to expand their details.",
          side: "left" as const, align: "start" as const,
          onPrevClick: () => doBackward(A_PROPS_INSTR, () => driverInstance?.movePrevious()),
        },
      },
      // 13 (A_SWITCH_COURSES)
      {
        element: "#properties-tab-courses button:last-child",
        popover: {
          title: "Switching Tabs",
          description: "There are two tabs: Instructors and Courses. Click Next to switch to the Courses tab.",
          side: "bottom" as const, align: "start" as const,
          onNextClick: () => doForward(A_SWITCH_COURSES, () => driverInstance?.moveNext()),
        },
      },
      // 14 (A_PROPS_COURSES)
      {
        element: "#properties-dialog",
        popover: {
          title: "Edit Properties: Courses",
          description: "The Courses tab lets you add or edit courses, set sections, and drop them from the schedule. The 'Paid By' field controls whether a course is external. External courses show a dashed blue border on their chips.",
          side: "left" as const, align: "start" as const,
          onPrevClick: () => doBackward(A_PROPS_COURSES, () => driverInstance?.movePrevious()),
        },
      },
      // 15 (A_CLOSE_PROPERTIES)
      {
        element: "#properties-dialog-header",
        popover: {
          title: "Closing Edit Properties",
          description: "Use the X button in the top-right to close the dialog when you are done. Click Next to close it now.",
          side: "bottom" as const, align: "end" as const,
          onNextClick: () => doForward(A_CLOSE_PROPERTIES, () => driverInstance?.moveNext()),
        },
      },
      // 16 (A_OPEN_SNAPSHOTS)
      {
        element: "#toolbar-saved-schedules",
        onHighlighted: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-saved-schedules")
          if (el && driverInstance) tutorialExpand(el, driverInstance)
        },
        onDeselected: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-saved-schedules")
          if (el) tutorialCollapse(el)
        },
        popover: {
          title: "Saved Schedules",
          description: "Save multiple versions of a schedule for the same year. Click Next to open it.",
          side: "bottom" as const, align: "end" as const,
          onNextClick: () => doForward(A_OPEN_SNAPSHOTS, () => driverInstance?.moveNext()),
          onPrevClick: () => doBackward(A_OPEN_SNAPSHOTS, () => driverInstance?.movePrevious()),
        },
      },
      // 17 (A_SNAPSHOTS)
      {
        element: "#saved-schedules-dialog",
        popover: {
          title: "Saved Schedules",
          description: "Each card shows a saved schedule. You can load, copy, rename, or delete schedules from here.",
          side: "left" as const, align: "start" as const,
          onPrevClick: () => doBackward(A_SNAPSHOTS, () => driverInstance?.movePrevious()),
        },
      },
      // 18 (A_SNAPSHOTS_ADD)
      {
        element: "#saved-schedules-add",
        popover: {
          title: "Adding a New Schedule",
          description: "Click \"Add+\" to create a blank schedule. You can build it independently from your other saved versions.",
          side: "bottom" as const, align: "start" as const,
        },
      },
      // 19 (A_CLOSE_SNAPSHOTS)
      {
        element: "#saved-schedules-dialog-header",
        popover: {
          title: "Closing Saved Schedules",
          description: "Use the X button in the top-right to close. Click Next to close it now.",
          side: "bottom" as const, align: "end" as const,
          onNextClick: () => doForward(A_CLOSE_SNAPSHOTS, () => driverInstance?.moveNext()),
        },
      },
      // 20 (A_EXPORT)
      {
        element: "#toolbar-export",
        onHighlighted: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-export")
          if (el && driverInstance) tutorialExpand(el, driverInstance)
        },
        onDeselected: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-export")
          if (el) tutorialCollapse(el)
        },
        popover: {
          title: "Export to XLSX",
          description: "Download the current schedule as a XLSX file, with instructors as rows and Fall and Winter assignments as columns.",
          side: "bottom" as const, align: "end" as const,
          onPrevClick: () => doBackward(A_EXPORT, () => driverInstance?.movePrevious()),
        },
      },
      // 21 (A_VALIDATION)
      {
        element: "#toolbar-validation-mode",
        onHighlighted: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-validation-mode")
          if (el && driverInstance) tutorialExpand(el, driverInstance)
        },
        onDeselected: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-validation-mode")
          if (el) tutorialCollapse(el)
        },
        popover: {
          title: "Validation Mode",
          description: "Auto mode validates the schedule after every change and highlights violations instantly. Hover over the button, then click \"Switch to Manual\" to validate on demand using the lightning bolt, useful when making many changes at once. To switch back, hover again and click \"Switch to Auto\".",
          side: "bottom" as const, align: "end" as const,
        },
      },
      // 22 (A_OPEN_MORE) — Next opens users directly
      {
        element: "#toolbar-more",
        onHighlighted: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-more")
          if (el && driverInstance) tutorialExpand(el, driverInstance)
        },
        onDeselected: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-more")
          if (el) tutorialCollapse(el)
        },
        popover: {
          title: "More Menu",
          description: "This menu contains Tutorial, How-to Guides, User Management, and Logout. Click Next to open User Management.",
          side: "bottom" as const, align: "end" as const,
          onNextClick: () => doForward(A_OPEN_MORE, () => driverInstance?.moveNext()),
        },
      },
      // 23 (A_USERS)
      {
        element: "#users-dialog",
        popover: {
          title: "User Management",
          description: "Create new accounts, update existing users, set roles (admin or support), and reset passwords. Admins have full edit access; support users have read-only access.",
          side: "left" as const, align: "start" as const,
          onPrevClick: () => doBackward(A_USERS, () => driverInstance?.movePrevious()),
        },
      },
      // 24 (A_CLOSE_USERS)
      {
        element: "#users-dialog-header",
        popover: {
          title: "Closing User Management",
          description: "Use the X button in the top-right to close. Click Next to close it now.",
          side: "bottom" as const, align: "end" as const,
          onNextClick: () => doForward(A_CLOSE_USERS, () => driverInstance?.moveNext()),
        },
      },
      // 25 (A_DONE)
      {
        popover: {
          title: "You're all set!",
          description: "That's the full tour. You can restart the tutorial at any time from the More menu in the toolbar.",
          side: "over" as const, align: "center" as const,
          onPrevClick: () => doBackward(A_DONE, () => driverInstance?.movePrevious()),
        },
      },
    ]

    const supportSteps = [
      ...commonSteps,
      // 7 (S_OPEN_SNAPSHOTS)
      {
        element: "#toolbar-saved-schedules",
        onHighlighted: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-saved-schedules")
          if (el && driverInstance) tutorialExpand(el, driverInstance)
        },
        onDeselected: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-saved-schedules")
          if (el) tutorialCollapse(el)
        },
        popover: {
          title: "Saved Schedules",
          description: "View multiple versions of a schedule for the same year. Click Next to open it.",
          side: "bottom" as const, align: "end" as const,
          onNextClick: () => doForward(S_OPEN_SNAPSHOTS, () => driverInstance?.moveNext()),
        },
      },
      // 8 (S_SNAPSHOTS)
      {
        element: "#saved-schedules-dialog",
        popover: {
          title: "Saved Schedules",
          description: "Each card shows a saved schedule with its completion progress. You can load a schedule to make it active.",
          side: "left" as const, align: "start" as const,
          onPrevClick: () => doBackward(S_SNAPSHOTS, () => driverInstance?.movePrevious()),
        },
      },
      // 9 (S_CLOSE_SNAPSHOTS)
      {
        element: "#saved-schedules-dialog-header",
        popover: {
          title: "Closing Saved Schedules",
          description: "Use the X button in the top-right to close. Click Next to close it now.",
          side: "bottom" as const, align: "end" as const,
          onNextClick: () => doForward(S_CLOSE_SNAPSHOTS, () => driverInstance?.moveNext()),
        },
      },
      // 10 (S_EXPORT)
      {
        element: "#toolbar-export",
        onHighlighted: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-export")
          if (el && driverInstance) tutorialExpand(el, driverInstance)
        },
        onDeselected: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-export")
          if (el) tutorialCollapse(el)
        },
        popover: {
          title: "Export to XLSX",
          description: "Download the current schedule as a XLSX file, with instructors as rows and Fall and Winter assignments as columns.",
          side: "bottom" as const, align: "end" as const,
          onPrevClick: () => doBackward(S_EXPORT, () => driverInstance?.movePrevious()),
        },
      },
      // 11 (S_OPEN_MORE)
      {
        element: "#toolbar-more",
        onHighlighted: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-more")
          if (el && driverInstance) tutorialExpand(el, driverInstance)
        },
        onDeselected: () => {
          const el = document.querySelector<HTMLElement>("#toolbar-more")
          if (el) tutorialCollapse(el)
        },
        popover: {
          title: "More Menu",
          description: "Account settings, Tutorial, How-to Guides, and Logout are accessible from this menu.",
          side: "bottom" as const, align: "end" as const,
        },
      },
      // 12 — done
      {
        popover: {
          title: "You're all set!",
          description: "That's the full tour. You can restart the tutorial at any time from the More menu in the toolbar.",
          side: "over" as const, align: "center" as const,
        },
      },
    ]

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0,0,0,0.6)",
      disableActiveInteraction: true,
      onDestroyStarted: () => {
        driverInstance = null
        driverObj.destroy()
        stopTutorial()
      },
      steps: isAdmin ? adminSteps : supportSteps,
    })

    driverInstance = driverObj
    driverObj.drive()
  }, [role, stopTutorial, onOpenProperties, onCloseProperties, onOpenSnapshots, onCloseSnapshots, onOpenUsers, onCloseUsers, onOpenMigration, onCloseMigration, onTutorialStart])

  return { startTutorial }
}
