import { getProfile, getEducation, getSkills } from "@/lib/data";
import ContactSection from "@/components/section/contact-section";
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
      profile={profile}
      education={education}
      skills={skills}
      workComponent={<WorkSection />}
      projectsComponent={<ProjectsSection />}
      articlesComponent={<ArticlesSection />}
      hackathonsComponent={<HackathonsSection />}
      contactComponent={<ContactSection />}
    />
  );
}
