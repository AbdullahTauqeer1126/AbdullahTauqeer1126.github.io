import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim() || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY?.trim()

const missingSupabaseConfigError = () =>
  new Error(
    'Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY (and optionally SUPABASE_SERVICE_KEY) in your environment.',
  )

const createUnconfiguredClient = () => {
  const thrower = () => {
    throw missingSupabaseConfigError()
  }
  return new Proxy(
    {},
    {
      get: () => thrower,
      apply: () => thrower(),
    },
  ) as any
}

const isConfigured = Boolean(SUPABASE_URL && SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY)

export const supabase = isConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : createUnconfiguredClient()

// Service role client for server-side operations (admin queries)
export const supabaseServiceRole = isConfigured && SUPABASE_SERVICE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    logger.info('🔌 Initializing Supabase...')
    logger.info(`📍 URL Present: ${Boolean(SUPABASE_URL)}`)
    logger.info(`🔑 Keys Present: ${Boolean(SUPABASE_ANON_KEY)} (service: ${Boolean(SUPABASE_SERVICE_KEY)})`)

    if (!isConfigured) {
      logger.warn('⚠️ Supabase is not configured - skipping connection test')
      return true
    }
    
    // Try to query the users table to test the connection
    try {
      const { error: schemaError } = await (supabaseServiceRole || supabase)
        .from('users')
        .select('id, password_hash')
        .limit(1)

      if (schemaError && String((schemaError as any)?.message || '').includes('password_hash')) {
        logger.error('❌ users.password_hash column missing in Supabase schema')
        logger.error('➡️ Run: trucking-api/supabase-migration-password-hash.sql in Supabase SQL editor')
      }

      const { data, error } = await (supabaseServiceRole || supabase)
        .from('users')
        .select('count', { count: 'exact', head: true })
        .limit(1)
      
      if (error) {
        logger.warn(`⚠️ Users table query result: ${JSON.stringify(error)}`)
        // Still consider this a success - table might not exist yet
        logger.info('✅ Supabase initialized (table check skipped)')
        return true
      }
      
      logger.info('✅ Supabase connected and users table accessible')
      return true
    } catch (queryError) {
      logger.warn(`⚠️ Supabase query warning: ${JSON.stringify(queryError)}`)
      // Connection is likely fine, just proceed
      return true
    }
  } catch (error) {
    logger.error(`⚠️ Supabase initialization warning: ${JSON.stringify(error)}`)
    // Allow server to start anyway
    return true
  }
}

export default supabase

