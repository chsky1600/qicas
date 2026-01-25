import type { Section } from "@/features/assignment/assignment.types"

function Course(section : Section)  {

  return (
    <>
      <p>
        Course component!
      </p>
      <p>
        {section.name}
      </p>
    </>
  )
}

export default Course