import { describe, it, expect } from 'bun:test'
import { 
  SectionAvailability, 
  sectionStateEmpty, 
  instructorStateEmpty 
} from '@/features/assignment/assignment.types'

describe('Assignment Types', () => {
  // Test that the SectionAvailability enum has all required semester options
  it('has correct section availability enum values', () => {
    expect(SectionAvailability.F).toBe('Fall')
    expect(SectionAvailability.W).toBe('Winter')
    expect(SectionAvailability.FandW).toBe('Fall/Wint.')
    expect(SectionAvailability.ForW).toBe('Full Year')
  })

  // Test that the empty section state constant is properly initialized with empty byId and allIds
  it('has empty section state initialized correctly', () => {
    expect(sectionStateEmpty).toEqual({
      byId: {},
      allIds: [],
    })
  })

  // Test that the empty instructor state constant is properly initialized with empty byId and allIds
  it('has empty instructor state initialized correctly', () => {
    expect(instructorStateEmpty).toEqual({
      byId: {},
      allIds: [],
    })
  })
})
