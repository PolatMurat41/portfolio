import type { ChatbotSettings } from "@prisma/client";
import {
  getEducation,
  getHackathons,
  getProfile,
  getProjects,
  getPublishedPosts,
  getSkills,
  getSocialLinks,
  getWorkExperience,
} from "@/lib/data";

type Language = "tr" | "en";

function section(title: string, lines: string[]): string {
  const body = lines.filter(Boolean).join("\n");
  return body ? `## ${title}\n${body}` : "";
}

function withEn(primary: string, english?: string | null): string {
  return english && english.trim() && english.trim() !== primary.trim()
    ? `${primary}\n  (EN) ${english}`
    : primary;
}

// Renders the admin-managed portfolio data as plain text for the model.
// Output is deterministic for unchanged data (everything is read in a fixed
// order), which keeps the system prompt byte-stable for prompt caching.
export async function buildPortfolioContext(): Promise<string> {
  const [profile, social, work, education, skills, projects, posts, hackathons] = await Promise.all([
    getProfile(),
    getSocialLinks(),
    getWorkExperience(),
    getEducation(),
    getSkills(),
    getProjects(),
    getPublishedPosts(),
    getHackathons(),
  ]);
  const siteUrl = profile.url.replace(/\/+$/, "");

  return [
    section("Profile", [
      `Name: ${profile.name}`,
      `Title: ${withEn(profile.description, profile.descriptionEn)}`,
      `Location: ${profile.location}`,
      `Email: ${profile.email}`,
      `Website: ${siteUrl}`,
    ]),
    section("About", [withEn(profile.summary, profile.summaryEn)]),
    section(
      "Social links",
      social.filter((s) => s.url).map((s) => `- ${s.platform}: ${s.url.replace(/^mailto:/, "")}`)
    ),
    section(
      "Work experience",
      work.map(
        (w) =>
          `- ${w.company} — ${withEn(w.title, w.titleEn)} (${w.start} – ${w.end}, ${w.location})\n  ${withEn(
            w.description,
            w.descriptionEn
          )}${w.badges.length ? `\n  Tags: ${w.badges.join(", ")}` : ""}`
      )
    ),
    section(
      "Education",
      education.map((e) => `- ${e.school} — ${e.degree} (${e.start} – ${e.end})`)
    ),
    section("Skills", skills.length ? [skills.map((s) => s.name).join(", ")] : []),
    section(
      "Projects",
      projects.map(
        (p) =>
          `- ${withEn(p.title, p.titleEn)} (${p.dates}) — ${p.href}\n  ${withEn(
            p.description,
            p.descriptionEn
          )}${p.technologies.length ? `\n  Technologies: ${p.technologies.join(", ")}` : ""}`
      )
    ),
    section(
      "Articles & publications",
      posts.map(
        (post) =>
          `- ${withEn(post.title, post.titleEn)} — ${siteUrl}/blog/${post.slug}\n  ${withEn(
            post.summary,
            post.summaryEn
          )}`
      )
    ),
    section(
      "Hackathons",
      hackathons.map(
        (h) => `- ${h.title} (${h.dates}, ${h.location})${h.win ? ` — ${h.win}` : ""}\n  ${h.description}`
      )
    ),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function applyPlaceholders(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => values[key] ?? match);
}

export async function buildSystemPrompt(
  settings: Pick<ChatbotSettings, "systemPrompt" | "includeContext">,
  language: Language
): Promise<string> {
  let name = "";
  let email = "";
  let context = "";
  try {
    const profile = await getProfile();
    name = profile.name;
    email = profile.email;
    if (settings.includeContext) context = await buildPortfolioContext();
  } catch (e) {
    console.error("Could not build portfolio context for the chatbot:", e);
  }

  const parts = [applyPlaceholders(settings.systemPrompt, { name, email })];
  if (context) parts.push(`<portfolio>\n${context}\n</portfolio>`);
  parts.push(
    language === "en"
      ? "The visitor is browsing the site in English."
      : "Ziyaretçi siteyi Türkçe görüntülüyor."
  );
  return parts.join("\n\n");
}
