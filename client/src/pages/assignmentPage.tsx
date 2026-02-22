//import { useState } from 'react'
//import reactLogo from '../assets/react.svg'
//import viteLogo from '/vite.svg'
//import './App.css'
import AssignmentInterface from "../components/assignmentInterface/assignmentInterface"
import { useAssignment } from "@/features/assignment/useAssignment"


function AssignmentPage() {
  const assignmentProperties = useAssignment()

  return (
    <AssignmentInterface {...assignmentProperties}/>
  )
}

export default AssignmentPage