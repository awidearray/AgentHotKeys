# Database Setup Instructions

## Quick Setup

1. **Go to your Supabase Dashboard**
   - Visit: https://app.supabase.com/project/qgtujogtjopmypkmbqua
   - Go to SQL Editor (left sidebar)

2. **Run the migrations in order:**

   a. First, run the initial schema (creates base tables):
   - Copy the contents of `supabase/migrations/00_initial_schema.sql`
   - Paste and run in SQL Editor

   b. Then run the licensing system:
   - Copy the contents of `supabase/migrations/20240301_licensing_system.sql`
   - Paste and run in SQL Editor

   c. Finally run the moderation system:
   - Copy the contents of `supabase/migrations/20240302_moderation_system.sql`
   - Paste and run in SQL Editor

3. **Create a test user (optional)**
   Run this in SQL Editor to create a test user:

```sql
-- Create a test user
INSERT INTO users (email, name, role) 
VALUES ('test@example.com', 'Test User', 'human');

-- Create a test creator
INSERT INTO users (email, name, role) 
VALUES ('creator@example.com', 'Test Creator', 'creator');

-- Create some test hotkeys
INSERT INTO hotkeys (title, description, price, creator_id, is_published, category)
SELECT 
  'VS Code Productivity Pack',
  'Essential hotkeys for VS Code power users',
  25.00,
  id,
  true,
  'productivity'
FROM users WHERE email = 'creator@example.com';

INSERT INTO hotkeys (title, description, price, creator_id, is_published, category)
SELECT 
  'React Development Essentials',
  'Hotkeys optimized for React development',
  35.00,
  id,
  true,
  'web-development'
FROM users WHERE email = 'creator@example.com';
```

4. **Restart your development server**
```bash
# Kill the current dev server (Ctrl+C) and restart:
npm run dev
```

## Verify Setup

Visit http://localhost:3000/dashboard - you should now see:
- Real data loading (no more "Database unavailable" warning)
- The dashboard will show 0 for all stats initially (unless you added test data)
- You can now create real accounts and data will persist

## Troubleshooting

If you see connection errors:
1. Check that your Supabase project is active (not paused)
2. Verify the environment variables are correct
3. Make sure you ran all migrations in order
4. Check Supabase Dashboard → Settings → API to ensure your keys match

## Production (Railway)

For Railway, the database should automatically connect since you've set the environment variables there. The app will use the same Supabase instance for both local and production.