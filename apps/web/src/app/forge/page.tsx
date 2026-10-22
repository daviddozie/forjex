import { Metadata } from "next";
import { ForgeWizard } from "@/components/forge-wizard/forge-wizard";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Cloud Forge Wizard — Forjex",
  description:
    "Scaffold, configure GitHub repositories, setup CI/CD pipelines, and deploy live to Vercel in seconds.",
};

export default function ForgePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col items-center">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <Badge variant="vercel" className="mb-2 uppercase tracking-widest text-[10px]">
          Cloud Automation
        </Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
          Cloud Forge Wizard
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 mt-2">
          Create repositories, generate CI/CD actions, and deploy straight to Vercel without touching the command line.
        </p>
      </div>

      <ForgeWizard />
    </div>
  );
}
