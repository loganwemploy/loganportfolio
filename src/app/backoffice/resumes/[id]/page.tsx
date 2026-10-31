import type { Metadata } from "next";
import { ResumeEditor } from "@/components/resume/editor";
import { requireSession } from "../../guard";

export const metadata: Metadata = {
  title: "Resume Studio · Back office",
};

export default async function ResumePage({ params }: PageProps<"/backoffice/resumes/[id]">) {
  const { id } = await params;
  await requireSession(`/backoffice/resumes/${encodeURIComponent(id)}`);
  return <ResumeEditor id={id} />;
}
