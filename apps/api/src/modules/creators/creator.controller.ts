import type { RequestHandler } from 'express'
import { AppError } from '../../shared/errors.js'
import { creatorProfileSchema } from './creator.schemas.js'
import { getCreators, saveCreatorProfile } from './creator.service.js'

function dependencies(request: Parameters<RequestHandler>[0]) {
  if (!request.authUser || !request.supabase) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
  return { user: request.authUser, client: request.supabase }
}

export const listCreatorsController: RequestHandler = async (request, response, next) => {
  try {
    const { client } = dependencies(request)
    response.json({ data: await getCreators(client) })
  } catch (error) { next(error) }
}

export const saveCreatorProfileController: RequestHandler = async (request, response, next) => {
  try {
    const input = creatorProfileSchema.parse(request.body)
    const { user, client } = dependencies(request)
    response.status(200).json({ data: await saveCreatorProfile(client, user.id, input) })
  } catch (error) { next(error) }
}
