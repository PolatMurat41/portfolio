import { getProfile, getEducation, getSkills } from "@/lib/data";
import HackathonsSection from "@/components/section/hackathons-section";
import ProjectsSection from "@/components/section/projects-section";
import WorkSection from "@/components/section/work-section";
import ArticlesSection from "@/components/section/articles-section";
import { HomeContent } from "@/components/home-content";

export default async function Page() {
  const [profile, education, skills] = await Promise.all([
    getProfile(),
    getEducation(),
    getSkills(),
  ]);

  return (
    <HomeContent
      // Only what the page shows: the full row also holds the email and phone
      // number, which would otherwise be serialized into the page payload.
      profile={{
        name: profile.name,
        initials: profile.initials,
        location: profile.location,
        locationLink: profile.locationLink,
        description: profile.description,
        descriptionEn: profile.descriptionEn,
        summary: profile.summary,
        summaryEn: profile.summaryEn,
        avatarUrl: profile.avatarUrl,
      }}
      education={education}
      skills={skills}
      workComponent={<WorkSection />}
      projectsComponent={<ProjectsSection />}
      articlesComponent={<ArticlesSection />}
      hackathonsComponent={<HackathonsSection />}
    />
  );
}
