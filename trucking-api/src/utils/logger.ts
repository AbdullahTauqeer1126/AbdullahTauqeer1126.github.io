import fs from 'fs'
import path from 'path'

interface LogEntry {
  level: string
  message: string
  timestamp: string
  data?: any
}

class Logger {
  private logsDir: string

  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs')
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true })
    }
  }

  private logToFile(entry: LogEntry) {
    try {
      const date = new Date()
      const dateString = date.toISOString().split('T')[0]
      const filePath = path.join(this.logsDir, `${dateString}.log`)
      
      const logMessage = `[${entry.timestamp}] [${entry.level}] ${entry.message}${
        entry.data ? '\n' + JSON.stringify(entry.data, null, 2) : ''
      }\n`
      
      fs.appendFileSync(filePath, logMessage)
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  private formatMessage(level: string, icon: string, message: string): string {
    return `${icon} [${new Date().toISOString()}] ${message}`
  }

  info(message: string, data?: any) {
    const entry = {
      level: 'INFO',
      message,
      timestamp: new Date().toISOString(),
      data,
    }
    console.log(this.formatMessage('INFO', '✅', message), data || '')
    this.logToFile(entry)
  }

  error(message: string, error?: any) {
    const entry = {
      level: 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      data: error,
    }
    console.error(this.formatMessage('ERROR', '❌', message), error || '')
    this.logToFile(entry)
  }

  warn(message: string, data?: any) {
    const entry = {
      level: 'WARN',
      message,
      timestamp: new Date().toISOString(),
      data,
    }
    console.warn(this.formatMessage('WARN', '⚠️', message), data || '')
    this.logToFile(entry)
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      const entry = {
        level: 'DEBUG',
        message,
        timestamp: new Date().toISOString(),
        data,
      }
      console.log(this.formatMessage('DEBUG', '🔍', message), data || '')
      this.logToFile(entry)
    }
  }

  http(method: string, path: string, status: number, responseTime: number) {
    const message = `${method} ${path} - ${status} (${responseTime}ms)`
    const entry = {
      level: 'HTTP',
      message,
      timestamp: new Date().toISOString(),
    }
    console.log(`📡 ${message}`)
    this.logToFile(entry)
  }
}

export const logger = new Logger()
