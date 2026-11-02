import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { authenticate } from '../../middleware/authenticate.js'
import {
  approveChallengeController, editOptionController, generateChallengeController, listChallengesController,
  openVotingController, saveChallengeController, selectWinnerController, voteChallengeController,
} from './challenge.controller.js'

export const challengeRouter = Router()
challengeRouter.use(authenticate)
challengeRouter.post('/suggestions/generate', rateLimit({ windowMs: 60_000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false }), generateChallengeController)
challengeRouter.get('/', listChallengesController)
challengeRouter.post('/', saveChallengeController)
challengeRouter.post('/:challengeId/voting/open', openVotingController)
challengeRouter.post('/:challengeId/voting/close', selectWinnerController)
challengeRouter.post('/:challengeId/votes', voteChallengeController)
challengeRouter.post('/:challengeId/approvals', approveChallengeController)
challengeRouter.patch('/:challengeId/options/:optionId', editOptionController)
