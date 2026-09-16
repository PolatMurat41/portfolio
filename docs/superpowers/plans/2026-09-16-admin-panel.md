# Admin Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a password-protected `/admin` panel backed by Postgres/Prisma that lets the site owner manage blog posts and all resume/profile data without code changes or redeploys, and cut the public site over from static files (`content/*.mdx`, `src/data/resume.tsx`) to reading the same database.

**Architecture:** Next.js App Router route group `src/app/admin/(dashboard)` holds the protected admin UI, guarded by `middleware.ts` checking a custom HMAC-signed session cookie (no external session library). `src/app/api/admin/**` route handlers do CRUD via Prisma against Postgres. Public pages read the same tables through `src/lib/data.ts`. A one-time `prisma/seed.ts` migrates the existing MDX posts and `resume.tsx` data (including the previously-unspec'd `hackathons` array) into the database.

**Tech Stack:** Next.js 16.1.1 (App Router, Route Handlers, Middleware), Prisma + Vercel Postgres, bcryptjs (password hashing), Web Crypto `crypto.subtle` HMAC (session signing — no iron-session dependency), Zod (validation), react-markdown + remark-gfm + remark-code-meta + rehype-raw (blog rendering, reusing the site's existing `mdxComponents`/`CodeBlock`), `@radix-ui/react-alert-dialog` (delete confirmation), pnpm.

**Spec:** `docs/superpowers/specs/2026-09-16-admin-panel-design.md`

## Global Constraints

- Package manager is pnpm (see `pnpm-lock.yaml`); every install/run command in this plan uses `pnpm`.
- TypeScript strict mode is on (`tsconfig.json`) — no `any` beyond what's shown here.
- All UI copy, code comments, and identifiers are in English, matching the existing codebase (the public site, all current component labels and aria-labels are English; only this planning conversation is in Turkish).
- No automated test suite exists in this repo and the spec explicitly opted out of adding one (§7) — every task's verification step is a manual, described browser/CLI check instead of a test run.
- `iconKey` string fields (never store JSX/React component references in the database) resolve through the single registry built in Task 4 (`src/lib/icon-registry.ts`).
- New DB-backed reads happen only in Server Components or Route Handlers (Node.js runtime); nothing added in this plan runs on the Edge runtime.
- Follow the existing shadcn "new-york" style primitives pattern already in `src/components/ui/*` (`React.forwardRef`, `cn()` from `@/lib/utils`, Tailwind v4 tokens from `src/app/globals.css`) for every new UI primitive.
- Commit after every task using the message style already in this repo's `git log` (short imperative summary), ending with the attribution lines configured for this session.

---

## Task 1: Add dependencies and initialize Prisma

**Files:**
- Modify: `package.json`
- Create: `prisma/schema.prisma` (placeholder generator/datasource block only — models added in Task 2)

**Interfaces:**
- Produces: `prisma` CLI available via `pnpm prisma ...`; `@prisma/client`, `bcryptjs`, `zod` (already present), `@radix-ui/react-alert-dialog`, `tsx`, `rehype-raw` installed.

- [ ] **Step 1: Install runtime and dev dependencies**

Run:
```bash
pnpm add @prisma/client bcryptjs @radix-ui/react-alert-dialog rehype-raw
pnpm add -D prisma tsx @types/bcryptjs
```

- [ ] **Step 2: Initialize Prisma**

Run:
```bash
pnpm prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma` and a `.env` file (already gitignored per `.gitignore`: `.env`, `.env*.local`, `.env.*` are all ignored, `.env.example` is not).

- [ ] **Step 3: Point the datasource at Vercel Postgres env vars**

Edit `prisma/schema.prisma` so the top matches:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL_NON_POOLING")
}
```

- [ ] **Step 4: Verify**

Run: `pnpm prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀` (no models yet, but the datasource/generator block must parse).

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml prisma/schema.prisma
git commit -m "chore: add Prisma, bcryptjs, and admin panel dependencies"
```

---

## Task 2: Define the Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: Prisma models `Profile`, `SocialLink` (+ `SocialPlatform` enum), `Skill`, `WorkExperience`, `Education`, `Project`, `Hackathon`, `BlogPost` — field names/types exactly as used by every later task in this plan.

- [ ] **Step 1: Append all models to `prisma/schema.prisma`**

```prisma
model Profile {
  id           Int      @id @default(1)
  name         String
  initials     String
  url          String
  location     String
  locationLink String
  description  String
  summary      String
  avatarUrl    String
  email        String
  tel          String
  updatedAt    DateTime @updatedAt
}

enum SocialPlatform {
  GitHub
  LinkedIn
  X
  Youtube
  Email
}

model SocialLink {
  id           String         @id @default(cuid())
  platform     SocialPlatform @unique
  url          String
  showInNavbar Boolean        @default(false)
}

model Skill {
  id        String @id @default(cuid())
  name      String
  iconKey   String
  sortOrder Int    @default(0)
}

model WorkExperience {
  id          String   @id @default(cuid())
  company     String
  href        String
  location    String
  title       String
  logoUrl     String
  start       String
  end         String
  description String
  badges      String[]
  sortOrder   Int      @default(0)
}

model Education {
  id        String @id @default(cuid())
  school    String
  href      String
  degree    String
  logoUrl   String
  start     String
  end       String
  sortOrder Int    @default(0)
}

model Project {
  id           String   @id @default(cuid())
  title        String
  href         String
  dates        String
  active       Boolean  @default(false)
  description  String
  technologies String[]
  image        String
  video        String
  links        Json
  sortOrder    Int      @default(0)
}

model Hackathon {
  id          String  @id @default(cuid())
  title       String
  dates       String
  location    String
  description String
  image       String
  mlh         String?
  win         String?
  links       Json
  sortOrder   Int     @default(0)
}

model BlogPost {
  id          String    @id @default(cuid())
  slug        String    @unique
  title       String
  summary     String
  content     String
  image       String?
  draft       Boolean   @default(true)
  publishedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

- [ ] **Step 2: Create `.env.example`**

Create `.env.example`:
```bash
POSTGRES_PRISMA_URL="postgres://user:password@host/db?pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://user:password@host/db"
SESSION_SECRET="generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
ADMIN_PASSWORD_HASH="generate with: node scripts/hash-password.mjs <your-password> (after Task 5)"
```

- [ ] **Step 3: Fill in your local `.env`**

Copy the same 4 keys into `.env` with real values pulled from your Vercel Postgres integration (`vercel env pull .env` if the project is already linked, or paste from the Vercel dashboard's `.env.local` tab). `SESSION_SECRET`/`ADMIN_PASSWORD_HASH` are generated once Task 5's helper script exists — leave them blank for now.

- [ ] **Step 4: Create the initial migration**

Run: `pnpm prisma migrate dev --name init`
Expected: migration folder created under `prisma/migrations/`, ends with `Your database is now in sync with your schema.`

- [ ] **Step 5: Verify**

Run: `pnpm prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀`

- [ ] **Step 6: Commit**

```bash
git add prisma .env.example
git commit -m "feat: define Prisma schema for admin panel data model"
```

---

## Task 3: Prisma client singleton

**Files:**
- Create: `src/lib/prisma.ts`

**Interfaces:**
- Produces: `import { prisma } from "@/lib/prisma"` — a shared `PrismaClient` instance, used by every task from here on.

- [ ] **Step 1: Write the file**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `src/lib/prisma.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "feat: add shared Prisma client singleton"
```

---

## Task 4: Icon registry

**Files:**
- Create: `src/lib/icon-registry.ts`

**Interfaces:**
- Produces: `IconKey` type, `ICON_REGISTRY: Record<IconKey, ComponentType<{className?: string}>>`, `ICON_KEYS: IconKey[]`, `getIcon(key: string)`. Consumed by every admin form/list that shows an icon (Skills, Project links, Hackathon links, Social links) and by the public site sections rewired in Task 12.

- [ ] **Step 1: Write the file**

```ts
import type { ComponentType } from "react";
import { GlobeIcon } from "lucide-react";
import { Icons } from "@/components/icons";
import { ReactLight } from "@/components/ui/svgs/reactLight";
import { NextjsIconDark } from "@/components/ui/svgs/nextjsIconDark";
import { Typescript } from "@/components/ui/svgs/typescript";
import { Nodejs } from "@/components/ui/svgs/nodejs";
import { Python } from "@/components/ui/svgs/python";
import { Golang } from "@/components/ui/svgs/golang";
import { Postgresql } from "@/components/ui/svgs/postgresql";
import { Docker } from "@/components/ui/svgs/docker";
import { Kubernetes } from "@/components/ui/svgs/kubernetes";
import { Java } from "@/components/ui/svgs/java";
import { Csharp } from "@/components/ui/svgs/csharp";

export type IconKey =
  | "react"
  | "nextjs"
  | "typescript"
  | "nodejs"
  | "python"
  | "golang"
  | "postgresql"
  | "docker"
  | "kubernetes"
  | "java"
  | "csharp"
  | "globe"
  | "github"
  | "linkedin"
  | "x"
  | "youtube"
  | "email";

type IconComponent = ComponentType<{ className?: string }>;

export const ICON_REGISTRY: Record<IconKey, IconComponent> = {
  react: ReactLight,
  nextjs: NextjsIconDark,
  typescript: Typescript,
  nodejs: Nodejs,
  python: Python,
  golang: Golang,
  postgresql: Postgresql,
  docker: Docker,
  kubernetes: Kubernetes,
  java: Java,
  csharp: Csharp,
  globe: GlobeIcon,
  github: Icons.github,
  linkedin: Icons.linkedin,
  x: Icons.x,
  youtube: Icons.youtube,
  email: Icons.email,
};

export const ICON_KEYS = Object.keys(ICON_REGISTRY) as IconKey[];

export function getIcon(key: string): IconComponent | null {
  return (ICON_REGISTRY as Record<string, IconComponent>)[key] ?? null;
}
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `src/lib/icon-registry.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/icon-registry.ts
git commit -m "feat: add icon registry mapping DB iconKey strings to components"
```

---

## Task 5: Session crypto helpers and password hash script

**Files:**
- Create: `src/lib/session.ts`
- Create: `scripts/hash-password.mjs`

**Interfaces:**
- Produces: `SESSION_COOKIE_NAME: string`, `async createSessionCookieValue(): Promise<string>`, `async verifySessionCookieValue(value: string | undefined): Promise<boolean>` — consumed by Task 6 (login/logout routes), Task 7 (middleware), and Task 8's `requireAdmin()` helper.
- Consumes: `process.env.SESSION_SECRET`, `process.env.ADMIN_PASSWORD_HASH`.

- [ ] **Step 1: Write `src/lib/session.ts`**

Self-signed HMAC cookie (Web Crypto `crypto.subtle`, works identically in the Edge middleware runtime and in Node route handlers, so no extra session library is needed):

```ts
export const SESSION_COOKIE_NAME = "admin_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const encoder = new TextEncoder();

async function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function toBase64Url(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function createSessionCookieValue(): Promise<string> {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `admin.${expires}`;
  const key = await getKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toBase64Url(signature)}`;
}

export async function verifySessionCookieValue(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;
  const [marker, expiresRaw, signatureB64] = parts;
  if (marker !== "admin") return false;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const key = await getKey();
  const expectedSignature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${marker}.${expiresRaw}`)
  );
  return timingSafeEqual(toBase64Url(expectedSignature), signatureB64);
}

export const SESSION_COOKIE_MAX_AGE = MAX_AGE_SECONDS;
```

- [ ] **Step 2: Write `scripts/hash-password.mjs`**

```js
import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
console.log(hash);
```

- [ ] **Step 3: Generate real secrets and fill in `.env`**

Run:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node scripts/hash-password.mjs "your-chosen-admin-password"
```
Paste the two outputs into `.env` as `SESSION_SECRET` and `ADMIN_PASSWORD_HASH`.

- [ ] **Step 4: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `src/lib/session.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/session.ts scripts/hash-password.mjs
git commit -m "feat: add HMAC session signing and password hash CLI script"
```

---

## Task 6: `requireAdmin` guard, login/logout API routes

**Files:**
- Create: `src/lib/require-admin.ts`
- Create: `src/app/api/admin/login/route.ts`
- Create: `src/app/api/admin/logout/route.ts`

**Interfaces:**
- Consumes: `SESSION_COOKIE_NAME`, `createSessionCookieValue`, `verifySessionCookieValue`, `SESSION_COOKIE_MAX_AGE` from `@/lib/session` (Task 5).
- Produces: `async requireAdmin(): Promise<NextResponse | null>` — returns a 401 `NextResponse` when unauthenticated, `null` when authenticated. Every admin API route added in later tasks starts with `const unauthorized = await requireAdmin(); if (unauthorized) return unauthorized;`.

- [ ] **Step 1: Write `src/lib/require-admin.ts`**

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/session";

export async function requireAdmin(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionCookieValue(value);
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
```

- [ ] **Step 2: Write `src/app/api/admin/login/route.ts`**

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_MAX_AGE,
  createSessionCookieValue,
} from "@/lib/session";

const loginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }

  const valid = await bcrypt.compare(parsed.data.password, hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, await createSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Write `src/app/api/admin/logout/route.ts`**

```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing the three new files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/require-admin.ts src/app/api/admin/login src/app/api/admin/logout
git commit -m "feat: add admin login/logout API routes and requireAdmin guard"
```

---

## Task 7: Middleware protecting `/admin`

**Files:**
- Create: `src/middleware.ts`

**Interfaces:**
- Consumes: `SESSION_COOKIE_NAME`, `verifySessionCookieValue` from `@/lib/session` (Task 5).

- [ ] **Step 1: Write the file**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionCookieValue } from "@/lib/session";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin/login")) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const valid = await verifySessionCookieValue(cookie);
  if (!valid) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `src/middleware.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: protect /admin routes with session middleware"
```

---

## Task 8: Shared admin UI primitives

