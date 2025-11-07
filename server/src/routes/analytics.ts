import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

// Get analytics for a course
router.get('/courses/:courseId', async (req: AuthRequest, res, next) => {
  try {
    // Verify course belongs to user
    const course = await prisma.course.findFirst({
      where: {
        id: req.params.courseId,
        userId: req.userId!,
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Get analytics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await prisma.analytics.findMany({
      where: {
        courseId: req.params.courseId,
        userId: req.userId!,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    res.json(analytics);
  } catch (error) {
    next(error as Error);
  }
});

// Get user-wide analytics
router.get('/summary', async (req: AuthRequest, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await prisma.analytics.findMany({
      where: {
        userId: req.userId!,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Aggregate totals
    const totals = analytics.reduce(
      (acc: any, curr: any) => ({
        questionsAnswered: acc.questionsAnswered + curr.questionsAnswered,
        correctAnswers: acc.correctAnswers + curr.correctAnswers,
        quizAttempts: acc.quizAttempts + curr.quizAttempts,
        studyTimeSeconds: acc.studyTimeSeconds + curr.studyTimeSeconds,
      }),
      {
        questionsAnswered: 0,
        correctAnswers: 0,
        quizAttempts: 0,
        studyTimeSeconds: 0,
      }
    );

    res.json({
      totals,
      daily: analytics,
    });
  } catch (error) {
    next(error as Error);
  }
});

export default router;

