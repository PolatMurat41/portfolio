import { getProfile, getSocialLinks } from "@/lib/data";
import { ContactSectionClient } from "./contact-section-client";

export default async function ContactSection() {
  const [profile, socialLinks] = await Promise.all([getProfile(), getSocialLinks()]);

  return (
    <ContactSectionClient
      email={profile.email}
      socialLinks={socialLinks
        .filter((social) => social.platform !== "Email" && social.url)
        .map(({ id, platform, url }) => ({ id, platform, url }))}
    />
  );
}
