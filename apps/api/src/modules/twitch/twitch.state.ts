import { randomBytes } from 'node:crypto'

export type StateRecord = { userId: string; creatorClashAccessToken: string; returnOrigin: string; expiresAt: number }

export class OAuthStateStore {
  private readonly records = new Map<string, StateRecord>()

  constructor(private readonly ttlMs = 5 * 60_000, private readonly now = () => Date.now()) {}

  issue(userId: string, creatorClashAccessToken: string, returnOrigin: string) {
    this.prune()
    const state = randomBytes(32).toString('base64url')
    this.records.set(state, { userId, creatorClashAccessToken, returnOrigin, expiresAt: this.now() + this.ttlMs })
    return state
  }

  consume(state: string): StateRecord | null {
    const record = this.records.get(state)
    this.records.delete(state)
    if (!record || record.expiresAt <= this.now()) return null
    return record
  }

  private prune() {
    const now = this.now()
    for (const [state, record] of this.records) {
      if (record.expiresAt <= now) this.records.delete(state)
    }
  }
}
