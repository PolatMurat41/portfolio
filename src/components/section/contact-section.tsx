import { getSocialLinks } from "@/lib/data";
import { ContactSectionClient } from "./contact-section-client";

export default async function ContactSection() {
  const socialLinks = await getSocialLinks();

  return (
    <ContactSectionClient
      socialLinks={socialLinks
        .filter((social) => social.platform !== "Email" && social.url)
        .map(({ id, platform, url }) => ({ id, platform, url }))}
    />
  );
}
