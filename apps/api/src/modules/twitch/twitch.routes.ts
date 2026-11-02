import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { connectTwitchController, twitchCallbackController, twitchDisconnectController, twitchMeController, twitchStreamController } from './twitch.controller.js'

export const twitchRouter = Router()
twitchRouter.get('/connect', authenticate, connectTwitchController)
twitchRouter.get('/callback', twitchCallbackController)
twitchRouter.get('/me', authenticate, twitchMeController)
twitchRouter.get('/stream', authenticate, twitchStreamController)
twitchRouter.delete('/disconnect', authenticate, twitchDisconnectController)
