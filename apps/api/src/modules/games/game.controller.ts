import type { RequestHandler } from 'express'
import { AppError } from '../../shared/errors.js'
import { gameSessionIdSchema, gameSessionSchema, quizAnswerSchema } from './game.schemas.js'
import { answerQuizQuestion, createGameSession, finalizeQuiz, getGameResults, getGameSession, getNextQuizQuestion, startGameSession, submitReaction } from './game.service.js'

function clientFor(request: Parameters<RequestHandler>[0]) {
  if (!request.supabase) throw new AppError('Authentication is required.', 401, 'UNAUTHENTICATED')
  return request.supabase
}

export const createGameSessionController: RequestHandler = async (request, response, next) => {
  try {
    const input = gameSessionSchema.parse(request.body)
    response.status(201).json({ data: await createGameSession(clientFor(request), input.battleId, input.gameSlug) })
  } catch (error) { next(error) }
}

export const startGameSessionController: RequestHandler = async (request, response, next) => {
  try {
    response.json({ data: await startGameSession(clientFor(request), gameSessionIdSchema.parse(request.params['sessionId'])) })
  } catch (error) { next(error) }
}

export const getGameSessionController: RequestHandler = async (request, response, next) => {
  try {
    response.json({ data: await getGameSession(clientFor(request), gameSessionIdSchema.parse(request.params['sessionId'])) })
  } catch (error) { next(error) }
}

export const submitQuizAnswerController: RequestHandler = async (request, response, next) => {
  try {
    const input = quizAnswerSchema.parse(request.body)
    response.json({ data: await answerQuizQuestion(clientFor(request), gameSessionIdSchema.parse(request.params['sessionId']), input.questionId, input.selectedOptionIndex) })
  } catch (error) { next(error) }
}

export const nextQuizQuestionController: RequestHandler = async (request, response, next) => {
  try {
    response.json({ data: await getNextQuizQuestion(clientFor(request), gameSessionIdSchema.parse(request.params['sessionId'])) })
  } catch (error) { next(error) }
}

export const submitReactionController: RequestHandler = async (request, response, next) => {
  try {
    response.json({ data: await submitReaction(clientFor(request), gameSessionIdSchema.parse(request.params['sessionId'])) })
  } catch (error) { next(error) }
}

export const finalizeQuizController: RequestHandler = async (request, response, next) => {
  try {
    response.json({ data: await finalizeQuiz(clientFor(request), gameSessionIdSchema.parse(request.params['sessionId'])) })
  } catch (error) { next(error) }
}

export const gameResultsController: RequestHandler = async (request, response, next) => {
  try {
    response.json({ data: await getGameResults(clientFor(request), gameSessionIdSchema.parse(request.params['sessionId'])) })
  } catch (error) { next(error) }
}
