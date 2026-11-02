/** Generate the local demo schedule at interaction time rather than render time. */
export function getDemoStartTime(): string {
  return new Date(Date.now() + 60 * 60 * 1000).toISOString()
}
