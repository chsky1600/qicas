import { describe, it, expect } from 'bun:test'
import { fetchAssignment } from '@/features/assignment/assignment.api'

describe('Assignment API', () => {
  // Test that fetchAssignment returns an object with both sectionState and instructorState properties
  it('returns mock data with sections and instructors', () => {
    const result = fetchAssignment()
    
    expect(result).toHaveProperty('sectionState')
    expect(result).toHaveProperty('instructorState')
  })

  // Test that sectionState has the correct normalized structure (byId object and allIds array)
  it('returns valid section state structure', () => {
    const result = fetchAssignment()
    
    expect(result.sectionState).toHaveProperty('byId')
    expect(result.sectionState).toHaveProperty('allIds')
    expect(Array.isArray(result.sectionState.allIds)).toBe(true)
  })

  // Test that instructorState has the correct normalized structure (byId object and allIds array)
  it('returns valid instructor state structure', () => {
    const result = fetchAssignment()
    
    expect(result.instructorState).toHaveProperty('byId')
    expect(result.instructorState).toHaveProperty('allIds')
    expect(Array.isArray(result.instructorState.allIds)).toBe(true)
  })

  // Test data integrity: every section ID in allIds array exists as a key in byId object
  it('section state byId matches allIds', () => {
    const result = fetchAssignment()
    
    result.sectionState.allIds.forEach(id => {
      expect(result.sectionState.byId[id]).toBeDefined()
    })
  })

  // Test data integrity: every instructor ID in allIds array exists as a key in byId object
  it('instructor state byId matches allIds', () => {
    const result = fetchAssignment()
    
    result.instructorState.allIds.forEach(id => {
      expect(result.instructorState.byId[id]).toBeDefined()
    })
  })

  // Test that mock data provides sufficient test data (minimum 2 sections for testing)
  it('mock data has at least 2 sections', () => {
    const result = fetchAssignment()
    expect(result.sectionState.allIds.length).toBeGreaterThanOrEqual(2)
  })

  // Test that mock data provides sufficient test data (minimum 2 instructors for testing)
  it('mock data has at least 2 instructors', () => {
    const result = fetchAssignment()
    expect(result.instructorState.allIds.length).toBeGreaterThanOrEqual(2)
  })
})
