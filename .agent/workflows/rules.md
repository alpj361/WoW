---
description: project rules and conventions for WoW
---

# Project Rules

## Architecture

### Backend (WoWBack)
- **Location**: `/Users/pj/Desktop/WoWBack`
- **Runtime**: Node.js 20 (Alpine Docker)
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Docker with docker-compose
- **Port**: 3001

### Frontend (Wow)  
- **Location**: `/Users/pj/Desktop/Wow/frontend`
- **Framework**: React Native with Expo
- **Router**: Expo Router (file-based)
- **State**: Zustand stores
- **API**: Axios to backend

---

## Development

### Running Backend Locally
```bash
cd /Users/pj/Desktop/WoWBack/event-analyzer
npm install
cp .env.example .env  # Configure your keys
npm run dev
```

### Running with Docker
```bash
cd /Users/pj/Desktop/WoWBack/event-analyzer
docker-compose up -d --build
```

### Running Frontend
```bash
cd /Users/pj/Desktop/Wow/frontend
npm install
npx expo start
```

---

## Environment Variables

### Backend (.env)
```
SUPABASE_URL=https://dyvchjqtwhadgybwmbjl.supabase.co
SUPABASE_SERVICE_KEY=<service_role key from Supabase>
OPENAI_API_KEY=sk-...
PORT=3001
```

### Frontend
- API URL configured in `src/services/api.ts`
- __DEV__ flag switches between localhost and production

---

## Conventions

1. **Always update CHANGELOG.md** after changes (see /changelog workflow)
2. **Commit messages**: Use conventional commits (`feat:`, `fix:`, `chore:`)
3. **Push to git** after completing features
4. **Backend runs in Docker** on VPS
5. **Supabase** is the only database (MongoDB disabled)

---

## Supabase Project

- **Name**: WoW DataBase
- **ID**: `dyvchjqtwhadgybwmbjl`
- **Region**: us-east-1
- **Dashboard**: https://supabase.com/dashboard/project/dyvchjqtwhadgybwmbjl
