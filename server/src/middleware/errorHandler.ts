import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({ error: 'Database error occurred' });
  }

  // Validation errors
  if (err.message.includes('validation') || err.message.includes('invalid')) {
    return res.status(400).json({ error: err.message });
  }

  // Default error
  res.status(500).json({ 
    error: err.message || 'Internal server error' 
  });
};

