<div align="center">
<img alt="Portfolio" src="https://github.com/dillionverma/portfolio/assets/16860528/57ffca81-3f0a-4425-b31d-094f61725455" width="90%">
</div>

# Portfolio [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdillionverma%2Fportfolio)

Built with next.js, [shadcn/ui](https://ui.shadcn.com/), and [magic ui](https://magicui.design/), deployed on Vercel.

# Features

- All content (blog posts, resume/profile data) is managed through a built-in, password-protected [admin panel](#admin-panel) — no code changes or redeploys needed
- Built using Next.js 14, React, Typescript, Shadcn/UI, TailwindCSS, Framer Motion, Magic UI
- Includes a blog
- Responsive for different devices
- Optimized for Next.js and Vercel

# Getting Started Locally

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/dillionverma/portfolio
   ```

2. Move to the cloned directory

   ```bash
   cd portfolio
   ```

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Start the local Server:

   ```bash
   pnpm dev
   ```

5. Set up the database and admin credentials — see [Admin Panel](#admin-panel) below, then run:

   ```bash
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

6. Open [http://localhost:3000/admin](http://localhost:3000/admin) and sign in with the password you hashed into `ADMIN_PASSWORD_HASH`

# Admin Panel

Blog posts and all resume/profile data (work experience, education, skills, projects, hackathons, contact links) are managed at `/admin`, backed by Postgres via Prisma.

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | How to get it |
| --- | --- |
| `POSTGRES_PRISMA_URL` | From your Vercel Postgres integration (`vercel env pull .env` if the project is linked, or the Vercel dashboard's `.env.local` tab) |
| `POSTGRES_URL_NON_POOLING` | Same place as above |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_PASSWORD_HASH` | `node scripts/hash-password.mjs <your-password>` (already base64-encoded — paste the output as-is) |
| `BLOB_READ_WRITE_TOKEN` | Storage tab → Create Database → Blob → set access to **Public** → Connect Project. Needed for the admin panel's image upload button (Profile avatar). |
| `AI_API_KEY` | Optional. API key for the AI chatbot ([Anthropic Console](https://console.anthropic.com/) for Claude, or any OpenAI-compatible provider). You can instead paste the key in **/admin/chatbot**, which takes precedence. |

## AI chatbot

A floating AI assistant answers visitors' questions about you, using the portfolio data from the admin panel (profile, work, education, skills, projects, articles) as context. Manage it at **/admin/chatbot**:

- **Provider & model** — Anthropic Claude (default `claude-opus-5-5`; Sonnet 5.5 and Haiku 4.5 are one click away) or any OpenAI-compatible API (OpenAI, OpenRouter, Groq, LiteLLM, vLLM, Ollama) via a base URL.
- **API key** — stored server-side only and never sent to the browser; falls back to `AI_API_KEY`. The widget stays hidden until the bot is enabled *and* has a key.
- **System prompt** — fully editable, with `{{name}}` / `{{email}}` placeholders, a preview of the exact prompt the model receives, and a live playground that tests unsaved settings.
- **Welcome message & suggested questions** in Turkish and English.
- **Limits** — messages per visitor per hour and a site-wide daily cap, to protect your API budget.
- **Conversation logs** — every visitor conversation is viewable and deletable under *Konuşma Kayıtları*.

## Contact section

The public contact section shows only the email address (with a copy button) and the social links from the profile. There is no contact form; **/admin/messages** still lists messages received while one existed.

## First-time setup

```bash
pnpm install
pnpm prisma migrate dev
pnpm prisma db seed   # only needed once, against a fresh database
pnpm dev
```

Then open [http://localhost:3000/admin](http://localhost:3000/admin) and sign in.

# License

Licensed under the [MIT license](https://github.com/dillionverma/portfolio/blob/main/LICENSE.md).
