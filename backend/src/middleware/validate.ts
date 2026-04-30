import { Request, Response, NextFunction } from 'express'
import { ZodObject, ZodError, ZodRawShape } from 'zod'

export const validate = (schema: ZodObject<ZodRawShape>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({ body: req.body })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        // group by field, take first error only
        const errors: Record<string, string> = {}
        error.issues.forEach(issue => {
          const field = issue.path[issue.path.length - 1] as string
          if (!errors[field]) {
            errors[field] = issue.message
          }
        })

        res.status(422).json({
          message: 'Validation failed',
          errors: Object.entries(errors).map(([field, message]) => ({
            field,
            message,
          })),
        })
        return
      }
      next(error)
    }
  }