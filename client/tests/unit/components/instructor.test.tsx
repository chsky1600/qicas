import { describe, it, expect, afterEach } from 'bun:test'
import { render, screen, cleanup } from '@testing-library/react'
import Instructor from '@/components/assignmentInterface/instructor'
import type { Instructor as InstructorType, SectionState } from '@/features/assignment/assignment.types'

describe('Instructor Component', () => {
  afterEach(() => {
    cleanup()
  })

  const mockSectionState: SectionState = {
    byId: {
      '1': {
        id: '1',
        name: 'Introduction to French',
        code: 'FREN101',
        year_introduced: '2024',
        section_num: 1,
        availability: 'Fall' as any,
        capacity: 200,
      },
      '2': {
        id: '2',
        name: 'Advanced French',
        code: 'FREN201',
        year_introduced: '2024',
        section_num: 1,
        availability: 'Winter' as any,
        capacity: 150,
      },
    },
    allIds: ['1', '2'],
  }

  const mockInstructor: InstructorType = {
    id: '1',
    name: 'John Smith',
    positon: { short: 'Prof.', long: 'Professor' },
    workload_total: 4,
    fall_assigned: ['1'],
    wint_assigned: ['2'],
  }

  // Test that the instructor's position prefix and name are displayed correctly in the first column
  it('renders instructor name with position', () => {
    render(
      <table>
        <tbody>
          <Instructor instructor={mockInstructor} sectionState={mockSectionState} />
        </tbody>
      </table>
    )
    
    const nameCell = screen.getByText('Prof. John Smith')
    expect(nameCell).toBeDefined()
  })

  // Test that the workload calculation shows correct ratio of assigned courses to total workload
  it('renders workload correctly (2 assigned out of 4 total)', () => {
    render(
      <table>
        <tbody>
          <Instructor instructor={mockInstructor} sectionState={mockSectionState} />
        </tbody>
      </table>
    )
    
    const workloadCell = screen.getByText('2/4')
    expect(workloadCell).toBeDefined()
  })

  // Test that fall semester course assignments are displayed in the Fall column
  it('renders fall assigned courses', () => {
    render(
      <table>
        <tbody>
          <Instructor instructor={mockInstructor} sectionState={mockSectionState} />
        </tbody>
      </table>
    )
    
    const fallCourse = screen.getByText('FREN101')
    expect(fallCourse).toBeDefined()
  })

  // Test that winter semester course assignments are displayed in the Winter column
  it('renders winter assigned courses', () => {
    render(
      <table>
        <tbody>
          <Instructor instructor={mockInstructor} sectionState={mockSectionState} />
        </tbody>
      </table>
    )
    
    const winterCourse = screen.getByText('FREN201')
    expect(winterCourse).toBeDefined()
  })

  // Test that instructors with no course assignments display correctly with 0 workload
  it('handles instructor with no assigned courses', () => {
    const emptyInstructor: InstructorType = {
      ...mockInstructor,
      fall_assigned: [],
      wint_assigned: [],
    }

    render(
      <table>
        <tbody>
          <Instructor instructor={emptyInstructor} sectionState={mockSectionState} />
        </tbody>
      </table>
    )
    
    const workloadCell = screen.getByText('0/4')
    expect(workloadCell).toBeDefined()
  })
})
