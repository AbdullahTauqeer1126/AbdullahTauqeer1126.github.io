import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

// Validation middleware factory
export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body)
      ;(req as any).validatedData = validated
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors,
        })
      }
      return res.status(500).json({
        success: false,
        message: 'Validation failed',
      })
    }
  }
}

// Validation helper for controllers
export const validateData = async <T>(
  schema: ZodSchema,
  data: unknown
): Promise<T> => {
  return (await schema.parseAsync(data)) as T
}
