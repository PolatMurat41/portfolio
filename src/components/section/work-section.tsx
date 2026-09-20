import { getWorkExperience } from "@/lib/data";
import { WorkSectionClient } from "./work-section-client";

export default async function WorkSection() {
  const work = await getWorkExperience();
  return <WorkSectionClient work={work} />;
}
