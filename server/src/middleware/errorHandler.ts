import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  if ('stack' in err) {
    console.error('Error stack:', err.stack);
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    console.error('Prisma error code:', prismaError.code);
    console.error('Prisma error meta:', prismaError.meta);
    
    // Check for specific Prisma errors
    if (prismaError.code === 'P2002') {
      return res.status(400).json({ error: 'A record with this value already exists' });
    }
    if (prismaError.code === 'P2025') {
      return res.status(404).json({ error: 'Record not found' });
    }
    if (prismaError.code === 'P1001' || prismaError.code === 'P1003') {
      return res.status(500).json({ error: 'Database connection failed. Please check your database configuration.' });
    }
    
    return res.status(500).json({ 
      error: 'Database error occurred',
      details: err.message,
      code: prismaError.code
    });
  }

  // Prisma client initialization errors
  if (err.name === 'PrismaClientInitializationError') {
    return res.status(500).json({ 
      error: 'Database connection failed. Please ensure the database is running and migrations have been applied.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Validation errors
  if (err.message.includes('validation') || err.message.includes('invalid')) {
    return res.status(400).json({ error: err.message });
  }

  // Default error
  res.status(500).json({ 
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? (err.stack || undefined) : undefined
  });
};

