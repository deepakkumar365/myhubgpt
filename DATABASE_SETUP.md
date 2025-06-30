# Database Setup Guide

This application uses PostgreSQL with Drizzle ORM. Follow these steps to set up the database:

## Prerequisites

1. **PostgreSQL Database**: You need a PostgreSQL database. You can use:
   - Local PostgreSQL installation
   - [Supabase](https://supabase.com/) (free tier available)
   - [Neon](https://neon.tech/) (free tier available)
   - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

## Setup Steps

### 1. Environment Variables

Create a `.env.local` file in the root directory with:

```env
POSTGRES_URL="postgresql://username:password@host:port/database"
OPENAI_API_KEY="your-openai-api-key"
```

Replace the connection string with your actual database credentials.

### 2. Install Dependencies

```bash
npm install
```

### 3. Generate Database Migrations

```bash
npm run db:generate
```

### 4. Run Migrations

```bash
npm run db:migrate
```

### 5. (Optional) Open Database Studio

```bash
npm run db:studio
```

## Troubleshooting

### Common Issues

1. **"Failed to get chat by id" Error**
   - This usually means the database tables haven't been created yet
   - Run the migration steps above
   - Check that your `POSTGRES_URL` is correct

2. **Connection Issues**
   - Verify your database is running
   - Check the connection string format
   - Ensure the database exists

3. **Permission Issues**
   - Make sure the database user has CREATE, INSERT, SELECT, UPDATE, DELETE permissions

### Database Schema

The application creates these tables:
- `User` - User accounts
- `Chat` - Chat conversations
- `Message_v2` - Chat messages
- `Vote_v2` - Message votes
- `Document` - Documents
- `Suggestion` - Document suggestions
- `Stream` - Stream data

## Development

- Use `npm run db:studio` to view and edit data
- After schema changes, run `npm run db:generate` then `npm run db:migrate`