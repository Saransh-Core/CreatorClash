import { describe, expect, it } from 'vitest'
import { challengeGenerationSchema, saveChallengeSchema } from '../src/modules/challenges/challenge.schemas.js'

const option = {
  title: 'Shape to Story',
  description: 'Build a character from three simple shapes.',
  rules: 'Use three shapes and present the character in one minute.',
  difficulty: 'Balanced',
  estimatedDurationMinutes: 25,
  scoringMethod: 'Score originality and clarity.',
  equipmentPreparation: 'Paper and pen.',
  victoryConditions: 'The highest combined judge score wins.',
}

describe('challenge request contracts', () => {
  it('requires a battle and validates creator generation preferences', () => {
    expect(challengeGenerationSchema.safeParse({
      battleId: '50000000-0000-4000-8000-000000000001',
      category: 'Art & Creativity',
      challengeType: 'Creative',
      difficulty: 'Balanced',
      durationMinutes: 30,
      format: 'creator-vs-creator',
      brief: 'Build a character from three shapes.',
      customInstructions: 'No purchased supplies.',
    }).success).toBe(true)
    expect(challengeGenerationSchema.safeParse({ category: 'Art', brief: 'A short prompt' }).success).toBe(false)
  })

  it('validates three to five complete structured options for persistence', () => {
    const base = {
      battleId: '50000000-0000-4000-8000-000000000001',
      prompt: 'Category: Art. Create a brief.',
      generatedByAi: true,
    }
    expect(saveChallengeSchema.safeParse({ ...base, options: [option, { ...option, title: 'Different challenge' }, { ...option, title: 'Third challenge' }] }).success).toBe(true)
    expect(saveChallengeSchema.safeParse({ ...base, options: [option, option] }).success).toBe(false)
  })
})
