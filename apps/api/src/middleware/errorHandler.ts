import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../shared/errors.js'
import { logger } from '../shared/logger.js'

export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Request validation failed.' } })
    return
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: { code: error.code, message: error.message } })
    return
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = error.status
    if (status === 400 || status === 413) {
      response.status(status).json({ error: {
        code: status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INVALID_REQUEST',
        message: status === 413 ? 'The request payload is too large.' : 'The request could not be parsed.',
      } })
      return
    }
  }

  logger.error({ err: error }, 'Unhandled request error')
  response.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } })
}
