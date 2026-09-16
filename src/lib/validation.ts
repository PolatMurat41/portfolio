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
