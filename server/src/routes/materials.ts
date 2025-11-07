import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { extractTextFromPDF } from '../utils/pdfParser';
import { extractTextFromDOCX } from '../utils/docxParser';
import { scrapeWebContent } from '../utils/webScraper';

const router = Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

// Configure multer for file uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = ['.pdf', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOCX files are allowed'));
    }
  },
});

// Get all materials for a course
router.get('/:courseId/materials', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    // Verify course belongs to user
    const course = await prisma.course.findFirst({
      where: {
        id: req.params.courseId,
        userId: authReq.userId!,
      },
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const materials = await prisma.material.findMany({
      where: {
        courseId: req.params.courseId,
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    });

    res.json(materials);
  } catch (error) {
    next(error as Error);
  }
});

// Upload file material
router.post('/:courseId/materials/upload', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    if (!authReq.file) {
      res.status(400).json({ error: 'File is required' });
      return;
    }

    // Verify course belongs to user
    const course = await prisma.course.findFirst({
      where: {
        id: req.params.courseId,
        userId: authReq.userId!,
      },
    });

    if (!course) {
      // Clean up uploaded file
      fs.unlinkSync(authReq.file.path);
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check material limit (50 per user)
    const materialCount = await prisma.material.count({
      where: {
        course: {
          userId: authReq.userId!,
        },
      },
    });

    if (materialCount >= 50) {
      fs.unlinkSync(authReq.file.path);
      res.status(400).json({ error: 'Maximum of 50 materials allowed' });
      return;
    }

    // Extract text based on file type
    let contentText = '';
    const ext = path.extname(authReq.file.originalname).toLowerCase();

    try {
      if (ext === '.pdf') {
        contentText = await extractTextFromPDF(authReq.file.path);
      } else if (ext === '.docx') {
        contentText = await extractTextFromDOCX(authReq.file.path);
      }

      const wordCount = contentText.split(/\s+/).filter(word => word.length > 0).length;

      const material = await prisma.material.create({
        data: {
          courseId: req.params.courseId,
          type: ext === '.pdf' ? 'PDF' : 'DOCX',
          name: req.body.name || authReq.file.originalname,
          originalFilename: authReq.file.originalname,
          storagePath: authReq.file.path,
          contentText,
          wordCount,
          fileSize: authReq.file.size,
          customTags: null, // Initialize as null for SQLite
          metadata: null, // Initialize as null for SQLite
        },
      });

      res.status(201).json(material);
    } catch (parseError: any) {
      fs.unlinkSync(authReq.file.path);
      console.error('File parsing error:', parseError);
      res.status(500).json({ 
        error: `Failed to extract text from file: ${parseError.message || 'Unknown error'}` 
      });
      return;
    }
  } catch (error: any) {
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'File size exceeds 10MB limit' });
      return;
    }
    if (error.message && error.message.includes('Only PDF and DOCX')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Upload error:', error);
    next(error as Error);
  }
});

// Add URL material
router.post('/:courseId/materials/url', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { url, name } = req.body;

    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    // Verify course belongs to user
    const course = await prisma.course.findFirst({
      where: {
        id: req.params.courseId,
        userId: authReq.userId!,
      },
    });

    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Check material limit
    const materialCount = await prisma.material.count({
      where: {
        course: {
          userId: authReq.userId!,
        },
      },
    });

    if (materialCount >= 50) {
      res.status(400).json({ error: 'Maximum of 50 materials allowed' });
      return;
    }

    // Scrape content
    const contentText = await scrapeWebContent(url);
    const wordCount = contentText.split(/\s+/).filter(word => word.length > 0).length;

    const material = await prisma.material.create({
      data: {
        courseId: req.params.courseId,
        type: 'URL',
        name: name || url,
        url,
        contentText,
        wordCount,
        lastScrapedAt: new Date(),
      },
    });

    res.status(201).json(material);
  } catch (error) {
    next(error as Error);
  }
});

// Update material
router.put('/materials/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const { name, priority, customTags } = req.body;

    const material = await prisma.material.findFirst({
      where: {
        id: req.params.id,
        course: {
          userId: authReq.userId!,
        },
      },
    });

    if (!material) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }

    const updated = await prisma.material.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(priority && { priority }),
        ...(customTags !== undefined && { customTags }),
      },
    });

    res.json(updated);
  } catch (error) {
    next(error as Error);
  }
});

// Delete material
router.delete('/materials/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const material = await prisma.material.findFirst({
      where: {
        id: req.params.id,
        course: {
          userId: authReq.userId!,
        },
      },
    });

    if (!material) {
      res.status(404).json({ error: 'Material not found' });
      return;
    }

    // Delete file if it exists
    if (material.storagePath && fs.existsSync(material.storagePath)) {
      fs.unlinkSync(material.storagePath);
    }

    await prisma.material.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    next(error as Error);
  }
});

export default router;

