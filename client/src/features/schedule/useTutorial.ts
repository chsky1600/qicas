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

// Admin tutorial step indices
const A_OPEN_PROPERTIES      = 8
const A_CLOSE_PROPS_BACK     = 9
const A_COURSES_TAB          = 10
const A_INSTRUCTORS_TAB      = 11
const A_CLOSE_PROPERTIES     = 12
const A_OPEN_USERS           = 13
const A_CLOSE_USERS_BACK     = 14
const A_CLOSE_USERS          = 15
const A_OPEN_SNAPSHOTS       = 16
const A_CLOSE_SNAPS_BACK     = 17
const A_CLOSE_SNAPSHOTS      = 19
const A_REOPEN_SNAPSHOTS     = 20
const A_OPEN_MIGRATION       = 20  // ArrowRight - open migration dialog
const A_CLOSE_MIGRATION_BACK = 21  // ArrowLeft  - close migration, go back
const A_CLOSE_MIGRATION      = 22  // ArrowRight - close migration via click
const A_REOPEN_MIGRATION     = 23  // ArrowLeft  - reopen migration, go back

// Support tutorial step indices
const S_OPEN_SNAPSHOTS       = 8
const S_CLOSE_SNAPS_BACK     = 9
const S_CLOSE_SNAPSHOTS      = 10
const S_REOPEN_SNAPSHOTS     = 11

