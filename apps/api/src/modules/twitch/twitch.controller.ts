import type { RequestHandler } from 'express'
import { AppError } from '../../shared/errors.js'
import { twitchService } from './twitch.service.js'

function authenticatedUser(request: Parameters<RequestHandler>[0]) {
  if (!request.authUser) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
  return request.authUser
}

export const connectTwitchController: RequestHandler = (request, response, next) => {
  try {
    const user = authenticatedUser(request)
    const token = request.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
    const url = twitchService.authorizationUrl(user.id, token, request.get('origin'))
    response.setHeader('Cache-Control', 'no-store')
    if (request.query['format'] === 'json') {
      response.json({ authorizationUrl: url })
      return
    }
    response.redirect(302, url)
  } catch (error) { next(error) }
}

export const twitchCallbackController: RequestHandler = async (request, response, next) => {
  try {
    const state = typeof request.query['state'] === 'string' ? request.query['state'] : undefined
    const code = typeof request.query['code'] === 'string' ? request.query['code'] : undefined
    const error = typeof request.query['error'] === 'string' ? request.query['error'] : undefined
    response.setHeader('Cache-Control', 'no-store')
    response.redirect(302, await twitchService.callback({
      ...(state ? { state } : {}), ...(code ? { code } : {}), ...(error ? { error } : {}),
    }))
  } catch (error) { next(error) }
}

export const twitchMeController: RequestHandler = async (request, response, next) => {
  try {
    const user = authenticatedUser(request)
    if (!request.supabase) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
    response.json({ data: await twitchService.me(user.id, request.supabase) })
  }
  catch (error) { next(error) }
}

export const twitchStreamController: RequestHandler = async (request, response, next) => {
  try {
    const user = authenticatedUser(request)
    if (!request.supabase) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
    response.json({ data: await twitchService.stream(user.id, request.supabase) })
  }
  catch (error) { next(error) }
}

export const twitchDisconnectController: RequestHandler = async (request, response, next) => {
  try {
    const user = authenticatedUser(request)
    if (!request.supabase) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
    response.json({ data: await twitchService.disconnect(user.id, request.supabase) })
  }
  catch (error) { next(error) }
}
