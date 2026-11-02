import cors from 'cors'
import express from 'express'
import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'
import type { RequestHandler } from 'express'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFoundHandler } from './middleware/notFound.js'
import { battleRouter } from './modules/battles/battle.routes.js'
import { creatorRouter } from './modules/creators/creator.routes.js'
import { healthRouter } from './modules/health/health.routes.js'
import { gameRouter } from './modules/games/game.routes.js'
import { walletRouter } from './modules/wallet/wallet.routes.js'
import { challengeRouter } from './modules/challenges/challenge.routes.js'
import { matchmakingRouter } from './modules/matchmaking/matchmaking.routes.js'
import { logger } from './shared/logger.js'
import { twitchRouter } from './modules/twitch/twitch.routes.js'

const requestLogger: RequestHandler = (request, response, next) => {
  const startedAt = performance.now()
  response.on('finish', () => {
    logger.info({
      method: request.method,
      path: request.path,
      statusCode: response.statusCode,
      durationMs: Math.round(performance.now() - startedAt),
    }, 'Request completed')
  })
  next()
}

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(helmet())
  app.use(requestLogger)
  app.use(cors({
    origin(origin, callback) {
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, true)
        return
      }
      callback(null, false)
    },
  }))
  app.use(express.json({ limit: '1mb', strict: true }))
  app.use('/api', rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }))
  app.use('/api/health', healthRouter)
  app.use('/api/battles', battleRouter)
  app.use('/api/creators', creatorRouter)
  app.use('/api/games', gameRouter)
  app.use('/api/wallet', walletRouter)
  app.use('/api/challenges', challengeRouter)
  app.use('/api/matchmaking', matchmakingRouter)
  app.use('/api/twitch', twitchRouter)
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
