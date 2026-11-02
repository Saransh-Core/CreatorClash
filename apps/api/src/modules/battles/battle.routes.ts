import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import {
  createBattleController,
  getBattleController,
  listBattlesController,
  listInvitationsController,
  rematchBattleController,
  respondInvitationController,
  transitionBattleController,
} from './battle.controller.js'

export const battleRouter = Router()

battleRouter.use(authenticate)
battleRouter.get('/', listBattlesController)
battleRouter.post('/', createBattleController)
battleRouter.get('/invitations', listInvitationsController)
battleRouter.post('/invitations/:invitationId/respond', respondInvitationController)
battleRouter.patch('/:battleId/transition', transitionBattleController)
battleRouter.post('/:battleId/rematch', rematchBattleController)
battleRouter.get('/:battleId', getBattleController)
