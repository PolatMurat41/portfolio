import { getSocialLinks } from "@/lib/data";
import { ContactSectionClient } from "./contact-section-client";

export default async function ContactSection() {
  const socialLinks = await getSocialLinks();
  const emailLink = socialLinks.find((social) => social.platform === "Email");

  return <ContactSectionClient emailLink={emailLink} />;
}
