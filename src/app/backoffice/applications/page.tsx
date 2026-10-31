import { Applications } from "@/components/jobs/applications";
import { requireSession } from "../guard";

export default async function ApplicationsPage() {
  await requireSession("/backoffice/applications");
  return <Applications />;
}
