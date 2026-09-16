import { prisma } from "@/lib/prisma";
import { ProfileForm } from "@/components/admin/profile-form";

const PLATFORMS = ["GitHub", "LinkedIn", "X", "Youtube", "Email"] as const;

export default async function ProfilePage() {
  const [profile, socialLinks] = await Promise.all([
    prisma.profile.findUnique({ where: { id: 1 } }),
    prisma.socialLink.findMany(),
  ]);

  if (!profile) {
    return <p className="text-sm text-destructive">Profile is not seeded yet. Run: pnpm prisma db seed</p>;
  }

  const social = PLATFORMS.map((platform) => {
    const existing = socialLinks.find((link) => link.platform === platform);
    return { platform, url: existing?.url ?? "", showInNavbar: existing?.showInNavbar ?? false };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Profile</h1>
      <ProfileForm
        initialProfile={{
          name: profile.name,
          initials: profile.initials,
          url: profile.url,
          location: profile.location,
          locationLink: profile.locationLink,
          description: profile.description,
          summary: profile.summary,
          avatarUrl: profile.avatarUrl,
          email: profile.email,
          tel: profile.tel,
        }}
        initialSocial={social}
      />
    </div>
  );
}
