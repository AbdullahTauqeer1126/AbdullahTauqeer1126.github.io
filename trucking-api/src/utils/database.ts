import { testSupabaseConnection } from './supabase'
import { logger } from './logger'

export const AppDataSource = { isInitialized: true } as any

export const initializeDatabase = async () => {
  try {
    const connected = await testSupabaseConnection()
    if (connected) {
      logger.info('✅ Connected to Supabase PostgreSQL database')
      return AppDataSource
    } else {
      logger.warn('⚠️ Supabase connection failed - running with limited functionality')
      return AppDataSource
    }
  } catch (error) {
    logger.error('Database initialization error:', error)
    throw error
  }
}

export const getRepository = <T>(entity: new () => T) => {
  return {} as any
}
