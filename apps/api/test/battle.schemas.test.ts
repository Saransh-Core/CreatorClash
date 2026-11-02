import { describe, expect, it } from 'vitest'
import { createBattleSchema, respondInvitationSchema } from '../src/modules/battles/battle.schemas.js'

describe('battle request contracts', () => {
  it('accepts a valid creator versus creator invitation request', () => {
    const result = createBattleSchema.safeParse({
      title: 'Creative challenge',
      category: 'Art & Creativity',
      format: 'creator-vs-creator',
      opponentId: 'b16a4e6b-0ba5-46e8-a966-d5b4710eddd2',
      challengeBrief: 'Make a character from three shapes.',
      durationMinutes: 30,
      rules: '',
    })
    expect(result.success).toBe(true)
  })

  it('rejects unsupported input fields and out-of-range durations', () => {
    const result = createBattleSchema.safeParse({
      title: 'Creative challenge',
      category: 'Art & Creativity',
      format: 'creator-vs-creator',
      opponentId: 'b16a4e6b-0ba5-46e8-a966-d5b4710eddd2',
      challengeBrief: 'Make a character from three shapes.',
      durationMinutes: 500,
      winnerId: 'client-controlled',
    })
    expect(result.success).toBe(false)
  })

  it('requires a boolean invitation decision', () => {
    expect(respondInvitationSchema.safeParse({ accept: true }).success).toBe(true)
    expect(respondInvitationSchema.safeParse({ accept: 'yes' }).success).toBe(false)
  })
})
