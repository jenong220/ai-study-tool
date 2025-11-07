# AI Study Tool App

A web-based study tool application that helps students create AI-generated quizzes from their course materials.

## Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite
- React Router v6
- Zustand
- Shadcn/ui with Tailwind CSS
- React Hook Form with Zod
- Axios

### Backend
- Node.js with TypeScript
- Express.js
- SQLite (file-based database - no server needed!)
- Prisma ORM
- JWT Authentication
- Claude API for quiz generation

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Setup Steps

1. **Install client dependencies:**
```bash
cd client
npm install
npm install react-router-dom zustand axios react-hook-form zod @hookform/resolvers
npm install react-dropzone recharts
npm install -D tailwindcss postcss autoprefixer
npm install -D @types/node

# Install Shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label select textarea dialog dropdown-menu badge progress slider tabs
```

2. **Install server dependencies:**
```bash
cd server
npm install
npm install express cors dotenv bcrypt jsonwebtoken multer
npm install axios cheerio pdf-parse mammoth
npm install @anthropic-ai/sdk openai
npm install @prisma/client
npm install -D typescript @types/express @types/node @types/bcrypt @types/jsonwebtoken @types/multer @types/cors
npm install -D prisma ts-node nodemon
```

3. **Configure environment:**
```bash
# Copy .env.example to .env in root and server directories
cp .env.example .env
cp .env.example server/.env

# Update DATABASE_URL to "file:./dev.db" (SQLite - no server needed!)
# Add your ANTHROPIC_API_KEY
```

4. **Setup database:**
```bash
cd server
npx prisma migrate dev --name init
npx prisma generate
# SQLite database file (dev.db) will be created automatically
```

5. **Start development servers:**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## Features

- ✅ User authentication (JWT)
- ✅ Course management (max 15 courses)
- ✅ Material upload (PDF, DOCX, URL)
- ✅ AI-powered quiz generation
- ✅ Multiple choice quizzes
- ✅ Flashcard quizzes
- ✅ Quiz results and analytics

## Project Structure

```
study-tool-app/
├── client/          # React frontend
├── server/          # Express backend
├── .env.example     # Environment variables template
└── README.md        # This file
```

## API Endpoints

### Authentication
- POST /api/auth/register
- POST /api/auth/login

### Courses
- GET /api/courses
- POST /api/courses
- GET /api/courses/:id
- PUT /api/courses/:id
- DELETE /api/courses/:id

### Materials
- GET /api/courses/:id/materials
- POST /api/courses/:id/materials/upload
- POST /api/courses/:id/materials/url
- PUT /api/materials/:id
- DELETE /api/materials/:id

### Quizzes
- POST /api/courses/:id/quizzes/generate
- GET /api/quizzes/:id
- POST /api/quizzes/:id/submit
- GET /api/quizzes/:id/results

## Development

The app runs on:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## License

MIT

