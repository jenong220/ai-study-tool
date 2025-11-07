import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

// Get all courses for user
router.get('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const courses = await prisma.course.findMany({
      where: {
        userId: authReq.userId!,
        archived: false,
      },
      include: {
        _count: {
          select: {
            materials: true,
            quizzes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(courses);
  } catch (error) {
    next(error as Error);
  }
});

// Create course
router.post('/', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { name, description, color, icon } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Course name is required' });
      return;
    }

    // Check course limit (15)
    const courseCount = await prisma.course.count({
      where: {
        userId: authReq.userId!,
        archived: false,
      },
    });

    if (courseCount >= 15) {
      res.status(400).json({ error: 'Maximum of 15 courses allowed' });
      return;
    }

    const course = await prisma.course.create({
      data: {
        userId: authReq.userId!,
        name,
        description,
        color: color || '#3B82F6',
        icon,
      },
    });

    res.status(201).json(course);
  } catch (error) {
    next(error as Error);
  }
});

// Get course by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const course = await prisma.course.findFirst({
      where: {
        id: req.params.id,
        userId: authReq.userId!,
      },
      include: {
        materials: {
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        _count: {
          select: {
            quizzes: true,
          },
        },
      },
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    res.json(course);
  } catch (error) {
    next(error as Error);
  }
});

// Update course
router.put('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { name, description, color, icon, archived } = req.body;

    const course = await prisma.course.findFirst({
      where: {
        id: req.params.id,
        userId: authReq.userId!,
      },
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const updated = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(color && { color }),
        ...(icon !== undefined && { icon }),
        ...(archived !== undefined && { archived }),
      },
    });

    res.json(updated);
  } catch (error) {
    next(error as Error);
  }
});

// Delete course
router.delete('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const course = await prisma.course.findFirst({
      where: {
        id: req.params.id,
        userId: authReq.userId!,
      },
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    await prisma.course.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    next(error as Error);
  }
});

export default router;

