import { HackathonForm } from "@/components/admin/hackathon-form";

export default function NewHackathonPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Hackathon</h1>
      <HackathonForm />
    </div>
  );
}
