import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
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
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {
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
router.get('/:courseId/materials', async (req: AuthRequest, res, next) => {
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
router.post('/:courseId/materials/upload', upload.single('file'), async (req: AuthRequest, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Verify course belongs to user
    const course = await prisma.course.findFirst({
      where: {
        id: req.params.courseId,
        userId: req.userId!,
      },
    });

    if (!course) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Course not found' });
    }

    // Check material limit (50 per user)
    const materialCount = await prisma.material.count({
      where: {
        course: {
          userId: req.userId!,
        },
      },
    });

    if (materialCount >= 50) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Maximum of 50 materials allowed' });
    }

    // Extract text based on file type
    let contentText = '';
    const ext = path.extname(req.file.originalname).toLowerCase();

    try {
      if (ext === '.pdf') {
        contentText = await extractTextFromPDF(req.file.path);
      } else if (ext === '.docx') {
        contentText = await extractTextFromDOCX(req.file.path);
      }

      const wordCount = contentText.split(/\s+/).filter(word => word.length > 0).length;

      const material = await prisma.material.create({
        data: {
          courseId: req.params.courseId,
          type: ext === '.pdf' ? 'PDF' : 'DOCX',
          name: req.body.name || req.file.originalname,
          originalFilename: req.file.originalname,
          storagePath: req.file.path,
          contentText,
          wordCount,
          fileSize: req.file.size,
          customTags: null, // Initialize as null for SQLite
          metadata: null, // Initialize as null for SQLite
        },
      });

      res.status(201).json(material);
    } catch (parseError: any) {
      fs.unlinkSync(req.file.path);
      console.error('File parsing error:', parseError);
      return res.status(500).json({ 
        error: `Failed to extract text from file: ${parseError.message || 'Unknown error'}` 
      });
    }
  } catch (error: any) {
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size exceeds 10MB limit' });
    }
    if (error.message && error.message.includes('Only PDF and DOCX')) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Upload error:', error);
    next(error as Error);
  }
});

// Add URL material
router.post('/:courseId/materials/url', async (req: AuthRequest, res, next) => {
  try {
    const { url, name } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
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

    // Check material limit
    const materialCount = await prisma.material.count({
      where: {
        course: {
          userId: req.userId!,
        },
      },
    });

    if (materialCount >= 50) {
      return res.status(400).json({ error: 'Maximum of 50 materials allowed' });
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
router.put('/materials/:id', async (req: AuthRequest, res, next) => {
  try {
    const { name, priority, customTags } = req.body;

    const material = await prisma.material.findFirst({
      where: {
        id: req.params.id,
        course: {
          userId: req.userId!,
        },
      },
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
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
router.delete('/materials/:id', async (req: AuthRequest, res, next) => {
  try {
    const material = await prisma.material.findFirst({
      where: {
        id: req.params.id,
        course: {
          userId: req.userId!,
        },
      },
    });

    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
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