**Files:**
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/textarea.tsx`
- Create: `src/components/ui/label.tsx`
- Create: `src/components/ui/checkbox.tsx`
- Create: `src/components/ui/icon-select.tsx`
- Create: `src/components/ui/alert-dialog.tsx`

**Interfaces:**
- Produces: `Input`, `Textarea`, `Label`, `Checkbox` (props `{checked: boolean; onChange: (checked: boolean) => void}`), `IconSelect` (props `{value: string; onChange: (value: IconKey) => void; className?: string}`), and the `AlertDialog*` family (`AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`) — used by every admin form/list from Task 15 onward.
- Consumes: `cn` from `@/lib/utils`, `buttonVariants` from `@/components/ui/button`, `ICON_KEYS`/`ICON_REGISTRY`/`IconKey` from `@/lib/icon-registry` (Task 4).

- [ ] **Step 1: Write `src/components/ui/input.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { Input };
```

- [ ] **Step 2: Write `src/components/ui/textarea.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export { Textarea };
```

- [ ] **Step 3: Write `src/components/ui/label.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium leading-none", className)} {...props} />
  )
);
Label.displayName = "Label";

export { Label };
```

- [ ] **Step 4: Write `src/components/ui/checkbox.tsx`**

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "type" | "checked"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onChange, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={cn("size-4 rounded border border-input accent-primary cursor-pointer", className)}
      {...props}
    />
  )
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
```

- [ ] **Step 5: Write `src/components/ui/icon-select.tsx`**

```tsx
"use client";

import { ICON_KEYS, ICON_REGISTRY, type IconKey } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";

export function IconSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (value: IconKey) => void;
  className?: string;
}) {
  const Icon = (ICON_REGISTRY as Record<string, (typeof ICON_REGISTRY)[IconKey]>)[value];
  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as IconKey)}
        className={cn(
          "flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className
        )}
      >
        {ICON_KEYS.map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      {Icon && <Icon className="size-5" />}
    </div>
  );
}
```

- [ ] **Step 6: Write `src/components/ui/alert-dialog.tsx`**

```tsx
"use client";

import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const AlertDialog = AlertDialogPrimitive.Root;
const AlertDialogTrigger = AlertDialogPrimitive.Trigger;
const AlertDialogPortal = AlertDialogPrimitive.Portal;

const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-black/50", className)} {...props} />
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;

const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-2", className)} {...props} />
);

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex justify-end gap-2 mt-6", className)} {...props} />
);

const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;

const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;

const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action ref={ref} className={cn(buttonVariants({ variant: "destructive" }), className)} {...props} />
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;

const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel ref={ref} className={cn(buttonVariants({ variant: "outline" }), className)} {...props} />
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
```

- [ ] **Step 7: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing the six new files.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/input.tsx src/components/ui/textarea.tsx src/components/ui/label.tsx src/components/ui/checkbox.tsx src/components/ui/icon-select.tsx src/components/ui/alert-dialog.tsx
git commit -m "feat: add form and dialog UI primitives for the admin panel"
```

---

## Task 9: Admin layout, login page, dashboard shell

**Files:**
- Create: `src/app/admin/login/page.tsx`
- Create: `src/app/admin/(dashboard)/layout.tsx`
- Create: `src/app/admin/(dashboard)/page.tsx`

**Interfaces:**
- Consumes: `Input`, `Label`, `Button` (existing) for the login form.
- Produces: `/admin/login` (public, outside the protected layout) and the `/admin` dashboard shell that every later admin page (`/admin/blog`, `/admin/work`, etc.) nests under via `src/app/admin/(dashboard)/<resource>/page.tsx`.

- [ ] **Step 1: Write `src/app/admin/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Invalid password.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4 border border-border rounded-xl p-6">
        <h1 className="text-lg font-semibold">Admin Login</h1>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Write `src/app/admin/(dashboard)/layout.tsx`**

```tsx
import Link from "next/link";
import { LogoutButton } from "@/components/admin/logout-button";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/blog", label: "Blog" },
  { href: "/admin/profile", label: "Profile" },
  { href: "/admin/work", label: "Work Experience" },
  { href: "/admin/education", label: "Education" },
  { href: "/admin/skills", label: "Skills" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/hackathons", label: "Hackathons" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col md:flex-row">
      <aside className="md:w-56 shrink-0 border-b md:border-b-0 md:border-r border-border p-4 flex flex-col gap-1">
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-sm">Admin</span>
          <LogoutButton />
        </div>
        <nav className="flex flex-row md:flex-col gap-1 flex-wrap">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 max-w-4xl">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/admin/logout-button.tsx`**

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
      Sign out
    </Button>
  );
}
```

- [ ] **Step 4: Write `src/app/admin/(dashboard)/page.tsx`** (placeholder counts — wired to real data in Task 23 once every resource exists)

```tsx
export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-sm text-muted-foreground">
        Resource counts will appear here once every admin section is wired up (Task 23).
      </p>
    </div>
  );
}
```

- [ ] **Step 5: Verify**

Run: `pnpm dev`, open `http://localhost:3000/admin` in a browser.
Expected: redirected to `/admin/login` (middleware from Task 7 has no valid cookie yet). Enter the password you hashed into `ADMIN_PASSWORD_HASH` in Task 5 — expected: redirected to `/admin`, sidebar with 8 links visible, "Dashboard" placeholder text shown. Click "Sign out" — expected: redirected back to `/admin/login`.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/login src/app/admin/\(dashboard\) src/components/admin/logout-button.tsx
git commit -m "feat: add admin login page, protected layout, and dashboard shell"
```

---

## Task 10: Public data-read helpers

**Files:**
- Create: `src/lib/data.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/prisma` (Task 3).
- Produces: `getProfile()`, `getSocialLinks()`, `getSkills()`, `getWorkExperience()`, `getEducation()`, `getProjects()`, `getHackathons()`, `getPublishedPosts()`, `getPostBySlug(slug)` — every function returns Prisma's generated model type directly (no separate DTO layer). Consumed by Task 12 and Task 13's public page rewires.

- [ ] **Step 1: Write the file**

```ts
import { prisma } from "@/lib/prisma";

export async function getProfile() {
  const profile = await prisma.profile.findUnique({ where: { id: 1 } });
  if (!profile) {
    throw new Error("Profile is not seeded yet. Run: pnpm prisma db seed");
  }
  return profile;
}

export async function getSocialLinks() {
  return prisma.socialLink.findMany({ orderBy: { platform: "asc" } });
}

