import type { Metadata } from "next";
import "./studio.css";

export const metadata: Metadata = {
  title: "Back office · Logan Wilson",
  description: "Private tools: edit, version and export tailored resumes.",
  robots: { index: false, follow: false },
};

export default function BackOfficeLayout({ children }: LayoutProps<"/backoffice">) {
  return children;
}
