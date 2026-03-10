import AssignmentInterface from "../components/assignmentInterface/assignmentInterface"
import { useAssignment } from "@/features/assignment/useAssignment"


function AssignmentPage() {
  const assignmentProperties = useAssignment()

  return (
    <AssignmentInterface {...assignmentProperties}/>
  )
}

export default AssignmentPage