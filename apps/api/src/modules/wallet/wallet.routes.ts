import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { listWalletsController, redeemRewardController, supportCreatorController, walletHistoryController } from './wallet.controller.js'

export const walletRouter = Router()
walletRouter.use(authenticate)
walletRouter.get('/', listWalletsController)
walletRouter.get('/transactions', walletHistoryController)
walletRouter.post('/support', supportCreatorController)
walletRouter.post('/rewards/:rewardId/redeem', redeemRewardController)
