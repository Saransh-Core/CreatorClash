import { createServer } from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { logger } from './shared/logger.js'

const server = createServer(createApp())

server.listen(env.port, () => {
  logger.info({ port: env.port }, 'Creator Clash API listening')
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    logger.info({ signal }, 'Shutting down API')
    server.close((error) => {
      if (error) {
        logger.error({ err: error }, 'API shutdown failed')
        process.exitCode = 1
      }
    })
  })
}
