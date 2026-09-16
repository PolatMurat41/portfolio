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
| `ADMIN_PASSWORD_HASH` | `node scripts/hash-password.mjs <your-password>` |

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
