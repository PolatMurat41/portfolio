import { getSocialLinks } from "@/lib/data";
import { NavbarClient } from "./navbar-client";

export default async function Navbar() {
  const socialLinks = await getSocialLinks();
  return <NavbarClient socialLinks={socialLinks} />;
}
