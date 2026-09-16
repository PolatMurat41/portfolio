import { WorkForm } from "@/components/admin/work-form";

export default function NewWorkPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Work Experience</h1>
      <WorkForm />
    </div>
  );
}
