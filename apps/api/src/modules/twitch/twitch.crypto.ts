import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors.js'

function encryptionKey() {
  if (!env.twitchTokenEncryptionKey) throw new AppError('Twitch token encryption is not configured.', 503, 'TWITCH_NOT_CONFIGURED')
  return Buffer.from(env.twitchTokenEncryptionKey, 'base64')
}

export function encryptTwitchToken(token: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `\\x${Buffer.concat([iv, tag, ciphertext]).toString('hex')}`
}

export function decryptTwitchToken(value: string) {
  const packed = Buffer.from(value.replace(/^\\x/, ''), 'hex')
  if (packed.length < 29) throw new AppError('Stored Twitch credentials are invalid.', 500, 'TWITCH_CREDENTIALS_INVALID')
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), packed.subarray(0, 12))
  decipher.setAuthTag(packed.subarray(12, 28))
  try {
    return Buffer.concat([decipher.update(packed.subarray(28)), decipher.final()]).toString('utf8')
  } catch {
    throw new AppError('Stored Twitch credentials could not be decrypted.', 500, 'TWITCH_CREDENTIALS_INVALID')
  }
}
