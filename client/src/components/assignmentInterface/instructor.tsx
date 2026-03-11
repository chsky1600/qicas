import { ViolationDegree, getDegreeColor, type Instructor as InstructorType, type SectionState, SectionAvailability } from "@/features/assignment/assignment.types"
import { TableCell, TableRow } from "@/components/ui/table"
import { useDroppable } from "@dnd-kit/core";
import AssignedChip from "./assignedChip";
import { useState,useMemo } from "react";
import { ChevronDownIcon, ChevronUpIcon} from "lucide-react";

interface InstructorProps {
  instructor: InstructorType;
  sectionState: SectionState;
}

export default function Instructor({ instructor, sectionState }: InstructorProps) {
  // toggleable state controlling if details violation data shown
  const [showViolations, setShowViolations] = useState<boolean>(false);

  const {isOver: isOverFall, setNodeRef: setNodeRefFall} = useDroppable({
    id: `instructor-${instructor.id}-F`,
    data: {
      type: "instructor",
      instructorId: instructor.id,
      term: SectionAvailability.F,
    }
  })

  const {isOver: isOverWint, setNodeRef: setNodeRefWint} = useDroppable({
    id: `instuctor-${instructor.id}-W`,
    data: {
      type: "instructor",
      instructorId: instructor.id,
      term: SectionAvailability.W,
    }
  })

  const styleFall = {
    opacity: isOverFall ? 0.5 : 1,
  }

  const styleWint = {
    opacity: isOverWint ? 0.5 : 1,
  }

  // Count # of violations of each type, but only when instructor.violations updates
  const { numInfo, numWarn, numErr } = useMemo(() => {
    let numInfo = 0
    let numWarn = 0
    let numErr = 0
    
    // concat the three violation arrays
    const violations = [...instructor.violations.details_col_violations, ...instructor.violations.fall_col_violations, ...instructor.violations.wint_col_violations]
  
    // Count the types of violations
    violations.forEach((violation) => {
      switch(violation.degree) {
        case ViolationDegree.I:
          numInfo++
          break
        case ViolationDegree.W:
          numWarn++
          break
        case ViolationDegree.E:
          numErr++
          break
        default:
          break
      }
    })

    return {numInfo, numWarn, numErr }
  }, [instructor.violations])

  // Count total capacity, but only when instructor.violations updates
  const totalAssignedWorkload = useMemo(() => {
    let totalAssignedWorkload = 0
    
    // concat the three violation arrays
    const sectionIds = [...instructor.fall_assigned, ...instructor.wint_assigned]
  
    // Count the types of violations
    sectionIds.forEach((sectionId) => {      
      totalAssignedWorkload += sectionState.byId[sectionId].workload
    })

    return totalAssignedWorkload
  }, [instructor.fall_assigned, instructor.wint_assigned, sectionState.byId])

  // Count total capacity, but only when instructor.violations updates
  const totalAssignedCapacity = useMemo(() => {
    let totalAssignedCapacity = 0
    
    // concat the three violation arrays
    const sectionIds = [...instructor.fall_assigned, ...instructor.wint_assigned]
  
    // Count the types of violations
    sectionIds.forEach((sectionId) => {      
      totalAssignedCapacity += sectionState.byId[sectionId].capacity
    })

    return totalAssignedCapacity
  }, [instructor.fall_assigned, instructor.wint_assigned, sectionState.byId])

  const numViolations = numInfo + numWarn + numErr

  // if # of violations > 0, and showViolations = true, show violations; otherwise hide violations tab
  const styleViolations = {
    display: (numViolations > 0 && showViolations) ? "" : "none",
  }

  return (
    <>
    <TableRow key={instructor.id + "_data"}>
      {/* Instructor Data */}
      <TableCell className="text-center font-medium flex flex-col">

        <div>
          {instructor.position.short + " " + instructor.name}
        </div>

        <div className={totalAssignedWorkload >  instructor.workload_total ? "text-orange-400" : ""}>
          <b>Workload: </b>{totalAssignedWorkload + "/" + instructor.workload_total}
        </div>

        <div>
          <b>Students: </b>{instructor.fall_assigned.size + instructor.wint_assigned.size > 0 ? totalAssignedCapacity : 0}
        </div>

        {numViolations > 0 ? // 
          <div onClick={() => setShowViolations(!showViolations)} style={{cursor:'pointer'}} className="flex justify-center">
            {numInfo > 0 ? // 
              <>
                <span className="text-blue-400"> 
                  Info: {numInfo}      
                </span>
                {numWarn > 0 ? "," : ""}&#8194;
              </>
            : null}
            {numWarn > 0 ? //
              <>
                <span className="text-orange-400"> 
                  Warnings: {numWarn}          
                </span>
                {numErr > 0 ? ",":""}&#8194;
              </>
            : null}
            {numErr > 0 ? // 
              <span className="text-red-400">
                Errors: {numErr}      
              </span>
            : null}
            <span className="content-center mt-1">
              {showViolations ? 
                <ChevronDownIcon className="size-4" /> :
                <ChevronUpIcon className="size-4" />  
              }     
            </span>         
          </div>
        : null}

      </TableCell>

      {/* Fall Term */}
      <TableCell ref={setNodeRefFall} style={styleFall}  className="text-center bg-orange-50 w-200 max-w-200">
        <div className="flex flex-wrap gap-1 justify-center">
          {Array.from(instructor.fall_assigned)
            .sort((a,b) => {
              const sA = sectionState.byId[a];
              const sB = sectionState.byId[b];
              if (!sA || !sB) return 0;
              return sA.course_code.localeCompare(sB.course_code)
            })
            .map((sectionId) => {
              const section = sectionState.byId[sectionId];
              return (section && !section.dropped) ? (
                <AssignedChip key={section.id+"_chip"} {...section}/>
              ) : null;
            })}
        </div>
      </TableCell>

      {/* Winter Term */}
      <TableCell ref={setNodeRefWint} style={styleWint} className="text-center bg-cyan-50 w-200 max-w-200">
        <div className="flex flex-wrap gap-1 justify-center">
          {Array.from(instructor.wint_assigned)
            .sort((a,b) => {
              const sA = sectionState.byId[a];
              const sB = sectionState.byId[b];
              if (!sA || !sB) return 0;
              return sA.course_code.localeCompare(sB.course_code)
            })
            .map((sectionId) => {
              const section = sectionState.byId[sectionId];
              return (section && !section.dropped) ? (
                <AssignedChip key={section.id+"_chip"} {...section}/>
              ) : null;
            })}
        </div>
      </TableCell>
    </TableRow>

    <TableRow key={instructor.id + "_violations"} style={styleViolations}>
      {/* overall instructor violations */}
      <TableCell className="w-12 align-top">
        <div className="flex flex-col gap-1 justify-left">
          {instructor.violations.details_col_violations.map((violation) => (
            <span className={`${getDegreeColor(violation.degree)} text-white px-2 py-1 rounded text-sm text-left text-wrap`}>
              <b>{violation.degree}</b> - {violation.msg}
            </span>
          ))}
        </div>
      </TableCell>

      {/* Fall Term violations */}
      <TableCell  className="bg-orange-50 w-200 max-w-200 align-top">
        <div className="flex flex-col gap-1 justify-left align-top">
          {instructor.violations.fall_col_violations.map((violation) => (
            <span className={`${getDegreeColor(violation.degree)} text-white px-2 py-1 rounded text-sm text-left text-wrap`}>
              <b>{violation.degree}</b> - {violation.msg}
            </span>
          ))}
        </div>
      </TableCell>

      {/* Winter Term violations */}
      <TableCell className="bg-cyan-50 w-200 max-w-200 align-top">
        <div className="flex flex-col gap-1 justify-left">
          {instructor.violations.wint_col_violations.map((violation) => (
            <span className={`${getDegreeColor(violation.degree)} text-white px-2 py-1 rounded text-sm text-left text-wrap`}>
              <b>{violation.degree}</b> - {violation.msg}
            </span>
          ))}
        </div>
      </TableCell>
    </TableRow>
    </>
  )
}
