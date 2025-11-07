# Setup Guide

## Prerequisites

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Anthropic API Key** - Get from [Anthropic Console](https://console.anthropic.com/)

**Note:** This app uses SQLite (file-based database) - no database server installation required!

## Quick Start

### 1. Install Dependencies

```bash
# Install client dependencies
cd client
npm install

# Install Shadcn/ui components (optional - basic components are already included)
# npx shadcn-ui@latest init
# npx shadcn-ui@latest add button card input label select textarea dialog dropdown-menu badge progress slider tabs

# Install server dependencies
cd ../server
npm install
```

### 2. Setup Database

```bash
# SQLite database will be created automatically
# Just run migrations to create the database file
cd server
npx prisma migrate dev --name init
npx prisma generate
```

The database file (`dev.db`) will be created in the `server/prisma` directory automatically.

### 3. Configure Environment Variables

Create `server/.env` file:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="24h"
ANTHROPIC_API_KEY="your-anthropic-api-key"
PORT=3001
NODE_ENV=development
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
CLIENT_URL=http://localhost:5173
```

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## First Steps

1. Register a new account at http://localhost:5173/register
2. Create your first course
3. Upload a PDF, DOCX, or add a URL
4. Generate a quiz
5. Take the quiz and view results!

## Troubleshooting

### Database Connection Issues
- SQLite database file is created automatically in `server/prisma/dev.db`
- If you get database errors, delete `server/prisma/dev.db` and run `npx prisma migrate dev` again
- Verify DATABASE_URL in server/.env is set to `file:./dev.db`

### Port Already in Use
- Change PORT in server/.env
- Update CLIENT_URL accordingly

### Claude API Errors
- Verify ANTHROPIC_API_KEY is correct
- Check API quota/limits
- Ensure you have credits in your Anthropic account

### File Upload Issues
- Ensure `uploads` directory exists in server root
- Check file size limits (10MB max)
- Verify file types (PDF, DOCX only)

### CORS Errors
- Ensure CLIENT_URL in server/.env matches frontend URL
- Check that backend is running before starting frontend

## Project Structure

```
study-tool-app/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/        # Route pages
│   │   ├── stores/       # Zustand stores
│   │   ├── lib/          # Utilities & API client
│   │   └── types/        # TypeScript types
│   └── package.json
├── server/              # Express backend
│   ├── src/
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Auth & error handling
│   │   ├── services/     # Business logic
│   │   ├── utils/        # Helper functions
│   │   └── prisma/       # Database schema
│   └── package.json
└── README.md
```

## Next Steps

- Add more UI polish and animations
- Implement spaced repetition for flashcards
- Add sharing functionality
- Deploy to production (AWS, Vercel, etc.)
- Add more analytics visualizations

