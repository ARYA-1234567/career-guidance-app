# Deployment Guide: Career Guidance System

This guide will help you host your backend on **Render**, your frontend on **Vercel**, and your database on **Neon Tech**.

## 1. Database Setup (Neon Tech)
1. Go to [Neon.tech](https://neon.tech/) and create a new project.
2. Create a database (e.g., `career_guidance`).
3. Copy the **Connection String** (it should look like `postgresql://user:password@hostname/dbname`).

## 2. Backend Setup (Render)
1. Go to [Render.com](https://render.com/) and create a new **Web Service**.
2. Connect your GitHub repository.
3. **Environment**: Select `Docker`.
4. **Plan**: Select the Free or Starter plan.
5. In the **Environment** section, add the following variables:

| Key | Value | Note |
|-----|-------|------|
| `DATABASE_URL` | *Your Neon Connection String* | Ensure it starts with `postgresql://` |
| `GEMINI_API_KEY` | *Your Gemini Key* | |
| `GROQ_API_KEY` | *Your Groq Key* | |
| `TAVILY_API_KEY` | *Your Tavily Key* | |
| `SARVAM_API_KEY` | *Your Sarvam Key* | |
| `FAL_KEY` | *Your FAL Key* | |
| `SECRET_KEY` | *Any long random string* | Used for JWT security |
| `CORS_ORIGINS` | `https://your-frontend-url.vercel.app` | Add this **after** you deploy the frontend |
| `PYTHONPATH` | `/app/backend` | Required for Docker |

## 3. Frontend Setup (Vercel)
1. Go to [Vercel.com](https://vercel.com/) and create a new project.
2. Connect your GitHub repository.
3. **Framework Preset**: select `Vite` (it should auto-detect).
4. **Root Directory**: Select `frontend`.
5. In the **Environment Variables** section, add:

| Key | Value | Note |
|-----|-------|------|
| `VITE_API_URL` | *Your Render Service URL* | e.g., `https://career-guidance-api.onrender.com` |

## 4. Final Steps
1. Once both are deployed, copy the Vercel URL.
2. Go back to Render settings and update `CORS_ORIGINS` with the Vercel URL.
3. The backend will automatically create the database tables on its first run!
