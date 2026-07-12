# Next.js Full-Stack Auth Boilerplate

This is a production-ready authentication boilerplate built with Next.js (App Router), TypeScript, and custom JWT authentication.

## Features

- **Custom JWT Auth**: Secure session management using HTTP-only cookies (no external providers).
- **Role-Based Access Control (RBAC)**: `USER` and `ADMIN` roles with middleware protection.
- **Prisma ORM**: Type-safe database access with Neon PostgreSQL.
- **Email Flow**: Forgot password and reset password functionality using Nodemailer.
- **Form Handling**: React Hook Form with Zod validation.
- **Modern UI**: Clean, responsive design using Tailwind CSS and Lucide icons.
- **Toast Notifications**: Built-in notifications for user feedback.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Auth**: custom JWT (using `jose`)
- **Validation**: Zod
- **Forms**: React Hook Form
- **API**: Axios

## Folder Structure

```text
src/
├── app/                  # App Router pages and API routes
│   ├── (auth)/           # Auth-related pages (Signin, Signup, etc.)
│   ├── admin/            # Admin dashboard (protected)
│   ├── dashboard/        # User dashboard (protected)
│   ├── api/              # API Route Handlers
│   └── layout.tsx        # Root layout with Navbar and Toaster
├── components/           # Reusable UI components
├── lib/                  # Utility functions (Auth, Prisma, Mail)
└── middleware.ts         # Route protection and RBAC
prisma/                   # Database schema and seed scripts
```

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory and add your credentials (refer to `.env.example`):

```env
DATABASE_URL="your-neon-postgres-url"
JWT_SECRET="your-secure-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yourdomain.com"
```

### 2. Install Dependencies

Run the following command to install all necessary packages:

```bash
npm install @prisma/client axios bcrypt clsx jose lucide-react nodemailer react-hook-form react-hot-toast tailwind-merge zod @hookform/resolvers
npm install -D prisma typescript @types/node @types/react @types/react-dom @types/bcrypt @types/nodemailer ts-node
```

### 3. Database Setup

Initialize Prisma and push the schema to your Neon database:

```bash
npx prisma generate
npx prisma db push
```

### 4. Seed Admin User

Create the initial admin user:

```bash
npx prisma db seed
```

Default Admin Credentials:
- **Email**: `admin@example.com`
- **Password**: `adminpassword123`

### 5. Run Locally

Start the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application in action.

## Key Utility Functions

Located in `src/lib/auth.ts`:
- `getCurrentUser()`: Get the current authenticated user on the server.
- `requireAuth()`: Throw an error if the user is not authenticated.
- `requireAdmin()`: Throw an error if the user is not an admin.
