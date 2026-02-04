import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'
import InstructorsPanel from '@/components/assignmentInterface/instructorsPanel'
import type { InstructorState, SectionState } from '@/features/assignment/assignment.types'

describe('InstructorsPanel Component', () => {
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
    },
    allIds: ['1'],
  }

  const mockInstructorState: InstructorState = {
    byId: {
      '1': {
        id: '1',
        name: 'John Smith',
        positon: { short: 'Prof.', long: 'Professor' },
        workload_total: 4,
        fall_assigned: ['1'],
        wint_assigned: [],
      },
      '2': {
        id: '2',
        name: 'Jane Doe',
        positon: { short: 'Adj.', long: 'Adjunct' },
        workload_total: 2,
        fall_assigned: [],
        wint_assigned: [],
      },
    },
    allIds: ['1', '2'],
  }

  // Test that the panel displays the "Instructors" heading
  it('renders instructors panel heading', () => {
    render(
      <InstructorsPanel 
        instructorState={mockInstructorState} 
        sectionState={mockSectionState} 
      />
    )
    
    expect(screen.getByText('Instructors')).toBeDefined()
  })

  // Test that all required table column headers are present (Name, Workload, Fall, Winter)
  it('renders table headers', () => {
    render(
      <InstructorsPanel 
        instructorState={mockInstructorState} 
        sectionState={mockSectionState} 
      />
    )
    
    expect(screen.getByText('Name')).toBeDefined()
    expect(screen.getByText('Workload')).toBeDefined()
    expect(screen.getByText('Fall')).toBeDefined()
    expect(screen.getByText('Winter')).toBeDefined()
  })

  // Test that all instructors from the state are rendered with their correct titles and names
  it('renders all instructors', () => {
    render(
      <InstructorsPanel 
        instructorState={mockInstructorState} 
        sectionState={mockSectionState} 
      />
    )
    
    expect(screen.getByText('Prof. John Smith')).toBeDefined()
    expect(screen.getByText('Adj. Jane Doe')).toBeDefined()
  })

  // Test that the panel handles empty instructor list gracefully (shows heading but no instructor rows)
  it('renders empty panel when no instructors', () => {
    const emptyState: InstructorState = {
      byId: {},
      allIds: [],
    }
    
    render(
      <InstructorsPanel 
        instructorState={emptyState} 
        sectionState={mockSectionState} 
      />
    )
    
    expect(screen.getByText('Instructors')).toBeDefined()
    expect(screen.queryByText('Prof. John Smith')).toBeNull()
  })
})
