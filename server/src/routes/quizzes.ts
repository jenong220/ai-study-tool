import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { createQuiz, submitQuizAnswers } from '../services/quiz.service';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

// Get all quizzes for a course
router.get('/:courseId/quizzes', async (req: AuthRequest, res, next) => {
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

    const quizzes = await prisma.quiz.findMany({
      where: {
        courseId: req.params.courseId,
        userId: req.userId!,
      },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse JSON strings for SQLite compatibility
    const parsedQuizzes = quizzes.map((quiz: any) => ({
      ...quiz,
      materialIds: quiz.materialIds ? JSON.parse(quiz.materialIds) : [],
    }));

    res.json(parsedQuizzes);
  } catch (error) {
    next(error as Error);
  }
});

// Generate quiz
router.post('/:courseId/quizzes/generate', async (req: AuthRequest, res, next) => {
  try {
    const { quizType, difficulty, questionCount, topicFocus, materialIds } = req.body;

    // Validate input
    if (!quizType || !difficulty || !questionCount) {
      return res.status(400).json({ error: 'quizType, difficulty, and questionCount are required' });
    }

    if (questionCount < 5 || questionCount > 25) {
      return res.status(400).json({ error: 'questionCount must be between 5 and 25' });
    }

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

    // Create quiz
    const { quiz, questions } = await createQuiz(
      req.params.courseId,
      req.userId!,
      quizType,
      difficulty,
      questionCount,
      topicFocus,
      materialIds
    );

    res.status(201).json({ quiz, questions });
  } catch (error: any) {
    console.error('Quiz generation error:', error);
    // Return more specific error messages
    if (error.message?.includes('No materials')) {
      return res.status(400).json({ error: 'No materials found. Please upload materials to your course first.' });
    }
    if (error.message?.includes('No content')) {
      return res.status(400).json({ error: 'Materials have no extractable content. Please ensure your PDF/DOCX files contain text.' });
    }
    if (error.message?.includes('API key')) {
      return res.status(500).json({ error: error.message });
    }
    next(error as Error);
  }
});

// Get quiz by ID
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
      include: {
        questions: {
          orderBy: {
            id: 'asc',
          },
        },
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Parse JSON strings for SQLite compatibility
    const parsedQuiz = {
      ...quiz,
      materialIds: quiz.materialIds ? JSON.parse(quiz.materialIds) : [],
      questions: quiz.questions.map((q: any) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : [],
      })),
    };

    res.json(parsedQuiz);
  } catch (error) {
    next(error as Error);
  }
});

// Submit quiz answers
router.post('/:id/submit', async (req: AuthRequest, res, next) => {
  try {
    const { answers, timeSpent } = req.body;

    if (!answers || typeof timeSpent !== 'number') {
      return res.status(400).json({ error: 'answers and timeSpent are required' });
    }

    const result = await submitQuizAnswers(
      req.params.id,
      req.userId!,
      answers,
      timeSpent
    );

    res.json(result);
  } catch (error) {
    next(error as Error);
  }
});

// Get quiz results
router.get('/:id/results', async (req: AuthRequest, res, next) => {
  try {
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: req.params.id,
        userId: req.userId!,
      },
      include: {
        questions: {
          orderBy: {
            id: 'asc',
          },
        },
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Parse JSON strings for SQLite compatibility
    const parsedQuiz = {
      ...quiz,
      materialIds: quiz.materialIds ? JSON.parse(quiz.materialIds) : [],
      questions: quiz.questions.map((q: any) => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : [],
      })),
    };

    res.json(parsedQuiz);
  } catch (error) {
    next(error as Error);
  }
});

export default router;

