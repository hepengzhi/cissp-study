import { isAnswerCorrect } from '@/lib/utils/question-grading'
import { describe, it, expect } from 'vitest'

describe('isAnswerCorrect', () => {
  describe('SINGLE_CHOICE', () => {
    it('should return true when answer matches', () => {
      expect(isAnswerCorrect('SINGLE_CHOICE', '2', '2')).toBe(true)
    })

    it('should return false when answer does not match', () => {
      expect(isAnswerCorrect('SINGLE_CHOICE', '2', '1')).toBe(false)
    })

    it('should return true for index 0', () => {
      expect(isAnswerCorrect('SINGLE_CHOICE', '0', '0')).toBe(true)
    })
  })

  describe('MATCHING', () => {
    it('should return true when all pairs match', () => {
      expect(isAnswerCorrect('MATCHING', '[0,2,3,1]', '[0,2,3,1]')).toBe(true)
    })

    it('should return false when any pair is wrong', () => {
      expect(isAnswerCorrect('MATCHING', '[0,2,3,1]', '[0,2,3,0]')).toBe(false)
    })

    it('should return false when array lengths differ', () => {
      expect(isAnswerCorrect('MATCHING', '[0,2,3,1]', '[0,2]')).toBe(false)
    })

    it('should return true for 6-item match', () => {
      expect(isAnswerCorrect('MATCHING', '[2,0,3,4,5,1]', '[2,0,3,4,5,1]')).toBe(true)
    })

    it('should return false for empty vs non-empty', () => {
      expect(isAnswerCorrect('MATCHING', '[0,2,3,1]', '[]')).toBe(false)
    })

    it('should return true when both are empty arrays', () => {
      expect(isAnswerCorrect('MATCHING', '[]', '[]')).toBe(true)
    })
  })
})
