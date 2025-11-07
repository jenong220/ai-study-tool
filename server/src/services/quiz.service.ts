import { PrismaClient } from '@prisma/client';
import { generateQuestions, QuizQuestion } from './llm.service';

const prisma = new PrismaClient();

export async function createQuiz(
  courseId: string,
  userId: string,
  quizType: 'FLASHCARD' | 'MULTIPLE_CHOICE',
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED',
  questionCount: number,
  topicFocus?: string,
  materialIds?: string[]
) {
  // Fetch materials
  let materials;
  if (materialIds && materialIds.length > 0) {
    materials = await prisma.material.findMany({
      where: {
        id: { in: materialIds },
        courseId,
      },
    });
  } else {
    materials = await prisma.material.findMany({
      where: {
        courseId,
      },
    });
  }

  if (materials.length === 0) {
    throw new Error('No materials found for quiz generation');
  }

  // Combine content from all materials
  const combinedContent = materials
    .map((m: any) => m.contentText || '')
    .filter((text: string) => text.length > 0)
    .join('\n\n');

  if (combinedContent.length === 0) {
    throw new Error('No content found in materials');
  }

  // Generate questions using AI
  const aiQuestions = await generateQuestions(
    combinedContent,
    questionCount,
    difficulty === 'MIXED' ? 'medium' : difficulty.toLowerCase(),
    quizType,
    topicFocus
  );

  // Create quiz
  const quiz = await prisma.quiz.create({
    data: {
      courseId,
      userId,
      quizType,
      difficulty,
      questionCount: aiQuestions.length,
      topicFocus,
      materialIds: materialIds ? JSON.stringify(materialIds) : JSON.stringify(materials.map((m: any) => m.id)),
    },
  });

  // Create questions
  const questions = await Promise.all(
    aiQuestions.map((q: QuizQuestion, index: number) =>
      prisma.question.create({
        data: {
          quizId: quiz.id,
          materialId: materials[0].id, // Use first material as primary source
          questionText: q.question,
          questionType: quizType,
          difficulty: q.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
          correctAnswer: q.correctAnswer,
          options: q.options ? JSON.stringify(q.options) : JSON.stringify([]),
          explanation: q.explanation,
          sourceReference: q.sourceReference,
        },
      })
    )
  );

  return { quiz, questions };
}

export async function submitQuizAnswers(
  quizId: string,
  userId: string,
  answers: Record<string, string>,
  timeSpent: number
) {
  // Get quiz with questions
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      userId,
    },
    include: {
      questions: true,
    },
  });

  if (!quiz) {
    throw new Error('Quiz not found');
  }

  // Allow retaking - reset completedAt and score if quiz was already completed
  const isRetake = !!quiz.completedAt;

  // Check answers and calculate score
  let correctCount = 0;
  const updatedQuestions = [];

  for (const question of quiz.questions) {
    const userAnswer = answers[question.id];
    const isCorrect = userAnswer === question.correctAnswer;

    if (isCorrect) {
      correctCount++;
    }

    const updated = await prisma.question.update({
      where: { id: question.id },
      data: {
        userAnswer,
        answeredCorrectly: isCorrect,
        attemptNumber: isRetake ? (question.attemptNumber || 0) + 1 : 1,
      },
    });

    updatedQuestions.push(updated);
  }

  const score = (correctCount / quiz.questions.length) * 100;

  // Update quiz (reset completedAt and score for retakes)
  const updatedQuiz = await prisma.quiz.update({
    where: { id: quizId },
    data: {
      completedAt: new Date(),
      score,
      timeSpent,
    },
  });

  // Update analytics
  await updateAnalytics(userId, quiz.courseId, {
    questionsAnswered: quiz.questions.length,
    correctAnswers: correctCount,
    quizAttempts: 1,
    studyTimeSeconds: timeSpent,
  });

  return { quiz: updatedQuiz, questions: updatedQuestions, score };
}

async function updateAnalytics(
  userId: string,
  courseId: string,
  data: {
    questionsAnswered: number;
    correctAnswers: number;
    quizAttempts: number;
    studyTimeSeconds: number;
  }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existing = await prisma.analytics.findUnique({
    where: {
      userId_courseId_date: {
        userId,
        courseId,
        date: today,
      },
    },
  });

  if (existing) {
    await prisma.analytics.update({
      where: { id: existing.id },
      data: {
        questionsAnswered: existing.questionsAnswered + data.questionsAnswered,
        correctAnswers: existing.correctAnswers + data.correctAnswers,
        quizAttempts: existing.quizAttempts + data.quizAttempts,
        studyTimeSeconds: existing.studyTimeSeconds + data.studyTimeSeconds,
        masteryPercentage: ((existing.correctAnswers + data.correctAnswers) / (existing.questionsAnswered + data.questionsAnswered)) * 100,
      },
    });
  } else {
    await prisma.analytics.create({
      data: {
        userId,
        courseId,
        date: today,
        questionsAnswered: data.questionsAnswered,
        correctAnswers: data.correctAnswers,
        quizAttempts: data.quizAttempts,
        studyTimeSeconds: data.studyTimeSeconds,
        masteryPercentage: (data.correctAnswers / data.questionsAnswered) * 100,
        topicsCovered: JSON.stringify([]),
      },
    });
  }
}

