import { getSocialLinks } from "@/lib/data";
import { NavbarClient } from "./navbar-client";

export default async function Navbar() {
  // Links hidden from the dock aren't sent to the browser at all.
  const socialLinks = (await getSocialLinks()).filter((social) => social.showInNavbar);
  return <NavbarClient socialLinks={socialLinks} />;
}
