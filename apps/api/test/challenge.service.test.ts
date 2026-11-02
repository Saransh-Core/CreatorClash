import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../src/shared/errors.js'
import { requestAiSuggestions } from '../src/modules/challenges/challenge.service.js'

const input = {
  battleId: '50000000-0000-4000-8000-000000000001',
  category: 'Art & Creativity',
  challengeType: 'Creative',
  difficulty: 'Balanced' as const,
  durationMinutes: 30,
  format: 'creator-vs-creator' as const,
  brief: 'Create a character using three geometric shapes.',
  customInstructions: 'Use materials already available at home.',
}

const suggestions = [
  { title: 'Shape to Story', description: 'Build a character from three simple shapes.', rules: 'Use only three shapes and explain the character in one minute.', difficulty: 'Balanced', estimatedDurationMinutes: 20, scoringMethod: 'Award one point for originality and one for clarity.', equipmentPreparation: 'Paper and any drawing tool.', victoryConditions: 'The highest combined judge score wins.' },
  { title: 'One Line World', description: 'Invent a place using a single continuous line.', rules: 'Do not lift the drawing tool; describe the world when time ends.', difficulty: 'Balanced', estimatedDurationMinutes: 25, scoringMethod: 'Score creativity and how clearly the setting reads.', equipmentPreparation: 'Paper and pen or a digital canvas.', victoryConditions: 'The highest combined judge score wins.' },
  { title: 'Pocket-Sized Myth', description: 'Turn an everyday object into a mythic artifact.', rules: 'Choose one nearby object and give it a short origin story.', difficulty: 'Balanced', estimatedDurationMinutes: 30, scoringMethod: 'Score originality, presentation, and connection to the object.', equipmentPreparation: 'One safe object already nearby.', victoryConditions: 'The highest combined judge score wins.' },
]

afterEach(() => vi.unstubAllGlobals())

describe('OpenAI challenge generation', () => {
  it('calls the server-side Responses API and validates structured challenge options', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output: [{ content: [{ type: 'output_text', text: JSON.stringify({ suggestions }) }] }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    const result = await requestAiSuggestions(input, 'server-test-key', 'test-model')

    expect(fetchMock).toHaveBeenCalledWith('https://api.openai.com/v1/responses', expect.objectContaining({
      method: 'POST',
      headers: { Authorization: 'Bearer server-test-key', 'Content-Type': 'application/json' },
    }))
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({ title: 'Shape to Story', victoryConditions: expect.any(String) })
  })

  it('returns a clear configuration error when the server key is missing', async () => {
    await expect(requestAiSuggestions(input, undefined, 'test-model')).rejects.toMatchObject<AppError>({
      statusCode: 503,
      code: 'OPENAI_NOT_CONFIGURED',
    })
  })

  it('rejects duplicate challenge titles from an otherwise valid response', async () => {
    const duplicated = [suggestions[0], { ...suggestions[1], title: 'shape to story' }, suggestions[2]]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      output: [{ content: [{ type: 'output_text', text: JSON.stringify({ suggestions: duplicated }) }] }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })))

    await expect(requestAiSuggestions(input, 'server-test-key', 'test-model')).rejects.toMatchObject({
      code: 'OPENAI_DUPLICATE_OPTIONS',
    })
  })
})
