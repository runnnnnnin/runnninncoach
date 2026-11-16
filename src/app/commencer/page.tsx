import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Questionnaire } from "./Questionnaire";

export const metadata: Metadata = { title: "Crée ton plan · RunFlow" };

export default function Commencer() {
  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Logo />
        <div className="mt-14 pb-16">
          <Questionnaire />
        </div>
      </div>
    </main>
  );
}
