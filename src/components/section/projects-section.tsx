import { getProjects } from "@/lib/data";
import { ProjectsSectionClient } from "./projects-section-client";

export default async function ProjectsSection() {
  const projects = await getProjects();
  return <ProjectsSectionClient projects={projects} />;
}
