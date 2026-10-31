import { ResumeHub } from "@/components/resume/hub";
import { requireSession } from "./guard";

export default async function BackOfficePage() {
  await requireSession("/backoffice");
  return <ResumeHub />;
}
