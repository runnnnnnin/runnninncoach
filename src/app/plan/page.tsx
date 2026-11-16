import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { PlanView } from "./PlanView";

export const metadata: Metadata = { title: "Ton plan · RunFlow" };

export default function PlanPage() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="no-print">
          <Logo />
        </div>
        <div className="mt-8 pb-16">
          <PlanView />
        </div>
      </div>
    </main>
  );
}
