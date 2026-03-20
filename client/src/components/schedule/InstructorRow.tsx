import { useState } from "react"
import { useDroppable } from "@dnd-kit/core"
import SectionChip from "./SectionChip"
import type { Instructor, InstructorRule, Course, CourseRule, Assignment, Violation } from "@/features/schedule/types"
import { RANK_DISPLAY } from "@/features/schedule/types"

interface Props {
  instructor: Instructor
  rule: InstructorRule | undefined
  courses: Course[]
  courseRules: CourseRule[]
  assignments: Assignment[]
  violations: Violation[]
}

export default function InstructorRow({ instructor, rule, courses, courseRules, assignments, violations }: Props) {
  const [showViolations, setShowViolations] = useState(false)

  const fallAssignments = assignments
    .filter(a => a.instructor_id === instructor.id && a.term === "Fall")
    .sort((a, b) => {
      if (a.course_code !== b.course_code) return a.course_code.localeCompare(b.course_code)
      const secA = courses.find(c => c.code === a.course_code)?.sections.find(s => s.id === a.section_id)?.number ?? 0
      const secB = courses.find(c => c.code === b.course_code)?.sections.find(s => s.id === b.section_id)?.number ?? 0
      return secA - secB
    })
  const wintAssignments = assignments
    .filter(a => a.instructor_id === instructor.id && a.term === "Winter")
    .sort((a, b) => {
      if (a.course_code !== b.course_code) return a.course_code.localeCompare(b.course_code)
      const secA = courses.find(c => c.code === a.course_code)?.sections.find(s => s.id === a.section_id)?.number ?? 0
      const secB = courses.find(c => c.code === b.course_code)?.sections.find(s => s.id === b.section_id)?.number ?? 0
      return secA - secB
    })

  const assignedWorkload = [...fallAssignments, ...wintAssignments].reduce((sum, a) => {
    const cr = courseRules.find(r => r.course_code === a.course_code)
    return sum + (cr?.workload_fulfillment ?? 0)
  }, 0)

  const totalCapacity = [...fallAssignments, ...wintAssignments].reduce((sum, a) => {
    const course = courses.find(c => c.code === a.course_code)
    const sec = course?.sections.find(s => s.id === a.section_id)
    return sum + (sec?.capacity ?? 0)
  }, 0)

  const myViolations = violations.filter(v => v.type === "Instructor" && v.offending_id === instructor.id)

  const fallCourseViolations = [... new Map(
    fallAssignments.flatMap(a =>
      violations.filter(v =>
        v.type === "Course" && v.offending_id === a.course_code && (v.id.includes(a.section_id) || v.code === "CROSS_TERM_DUPLICATE" || v.code === "FULLYEAR_HALF_OPEN")
      )
    ).map(v => [v.id, v])
  ).values()]

  const wintCourseViolations = [... new Map(
    wintAssignments.flatMap(a =>
      violations.filter(v =>
        v.type === "Course" && v.offending_id === a.course_code && (v.id.includes(a.section_id) || v.code === "CROSS_TERM_DUPLICATE" || v.code === "FULLYEAR_HALF_OPEN")
      )
    ).map(v => [v.id, v])
  ).values()]

  const violationCounts = [...myViolations, ...fallCourseViolations, ...wintCourseViolations].reduce(
    (acc, v) => {
      if (v.degree === "Info") acc.info++
      else if (v.degree === "Warning") acc.warn++
      else if (v.degree === "Error") acc.err++
      return acc
    },
    { info: 0, warn: 0, err: 0 }
  )

  const infoCount = violationCounts.info
  const warnCount = violationCounts.warn
  const errCount = violationCounts.err

  const { setNodeRef: fallRef, isOver: fallOver } = useDroppable({ id: `drop-${instructor.id}-Fall`, data: { type: "instructor", instructorId: instructor.id, term: "Fall" } })
  const { setNodeRef: wintRef, isOver: wintOver } = useDroppable({ id: `drop-${instructor.id}-Winter`, data: { type: "instructor", instructorId: instructor.id, term: "Winter" } })

  const baseWorkload = instructor.workload + (rule?.workload_delta ?? 0)
  const workloadExceeded = assignedWorkload > baseWorkload
  const rankShort = RANK_DISPLAY[instructor.rank]?.short ?? ""

  return (
    <>
      <tr className="border-b border-gray-200">

        {/* -- Info Col -- */}
        <td className="px-3 py-2 text-sm whitespace-nowrap align-top">
          <div className="font-medium">{rankShort} {instructor.name}</div>
          <div className={`text-xs ${workloadExceeded ? "text-orange-500 font-semibold" : "text-gray-500"}`}>
            Workload: {assignedWorkload}/{baseWorkload}
          </div>
          <div className="text-xs text-gray-500">Students: {totalCapacity}</div>
          {myViolations.length > 0 && (
            <div className="cursor-pointer text-xs flex items-center gap-1 mt-0.5 " onClick={() => setShowViolations(v => !v)}>
              {infoCount > 0 && <span className="text-blue-500">Info: {infoCount},</span>}
              {warnCount > 0 && <span className="text-orange-500">Warnings: {warnCount},</span>}
              {errCount > 0 && <span className="text-red-500">Errors: {errCount}</span>}
              <div className="text-gray-400 hover:text-gray-600 ml-0.5">
                {showViolations ? "▲" : "▼"}
              </div>
            </div>
          )}
        </td>

        {/* -- Fall Col -- */}
        <td
          ref={fallRef}
          className={`px-3 py-2 min-w-48 ${fallOver ? "bg-blue-100" : "bg-orange-50"}`}
        >
          <div className="flex flex-wrap gap-1">
            {fallAssignments.map(a => {
              const course = courses.find(c => c.code === a.course_code)
              const section = course?.sections.find(s => s.id === a.section_id)
              const cRule = courseRules.find(r => r.course_code === a.course_code)
              const chipViolations = violations.filter(v => v.type === "Course" && v.offending_id === a.course_code && (v.id.includes(a.section_id) || v.code === "FULLYEAR_HALF_OPEN" || v.code === "CROSS_TERM_DUPLICATE"))
              return section ? (
                <SectionChip
                  key={a.id}
                  courseCode={a.course_code}
                  sectionId={a.section_id}
                  sectionNum={section.number}
                  isFullYear={cRule?.is_full_year ?? false}
                  assignmentId={a.id}
                  prevInstructorId={instructor.id}
                  prevTerm="Fall"
                  inViolation={chipViolations.find(v => v.degree === "Error") ? "Error" : chipViolations.find(v => v.degree === "Warning") ? "Warning" : chipViolations.find(v => v.degree === "Info") ? "Info" : null}
                />
              ) : null
            })}
          </div>
        </td>

        {/* -- Winter Col -- */}
        <td
          ref={wintRef}
          className={`px-3 py-2 min-w-48 ${wintOver ? "bg-blue-100" : "bg-cyan-50"}`}
        >
          <div className="flex flex-wrap gap-1">
            {wintAssignments.map(a => {
              const course = courses.find(c => c.code === a.course_code)
              const section = course?.sections.find(s => s.id === a.section_id)
              const cRule = courseRules.find(r => r.course_code === a.course_code)
              const chipViolations = violations.filter(v => v.type === "Course" && v.offending_id === a.course_code && (v.id.includes(a.section_id) || v.code === "FULLYEAR_HALF_OPEN" || v.code === "CROSS_TERM_DUPLICATE"))
              return section ? (
                <SectionChip
                  key={a.id}
                  courseCode={a.course_code}
                  sectionId={a.section_id}
                  sectionNum={section.number}
                  isFullYear={cRule?.is_full_year ?? false}
                  assignmentId={a.id}
                  prevInstructorId={instructor.id}
                  prevTerm="Winter"
                  inViolation={chipViolations.find(v => v.degree === "Error") ? "Error" : chipViolations.find(v => v.degree === "Warning") ? "Warning" : chipViolations.find(v => v.degree === "Info") ? "Info" : null}
                />
              ) : null
            })}
          </div>
        </td>
      </tr>

      {/* -- Violation Warnings -- */}
      {showViolations && (myViolations.length + fallCourseViolations.length + wintCourseViolations.length) > 0 && (
        <tr className="border-b border-gray-100 bg-gray-50">
          <td colSpan={1} className="px-4 py-2 align-top">
            <ul className="space-y-0.5">
              {myViolations.map(v => (
                <li key={v.id} className={`text-xs flex gap-2 ${v.degree === "Error" ? "text-red-600" : v.degree === "Warning" ? "text-orange-500" : "text-blue-500"}`}>
                  <span className="font-semibold">[{v.degree}]</span>
                  <span>{v.message}</span>
                </li>
              ))}
            </ul>
          </td>
          <td colSpan={1} className="px-4 py-2 align-top">
            <ul className="space-y-0.5">
              {fallCourseViolations.map(v => (
                <li key={v.id} className={`text-xs flex gap-2 ${v.degree === "Error" ? "text-red-600" : v.degree === "Warning" ? "text-orange-500" : "text-blue-500"}`}>
                  <span className="font-semibold">[{v.degree}]</span>
                  <span>{v.message}</span>
                </li>
              ))}
            </ul>
          </td>
          <td colSpan={1} className="px-4 py-2 align-top">
            <ul className="space-y-0.5">
              {wintCourseViolations.map(v => (
                <li key={v.id} className={`text-xs flex gap-2 ${v.degree === "Error" ? "text-red-600" : v.degree === "Warning" ? "text-orange-500" : "text-blue-500"}`}>
                  <span className="font-semibold">[{v.degree}]</span>
                  <span>{v.message}</span>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}
    </>
  )
}
