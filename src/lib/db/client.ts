import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function getDB() {
  const { env } = await getCloudflareContext({ async: true })
  
  if (!env.DB) {
    const errorMsg = 'D1 database binding not available. Ensure "DB" is configured in wrangler.jsonc and migrations have been applied.'
    console.error('[DB Client] Error: ' + errorMsg)
    throw new Error(errorMsg)
  }

  // Diagnostic logging for build-time issues
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.debug('[DB Client] D1 connection established')
  }
  
  return env.DB
}
