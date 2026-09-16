import { ProjectForm } from "@/components/admin/project-form";

export default function NewProjectPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Project</h1>
      <ProjectForm />
    </div>
  );
}
