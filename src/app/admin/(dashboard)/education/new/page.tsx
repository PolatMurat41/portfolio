import { EducationForm } from "@/components/admin/education-form";

export default function NewEducationPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Education</h1>
      <EducationForm />
    </div>
  );
}
