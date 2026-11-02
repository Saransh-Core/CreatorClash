import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/app.js'

describe('health route', () => {
  it('returns service health without exposing configuration', async () => {
    const response = await request(createApp()).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ status: 'ok', service: 'creator-clash-api' })
    expect(JSON.stringify(response.body)).not.toContain('SUPABASE')
  })

  it('returns a standard not found response for unknown endpoints', async () => {
    const response = await request(createApp()).get('/api/missing')

    expect(response.status).toBe(404)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })

  it('rejects malformed JSON with a safe client error', async () => {
    const response = await request(createApp())
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{bad json')

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('INVALID_REQUEST')
  })
})
