import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { listCreatorsController, saveCreatorProfileController } from './creator.controller.js'

export const creatorRouter = Router()
creatorRouter.use(authenticate)
creatorRouter.get('/', listCreatorsController)
creatorRouter.put('/me', saveCreatorProfileController)
