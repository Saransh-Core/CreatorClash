import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { findOpponentsController, joinQueueController, leaveQueueController, listProposalsController, proposeMatchController, respondMatchController } from './matchmaking.controller.js'

export const matchmakingRouter = Router()
matchmakingRouter.use(authenticate)
matchmakingRouter.post('/queue', joinQueueController)
matchmakingRouter.delete('/queue', leaveQueueController)
matchmakingRouter.get('/opponents', findOpponentsController)
matchmakingRouter.get('/proposals', listProposalsController)
matchmakingRouter.post('/proposals', proposeMatchController)
matchmakingRouter.post('/proposals/:proposalId/respond', respondMatchController)