export async function getSkills() {
  return prisma.skill.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getWorkExperience() {
  return prisma.workExperience.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getEducation() {
  return prisma.education.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getProjects() {
  return prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getHackathons() {
  return prisma.hackathon.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getPublishedPosts() {
  return prisma.blogPost.findMany({
    where: { draft: false },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getPostBySlug(slug: string) {
  return prisma.blogPost.findFirst({ where: { slug, draft: false } });
}
```

- [ ] **Step 2: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing `src/lib/data.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/data.ts
git commit -m "feat: add public data-read helpers backed by Prisma"
```

---

## Task 11: Seed script — migrate `resume.tsx` and `content/*.mdx` into the database

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add `"prisma": {"seed": "tsx prisma/seed.ts"}`)

**Interfaces:**
- Consumes: `DATA` from `@/data/resume` (still present — deleted only in Task 14, after this task has run against it), `prisma` from `@/lib/prisma`, `IconKey` from `@/lib/icon-registry`.
- Produces: fully populated `Profile`, `SocialLink`, `Skill`, `WorkExperience`, `Education`, `Project`, `Hackathon`, `BlogPost` tables — required before Task 12/13 can render the public site from the database.

- [ ] **Step 1: Write `prisma/seed.ts`**

```ts
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";
import { DATA } from "../src/data/resume";
import type { IconKey } from "../src/lib/icon-registry";

const SKILL_ICON_KEYS: Record<string, IconKey> = {
  React: "react",
  "Next.js": "nextjs",
  Typescript: "typescript",
  "Node.js": "nodejs",
  Python: "python",
  Go: "golang",
  Postgres: "postgresql",
  Docker: "docker",
  Kubernetes: "kubernetes",
  Java: "java",
  "C++": "csharp",
};

const PROJECT_LINK_ICON: Record<string, IconKey> = {
  Website: "globe",
  Source: "github",
};

function hackathonLinkIcon(title: string): IconKey {
  if (title === "YouTube") return "youtube";
  if (["Devpost", "Medium Article", "Article", "Site"].includes(title)) return "globe";
  return "github";
}

const SOCIAL_PLATFORM_MAP: Record<string, "GitHub" | "LinkedIn" | "X" | "Youtube" | "Email"> = {
  GitHub: "GitHub",
  LinkedIn: "LinkedIn",
  X: "X",
  Youtube: "Youtube",
  email: "Email",
};

function parseFrontmatter(raw: string) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter block");
  const [, block, content] = match;
  const data: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const lineMatch = line.match(/^([a-zA-Z]+):\s*"?([^"]*)"?\s*$/);
    if (lineMatch) data[lineMatch[1]] = lineMatch[2];
  }
  return { data, content: content.trim() };
}

function stripMediaContainer(markdown: string): string {
  return markdown.replace(
    /<MediaContainer\s+src="([^"]+)"\s+alt="([^"]+)"\s*\/>/,
    (_match, src, alt) => `![${alt}](${src})`
  );
}

async function seedProfileAndSocial() {
  await prisma.profile.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      name: DATA.name,
      initials: DATA.initials,
      url: DATA.url,
      location: DATA.location,
      locationLink: DATA.locationLink,
      description: DATA.description,
      summary: DATA.summary,
      avatarUrl: DATA.avatarUrl,
      email: DATA.contact.email,
      tel: DATA.contact.tel,
    },
    update: {},
  });

  for (const [key, social] of Object.entries(DATA.contact.social)) {
    const platform = SOCIAL_PLATFORM_MAP[key];
    if (!platform) continue;
    await prisma.socialLink.upsert({
      where: { platform },
      create: { platform, url: social.url, showInNavbar: social.navbar },
      update: { url: social.url, showInNavbar: social.navbar },
    });
  }
}

async function seedSkills() {
  for (const [index, skill] of DATA.skills.entries()) {
    const iconKey = SKILL_ICON_KEYS[skill.name];
    if (!iconKey) throw new Error(`No iconKey mapping for skill "${skill.name}"`);
    await prisma.skill.create({ data: { name: skill.name, iconKey, sortOrder: index } });
  }
}

async function seedWork() {
  for (const [index, work] of DATA.work.entries()) {
    await prisma.workExperience.create({
      data: {
        company: work.company,
        href: work.href,
        location: work.location,
        title: work.title,
        logoUrl: work.logoUrl,
        start: work.start,
        end: work.end,
        description: work.description,
        badges: [...work.badges],
        sortOrder: index,
      },
    });
  }
}

async function seedEducation() {
  for (const [index, education] of DATA.education.entries()) {
    await prisma.education.create({
      data: {
        school: education.school,
        href: education.href,
        degree: education.degree,
        logoUrl: education.logoUrl,
        start: education.start,
        end: education.end,
        sortOrder: index,
      },
    });
  }
}

async function seedProjects() {
  for (const [index, project] of DATA.projects.entries()) {
    await prisma.project.create({
      data: {
        title: project.title,
        href: project.href,
        dates: project.dates,
        active: project.active,
        description: project.description,
        technologies: [...project.technologies],
        image: project.image,
        video: project.video,
        links: project.links.map((link) => ({
          type: link.type,
          href: link.href,
          iconKey: PROJECT_LINK_ICON[link.type] ?? "globe",
        })),
        sortOrder: index,
      },
    });
  }
}

async function seedHackathons() {
  for (const [index, hackathon] of DATA.hackathons.entries()) {
    await prisma.hackathon.create({
      data: {
        title: hackathon.title,
        dates: hackathon.dates,
        location: hackathon.location,
        description: hackathon.description,
        image: hackathon.image,
        mlh: "mlh" in hackathon ? (hackathon.mlh as string) : null,
        win: "win" in hackathon ? (hackathon.win as string) : null,
        links: hackathon.links.map((link) => ({
          title: link.title,
          href: link.href,
          iconKey: hackathonLinkIcon(link.title),
        })),
        sortOrder: index,
      },
    });
  }
}

async function seedBlogPosts() {
  const contentDir = path.join(__dirname, "..", "content");
  const files = readdirSync(contentDir).filter((file) => file.endsWith(".mdx"));

  for (const file of files) {
    const raw = readFileSync(path.join(contentDir, file), "utf-8");
    const { data, content } = parseFrontmatter(raw);
    const slug = file.replace(/\.mdx$/, "");

    await prisma.blogPost.upsert({
      where: { slug },
      create: {
        slug,
        title: data.title,
        summary: data.summary,
        content: stripMediaContainer(content),
        image: data.image || null,
        draft: false,
        publishedAt: new Date(data.publishedAt),
      },
      update: {},
    });
  }
}

async function main() {
  await seedProfileAndSocial();
  await seedSkills();
  await seedWork();
  await seedEducation();
  await seedProjects();
  await seedHackathons();
  await seedBlogPosts();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
```

- [ ] **Step 2: Register the seed command**

Add to `package.json` (top level, sibling of `"scripts"`):

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 3: Run the seed**

Run: `pnpm prisma db seed`
Expected: no errors; ends with the process exiting 0.

- [ ] **Step 4: Verify the data landed**

Run: `pnpm prisma studio`, open the browser tab it prints.
Expected: `Profile` has 1 row, `SocialLink` has 5 rows, `Skill` has 11 rows, `WorkExperience` has 6 rows, `Education` has 4 rows, `Project` has 4 rows, `Hackathon` has 20 rows, `BlogPost` has 7 rows (`draft = false` on all, `content` for the `typescript-best-practices` slug contains `![TypeScript code on screen](...)` instead of a `<MediaContainer>` tag). Close Prisma Studio (Ctrl+C) when done.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: add seed script migrating resume.tsx and MDX posts into the database"
```

---

## Task 12: Public site cutover — profile, work, education, skills, projects, contact, hackathons

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/navbar.tsx`
- Modify: `src/components/section/work-section.tsx`
- Modify: `src/components/section/projects-section.tsx`
- Modify: `src/components/project-card.tsx`
- Modify: `src/components/section/contact-section.tsx`
- Modify: `src/components/section/hackathons-section.tsx`

**Interfaces:**
- Consumes: `getProfile`, `getSocialLinks`, `getSkills`, `getWorkExperience`, `getEducation`, `getProjects`, `getHackathons` from `@/lib/data` (Task 10); `getIcon` from `@/lib/icon-registry` (Task 4).
- Produces: every public page/section below reads Prisma-backed data instead of the static `DATA` import; `ProjectCard`'s `links` prop changes shape from `{icon: React.ReactNode; type; href}[]` to `{iconKey: string; type: string; href: string}[]`.

- [ ] **Step 1: Rewrite `src/app/layout.tsx`**

Replace the `DATA` import and every `DATA.*` reference in the `metadata` object and JSX with an awaited `getProfile()` call, since `generateMetadata`-less layouts can still be `async`:

```tsx
import Navbar from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getProfile } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-mono",
});

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return {
    metadataBase: new URL(profile.url),
    title: {
      default: profile.name,
      template: `%s | ${profile.name}`,
    },
    description: profile.description,
    openGraph: {
      title: profile.name,
      description: profile.description,
      url: profile.url,
      siteName: profile.name,
      locale: "en_US",
      type: "website",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    twitter: {
      title: profile.name,
      card: "summary_large_image",
    },
    verification: {
      google: "",
      yandex: "",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased relative",
          geist.variable,
          geistMono.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider delayDuration={0}>
            <div className="absolute inset-0 top-0 left-0 right-0 h-[100px] overflow-hidden z-0">
              <FlickeringGrid
                className="h-full w-full"
                squareSize={2}
                gridGap={2}
                style={{
                  maskImage: "linear-gradient(to bottom, black, transparent)",
                  WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
                }}
              />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto py-12 pb-24 sm:py-24 px-6">
              {children}
            </div>
            <Navbar />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Rewrite `src/app/page.tsx`**

Make the component `async`, replace `DATA` with `getProfile()`/`getEducation()`/`getSkills()`, resolve each skill's icon via `getIcon`, and drop the now-unused `Link` import for education hrefs only if unused elsewhere (it is still used for education links, keep it):

```tsx
/* eslint-disable @next/next/no-img-element */
import BlurFade from "@/components/magicui/blur-fade";
import BlurFadeText from "@/components/magicui/blur-fade-text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfile, getEducation, getSkills } from "@/lib/data";
import { getIcon } from "@/lib/icon-registry";
import Link from "next/link";
import Markdown from "react-markdown";
import ContactSection from "@/components/section/contact-section";
import HackathonsSection from "@/components/section/hackathons-section";
import ProjectsSection from "@/components/section/projects-section";
import WorkSection from "@/components/section/work-section";
import { ArrowUpRight } from "lucide-react";

const BLUR_FADE_DELAY = 0.04;

export default async function Page() {
  const [profile, education, skills] = await Promise.all([
    getProfile(),
    getEducation(),
    getSkills(),
  ]);

  return (
    <main className="min-h-dvh flex flex-col gap-14 relative">
      <section id="hero">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="gap-2 gap-y-6 flex flex-col md:flex-row justify-between">
            <div className="gap-2 flex flex-col order-2 md:order-1">
              <BlurFadeText
                delay={BLUR_FADE_DELAY}
                className="text-3xl font-semibold tracking-tighter sm:text-4xl lg:text-5xl"
                yOffset={8}
                text={`Hi, I'm ${profile.name.split(" ")[0]}`}
              />
              <BlurFadeText
                className="text-muted-foreground max-w-[600px] md:text-lg lg:text-xl"
                delay={BLUR_FADE_DELAY}
                text={profile.description}
              />
            </div>
            <BlurFade delay={BLUR_FADE_DELAY} className="order-1 md:order-2">
              <Avatar className="size-24 md:size-32 border rounded-full shadow-lg ring-4 ring-muted">
                <AvatarImage alt={profile.name} src={profile.avatarUrl} />
                <AvatarFallback>{profile.initials}</AvatarFallback>
              </Avatar>
            </BlurFade>
          </div>
        </div>
      </section>
      <section id="about">
        <div className="flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 3}>
            <h2 className="text-xl font-bold">About</h2>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 4}>
            <div className="prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
              <Markdown>{profile.summary}</Markdown>
            </div>
          </BlurFade>
        </div>
      </section>
      <section id="work">
        <div className="flex min-h-0 flex-col gap-y-6">
          <BlurFade delay={BLUR_FADE_DELAY * 5}>
            <h2 className="text-xl font-bold">Work Experience</h2>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 6}>
            <WorkSection />
          </BlurFade>
        </div>
      </section>
      <section id="education">
        <div className="flex min-h-0 flex-col gap-y-6">
          <BlurFade delay={BLUR_FADE_DELAY * 7}>
            <h2 className="text-xl font-bold">Education</h2>
          </BlurFade>
          <div className="flex flex-col gap-8">
            {education.map((item, index) => (
              <BlurFade key={item.id} delay={BLUR_FADE_DELAY * 8 + index * 0.05}>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-x-3 justify-between group"
                >
                  <div className="flex items-center gap-x-3 flex-1 min-w-0">
                    {item.logoUrl ? (
                      <img
                        src={item.logoUrl}
                        alt={item.school}
                        className="size-8 md:size-10 p-1 border rounded-full shadow ring-2 ring-border overflow-hidden object-contain flex-none"
                      />
                    ) : (
                      <div className="size-8 md:size-10 p-1 border rounded-full shadow ring-2 ring-border bg-muted flex-none" />
                    )}
                    <div className="flex-1 min-w-0 gap-0.5 flex flex-col">
                      <div className="font-semibold leading-none flex items-center gap-2">
                        {item.school}
                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" aria-hidden />
                      </div>
                      <div className="font-sans text-sm text-muted-foreground">{item.degree}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground text-right flex-none">
                    <span>
                      {item.start} - {item.end}
                    </span>
                  </div>
                </Link>
              </BlurFade>
            ))}
          </div>
        </div>
      </section>
      <section id="skills">
        <div className="flex min-h-0 flex-col gap-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 9}>
            <h2 className="text-xl font-bold">Skills</h2>
          </BlurFade>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, id) => {
              const Icon = getIcon(skill.iconKey);
              return (
                <BlurFade key={skill.id} delay={BLUR_FADE_DELAY * 10 + id * 0.05}>
                  <div className="border bg-background border-border ring-2 ring-border/20 rounded-xl h-8 w-fit px-4 flex items-center gap-2">
                    {Icon && <Icon className="size-4 rounded overflow-hidden object-contain" />}
                    <span className="text-foreground text-sm font-medium">{skill.name}</span>
                  </div>
                </BlurFade>
              );
            })}
          </div>
        </div>
      </section>
      <section id="projects">
        <BlurFade delay={BLUR_FADE_DELAY * 11}>
          <ProjectsSection />
        </BlurFade>
      </section>
      <section id="hackathons">
        <BlurFade delay={BLUR_FADE_DELAY * 13}>
          <HackathonsSection />
        </BlurFade>
      </section>
      <section id="contact">
        <BlurFade delay={BLUR_FADE_DELAY * 16}>
          <ContactSection />
        </BlurFade>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Rewrite `src/components/navbar.tsx`**

Make it `async`, replace `DATA.navbar` (drop — it only ever listed the two static links `/` and `/blog`, so hardcode that tuple directly since it's page-structure, not content) and `DATA.contact.social` with DB reads:

```tsx
import { Dock, DockIcon } from "@/components/magicui/dock";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getSocialLinks } from "@/lib/data";
import { getIcon } from "@/lib/icon-registry";
import { HomeIcon, NotebookIcon } from "lucide-react";

const NAVBAR_ITEMS = [
  { href: "/", icon: HomeIcon, label: "Home" },
  { href: "/blog", icon: NotebookIcon, label: "Blog" },
];

const SOCIAL_ICON_KEY: Record<string, string> = {
  GitHub: "github",
  LinkedIn: "linkedin",
  X: "x",
  Youtube: "youtube",
  Email: "email",
};

export default async function Navbar() {
  const socialLinks = await getSocialLinks();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30">
      <Dock className="z-50 pointer-events-auto relative h-14 p-2 w-fit mx-auto flex gap-2 border bg-card/90 backdrop-blur-3xl shadow-[0_0_10px_3px] shadow-primary/5">
        {NAVBAR_ITEMS.map((item) => {
          const isExternal = item.href.startsWith("http");
          return (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <a
                  href={item.href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                >
                  <DockIcon className="rounded-3xl cursor-pointer size-full bg-background p-0 text-muted-foreground hover:text-foreground hover:bg-muted backdrop-blur-3xl border border-border transition-colors">
                    <item.icon className="size-full rounded-sm overflow-hidden object-contain" />
                  </DockIcon>
                </a>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={8}
                className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
              >
                <p>{item.label}</p>
                <TooltipArrow className="fill-primary" />
              </TooltipContent>
            </Tooltip>
          );
        })}
        <Separator orientation="vertical" className="h-2/3 m-auto w-px bg-border" />
        {socialLinks
          .filter((social) => social.showInNavbar)
          .map((social) => {
            const isExternal = social.url.startsWith("http");
            const IconComponent = getIcon(SOCIAL_ICON_KEY[social.platform]);
            if (!IconComponent) return null;
            return (
              <Tooltip key={social.id}>
                <TooltipTrigger asChild>
                  <a
                    href={social.url}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                  >
                    <DockIcon className="rounded-3xl cursor-pointer size-full bg-background p-0 text-muted-foreground hover:text-foreground hover:bg-muted backdrop-blur-3xl border border-border transition-colors">
                      <IconComponent className="size-full rounded-sm overflow-hidden object-contain" />
                    </DockIcon>
                  </a>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  sideOffset={8}
                  className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
                >
                  <p>{social.platform}</p>
                  <TooltipArrow className="fill-primary" />
                </TooltipContent>
              </Tooltip>
            );
          })}
        <Separator orientation="vertical" className="h-2/3 m-auto w-px bg-border" />
        <Tooltip>
          <TooltipTrigger asChild>
            <DockIcon className="rounded-3xl cursor-pointer size-full bg-background p-0 text-muted-foreground hover:text-foreground hover:bg-muted backdrop-blur-3xl border border-border transition-colors">
              <ModeToggle className="size-full cursor-pointer" />
            </DockIcon>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            sideOffset={8}
            className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]"
          >
            <p>Theme</p>
            <TooltipArrow className="fill-primary" />
          </TooltipContent>
        </Tooltip>
      </Dock>
    </div>
  );
}
```

- [ ] **Step 4: Split out `LogoImage`, then rewrite `work-section.tsx` as a Server Component**

`WorkSection` needs to become an `async` Server Component to fetch data, but the file currently also defines `LogoImage`, a `"use client"` sub-component using `useState` for its image-error fallback — a single file can't be both. Move `LogoImage` to its own client component file first.

- [ ] **Step 4a: Create `src/components/section/logo-image.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

export function LogoImage({ src, alt }: { src: string; alt: string }) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return <div className="size-8 md:size-10 p-1 border rounded-full shadow ring-2 ring-border bg-muted flex-none" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className="size-8 md:size-10 p-1 border rounded-full shadow ring-2 ring-border overflow-hidden object-contain flex-none"
      onError={() => setImageError(true)}
    />
  );
}
```

- [ ] **Step 4b: Rewrite `src/components/section/work-section.tsx`**

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getWorkExperience } from "@/lib/data";
import { LogoImage } from "@/components/section/logo-image";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function WorkSection() {
  const work = await getWorkExperience();

  return (
    <Accordion type="single" collapsible className="w-full grid gap-6">
      {work.map((item) => (
        <AccordionItem key={item.id} value={item.id} className="w-full border-b-0 grid gap-2">
          <AccordionTrigger className="hover:no-underline p-0 cursor-pointer transition-colors rounded-none group [&>svg]:hidden">
            <div className="flex items-center gap-x-3 justify-between w-full text-left">
              <div className="flex items-center gap-x-3 flex-1 min-w-0">
                <LogoImage src={item.logoUrl} alt={item.company} />
                <div className="flex-1 min-w-0 gap-0.5 flex flex-col">
                  <div className="font-semibold leading-none flex items-center gap-2">
                    {item.company}
                    <span className="relative inline-flex items-center w-3.5 h-3.5">
                      <ChevronRight
                        className={cn(
                          "absolute h-3.5 w-3.5 shrink-0 text-muted-foreground stroke-2 transition-all duration-300 ease-out",
                          "translate-x-0 opacity-0",
                          "group-hover:translate-x-1 group-hover:opacity-100",
                          "group-data-[state=open]:opacity-0 group-data-[state=open]:translate-x-0"
                        )}
                      />
                      <ChevronDown
                        className={cn(
                          "absolute h-3.5 w-3.5 shrink-0 text-muted-foreground stroke-2 transition-all duration-200",
                          "opacity-0 rotate-0",
                          "group-data-[state=open]:opacity-100 group-data-[state=open]:rotate-180"
                        )}
                      />
                    </span>
                  </div>
                  <div className="font-sans text-sm text-muted-foreground">{item.title}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs tabular-nums text-muted-foreground text-right flex-none">
                <span>
                  {item.start} - {item.end ?? "Present"}
                </span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0 ml-13 text-xs sm:text-sm text-muted-foreground">
            {item.description}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

- [ ] **Step 5: Rewrite `src/components/section/projects-section.tsx`**

```tsx
import BlurFade from "@/components/magicui/blur-fade";
import { ProjectCard } from "@/components/project-card";
import { getProjects } from "@/lib/data";

const BLUR_FADE_DELAY = 0.04;

export default async function ProjectsSection() {
  const projects = await getProjects();

  return (
    <section id="projects">
      <div className="flex min-h-0 flex-col gap-y-8">
        <div className="flex flex-col gap-y-4 items-center justify-center">
          <div className="flex items-center w-full">
            <div className="flex-1 h-px bg-linear-to-r from-transparent from-5% via-border via-95% to-transparent" />
            <div className="border bg-primary z-10 rounded-xl px-4 py-1">
              <span className="text-background text-sm font-medium">My Projects</span>
            </div>
            <div className="flex-1 h-px bg-linear-to-l from-transparent from-5% via-border via-95% to-transparent" />
          </div>
          <div className="flex flex-col gap-y-3 items-center justify-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Check out my latest work</h2>
            <p className="text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed text-balance text-center">
              I&apos;ve worked on a variety of projects, from simple websites to complex web applications. Here are a few of my favorites.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto auto-rows-fr">
          {projects.map((project, id) => (
            <BlurFade key={project.id} delay={BLUR_FADE_DELAY * 12 + id * 0.05} className="h-full">
              <ProjectCard
                href={project.href}
                title={project.title}
                description={project.description}
                dates={project.dates}
                tags={project.technologies}
                image={project.image}
                video={project.video}
                links={project.links as { type: string; href: string; iconKey: string }[]}
              />
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Rewrite `src/components/project-card.tsx`**

Change only the `links` prop shape and how each link's icon is resolved (from a passed-in `React.ReactNode` to a resolved `iconKey`):

```tsx
/* eslint-disable @next/next/no-img-element */
"use client";

import { Badge } from "@/components/ui/badge";
import { getIcon } from "@/lib/icon-registry";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import Markdown from "react-markdown";

function ProjectImage({ src, alt }: { src: string; alt: string }) {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) {
    return <div className="w-full h-48 bg-muted" />;
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-48 object-cover"
      onError={() => setImageError(true)}
    />
  );
}

interface Props {
  title: string;
  href?: string;
  description: string;
  dates: string;
  tags: readonly string[];
  image?: string;
  video?: string;
  links?: readonly { type: string; href: string; iconKey: string }[];
  className?: string;
}

export function ProjectCard({
  title,
  href,
  description,
  dates,
  tags,
  image,
  video,
  links,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col h-full border border-border rounded-xl overflow-hidden hover:ring-2 cursor-pointer hover:ring-muted transition-all duration-200",
        className
      )}
    >
      <div className="relative shrink-0">
        <Link href={href || "#"} target="_blank" rel="noopener noreferrer" className="block">
          {video ? (
            <video src={video} autoPlay loop muted playsInline className="w-full h-48 object-cover" />
          ) : image ? (
            <ProjectImage src={image} alt={title} />
          ) : (
            <div className="w-full h-48 bg-muted" />
          )}
        </Link>
        {links && links.length > 0 && (
          <div className="absolute top-2 right-2 flex flex-wrap gap-2">
            {links.map((link, idx) => {
              const Icon = getIcon(link.iconKey);
              return (
                <Link href={link.href} key={idx} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                  <Badge className="flex items-center gap-1.5 text-xs bg-black text-white hover:bg-black/90" variant="default">
                    {Icon && <Icon className="size-3" />}
                    {link.type}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <h3 className="font-semibold">{title}</h3>
            <time className="text-xs text-muted-foreground">{dates}</time>
          </div>
          <Link
            href={href || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label={`Open ${title}`}
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <div className="text-xs flex-1 prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
          <Markdown>{description}</Markdown>
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {tags.map((tag) => (
              <Badge key={tag} className="text-[11px] font-medium border border-border h-6 w-fit px-2" variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Rewrite `src/components/section/contact-section.tsx`**

```tsx
import Link from "next/link";
import { FlickeringGrid } from "@/components/magicui/flickering-grid";
import { getSocialLinks } from "@/lib/data";

export default async function ContactSection() {
  const socialLinks = await getSocialLinks();
  const xLink = socialLinks.find((social) => social.platform === "X");

  return (
    <div className="border rounded-xl p-10 relative">
      <div className="absolute -top-4 border bg-primary z-10 rounded-xl px-4 py-1 left-1/2 -translate-x-1/2">
        <span className="text-background text-sm font-medium">Contact</span>
      </div>
      <div className="absolute inset-0 top-0 left-0 right-0 h-1/2 rounded-xl overflow-hidden">
        <FlickeringGrid
          className="h-full w-full"
          squareSize={2}
          gridGap={2}
          style={{
            maskImage: "linear-gradient(to bottom, black, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>
      <div className="relative flex flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Get in Touch</h2>
        <p className="mx-auto max-w-lg text-muted-foreground text-balance">
          Want to chat? Just shoot me a dm{" "}
          {xLink && (
            <Link
              href={xLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              with a direct question on twitter
            </Link>
          )}{" "}
          and I&apos;ll respond whenever I can. I will ignore all soliciting.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Rewrite `src/components/section/hackathons-section.tsx`**

```tsx
/* eslint-disable @next/next/no-img-element */
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getHackathons } from "@/lib/data";
import { getIcon } from "@/lib/icon-registry";
import { Timeline, TimelineItem, TimelineConnectItem } from "@/components/timeline";

export default async function HackathonsSection() {
  const hackathons = await getHackathons();

  return (
    <section id="hackathons" className="overflow-hidden">
      <div className="flex min-h-0 flex-col gap-y-8 w-full">
        <div className="flex flex-col gap-y-4 items-center justify-center">
          <div className="flex items-center w-full">
            <div className="flex-1 h-px bg-linear-to-r from-transparent from-5% via-border via-95% to-transparent" />
            <div className="border bg-primary z-10 rounded-xl px-4 py-1">
              <span className="text-background text-sm font-medium">Hackathons</span>
            </div>
            <div className="flex-1 h-px bg-linear-to-l from-transparent from-5% via-border via-95% to-transparent" />
          </div>
          <div className="flex flex-col gap-y-3 items-center justify-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">I like building things</h2>
            <p className="text-muted-foreground md:text-lg/relaxed lg:text-base/relaxed xl:text-lg/relaxed text-balance text-center">
              During my time in university, I attended {hackathons.length}+ hackathons. People from around the country would come together and
              build incredible things in 2-3 days. It was eye-opening to see the endless possibilities brought to life by a group of motivated and passionate individuals.
            </p>
          </div>
        </div>
        <Timeline>
          {hackathons.map((hackathon) => (
            <TimelineItem key={hackathon.id} className="w-full flex items-start justify-between gap-10">
              <TimelineConnectItem className="flex items-start justify-center">
                {hackathon.image ? (
                  <img
                    src={hackathon.image}
                    alt={hackathon.title}
                    className="size-10 bg-card z-10 shrink-0 overflow-hidden p-1 border rounded-full shadow ring-2 ring-border object-contain flex-none"
                  />
                ) : (
                  <div className="size-10 bg-card z-10 shrink-0 overflow-hidden p-1 border rounded-full shadow ring-2 ring-border flex-none" />
                )}
              </TimelineConnectItem>
              <div className="flex flex-1 flex-col justify-start gap-2 min-w-0">
                {hackathon.dates && <time className="text-xs text-muted-foreground">{hackathon.dates}</time>}
                {hackathon.title && <h3 className="font-semibold leading-none">{hackathon.title}</h3>}
                {hackathon.location && <p className="text-sm text-muted-foreground">{hackathon.location}</p>}
                {hackathon.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed wrap-break-word">{hackathon.description}</p>
                )}
                {(() => {
                  const links = hackathon.links as { title: string; href: string; iconKey: string }[];
                  return (
                    links.length > 0 && (
                      <div className="mt-1 flex flex-row flex-wrap items-start gap-2">
                        {links.map((link, idx) => {
                          const Icon = getIcon(link.iconKey);
                          return (
                            <Link href={link.href} key={idx} target="_blank" rel="noopener noreferrer">
                              <Badge className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground">
                                {Icon && <Icon className="h-4 w-4" />}
                                {link.title}
                              </Badge>
                            </Link>
                          );
                        })}
                      </div>
                    )
                  );
                })()}
              </div>
            </TimelineItem>
          ))}
        </Timeline>
      </div>
    </section>
  );
}
```

- [ ] **Step 9: Verify**

Run: `pnpm dev`, open `http://localhost:3000/`.
Expected: hero, about, work experience (accordion still expands/collapses), education, skills (with icons), projects (with tags and link badges), hackathons timeline (20 items, icons render), and contact section all render with data matching what Prisma Studio showed in Task 11. Toggle dark mode — expected: everything still themes correctly (no change was made to CSS).

- [ ] **Step 10: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/components/navbar.tsx src/components/section src/components/project-card.tsx
git commit -m "feat: read profile, work, education, skills, projects, contact, and hackathons from the database"
```

---

## Task 13: Public site cutover — blog list, blog detail, OpenGraph images

**Files:**
- Modify: `src/app/blog/page.tsx`
- Modify: `src/app/blog/[slug]/page.tsx`
- Modify: `src/app/opengraph-image.tsx`
- Modify: `src/app/blog/opengraph-image.tsx`
- Modify: `src/app/blog/[slug]/opengraph-image.tsx`

**Interfaces:**
- Consumes: `getPublishedPosts`, `getPostBySlug`, `getProfile` from `@/lib/data` (Task 10); existing `mdxComponents` from `@/mdx-components` (unchanged — it has no `content-collections` dependency); existing `remarkCodeMeta` from `@/lib/remark-code-meta` (unchanged, framework-agnostic mdast transform).
- Note: `src/mdx-components.tsx` needs **no changes** — it never imported from `content-collections`.

- [ ] **Step 1: Rewrite `src/app/blog/page.tsx`**

Replace `allPosts` from `content-collections` with `getPublishedPosts()` (already sorted `publishedAt desc` in `lib/data.ts`, so drop the client-side sort), and `post._meta.path.replace(/\.mdx$/, "")` with `post.slug`:

```tsx
import BlurFade from "@/components/magicui/blur-fade";
import { getPublishedPosts } from "@/lib/data";
import Link from "next/link";
import type { Metadata } from "next";
import { paginate, normalizePage } from "@/lib/pagination";
import { ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog",
  description: "Thoughts on software development, life, and more.",
  openGraph: {
    title: "Blog",
    description: "Thoughts on software development, life, and more.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog",
    description: "Thoughts on software development, life, and more.",
  },
};

const PAGE_SIZE = 5;
const BLUR_FADE_DELAY = 0.04;

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const sortedPosts = await getPublishedPosts();

  const totalPages = Math.ceil(sortedPosts.length / PAGE_SIZE);
  const currentPage = normalizePage(pageParam, totalPages);
  const { items: paginatedPosts, pagination } = paginate(sortedPosts, {
    page: currentPage,
    pageSize: PAGE_SIZE,
  });

  return (
    <section id="blog">
      <BlurFade delay={BLUR_FADE_DELAY}>
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Blog <span className="ml-1 bg-card border border-border rounded-md px-2 py-1 text-muted-foreground text-sm">{sortedPosts.length} posts</span>
        </h1>
        <p className="text-sm text-muted-foreground mb-8">My thoughts on software development, life, and more.</p>
      </BlurFade>

      {paginatedPosts.length > 0 ? (
        <>
          <BlurFade delay={BLUR_FADE_DELAY * 2}>
            <div className="flex flex-col gap-5">
              {paginatedPosts.map((post, id) => {
                const indexNumber = (pagination.page - 1) * PAGE_SIZE + id + 1;
                return (
                  <BlurFade delay={BLUR_FADE_DELAY * 3 + id * 0.05} key={post.slug}>
                    <Link
                      className="flex items-start gap-x-2 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      href={`/blog/${post.slug}`}
                    >
                      <span className="text-xs font-mono tabular-nums font-medium mt-[5px]">
                        {String(indexNumber).padStart(2, "0")}.
                      </span>
                      <div className="flex flex-col gap-y-2 flex-1">
                        <p className="tracking-tight text-lg font-medium">
                          <span className="group-hover:text-foreground transition-colors">
                            {post.title}
                            <ChevronRight
                              className="ml-1 inline-block size-4 stroke-3 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                              aria-hidden
                            />
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {post.publishedAt?.toISOString().slice(0, 10)}
                        </p>
                      </div>
                    </Link>
                  </BlurFade>
                );
              })}
            </div>
          </BlurFade>

          {pagination.totalPages > 1 && (
            <BlurFade delay={BLUR_FADE_DELAY * 4}>
              <div className="flex gap-3 flex-row items-center justify-between mt-8">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <div className="flex gap-2 sm:justify-end">
                  {pagination.hasPreviousPage ? (
                    <Link
                      href={`/blog?page=${pagination.page - 1}`}
                      className="h-8 w-fit px-2 flex items-center justify-center text-sm border border-border rounded-lg hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span className="h-8 w-fit px-2 flex items-center justify-center text-sm border border-border rounded-lg opacity-50 cursor-not-allowed">
                      Previous
                    </span>
                  )}
                  {pagination.hasNextPage ? (
                    <Link
                      href={`/blog?page=${pagination.page + 1}`}
                      className="h-8 w-fit px-2 flex items-center justify-center text-sm border border-border rounded-lg hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      Next
                    </Link>
                  ) : (
                    <span className="h-8 w-fit px-2 flex items-center justify-center text-sm border border-border rounded-lg opacity-50 cursor-not-allowed">
                      Next
                    </span>
                  )}
                </div>
              </div>
            </BlurFade>
          )}
        </>
      ) : (
        <BlurFade delay={BLUR_FADE_DELAY * 2}>
          <div className="flex flex-col items-center justify-center py-12 px-4 border border-border rounded-xl">
            <p className="text-muted-foreground text-center">No blog posts yet. Check back soon!</p>
          </div>
        </BlurFade>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Rewrite `src/app/blog/[slug]/page.tsx`**

Replace `allPosts`/`MDXContent` with `getPublishedPosts()` and a `react-markdown` render using the site's existing `mdxComponents`:

```tsx
import { getPublishedPosts } from "@/lib/data";
import { getProfile } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { remarkCodeMeta } from "@/lib/remark-code-meta";
import { mdxComponents } from "@/mdx-components";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata | undefined> {
  const { slug } = await params;
  const [posts, profile] = await Promise.all([getPublishedPosts(), getProfile()]);
  const post = posts.find((p) => p.slug === slug);
  if (!post) return undefined;

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      url: `${profile.url}/blog/${slug}`,
      ...(post.image && { images: [{ url: `${profile.url}${post.image}` }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.summary,
      ...(post.image && { images: [`${profile.url}${post.image}`] }),
    },
  };
}

export default async function Blog({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [sortedPosts, profile] = await Promise.all([getPublishedPosts(), getProfile()]);
  const currentIndex = sortedPosts.findIndex((p) => p.slug === slug);
  const post = sortedPosts[currentIndex];

  if (!post) {
    notFound();
  }

  const previousPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;

  const jsonLdContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    description: post.summary,
    image: post.image ? `${profile.url}${post.image}` : `${profile.url}/blog/${slug}/opengraph-image`,
    url: `${profile.url}/blog/${slug}`,
    author: { "@type": "Person", name: profile.name },
  }).replace(/</g, "\\u003c");

  return (
    <section id="blog">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: jsonLdContent }}
      />
      <div className="flex justify-start gap-4 items-center">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-2 py-1 inline-flex items-center gap-1 mb-6 group" aria-label="Back to Blog">
          <ChevronLeft className="size-3 group-hover:-translate-x-px transition-transform" />
          Back to Blog
        </Link>
      </div>
      <div className="flex flex-col gap-4">
        <h1 className="title font-semibold text-3xl md:text-4xl tracking-tighter leading-tight">{post.title}</h1>
        <p className="text-sm text-muted-foreground">{post.publishedAt && formatDate(post.publishedAt)}</p>
      </div>
      <div className="my-6 flex w-full items-center">
        <div
          className="flex-1 h-px bg-border"
          style={{
            maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          }}
        />
      </div>
      <article className="prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
        <Markdown remarkPlugins={[remarkGfm, remarkCodeMeta]} rehypePlugins={[rehypeRaw]} components={mdxComponents}>
          {post.content}
        </Markdown>
      </article>

      <nav className="mt-12 pt-8 max-w-2xl">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          {previousPost ? (
            <Link href={`/blog/${previousPost.slug}`} className="group flex-1 flex flex-col gap-1 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ChevronLeft className="size-3" />
                Previous
              </span>
              <span className="text-sm font-medium group-hover:text-foreground transition-colors whitespace-normal wrap-break-word">{previousPost.title}</span>
            </Link>
          ) : (
            <div className="hidden sm:block flex-1" />
          )}

          {nextPost ? (
            <Link href={`/blog/${nextPost.slug}`} className="group flex-1 flex flex-col gap-1 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors text-right">
              <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                Next
                <ChevronRight className="size-3" />
              </span>
              <span className="text-sm font-medium group-hover:text-foreground transition-colors whitespace-normal wrap-break-word">{nextPost.title}</span>
            </Link>
          ) : (
            <div className="hidden sm:block flex-1" />
          )}
        </div>
      </nav>
    </section>
  );
}
```

- [ ] **Step 3: Update `src/app/opengraph-image.tsx`**

Remove `export const runtime = "edge";` (Prisma needs the Node.js runtime) and replace `DATA` with an awaited `getProfile()`. Only these lines change — everything else (the `styles` object, font loading, `ImageResponse` JSX) stays exactly as it is today:

```tsx
import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/data";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";
```

Then inside `export default async function Image()`, add `const profile = await getProfile();` as the first line and replace every remaining `DATA.name`/`DATA.avatarUrl`/`DATA.url` reference with `profile.name`/`profile.avatarUrl`/`profile.url`. Also change the module-level `export const alt = DATA.name;` — since `DATA` is no longer imported, hardcode `export const alt = "Portfolio";` (a generic static fallback; per-post OG images set their own `alt` already in the `[slug]` route).

- [ ] **Step 4: Update `src/app/blog/opengraph-image.tsx`**

Same change as Step 3: remove `export const runtime = "edge";`, remove the `DATA` import (this file never actually used `DATA` for `alt`, which is the static string `"Blog"` — check for any other `DATA.*` reference in the file body and replace with `await getProfile()` the same way if present).

- [ ] **Step 5: Update `src/app/blog/[slug]/opengraph-image.tsx`**

Remove `export const runtime = "edge";`. Replace:

```tsx
import { ImageResponse } from "next/og";
import { allPosts } from "content-collections";
import { DATA } from "@/data/resume";
```

with:

```tsx
import { ImageResponse } from "next/og";
import { getPublishedPosts, getProfile } from "@/lib/data";
```

Replace the body's `const post = allPosts.find((p) => p._meta.path.replace(/\.mdx$/, "") === slug);` with:

```tsx
const posts = await getPublishedPosts();
const profile = await getProfile();
const post = posts.find((p) => p.slug === slug);
```

and every remaining `DATA.avatarUrl` / `DATA.url` with `profile.avatarUrl` / `profile.url`. `post.publishedAt` is now a `Date | null` instead of a string — the existing `new Date(post.publishedAt)` call still works unchanged (drop the `post.publishedAt &&` guard's `new Date(...)` re-wrap since it's already a `Date`, i.e. `const publishedDate = post.publishedAt ? post.publishedAt.toLocaleDateString(...) : ""`).

- [ ] **Step 6: Verify**

Run: `pnpm dev`.
Expected: `http://localhost:3000/blog` lists all 7 posts with correct dates and pagination hidden (only 7 posts, page size 5, so page 1 shows 5 with "Next" enabled, page 2 shows 2). Open each of the 7 posts at `/blog/<slug>` — expected: content renders identically to before, including the `typescript-best-practices` post's cover image (now a markdown image instead of `<MediaContainer>`), fenced code blocks still syntax-highlighted via `CodeBlock`, and the `<mark>` tag in that same post renders as highlighted text (not literal `<mark>` text) proving `rehypeRaw` is wired correctly. Visit `http://localhost:3000/opengraph-image`, `http://localhost:3000/blog/opengraph-image`, and `http://localhost:3000/blog/git-workflow-guide/opengraph-image` directly — expected: each returns a PNG image, no 500 error.

- [ ] **Step 7: Commit**

```bash
git add src/app/blog src/app/opengraph-image.tsx
git commit -m "feat: read blog posts and OpenGraph images from the database"
```

---

## Task 14: Remove `content-collections` and the now-unused static data files

**Files:**
- Delete: `content-collections.ts`
- Delete: `content/*.mdx` (all 7 files)
- Delete: `src/data/resume.tsx`
- Modify: `next.config.mjs`
- Modify: `tsconfig.json`
- Modify: `package.json`
- Modify: `prisma/seed.ts` (neuter, don't delete — kept as a historical record)
- Modify: `.gitignore`

**Interfaces:**
- Nothing in the codebase should reference `content-collections`, `@content-collections/*`, or `@/data/resume` after this task. Verified by Step 5's grep.

- [ ] **Step 1: Delete the static content files**

```bash
git rm content-collections.ts src/data/resume.tsx
git rm content/*.mdx
```

- [ ] **Step 2: Remove the plugin from `next.config.mjs`**

```mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 3: Remove the `content-collections` path alias from `tsconfig.json`**

Remove this line from `compilerOptions.paths`:
```json
"content-collections": ["./.content-collections/generated"],
```
leaving only:
```json
"paths": {
  "@/*": ["./src/*"]
},
```

- [ ] **Step 4: Remove the content-collections packages**

Run:
```bash
pnpm remove @content-collections/mdx @content-collections/core @content-collections/next content-collections
```

- [ ] **Step 5: Verify nothing still references the removed packages/files**

Run: `grep -rn "content-collections\|@/data/resume" src next.config.mjs package.json tsconfig.json`
Expected: no output.

- [ ] **Step 6: Neuter `prisma/seed.ts` so a future `prisma migrate reset` doesn't crash on the deleted `resume.tsx`/`content/` import**

Add a comment at the very top of `prisma/seed.ts`:
```ts
// HISTORICAL MIGRATION SCRIPT — already run once against production.
// It imported src/data/resume.tsx and content/*.mdx, both deleted in
// the same commit that finished the admin panel migration. Do not
// re-run; kept only as a record of how the original seed was derived.
```
and remove the `"prisma": {"seed": "tsx prisma/seed.ts"}` block from `package.json` so `prisma migrate reset` no longer tries to execute it automatically.

- [ ] **Step 7: Remove the now-unused `.content-collections` ignore entry from `.gitignore`**

Delete the line `.content-collections` from `.gitignore`.

- [ ] **Step 8: Verify the app still builds**

Run: `pnpm build`
Expected: build completes successfully (no missing-module errors for `content-collections` or `@/data/resume`).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: remove content-collections and static resume/blog data files"
```

---

## Task 15: Shared admin CRUD infrastructure (validation schemas, reorder helper, sortable list UI)

**Files:**
- Create: `src/lib/validation.ts`
- Create: `src/lib/admin-reorder.ts`
- Create: `src/components/admin/sortable-list.tsx`

**Interfaces:**
- Produces: `workSchema`, `educationSchema`, `skillSchema`, `projectSchema`, `hackathonSchema`, `blogPostSchema`, `profileSchema`, `socialLinksSchema` (all Zod, `src/lib/validation.ts`) — consumed by every admin API route in Tasks 16–22. `applyReorder(delegate, ids)` (`src/lib/admin-reorder.ts`) — consumed by every `.../reorder/route.ts`. `<SortableList>` (`src/components/admin/sortable-list.tsx`) — consumed by every list page in Tasks 18–22 (Work, Education, Skills, Projects, Hackathons; Blog uses its own list UI in Task 16 since posts aren't manually reordered).
- Consumes: `prisma` from `@/lib/prisma` (Task 3) only inside `admin-reorder.ts`'s type signature; `Button` (existing) and the `AlertDialog*` family from Task 8 inside `sortable-list.tsx`.

- [ ] **Step 1: Write `src/lib/validation.ts`**

```ts
import { z } from "zod";

export const linkItemSchema = z.object({
  type: z.string().min(1),
  href: z.string().url(),
  iconKey: z.string().min(1),
});

export const hackathonLinkItemSchema = z.object({
  title: z.string().min(1),
  href: z.string().url(),
  iconKey: z.string().min(1),
});

export const workSchema = z.object({
  company: z.string().min(1),
  href: z.string().url(),
  location: z.string().min(1),
  title: z.string().min(1),
  logoUrl: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1),
  description: z.string().min(1),
  badges: z.array(z.string()).default([]),
});
export type WorkInput = z.infer<typeof workSchema>;

export const educationSchema = z.object({
  school: z.string().min(1),
  href: z.string().url(),
  degree: z.string().min(1),
  logoUrl: z.string().min(1),
  start: z.string().min(1),
  end: z.string().min(1),
});
export type EducationInput = z.infer<typeof educationSchema>;

export const skillSchema = z.object({
  name: z.string().min(1),
  iconKey: z.string().min(1),
});
export type SkillInput = z.infer<typeof skillSchema>;

export const projectSchema = z.object({
  title: z.string().min(1),
  href: z.string().url(),
  dates: z.string().min(1),
  active: z.boolean().default(false),
  description: z.string().min(1),
  technologies: z.array(z.string()).default([]),
  image: z.string().default(""),
  video: z.string().default(""),
  links: z.array(linkItemSchema).default([]),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const hackathonSchema = z.object({
  title: z.string().min(1),
  dates: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  image: z.string().min(1),
  mlh: z.string().optional().nullable(),
  win: z.string().optional().nullable(),
  links: z.array(hackathonLinkItemSchema).default([]),
});
export type HackathonInput = z.infer<typeof hackathonSchema>;

export const blogPostSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, letters/numbers/hyphens only"),
  title: z.string().min(1),
  summary: z.string().min(1),
  content: z.string().min(1),
  image: z.string().optional().nullable(),
  draft: z.boolean().default(true),
});
export type BlogPostInput = z.infer<typeof blogPostSchema>;

export const profileSchema = z.object({
  name: z.string().min(1),
  initials: z.string().min(1),
  url: z.string().url(),
  location: z.string().min(1),
  locationLink: z.string().url(),
  description: z.string().min(1),
  summary: z.string().min(1),
  avatarUrl: z.string().min(1),
  email: z.string().email(),
  tel: z.string().min(1),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const socialLinksSchema = z.object({
  links: z.array(
    z.object({
      platform: z.enum(["GitHub", "LinkedIn", "X", "Youtube", "Email"]),
      url: z.string().min(1),
      showInNavbar: z.boolean(),
    })
  ),
});
export type SocialLinksInput = z.infer<typeof socialLinksSchema>;
```

- [ ] **Step 2: Write `src/lib/admin-reorder.ts`**

```ts
import { prisma } from "@/lib/prisma";

type Reorderable = { update: (args: { where: { id: string }; data: { sortOrder: number } }) => Promise<unknown> };

export async function applyReorder(delegate: Reorderable, ids: string[]) {
  await prisma.$transaction(ids.map((id, index) => delegate.update({ where: { id }, data: { sortOrder: index } })));
}
```

- [ ] **Step 3: Write `src/components/admin/sortable-list.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SortableListItem {
  id: string;
}

interface SortableListProps<T extends SortableListItem> {
  items: T[];
  basePath: string;
  apiPath: string;
  renderItem: (item: T) => React.ReactNode;
  renderLabel: (item: T) => string;
}

export function SortableList<T extends SortableListItem>({
  items: initialItems,
  basePath,
  apiPath,
  renderItem,
  renderLabel,
}: SortableListProps<T>) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function persistOrder(next: T[]) {
    const previous = items;
    setItems(next);
    setError(null);
    const res = await fetch(`${apiPath}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((item) => item.id) }),
    });
    if (!res.ok) {
      setItems(previous);
      setError("Could not save the new order.");
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    void persistOrder(next);
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    setError(null);
    const res = await fetch(`${apiPath}/${id}`, { method: "DELETE" });
    setPendingId(null);
    if (!res.ok) {
      setError("Could not delete this item.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} item(s)</p>
        <Button asChild size="sm">
          <Link href={`${basePath}/new`}>
            <Plus className="size-4" /> Add New
          </Link>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
            <div className="flex flex-col">
              <button type="button" aria-label="Move up" className="disabled:opacity-30" disabled={index === 0} onClick={() => move(index, -1)}>
                <ArrowUp className="size-4" />
              </button>
              <button type="button" aria-label="Move down" className="disabled:opacity-30" disabled={index === items.length - 1} onClick={() => move(index, 1)}>
                <ArrowDown className="size-4" />
              </button>
            </div>
            <div className="flex-1 min-w-0">{renderItem(item)}</div>
            <Link href={`${basePath}/${item.id}`} className="text-muted-foreground hover:text-foreground" aria-label="Edit">
              <Pencil className="size-4" />
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" className="text-muted-foreground hover:text-destructive" aria-label="Delete">
                  <Trash2 className="size-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    &quot;{renderLabel(item)}&quot; will be permanently deleted. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction disabled={pendingId === item.id} onClick={() => handleDelete(item.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No items yet.</p>}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `pnpm exec tsc --noEmit`
Expected: no errors referencing the three new files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts src/lib/admin-reorder.ts src/components/admin/sortable-list.tsx
git commit -m "feat: add shared validation schemas, reorder helper, and sortable list UI for admin CRUD"
```

---

## Task 16: Admin — Blog CRUD

**Files:**
- Create: `src/app/api/admin/blog/route.ts`
- Create: `src/app/api/admin/blog/[id]/route.ts`
- Create: `src/components/admin/blog-form.tsx`
- Create: `src/components/admin/blog-list.tsx`
- Create: `src/app/admin/(dashboard)/blog/page.tsx`
- Create: `src/app/admin/(dashboard)/blog/new/page.tsx`
- Create: `src/app/admin/(dashboard)/blog/[id]/page.tsx`

**Interfaces:**
- Consumes: `blogPostSchema` from `@/lib/validation` (Task 15); `requireAdmin` (Task 6); `prisma` (Task 3); `mdxComponents` (existing), `remarkCodeMeta` (existing) for the live preview.
- Note: list/edit pages query Prisma directly in the Server Component (no `GET` route handlers are added — nothing would ever call them).

- [ ] **Step 1: Write `src/app/api/admin/blog/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { blogPostSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = blogPostSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const created = await prisma.blogPost.create({
      data: { ...parsed.data, publishedAt: parsed.data.draft ? null : new Date() },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Slug is already in use" }, { status: 409 });
    }
    throw error;
  }
}
```

- [ ] **Step 2: Write `src/app/api/admin/blog/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { blogPostSchema } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = blogPostSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        ...parsed.data,
        publishedAt: parsed.data.draft ? existing.publishedAt : existing.publishedAt ?? new Date(),
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Slug is already in use" }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Write `src/components/admin/blog-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { remarkCodeMeta } from "@/lib/remark-code-meta";
import { mdxComponents } from "@/mdx-components";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export interface BlogFormValues {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  image: string;
  draft: boolean;
}

const emptyValues: BlogFormValues = { slug: "", title: "", summary: "", content: "", image: "", draft: true };

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function BlogForm({ initialValues }: { initialValues?: BlogFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<BlogFormValues>(initialValues ?? emptyValues);
  const [slugEdited, setSlugEdited] = useState(Boolean(initialValues));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleTitleChange(title: string) {
    setValues((prev) => ({ ...prev, title, slug: slugEdited ? prev.slug : slugify(title) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const res = await fetch(isEdit ? `/api/admin/blog/${values.id}` : "/api/admin/blog", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error === "Slug is already in use" ? body.error : "Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/blog");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-4">
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={values.title} onChange={(e) => handleTitleChange(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={values.slug}
            onChange={(e) => {
              setSlugEdited(true);
              setValues({ ...values, slug: e.target.value });
            }}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="summary">Summary</Label>
          <Textarea id="summary" rows={3} value={values.summary} onChange={(e) => setValues({ ...values, summary: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="image">Cover Image URL</Label>
          <Input id="image" value={values.image} onChange={(e) => setValues({ ...values, image: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="content">Content (Markdown)</Label>
          <Textarea
            id="content"
            rows={20}
            className="font-mono text-xs"
            value={values.content}
            onChange={(e) => setValues({ ...values, content: e.target.value })}
            required
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="draft" checked={values.draft} onChange={(checked) => setValues({ ...values, draft: checked })} />
          <Label htmlFor="draft">Draft (do not publish)</Label>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Preview</Label>
        <div className="border border-border rounded-lg p-4 prose max-w-full text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert overflow-y-auto max-h-[80vh]">
          <Markdown remarkPlugins={[remarkGfm, remarkCodeMeta]} rehypePlugins={[rehypeRaw]} components={mdxComponents}>
            {values.content || "*Content preview will appear here*"}
          </Markdown>
        </div>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Write `src/components/admin/blog-list.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Pencil } from "lucide-react";

interface BlogListItem {
  id: string;
  slug: string;
  title: string;
  draft: boolean;
}

export function BlogList({ posts: initialPosts }: { posts: BlogListItem[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setPendingId(id);
    setError(null);
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    setPendingId(null);
    if (!res.ok) {
      setError("Could not delete this post.");
      return;
    }
    setPosts((prev) => prev.filter((post) => post.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {posts.map((post) => (
        <div key={post.id} className="flex items-center gap-3 border border-border rounded-lg p-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{post.title}</span>
              {post.draft && <Badge variant="outline">Draft</Badge>}
            </div>
            <span className="text-xs text-muted-foreground">/{post.slug}</span>
          </div>
          <Link href={`/admin/blog/${post.id}`} className="text-muted-foreground hover:text-foreground" aria-label="Edit">
            <Pencil className="size-4" />
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className="text-muted-foreground hover:text-destructive" aria-label="Delete">
                <Trash2 className="size-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                <AlertDialogDescription>&quot;{post.title}&quot; will be permanently deleted. This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction disabled={pendingId === post.id} onClick={() => handleDelete(post.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
      {posts.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No posts yet.</p>}
    </div>
  );
}
```

- [ ] **Step 5: Write `src/app/admin/(dashboard)/blog/page.tsx`**

```tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { BlogList } from "@/components/admin/blog-list";

export default async function BlogListPage() {
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Blog</h1>
        <Button asChild size="sm">
          <Link href="/admin/blog/new">
            <Plus className="size-4" /> Add New
          </Link>
        </Button>
      </div>
      <BlogList posts={posts.map(({ id, slug, title, draft }) => ({ id, slug, title, draft }))} />
    </div>
  );
}
```

- [ ] **Step 6: Write `src/app/admin/(dashboard)/blog/new/page.tsx`**

```tsx
import { BlogForm } from "@/components/admin/blog-form";

export default function NewBlogPostPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Blog Post</h1>
      <BlogForm />
    </div>
  );
}
```

- [ ] **Step 7: Write `src/app/admin/(dashboard)/blog/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BlogForm } from "@/components/admin/blog-form";

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Blog Post</h1>
      <BlogForm
        initialValues={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          summary: post.summary,
          content: post.content,
          image: post.image ?? "",
          draft: post.draft,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 8: Verify**

Run: `pnpm dev`, sign in at `/admin/login`, go to `/admin/blog`.
Expected: 7 seeded posts listed, none marked "Draft". Click "Add New" — fill in a title (slug auto-fills), summary, content with a fenced code block and a `## Heading`, leave "Draft" checked, click Save — expected: redirected to `/admin/blog`, new post shows a "Draft" badge, and `http://localhost:3000/blog` does **not** list it (still draft). Edit that post, uncheck "Draft", Save — expected: badge disappears from the admin list and the post now appears on the public `/blog` list. Delete it via the trash icon (confirm in the dialog) — expected: it disappears from both the admin list and, after refresh, would not appear publicly.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/admin/blog src/components/admin/blog-form.tsx src/components/admin/blog-list.tsx src/app/admin/\(dashboard\)/blog
git commit -m "feat: add blog post admin CRUD"
```

---

## Task 17: Admin — Profile and Social Links

**Files:**
- Create: `src/app/api/admin/profile/route.ts`
- Create: `src/components/admin/profile-form.tsx`
- Create: `src/app/admin/(dashboard)/profile/page.tsx`

**Interfaces:**
- Consumes: `profileSchema`, `socialLinksSchema` from `@/lib/validation` (Task 15); `requireAdmin` (Task 6); `prisma` (Task 3).

- [ ] **Step 1: Write `src/app/api/admin/profile/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { profileSchema, socialLinksSchema } from "@/lib/validation";

const bodySchema = z.object({
  profile: profileSchema,
  social: socialLinksSchema.shape.links,
});

export async function PUT(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.profile.update({ where: { id: 1 }, data: parsed.data.profile });
  await prisma.$transaction(
    parsed.data.social.map((link) =>
      prisma.socialLink.update({
        where: { platform: link.platform },
        data: { url: link.url, showInNavbar: link.showInNavbar },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Write `src/components/admin/profile-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export interface ProfileFormValues {
  name: string;
  initials: string;
  url: string;
  location: string;
  locationLink: string;
  description: string;
  summary: string;
  avatarUrl: string;
  email: string;
  tel: string;
}

export interface SocialLinkFormValue {
  platform: "GitHub" | "LinkedIn" | "X" | "Youtube" | "Email";
  url: string;
  showInNavbar: boolean;
}

export function ProfileForm({
  initialProfile,
  initialSocial,
}: {
  initialProfile: ProfileFormValues;
  initialSocial: SocialLinkFormValue[];
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [social, setSocial] = useState(initialSocial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateSocial(platform: string, patch: Partial<SocialLinkFormValue>) {
    setSocial((prev) => prev.map((link) => (link.platform === platform ? { ...link, ...patch } : link)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/admin/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, social }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not save. Check the required fields.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-2xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && <p className="text-sm text-muted-foreground">Saved.</p>}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="initials">Initials</Label>
            <Input id="initials" value={profile.initials} onChange={(e) => setProfile({ ...profile, initials: e.target.value })} required />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="url">Site URL</Label>
          <Input id="url" type="url" value={profile.url} onChange={(e) => setProfile({ ...profile, url: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="location">Location</Label>
            <Input id="location" value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="locationLink">Location Link</Label>
            <Input id="locationLink" type="url" value={profile.locationLink} onChange={(e) => setProfile({ ...profile, locationLink: e.target.value })} required />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Short Description (hero subtitle)</Label>
          <Textarea id="description" rows={2} value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="summary">About Summary (Markdown)</Label>
          <Textarea id="summary" rows={6} value={profile.summary} onChange={(e) => setProfile({ ...profile, summary: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <Input id="avatarUrl" value={profile.avatarUrl} onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tel">Phone</Label>
            <Input id="tel" value={profile.tel} onChange={(e) => setProfile({ ...profile, tel: e.target.value })} required />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Social Links</h2>
        {social.map((link) => (
          <div key={link.platform} className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor={`social-${link.platform}`}>{link.platform}</Label>
              <Input id={`social-${link.platform}`} value={link.url} onChange={(e) => updateSocial(link.platform, { url: e.target.value })} />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Checkbox
                id={`navbar-${link.platform}`}
                checked={link.showInNavbar}
                onChange={(checked) => updateSocial(link.platform, { showInNavbar: checked })}
              />
              <Label htmlFor={`navbar-${link.platform}`}>Show in navbar</Label>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={submitting} className="w-fit">
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Write `src/app/admin/(dashboard)/profile/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/admin/profile-form";

const PLATFORMS = ["GitHub", "LinkedIn", "X", "Youtube", "Email"] as const;

export default async function ProfilePage() {
  const [profile, socialLinks] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.socialLink.findMany(),
  ]);

  if (!profile) {
    return <p className="text-sm text-destructive">Profile is not seeded yet. Run: pnpm prisma db seed</p>;
  }

  const social = PLATFORMS.map((platform) => {
    const existing = socialLinks.find((link) => link.platform === platform);
    return { platform, url: existing?.url ?? "", showInNavbar: existing?.showInNavbar ?? false };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Profile</h1>
      <ProfileForm
        initialProfile={{
          name: profile.name,
          initials: profile.initials,
          url: profile.url,
          location: profile.location,
          locationLink: profile.locationLink,
          description: profile.description,
          summary: profile.summary,
          avatarUrl: profile.avatarUrl,
          email: profile.email,
          tel: profile.tel,
        }}
        initialSocial={social}
      />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Run: `pnpm dev`, go to `/admin/profile`.
Expected: form pre-filled with seeded values, 5 social link rows (GitHub/LinkedIn/X/Youtube/Email) each pre-filled. Change the "Short Description" field and toggle "Show in navbar" off for Youtube, click Save — expected: "Saved." message appears. Reload `http://localhost:3000/` — expected: hero subtitle reflects the new description, and the dock at the bottom no longer shows the YouTube icon.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/profile src/components/admin/profile-form.tsx src/app/admin/\(dashboard\)/profile
git commit -m "feat: add profile and social links admin form"
```

---

## Task 18: Admin — Work Experience CRUD

**Files:**
- Create: `src/app/api/admin/work/route.ts`
- Create: `src/app/api/admin/work/[id]/route.ts`
- Create: `src/app/api/admin/work/reorder/route.ts`
- Create: `src/components/admin/work-form.tsx`
- Create: `src/app/admin/(dashboard)/work/page.tsx`
- Create: `src/app/admin/(dashboard)/work/new/page.tsx`
- Create: `src/app/admin/(dashboard)/work/[id]/page.tsx`

**Interfaces:**
- Consumes: `workSchema` (Task 15), `requireAdmin` (Task 6), `applyReorder` (Task 15), `SortableList` (Task 15), `prisma` (Task 3).

- [ ] **Step 1: Write `src/app/api/admin/work/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { workSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = workSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.workExperience.count();
  const created = await prisma.workExperience.create({ data: { ...parsed.data, sortOrder: count } });
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/admin/work/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { workSchema } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = workSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.workExperience.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  await prisma.workExperience.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Write `src/app/api/admin/work/reorder/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { applyReorder } from "@/lib/admin-reorder";

const schema = z.object({ ids: z.array(z.string()).min(1) });

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await applyReorder(prisma.workExperience, parsed.data.ids);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Write `src/components/admin/work-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface WorkFormValues {
  id?: string;
  company: string;
  href: string;
  location: string;
  title: string;
  logoUrl: string;
  start: string;
  end: string;
  description: string;
  badges: string[];
}

const emptyValues: WorkFormValues = {
  company: "",
  href: "",
  location: "",
  title: "",
  logoUrl: "",
  start: "",
  end: "",
  description: "",
  badges: [],
};

export function WorkForm({ initialValues }: { initialValues?: WorkFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<WorkFormValues>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const res = await fetch(isEdit ? `/api/admin/work/${values.id}` : "/api/admin/work", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/work");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="company">Company</Label>
        <Input id="company" value={values.company} onChange={(e) => setValues({ ...values, company: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="href">Company URL</Label>
        <Input id="href" type="url" value={values.href} onChange={(e) => setValues({ ...values, href: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="location">Location</Label>
        <Input id="location" value={values.location} onChange={(e) => setValues({ ...values, location: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input id="logoUrl" value={values.logoUrl} onChange={(e) => setValues({ ...values, logoUrl: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start">Start</Label>
          <Input id="start" value={values.start} onChange={(e) => setValues({ ...values, start: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end">End</Label>
          <Input id="end" value={values.end} onChange={(e) => setValues({ ...values, end: e.target.value })} required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" rows={5} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="badges">Badges (comma-separated)</Label>
        <Input
          id="badges"
          value={values.badges.join(", ")}
          onChange={(e) =>
            setValues({ ...values, badges: e.target.value.split(",").map((b) => b.trim()).filter(Boolean) })
          }
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Write `src/app/admin/(dashboard)/work/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { SortableList } from "@/components/admin/sortable-list";

export default async function WorkListPage() {
  const items = await prisma.workExperience.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Work Experience</h1>
      <SortableList
        items={items}
        basePath="/admin/work"
        apiPath="/api/admin/work"
        renderLabel={(item) => item.company}
        renderItem={(item) => (
          <div className="flex flex-col">
            <span className="font-medium">{item.company}</span>
            <span className="text-sm text-muted-foreground">
              {item.title} · {item.start} - {item.end}
            </span>
          </div>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 6: Write `src/app/admin/(dashboard)/work/new/page.tsx`**

```tsx
import { WorkForm } from "@/components/admin/work-form";

export default function NewWorkPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Work Experience</h1>
      <WorkForm />
    </div>
  );
}
```

- [ ] **Step 7: Write `src/app/admin/(dashboard)/work/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkForm } from "@/components/admin/work-form";

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = await prisma.workExperience.findUnique({ where: { id } });
  if (!work) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Work Experience</h1>
      <WorkForm initialValues={work} />
    </div>
  );
}
```

- [ ] **Step 8: Verify**

Run: `pnpm dev`, go to `/admin/work`.
Expected: 6 seeded entries listed in original order. Move the second item up via the up-arrow — expected: order swaps immediately and persists across a page reload. Add a new entry, then edit it, then delete it (confirm in the dialog) — expected: each action redirects/updates correctly and the list count matches. Reload `http://localhost:3000/` and check the "Work Experience" accordion — expected: it reflects the current DB order.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/admin/work src/components/admin/work-form.tsx src/app/admin/\(dashboard\)/work
git commit -m "feat: add work experience admin CRUD"
```

---

## Task 19: Admin — Education CRUD

**Files:**
- Create: `src/app/api/admin/education/route.ts`
- Create: `src/app/api/admin/education/[id]/route.ts`
- Create: `src/app/api/admin/education/reorder/route.ts`
- Create: `src/components/admin/education-form.tsx`
- Create: `src/app/admin/(dashboard)/education/page.tsx`
- Create: `src/app/admin/(dashboard)/education/new/page.tsx`
- Create: `src/app/admin/(dashboard)/education/[id]/page.tsx`

**Interfaces:**
- Consumes: `educationSchema` (Task 15), `requireAdmin` (Task 6), `applyReorder`/`SortableList` (Task 15), `prisma` (Task 3). Same shape as Task 18, with `Education` fields instead of `WorkExperience`.

- [ ] **Step 1: Write `src/app/api/admin/education/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { educationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = educationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.education.count();
  const created = await prisma.education.create({ data: { ...parsed.data, sortOrder: count } });
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/admin/education/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { educationSchema } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = educationSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.education.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  await prisma.education.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Write `src/app/api/admin/education/reorder/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { applyReorder } from "@/lib/admin-reorder";

const schema = z.object({ ids: z.array(z.string()).min(1) });

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await applyReorder(prisma.education, parsed.data.ids);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Write `src/components/admin/education-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface EducationFormValues {
  id?: string;
  school: string;
  href: string;
  degree: string;
  logoUrl: string;
  start: string;
  end: string;
}

const emptyValues: EducationFormValues = { school: "", href: "", degree: "", logoUrl: "", start: "", end: "" };

export function EducationForm({ initialValues }: { initialValues?: EducationFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<EducationFormValues>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const res = await fetch(isEdit ? `/api/admin/education/${values.id}` : "/api/admin/education", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/education");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="school">School</Label>
        <Input id="school" value={values.school} onChange={(e) => setValues({ ...values, school: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="degree">Degree</Label>
        <Input id="degree" value={values.degree} onChange={(e) => setValues({ ...values, degree: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="href">School URL</Label>
        <Input id="href" type="url" value={values.href} onChange={(e) => setValues({ ...values, href: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input id="logoUrl" value={values.logoUrl} onChange={(e) => setValues({ ...values, logoUrl: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="start">Start</Label>
          <Input id="start" value={values.start} onChange={(e) => setValues({ ...values, start: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="end">End</Label>
          <Input id="end" value={values.end} onChange={(e) => setValues({ ...values, end: e.target.value })} required />
        </div>
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Write `src/app/admin/(dashboard)/education/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { SortableList } from "@/components/admin/sortable-list";

export default async function EducationListPage() {
  const items = await prisma.education.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Education</h1>
      <SortableList
        items={items}
        basePath="/admin/education"
        apiPath="/api/admin/education"
        renderLabel={(item) => item.school}
        renderItem={(item) => (
          <div className="flex flex-col">
            <span className="font-medium">{item.school}</span>
            <span className="text-sm text-muted-foreground">
              {item.degree} · {item.start} - {item.end}
            </span>
          </div>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 6: Write `src/app/admin/(dashboard)/education/new/page.tsx`**

```tsx
import { EducationForm } from "@/components/admin/education-form";

export default function NewEducationPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Education</h1>
      <EducationForm />
    </div>
  );
}
```

- [ ] **Step 7: Write `src/app/admin/(dashboard)/education/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EducationForm } from "@/components/admin/education-form";

export default async function EditEducationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const education = await prisma.education.findUnique({ where: { id } });
  if (!education) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Education</h1>
      <EducationForm initialValues={education} />
    </div>
  );
}
```

- [ ] **Step 8: Verify**

Run: `pnpm dev`, go to `/admin/education`.
Expected: 4 seeded entries listed. Reorder, add, edit, and delete one entry the same way as Task 18's verification. Reload `http://localhost:3000/` — expected: the "Education" section reflects the current DB order.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/admin/education src/components/admin/education-form.tsx src/app/admin/\(dashboard\)/education
git commit -m "feat: add education admin CRUD"
```

---

## Task 20: Admin — Skills CRUD

**Files:**
- Create: `src/app/api/admin/skills/route.ts`
- Create: `src/app/api/admin/skills/[id]/route.ts`
- Create: `src/app/api/admin/skills/reorder/route.ts`
- Create: `src/components/admin/skill-form.tsx`
- Create: `src/app/admin/(dashboard)/skills/page.tsx`
- Create: `src/app/admin/(dashboard)/skills/new/page.tsx`
- Create: `src/app/admin/(dashboard)/skills/[id]/page.tsx`

**Interfaces:**
- Consumes: `skillSchema` (Task 15), `requireAdmin` (Task 6), `applyReorder`/`SortableList` (Task 15), `IconSelect`/`getIcon` (Task 4/8), `prisma` (Task 3).

- [ ] **Step 1: Write `src/app/api/admin/skills/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { skillSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = skillSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.skill.count();
  const created = await prisma.skill.create({ data: { ...parsed.data, sortOrder: count } });
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/admin/skills/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { skillSchema } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = skillSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.skill.update({ where: { id }, data: parsed.data });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  await prisma.skill.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Write `src/app/api/admin/skills/reorder/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { applyReorder } from "@/lib/admin-reorder";

const schema = z.object({ ids: z.array(z.string()).min(1) });

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await applyReorder(prisma.skill, parsed.data.ids);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Write `src/components/admin/skill-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IconSelect } from "@/components/ui/icon-select";
import type { IconKey } from "@/lib/icon-registry";

export interface SkillFormValues {
  id?: string;
  name: string;
  iconKey: string;
}

const emptyValues: SkillFormValues = { name: "", iconKey: "globe" };

export function SkillForm({ initialValues }: { initialValues?: SkillFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<SkillFormValues>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const res = await fetch(isEdit ? `/api/admin/skills/${values.id}` : "/api/admin/skills", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/skills");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="iconKey">Icon</Label>
        <IconSelect value={values.iconKey} onChange={(iconKey: IconKey) => setValues({ ...values, iconKey })} />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Write `src/app/admin/(dashboard)/skills/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { SortableList } from "@/components/admin/sortable-list";
import { getIcon } from "@/lib/icon-registry";

export default async function SkillsListPage() {
  const items = await prisma.skill.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Skills</h1>
      <SortableList
        items={items}
        basePath="/admin/skills"
        apiPath="/api/admin/skills"
        renderLabel={(item) => item.name}
        renderItem={(item) => {
          const Icon = getIcon(item.iconKey);
          return (
            <div className="flex items-center gap-2">
              {Icon && <Icon className="size-4" />}
              <span className="font-medium">{item.name}</span>
            </div>
          );
        }}
      />
    </div>
  );
}
```

- [ ] **Step 6: Write `src/app/admin/(dashboard)/skills/new/page.tsx`**

```tsx
import { SkillForm } from "@/components/admin/skill-form";

export default function NewSkillPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Skill</h1>
      <SkillForm />
    </div>
  );
}
```

- [ ] **Step 7: Write `src/app/admin/(dashboard)/skills/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SkillForm } from "@/components/admin/skill-form";

export default async function EditSkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skill = await prisma.skill.findUnique({ where: { id } });
  if (!skill) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Skill</h1>
      <SkillForm initialValues={skill} />
    </div>
  );
}
```

- [ ] **Step 8: Verify**

Run: `pnpm dev`, go to `/admin/skills`.
Expected: 11 seeded skills listed, each with its icon. Add a new skill (pick an icon from the dropdown, e.g. "docker"), reorder it, then delete it. Reload `http://localhost:3000/` — expected: the "Skills" section on the public page reflects the current DB contents/order.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/admin/skills src/components/admin/skill-form.tsx src/app/admin/\(dashboard\)/skills
git commit -m "feat: add skills admin CRUD"
```

---

## Task 21: Admin — Projects CRUD

**Files:**
- Create: `src/app/api/admin/projects/route.ts`
- Create: `src/app/api/admin/projects/[id]/route.ts`
- Create: `src/app/api/admin/projects/reorder/route.ts`
- Create: `src/components/admin/project-form.tsx`
- Create: `src/app/admin/(dashboard)/projects/page.tsx`
- Create: `src/app/admin/(dashboard)/projects/new/page.tsx`
- Create: `src/app/admin/(dashboard)/projects/[id]/page.tsx`

**Interfaces:**
- Consumes: `projectSchema` (Task 15), `requireAdmin` (Task 6), `applyReorder`/`SortableList` (Task 15), `IconSelect` (Task 8), `prisma` (Task 3). `Project.links` is a Prisma `Json` column — API routes cast the validated array `as Prisma.InputJsonValue`.

- [ ] **Step 1: Write `src/app/api/admin/projects/route.ts`**

```ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { projectSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = projectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.project.count();
  const created = await prisma.project.create({
    data: { ...parsed.data, links: parsed.data.links as Prisma.InputJsonValue, sortOrder: count },
  });
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/admin/projects/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { projectSchema } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = projectSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id },
    data: { ...parsed.data, links: parsed.data.links as Prisma.InputJsonValue },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Write `src/app/api/admin/projects/reorder/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { applyReorder } from "@/lib/admin-reorder";

const schema = z.object({ ids: z.array(z.string()).min(1) });

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await applyReorder(prisma.project, parsed.data.ids);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Write `src/components/admin/project-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { IconSelect } from "@/components/ui/icon-select";
import type { IconKey } from "@/lib/icon-registry";
import { Trash2, Plus } from "lucide-react";

export interface ProjectLinkValue {
  type: string;
  href: string;
  iconKey: string;
}

export interface ProjectFormValues {
  id?: string;
  title: string;
  href: string;
  dates: string;
  active: boolean;
  description: string;
  technologies: string[];
  image: string;
  video: string;
  links: ProjectLinkValue[];
}

const emptyValues: ProjectFormValues = {
  title: "",
  href: "",
  dates: "",
  active: false,
  description: "",
  technologies: [],
  image: "",
  video: "",
  links: [],
};

export function ProjectForm({ initialValues }: { initialValues?: ProjectFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<ProjectFormValues>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateLink(index: number, patch: Partial<ProjectLinkValue>) {
    setValues((prev) => ({ ...prev, links: prev.links.map((link, i) => (i === index ? { ...link, ...patch } : link)) }));
  }

  function addLink() {
    setValues((prev) => ({ ...prev, links: [...prev.links, { type: "Website", href: "", iconKey: "globe" }] }));
  }

  function removeLink(index: number) {
    setValues((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const res = await fetch(isEdit ? `/api/admin/projects/${values.id}` : "/api/admin/projects", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/projects");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="href">Project URL</Label>
        <Input id="href" type="url" value={values.href} onChange={(e) => setValues({ ...values, href: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="dates">Dates</Label>
        <Input id="dates" value={values.dates} onChange={(e) => setValues({ ...values, dates: e.target.value })} required placeholder="Jan 2024 - Feb 2024" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="active" checked={values.active} onChange={(checked) => setValues({ ...values, active: checked })} />
        <Label htmlFor="active">Active</Label>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (Markdown)</Label>
        <Textarea id="description" rows={4} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="technologies">Technologies (comma-separated)</Label>
        <Input
          id="technologies"
          value={values.technologies.join(", ")}
          onChange={(e) => setValues({ ...values, technologies: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" value={values.image} onChange={(e) => setValues({ ...values, image: e.target.value })} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="video">Video URL</Label>
        <Input id="video" value={values.video} onChange={(e) => setValues({ ...values, video: e.target.value })} />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Links</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLink}>
            <Plus className="size-4" /> Add Link
          </Button>
        </div>
        {values.links.map((link, index) => (
          <div key={index} className="flex items-end gap-2 border border-border rounded-lg p-3">
            <div className="flex flex-col gap-1.5 w-28">
              <Label htmlFor={`link-type-${index}`}>Label</Label>
              <Input id={`link-type-${index}`} value={link.type} onChange={(e) => updateLink(index, { type: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor={`link-href-${index}`}>URL</Label>
              <Input id={`link-href-${index}`} value={link.href} onChange={(e) => updateLink(index, { href: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Icon</Label>
              <IconSelect value={link.iconKey} onChange={(iconKey: IconKey) => updateLink(index, { iconKey })} />
            </div>
            <button type="button" aria-label="Remove link" className="text-muted-foreground hover:text-destructive pb-2" onClick={() => removeLink(index)}>
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Write `src/app/admin/(dashboard)/projects/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { SortableList } from "@/components/admin/sortable-list";

export default async function ProjectsListPage() {
  const items = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Projects</h1>
      <SortableList
        items={items}
        basePath="/admin/projects"
        apiPath="/api/admin/projects"
        renderLabel={(item) => item.title}
        renderItem={(item) => (
          <div className="flex flex-col">
            <span className="font-medium">{item.title}</span>
            <span className="text-sm text-muted-foreground">{item.dates}</span>
          </div>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 6: Write `src/app/admin/(dashboard)/projects/new/page.tsx`**

```tsx
import { ProjectForm } from "@/components/admin/project-form";

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Project</h1>
      <ProjectForm />
    </div>
  );
}
```

- [ ] **Step 7: Write `src/app/admin/(dashboard)/projects/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectForm } from "@/components/admin/project-form";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Project</h1>
      <ProjectForm
        initialValues={{
          id: project.id,
          title: project.title,
          href: project.href,
          dates: project.dates,
          active: project.active,
          description: project.description,
          technologies: project.technologies,
          image: project.image,
          video: project.video,
          links: project.links as { type: string; href: string; iconKey: string }[],
        }}
      />
    </div>
  );
}
```

- [ ] **Step 8: Verify**

Run: `pnpm dev`, go to `/admin/projects`.
Expected: 4 seeded projects listed. Edit "Chat Collect" — expected: its one "Website" link is pre-filled with the globe icon selected. Add a second link row (e.g. type "Source", pick the "github" icon, paste a repo URL), Save — expected: redirected to the list, and `http://localhost:3000/` project card now shows two badges (Website + Source) with the correct icons.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/admin/projects src/components/admin/project-form.tsx src/app/admin/\(dashboard\)/projects
git commit -m "feat: add projects admin CRUD"
```

---

## Task 22: Admin — Hackathons CRUD

**Files:**
- Create: `src/app/api/admin/hackathons/route.ts`
- Create: `src/app/api/admin/hackathons/[id]/route.ts`
- Create: `src/app/api/admin/hackathons/reorder/route.ts`
- Create: `src/components/admin/hackathon-form.tsx`
- Create: `src/app/admin/(dashboard)/hackathons/page.tsx`
- Create: `src/app/admin/(dashboard)/hackathons/new/page.tsx`
- Create: `src/app/admin/(dashboard)/hackathons/[id]/page.tsx`

**Interfaces:**
- Consumes: `hackathonSchema` (Task 15), `requireAdmin` (Task 6), `applyReorder`/`SortableList` (Task 15), `IconSelect` (Task 8), `prisma` (Task 3). Same `links` Json pattern as Task 21, but each link is `{title, href, iconKey}` (not `{type, href, iconKey}`) per the spec's `Hackathon` model.

- [ ] **Step 1: Write `src/app/api/admin/hackathons/route.ts`**

```ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { hackathonSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const parsed = hackathonSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const count = await prisma.hackathon.count();
  const created = await prisma.hackathon.create({
    data: { ...parsed.data, links: parsed.data.links as Prisma.InputJsonValue, sortOrder: count },
  });
  return NextResponse.json(created, { status: 201 });
}
```

- [ ] **Step 2: Write `src/app/api/admin/hackathons/[id]/route.ts`**

```ts
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { hackathonSchema } from "@/lib/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const parsed = hackathonSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.hackathon.update({
    where: { id },
    data: { ...parsed.data, links: parsed.data.links as Prisma.InputJsonValue },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  await prisma.hackathon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: Write `src/app/api/admin/hackathons/reorder/route.ts`**

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { applyReorder } from "@/lib/admin-reorder";

const schema = z.object({ ids: z.array(z.string()).min(1) });

export async function POST(request: Request) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  await applyReorder(prisma.hackathon, parsed.data.ids);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Write `src/components/admin/hackathon-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { IconSelect } from "@/components/ui/icon-select";
import type { IconKey } from "@/lib/icon-registry";
import { Trash2, Plus } from "lucide-react";

export interface HackathonLinkValue {
  title: string;
  href: string;
  iconKey: string;
}

export interface HackathonFormValues {
  id?: string;
  title: string;
  dates: string;
  location: string;
  description: string;
  image: string;
  mlh: string;
  win: string;
  links: HackathonLinkValue[];
}

const emptyValues: HackathonFormValues = {
  title: "",
  dates: "",
  location: "",
  description: "",
  image: "",
  mlh: "",
  win: "",
  links: [],
};

export function HackathonForm({ initialValues }: { initialValues?: HackathonFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<HackathonFormValues>(initialValues ?? emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateLink(index: number, patch: Partial<HackathonLinkValue>) {
    setValues((prev) => ({ ...prev, links: prev.links.map((link, i) => (i === index ? { ...link, ...patch } : link)) }));
  }

  function addLink() {
    setValues((prev) => ({ ...prev, links: [...prev.links, { title: "Source", href: "", iconKey: "github" }] }));
  }

  function removeLink(index: number) {
    setValues((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const isEdit = Boolean(values.id);
    const payload = { ...values, mlh: values.mlh || null, win: values.win || null };
    const res = await fetch(isEdit ? `/api/admin/hackathons/${values.id}` : "/api/admin/hackathons", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Could not save. Check the required fields.");
      return;
    }
    router.push("/admin/hackathons");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={values.title} onChange={(e) => setValues({ ...values, title: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dates">Dates</Label>
          <Input id="dates" value={values.dates} onChange={(e) => setValues({ ...values, dates: e.target.value })} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" value={values.location} onChange={(e) => setValues({ ...values, location: e.target.value })} required />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description (Markdown)</Label>
        <Textarea id="description" rows={4} value={values.description} onChange={(e) => setValues({ ...values, description: e.target.value })} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">Image URL</Label>
        <Input id="image" value={values.image} onChange={(e) => setValues({ ...values, image: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mlh">MLH Badge URL (optional)</Label>
          <Input id="mlh" value={values.mlh} onChange={(e) => setValues({ ...values, mlh: e.target.value })} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="win">Award (optional)</Label>
          <Input id="win" value={values.win} onChange={(e) => setValues({ ...values, win: e.target.value })} placeholder="1st Place Winner" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Links</Label>
          <Button type="button" variant="outline" size="sm" onClick={addLink}>
            <Plus className="size-4" /> Add Link
          </Button>
        </div>
        {values.links.map((link, index) => (
          <div key={index} className="flex items-end gap-2 border border-border rounded-lg p-3">
            <div className="flex flex-col gap-1.5 w-32">
              <Label htmlFor={`link-title-${index}`}>Label</Label>
              <Input id={`link-title-${index}`} value={link.title} onChange={(e) => updateLink(index, { title: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <Label htmlFor={`link-href-${index}`}>URL</Label>
              <Input id={`link-href-${index}`} value={link.href} onChange={(e) => updateLink(index, { href: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Icon</Label>
              <IconSelect value={link.iconKey} onChange={(iconKey: IconKey) => updateLink(index, { iconKey })} />
            </div>
            <button type="button" aria-label="Remove link" className="text-muted-foreground hover:text-destructive pb-2" onClick={() => removeLink(index)}>
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 5: Write `src/app/admin/(dashboard)/hackathons/page.tsx`**

```tsx
import { prisma } from "@/lib/prisma";
import { SortableList } from "@/components/admin/sortable-list";

export default async function HackathonsListPage() {
  const items = await prisma.hackathon.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Hackathons</h1>
      <SortableList
        items={items}
        basePath="/admin/hackathons"
        apiPath="/api/admin/hackathons"
        renderLabel={(item) => item.title}
        renderItem={(item) => (
          <div className="flex flex-col">
            <span className="font-medium">{item.title}</span>
            <span className="text-sm text-muted-foreground">
              {item.location} · {item.dates}
            </span>
          </div>
        )}
      />
    </div>
  );
}
```

- [ ] **Step 6: Write `src/app/admin/(dashboard)/hackathons/new/page.tsx`**

```tsx
import { HackathonForm } from "@/components/admin/hackathon-form";

export default function NewHackathonPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Hackathon</h1>
      <HackathonForm />
    </div>
  );
}
```

- [ ] **Step 7: Write `src/app/admin/(dashboard)/hackathons/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { HackathonForm } from "@/components/admin/hackathon-form";

export default async function EditHackathonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hackathon = await prisma.hackathon.findUnique({ where: { id } });
  if (!hackathon) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Edit Hackathon</h1>
      <HackathonForm
        initialValues={{
          id: hackathon.id,
          title: hackathon.title,
          dates: hackathon.dates,
          location: hackathon.location,
          description: hackathon.description,
          image: hackathon.image,
          mlh: hackathon.mlh ?? "",
          win: hackathon.win ?? "",
          links: hackathon.links as { title: string; href: string; iconKey: string }[],
        }}
      />
    </div>
  );
}
```

- [ ] **Step 8: Verify**

Run: `pnpm dev`, go to `/admin/hackathons`.
Expected: 20 seeded entries listed in original order. Edit "HackDavis" — expected: its "win" field shows "Best Data Hack" and its 4 links (Devpost/ML/iOS/Server) are pre-filled with correct icons (globe for Devpost, github for the other three). Reorder the list, add a new hackathon, then delete it. Reload `http://localhost:3000/` — expected: the "Hackathons" timeline count and order matches the DB.

- [ ] **Step 9: Commit**

```bash
git add src/app/api/admin/hackathons src/components/admin/hackathon-form.tsx src/app/admin/\(dashboard\)/hackathons
git commit -m "feat: add hackathons admin CRUD"
```

---

## Task 23: Wire real counts into the admin dashboard

**Files:**
- Modify: `src/app/admin/(dashboard)/page.tsx`

**Interfaces:**
- Consumes: `prisma` (Task 3). Replaces the Task 9 placeholder now that every resource from Tasks 16–22 exists.

- [ ] **Step 1: Rewrite the file**

```tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [posts, drafts, work, education, skills, projects, hackathons] = await Promise.all([
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { draft: true } }),
    prisma.workExperience.count(),
    prisma.education.count(),
    prisma.skill.count(),
    prisma.project.count(),
    prisma.hackathon.count(),
  ]);

  const stats = [
    { label: "Blog Posts", value: posts, hint: `${drafts} draft${drafts === 1 ? "" : "s"}`, href: "/admin/blog" },
    { label: "Work Experience", value: work, hint: null, href: "/admin/work" },
    { label: "Education", value: education, hint: null, href: "/admin/education" },
    { label: "Skills", value: skills, hint: null, href: "/admin/skills" },
    { label: "Projects", value: projects, hint: null, href: "/admin/projects" },
    { label: "Hackathons", value: hackathons, hint: null, href: "/admin/hackathons" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors">
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            {stat.hint && <p className="text-xs text-muted-foreground mt-1">{stat.hint}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `pnpm dev`, go to `/admin`.
Expected: 6 stat cards with correct counts (7 posts / however many are still drafts from Task 16's testing, 6 work, 4 education, 11 skills, 4 projects, 20 hackathons — adjust expectations for whatever you added/deleted while testing earlier tasks). Click each card — expected: navigates to the matching list page.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/\(dashboard\)/page.tsx
git commit -m "feat: wire real resource counts into the admin dashboard"
```

---

## Task 24: Documentation — README setup instructions

**Files:**
- Modify: `README.md`

**Interfaces:**
- None (documentation only).

- [ ] **Step 1: Update the "Features" bullet that references the deleted config file**

In `README.md`, replace:
```md
- Setup only takes a few minutes by editing the [single config file](./src/data/resume.tsx)
```
with:
```md
- All content (blog posts, resume/profile data) is managed through a built-in, password-protected [admin panel](#admin-panel) — no code changes or redeploys needed
```

- [ ] **Step 2: Replace step 5 of "Getting Started Locally"**

Replace:
```md
5. Open the [Config file](./src/data/resume.tsx) and make changes
```
with:
```md
5. Set up the database and admin credentials — see [Admin Panel](#admin-panel) below, then run:

   ```bash
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

6. Open [http://localhost:3000/admin](http://localhost:3000/admin) and sign in with the password you hashed into `ADMIN_PASSWORD_HASH`
```

- [ ] **Step 3: Add an "Admin Panel" section before "License"**

```md
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
```

- [ ] **Step 4: Verify**

Read the rendered `README.md` (e.g. `pnpm dlx markdown-preview README.md` or just re-open the file) and confirm no remaining reference to `src/data/resume.tsx`.

Run: `grep -n "resume.tsx" README.md`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document admin panel setup and environment variables"
```

---

## Plan Self-Review Notes

- **Spec coverage:** every section of `docs/superpowers/specs/2026-09-16-admin-panel-design.md` maps to a task — §1 Architecture → Tasks 1–3, 7; §2 Data Model → Task 2 (+ Task 2's Hackathon addendum); §3 Auth → Tasks 5–7; §4 Pages → Tasks 9, 16–22; §5 Migration → Task 11, 14; §6 Error Handling → validation in Task 15 + per-route handling in Tasks 16–22 + `AlertDialog` confirmations in Task 8/15; §7 Test → every task's "Verify" step is manual, matching the spec's explicit no-automated-tests decision.
- **Placeholder scan:** no `TBD`/`TODO`/"similar to Task N" remain — every step shows the file's full real content.
- **Type consistency:** `IconKey`/`ICON_REGISTRY`/`getIcon` (Task 4) are used with the same signatures in Tasks 8, 12, 13, 20, 21, 22. `applyReorder(delegate, ids)` (Task 15) is called identically by every `.../reorder/route.ts` in Tasks 18–22. `SortableList<T extends {id: string}>` (Task 15) is used with matching `basePath`/`apiPath`/`renderItem`/`renderLabel` props in Tasks 18–22. `requireAdmin()` (Task 6) is the first call in every admin API route from Task 16 onward.