// Required DOM IDs - do not remove these from their components:
// #toolbar-year-select          - Toolbar year dropdown
// #toolbar-active-schedule      - Toolbar active schedule name
// #toolbar-edit-properties      - Toolbar Edit Properties button (admin)
// #toolbar-users                - Toolbar Users button (admin)
// #toolbar-account              - Toolbar Account button (support)
// #toolbar-saved-schedules      - Toolbar Saved Schedules button
// #toolbar-export               - Toolbar Export button
// #toolbar-validation-mode      - Toolbar validation mode button (admin)
// #courses-panel                - Courses panel container
// #courses-panel-search         - Courses panel search input
// #courses-panel-list           - Courses panel list
// #schedule-table               - Schedule table container
// #properties-dialog            - Edit Properties dialog
// #properties-dialog-close      - Edit Properties close button
// #properties-tab-courses       - Edit Properties tab switcher
// #users-dialog                 - Users dialog
// #users-dialog-close           - Users dialog close button
// #saved-schedules-dialog       - Saved Schedules dialog
// #saved-schedules-dialog-close - Saved Schedules close button
// #saved-schedules-add          - Saved Schedules Add+ button
// #migration-dialog             - Migration dialog
// #migration-dialog-close       - Migration dialog close button

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

    let propertiesClickHandler: (() => void) | null = null
    let propertiesCloseHandler: (() => void) | null = null
    let usersClickHandler: (() => void) | null = null
    let usersCloseHandler: (() => void) | null = null
    let snapshotsClickHandler: (() => void) | null = null
    let snapshotsCloseHandler: (() => void) | null = null
    let migrationCloseHandler: (() => void) | null = null
    let coursesTabClickHandler: (() => void) | null = null

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

      if (isAdmin) {
        if (e.key === "ArrowRight") {
          if (index === A_OPEN_PROPERTIES) {
            e.stopImmediatePropagation()
            const btn = document.querySelector<HTMLElement>("#toolbar-edit-properties")
            if (btn && propertiesClickHandler) { btn.removeEventListener("click", propertiesClickHandler); propertiesClickHandler = null }
            onOpenProperties()
            setTimeout(() => d.moveNext(), 150)
          } else if (index === A_COURSES_TAB) {
            e.stopImmediatePropagation()
            const wrapper = document.querySelector<HTMLElement>("#properties-tab-courses")
            if (wrapper && coursesTabClickHandler) { wrapper.removeEventListener("click", coursesTabClickHandler); coursesTabClickHandler = null }
            document.querySelector<HTMLElement>("#properties-tab-courses button:last-child")?.click()
            setTimeout(() => d.moveNext(), 50)
          } else if (index === A_CLOSE_PROPERTIES) {
            e.stopImmediatePropagation()
            const btn = document.querySelector<HTMLElement>("#properties-dialog-close")
            if (btn && propertiesCloseHandler) { btn.removeEventListener("click", propertiesCloseHandler); propertiesCloseHandler = null }
            onCloseProperties()
            setTimeout(() => d.moveNext(), 50)
          } else if (index === A_OPEN_USERS) {
            e.stopImmediatePropagation()
            const btn = document.querySelector<HTMLElement>("#toolbar-users")
            if (btn && usersClickHandler) { btn.removeEventListener("click", usersClickHandler); usersClickHandler = null }
            onOpenUsers()
            setTimeout(() => d.moveNext(), 150)
          } else if (index === A_CLOSE_USERS) {
            e.stopImmediatePropagation()
            const btn = document.querySelector<HTMLElement>("#users-dialog-close")
            if (btn && usersCloseHandler) { btn.removeEventListener("click", usersCloseHandler); usersCloseHandler = null }
            onCloseUsers()
            setTimeout(() => d.moveNext(), 50)
          } else if (index === A_OPEN_SNAPSHOTS) {
            e.stopImmediatePropagation()
            const btn = document.querySelector<HTMLElement>("#toolbar-saved-schedules")
            if (btn && snapshotsClickHandler) { btn.removeEventListener("click", snapshotsClickHandler); snapshotsClickHandler = null }
            onOpenSnapshots()
            setTimeout(() => d.moveNext(), 150)
          } else if (index === A_CLOSE_SNAPSHOTS) {
            e.stopImmediatePropagation()
            const btn = document.querySelector<HTMLElement>("#saved-schedules-dialog-close")
            if (btn && snapshotsCloseHandler) { btn.removeEventListener("click", snapshotsCloseHandler); snapshotsCloseHandler = null }
            onCloseSnapshots()
            setTimeout(() => d.moveNext(), 50)
          } else if (index === A_OPEN_MIGRATION) {
            e.stopImmediatePropagation()
            onOpenMigration()
            setTimeout(() => d.moveNext(), 150)
          } else if (index === A_CLOSE_MIGRATION) {
            e.stopImmediatePropagation()
            const btn = document.querySelector<HTMLElement>("#migration-dialog-close")
            if (btn && migrationCloseHandler) { btn.removeEventListener("click", migrationCloseHandler); migrationCloseHandler = null }
            onCloseMigration()
            setTimeout(() => d.moveNext(), 50)
          }
        } else {
          if (index === A_CLOSE_PROPS_BACK) {
            e.stopImmediatePropagation()
            onCloseProperties()
            setTimeout(() => d.movePrevious(), 50)
          } else if (index === A_INSTRUCTORS_TAB) {
            e.stopImmediatePropagation()
            document.querySelector<HTMLElement>("#properties-tab-courses button:first-child")?.click()
            setTimeout(() => d.movePrevious(), 50)
          } else if (index === A_OPEN_USERS) {
            e.stopImmediatePropagation()
            onOpenProperties()
            setTimeout(() => d.movePrevious(), 150)
          } else if (index === A_CLOSE_USERS_BACK) {
            e.stopImmediatePropagation()
            onCloseUsers()
            setTimeout(() => d.movePrevious(), 50)
          } else if (index === A_OPEN_SNAPSHOTS) {
            e.stopImmediatePropagation()
            onOpenUsers()
            setTimeout(() => d.movePrevious(), 150)
          } else if (index === A_CLOSE_SNAPS_BACK) {
            e.stopImmediatePropagation()
            onCloseSnapshots()
            setTimeout(() => d.movePrevious(), 50)
          } else if (index === A_REOPEN_SNAPSHOTS) {
            e.stopImmediatePropagation()
            onOpenSnapshots()
            setTimeout(() => d.movePrevious(), 150)
          } else if (index === A_CLOSE_MIGRATION_BACK) {
            e.stopImmediatePropagation()
            onCloseMigration()
            setTimeout(() => d.movePrevious(), 50)
          } else if (index === A_REOPEN_MIGRATION) {
            e.stopImmediatePropagation()
            onOpenMigration()
            setTimeout(() => d.movePrevious(), 150)
          }
        }
      } else {
        // Support role
        if (e.key === "ArrowRight") {
          if (index === S_OPEN_SNAPSHOTS) {
            e.stopImmediatePropagation()
            const btn = document.querySelector<HTMLElement>("#toolbar-saved-schedules")
            if (btn && snapshotsClickHandler) { btn.removeEventListener("click", snapshotsClickHandler); snapshotsClickHandler = null }
            onOpenSnapshots()
            setTimeout(() => d.moveNext(), 150)
          } else if (index === S_CLOSE_SNAPSHOTS) {
            e.stopImmediatePropagation()
            const btn = document.querySelector<HTMLElement>("#saved-schedules-dialog-close")
            if (btn && snapshotsCloseHandler) { btn.removeEventListener("click", snapshotsCloseHandler); snapshotsCloseHandler = null }
            onCloseSnapshots()
            setTimeout(() => d.moveNext(), 50)
          }
        } else {
          if (index === S_CLOSE_SNAPS_BACK) {
            e.stopImmediatePropagation()
            onCloseSnapshots()
            setTimeout(() => d.movePrevious(), 50)
          } else if (index === S_REOPEN_SNAPSHOTS) {
            e.stopImmediatePropagation()
            onOpenSnapshots()
            setTimeout(() => d.movePrevious(), 150)
          }
        }
      }
    }

    keyHandlerRef.current = keyHandler
    window.addEventListener("keyup", keyHandler, true)

    const commonStepsStart = [
      // 0
      {
        popover: {
          title: "Welcome to QICAS!",
          description:
            "This quick tour will walk you through the schedule interface. Use the Next and Previous buttons to navigate, or press Escape to exit at any time.",
          side: "over" as const,
          align: "center" as const,
        },
      },
      // 1
      {
        element: "#toolbar-year-select",
        popover: {
          title: "Academic Year",
          description:
            "Use this dropdown to switch between academic years. All courses, instructors, and schedules are organised per year.",
          side: "bottom" as const,
          align: "start" as const,
        },
      },
      // 2
      {
        element: "#toolbar-active-schedule",
        popover: {
          title: "Active Schedule",
          description:
            "The name of your currently active schedule is shown here. You can have multiple saved schedules for the same year and switch between them freely.",
          side: "bottom" as const,
          align: "start" as const,
        },
      },
      // 3
      {
        element: "#courses-panel",
        popover: {
          title: "Courses Panel",
          description:
            "This panel lists all active courses for the year. Unassigned courses appear at the top, assigned courses below. Use the search bar to filter quickly.",
          side: "right" as const,
          align: "start" as const,
        },
      },
      // 4
      {
        element: "#courses-panel-search",
        popover: {
          title: "Search Courses",
          description:
            "Type here to filter by course code. The list updates as you type.",
          side: "right" as const,
          align: "start" as const,
        },
      },
      // 5
      {
        element: "#courses-panel-list",
        popover: {
          title: isAdmin ? "Drag to Assign" : "Course Chips",
          description: isAdmin
            ? "Drag a course chip from this panel and drop it onto an instructor's Fall or Winter cell to assign it. Chips with a dashed blue border are external courses, meaning they are paid by the faculty member rather than the department. You can set this in Edit Properties under the Courses tab."
            : "Each chip represents a course section. Chips with a dashed blue border are external courses, meaning they are paid by the faculty member rather than the department.",
          side: "right" as const,
          align: "start" as const,
        },
      },
      // 6
      {
        element: "#schedule-table",
        popover: {
          title: "Schedule Table",
          description: isAdmin
            ? "Each row is an instructor. Drop chips in the Fall or Winter column to assign them. Drag a chip back to the courses panel to unassign it, or to another row to reassign."
            : "Each row is an instructor with their Fall and Winter course assignments.",
          side: "left" as const,
          align: "start" as const,
        },
      },
    ]

    const adminSteps = [
      ...commonStepsStart,
      // 7 - keyboard shortcuts
      {
        popover: {
          title: "Keyboard Shortcuts",
          description:
            "Use Cmd+Z (Mac) or Ctrl+Z (Windows) to undo a recent assignment or unassignment. Use Cmd+Shift+Z / Ctrl+Shift+Z to redo. Up to 20 actions are stored in the undo history.",
          side: "over" as const,
          align: "center" as const,
        },
      },
      // 8 (A_OPEN_PROPERTIES) - click to open
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
          if (btn && propertiesClickHandler) { btn.removeEventListener("click", propertiesClickHandler); propertiesClickHandler = null }
        },
        popover: {
          title: "Edit Properties",
          description:
            "Manage instructors and courses for the year. Click this button to open it.",
          side: "bottom" as const,
          align: "end" as const,
          showButtons: ["previous", "close"] as ["previous", "close"],
        },
      },
      // 9 (A_CLOSE_PROPS_BACK) - prev closes properties
      {
        element: "#properties-dialog",
        popover: {
          title: "Edit Properties: Instructors",
          description:
            "The Instructors tab lets you add or edit instructors, set their workload limit, rank, and notes. Click on an instructor to expand their details.",
          side: "left" as const,
          align: "start" as const,
          onPrevClick: () => {
            onCloseProperties()
            setTimeout(() => driverObj.movePrevious(), 50)
          },
        },
      },
      // 10 (A_COURSES_TAB) - click Courses tab
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
          if (wrapper && coursesTabClickHandler) { wrapper.removeEventListener("click", coursesTabClickHandler); coursesTabClickHandler = null }
        },
        popover: {
          title: "Switching Tabs",
          description:
            "There are two tabs: Instructors and Courses. Click the Courses tab now to continue.",
          side: "bottom" as const,
          align: "start" as const,
          showButtons: ["previous", "close"] as ["previous", "close"],
        },
      },
      // 11 (A_INSTRUCTORS_TAB) - explain courses tab
      {
        element: "#properties-dialog",
        popover: {
          title: "Edit Properties: Courses",
          description:
            "The Courses tab lets you add or edit courses, set sections, and drop it from the schedule. The 'Paid By' field controls whether a course is external. External courses show a dashed blue border on their chips in the schedule.",
          side: "right" as const,
          align: "start" as const,
          onPrevClick: () => {
            document.querySelector<HTMLElement>("#properties-tab-courses button:first-child")?.click()
            setTimeout(() => driverObj.movePrevious(), 50)
          },
        },
      },
      // 12 (A_CLOSE_PROPERTIES) - click X to close
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
          if (btn && propertiesCloseHandler) { btn.removeEventListener("click", propertiesCloseHandler); propertiesCloseHandler = null }
        },
        popover: {
          title: "Closing Edit Properties",
          description: "Click the X to close the dialog when you're done.",
          side: "bottom" as const,
          align: "end" as const,
          showButtons: ["previous", "close"] as ["previous", "close"],
        },
      },
      // 13 (A_OPEN_USERS) - click to open; prev closes properties and goes back
      {
        element: "#toolbar-users",
        onHighlighted: () => {
          const btn = document.querySelector<HTMLElement>("#toolbar-users")
          if (!btn) return
          usersClickHandler = () => setTimeout(() => driverObj.moveNext(), 150)
          btn.addEventListener("click", usersClickHandler)
        },
        onDeselected: () => {
          const btn = document.querySelector<HTMLElement>("#toolbar-users")
          if (btn && usersClickHandler) { btn.removeEventListener("click", usersClickHandler); usersClickHandler = null }
        },
        popover: {
          title: "User Management",
          description:
            "Use this to manage who has access to QICAS. Click the button to open it.",
          side: "bottom" as const,
          align: "end" as const,
          showButtons: ["previous", "close"] as ["previous", "close"],
          onPrevClick: () => {
            onOpenProperties()
            setTimeout(() => driverObj.movePrevious(), 150)
          },
        },
      },
      // 14 (A_CLOSE_USERS_BACK) - prev closes users
      {
        element: "#users-dialog",
        popover: {
          title: "Users Dialog",
          description:
            "Create new accounts, update existing users, set roles (admin or support), and reset passwords. Admins have full edit access; support users have read-only access.",
          side: "left" as const,
          align: "start" as const,
          onPrevClick: () => {
            onCloseUsers()
            setTimeout(() => driverObj.movePrevious(), 50)
          },
        },
      },
      // 15 (A_CLOSE_USERS) - click X to close
      {
        element: "#users-dialog-close",
        onHighlighted: () => {
          const btn = document.querySelector<HTMLElement>("#users-dialog-close")
          if (!btn) return
          usersCloseHandler = () => setTimeout(() => driverObj.moveNext(), 50)
          btn.addEventListener("click", usersCloseHandler)
        },
        onDeselected: () => {
          const btn = document.querySelector<HTMLElement>("#users-dialog-close")
          if (btn && usersCloseHandler) { btn.removeEventListener("click", usersCloseHandler); usersCloseHandler = null }
        },
        popover: {
          title: "Closing Users",
          description: "Click the X to close when you're done.",
          side: "left" as const,
          align: "start" as const,
          showButtons: ["previous", "close"] as ["previous", "close"],
        },
      },
      // 16 (A_OPEN_SNAPSHOTS) - click to open; prev closes users
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
          if (btn && snapshotsClickHandler) { btn.removeEventListener("click", snapshotsClickHandler); snapshotsClickHandler = null }
        },
        popover: {
          title: "Saved Schedules",
          description:
            "Save multiple versions of a schedule for the same year. Click the button to open it.",
          side: "bottom" as const,
          align: "end" as const,
          showButtons: ["previous", "close"] as ["previous", "close"],
          onPrevClick: () => {
            onOpenUsers()
            setTimeout(() => driverObj.movePrevious(), 150)
          },
        },
      },
      // 17 (A_CLOSE_SNAPS_BACK) - prev closes snapshots
      {
        element: "#saved-schedules-dialog",
        popover: {
          title: "Saved Schedules",
          description:
            "Each card shows a saved schedule. You can load, copy, rename, or delete schedules from here.",
          side: "left" as const,
          align: "start" as const,
          onPrevClick: () => {
            onCloseSnapshots()
            setTimeout(() => driverObj.movePrevious(), 50)
          },
        },
      },
      // 18 - add button
      {
        element: "#saved-schedules-add",
        popover: {
          title: "Adding a New Schedule",
          description:
            'Click "Add+" to create a blank schedule. You can build it independently from your other saved versions.',
          side: "bottom" as const,
          align: "start" as const,
        },
      },
      // 19 (A_CLOSE_SNAPSHOTS) - click X to close
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
          if (btn && snapshotsCloseHandler) { btn.removeEventListener("click", snapshotsCloseHandler); snapshotsCloseHandler = null }
        },
        popover: {
          title: "Closing Saved Schedules",
          description: "Click the X to close the dialog.",
          side: "left" as const,
          align: "start" as const,
          showButtons: ["previous", "close"] as ["previous", "close"],
        },
      },
      // 20 (A_REOPEN_SNAPSHOTS / A_OPEN_MIGRATION) - prev reopens snapshots, next opens migration
      {
        element: "#toolbar-year-select",
        popover: {
          title: "Creating a New Academic Year",
          description:
            "Select \"New Year +\" from this dropdown to migrate to a new academic year. You must be on the latest year to do this. Press → to open the Migration dialog.",
          side: "bottom" as const,
          align: "start" as const,
          showButtons: ["previous", "close"] as ["previous", "close"],
          onPrevClick: () => {
            onOpenSnapshots()
            setTimeout(() => driverObj.movePrevious(), 150)
          },
        },
      },
      // 21 (A_CLOSE_MIGRATION_BACK) - prev closes migration
      {
        element: "#migration-dialog",
        popover: {
          title: "Migration Dialog",
          description:
            "Optionally select schedules from the current year to copy into the new one, then click \"Create new academic year\" to proceed.",
          side: "left" as const,
          align: "start" as const,
          onPrevClick: () => {
            onCloseMigration()
            setTimeout(() => driverObj.movePrevious(), 50)
          },
        },
      },
      // 22 (A_CLOSE_MIGRATION) - click X to close
      {
        element: "#migration-dialog-close",
        onHighlighted: () => {
          const btn = document.querySelector<HTMLElement>("#migration-dialog-close")
          if (!btn) return
          migrationCloseHandler = () => setTimeout(() => driverObj.moveNext(), 50)
          btn.addEventListener("click", migrationCloseHandler)
        },
        onDeselected: () => {
          const btn = document.querySelector<HTMLElement>("#migration-dialog-close")
          if (btn && migrationCloseHandler) { btn.removeEventListener("click", migrationCloseHandler); migrationCloseHandler = null }
        },
        popover: {
          title: "Closing Migration",
          description: "Click the X to close the dialog.",
          side: "left" as const,
          align: "start" as const,
          showButtons: ["previous", "close"] as ["previous", "close"],
        },
      },
      // 23 (A_REOPEN_MIGRATION) - prev reopens migration
      {
        element: "#toolbar-export",
        popover: {
          title: "Export to CSV",
          description:
            "Download the current schedule as a CSV file, with instructors as rows and Fall and Winter assignments as columns.",
          side: "bottom" as const,
          align: "end" as const,
          onPrevClick: () => {
            onOpenMigration()
            setTimeout(() => driverObj.movePrevious(), 150)
          },
        },
      },
      // 24 - validation mode
      {
        element: "#toolbar-validation-mode",
        popover: {
          title: "Validation Mode",
          description:
            "Auto mode validates the schedule after every change and highlights violations instantly. Switch to Manual to validate on demand using the lightning bolt, which is useful when making many changes at once.",
          side: "bottom" as const,
          align: "end" as const,
        },
      },
      // 25 - done
      {
        popover: {
          title: "You're all set!",
          description:
            "That's the full tour. You can restart the tutorial any time from the Tutorial button in the toolbar.",
          side: "over" as const,
          align: "center" as const,
        },
      },
    ]

    const supportSteps = [
      ...commonStepsStart,
      // 7 - account button
      {
        element: "#toolbar-account",
        popover: {
          title: "Your Account",
          description: "Update your name, email, or password here.",
          side: "bottom" as const,
          align: "end" as const,
        },
      },
      // 8 (S_OPEN_SNAPSHOTS) - click to open
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
          if (btn && snapshotsClickHandler) { btn.removeEventListener("click", snapshotsClickHandler); snapshotsClickHandler = null }
        },
        popover: {
          title: "Saved Schedules",
          description:
            "View multiple versions of a schedule for the same year. Click the button to open it.",
          side: "bottom" as const,
          align: "end" as const,
          showButtons: ["previous", "close"] as ["previous", "close"],
        },
      },
      // 8 (S_CLOSE_SNAPS_BACK) - prev closes snapshots
      {
        element: "#saved-schedules-dialog",
        popover: {
          title: "Saved Schedules",
          description:
            "Each card shows a saved schedule with its completion progress. You can load a schedule to make it active.",
          side: "left" as const,
          align: "start" as const,
          onPrevClick: () => {
            onCloseSnapshots()
            setTimeout(() => driverObj.movePrevious(), 50)
          },
        },
      },
      // 9 (S_CLOSE_SNAPSHOTS) - click X to close
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
          if (btn && snapshotsCloseHandler) { btn.removeEventListener("click", snapshotsCloseHandler); snapshotsCloseHandler = null }
        },
        popover: {
          title: "Closing Saved Schedules",
          description: "Click the X to close the dialog.",
          side: "left" as const,
          align: "start" as const,
          showButtons: ["previous", "close"] as ["previous", "close"],
        },
      },
      // 10 (S_REOPEN_SNAPSHOTS) - prev reopens snapshots
      {
        element: "#toolbar-export",
        popover: {
          title: "Export to CSV",
          description:
            "Download the current schedule as a CSV file, with instructors as rows and Fall and Winter assignments as columns.",
          side: "bottom" as const,
          align: "end" as const,
          onPrevClick: () => {
            onOpenSnapshots()
            setTimeout(() => driverObj.movePrevious(), 150)
          },
        },
      },
      // 11 - done
      {
        popover: {
          title: "You're all set!",
          description:
            "That's the full tour. You can restart the tutorial any time from the Tutorial button in the toolbar.",
          side: "over" as const,
          align: "center" as const,
        },
      },
    ]

    const driverObj = driver({
      showProgress: true,
      animate: true,
      overlayColor: "rgba(0,0,0,0.6)",
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
