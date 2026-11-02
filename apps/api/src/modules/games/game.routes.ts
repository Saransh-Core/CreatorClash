import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import {
  createGameSessionController, finalizeQuizController, gameResultsController, getGameSessionController, nextQuizQuestionController,
  startGameSessionController, submitQuizAnswerController, submitReactionController,
} from './game.controller.js'

export const gameRouter = Router()
gameRouter.use(authenticate)
gameRouter.post('/sessions', createGameSessionController)
gameRouter.get('/sessions/:sessionId', getGameSessionController)
gameRouter.post('/sessions/:sessionId/start', startGameSessionController)
gameRouter.get('/sessions/:sessionId/next-question', nextQuizQuestionController)
gameRouter.post('/sessions/:sessionId/answers', submitQuizAnswerController)
gameRouter.post('/sessions/:sessionId/reaction', submitReactionController)
gameRouter.post('/sessions/:sessionId/finalize', finalizeQuizController)
gameRouter.get('/sessions/:sessionId/results', gameResultsController)
