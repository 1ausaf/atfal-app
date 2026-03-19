import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { LetterToHuzoorForm } from "./letter-to-huzoor-form";

export default async function LetterToHuzoorPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (session.user.role !== "tifl") {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gta-text tracking-tight">Letter to Huzoor</h1>
            <p className="text-gta-textSecondary mt-1">This section is available for Tifl accounts only.</p>
          </div>
          <Link href="/activities" className="link-kid text-sm whitespace-nowrap">
            Back to Activities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gta-text tracking-tight">Letter to Huzoor</h1>
          <p className="text-gta-textSecondary mt-1">Type your letter in the boxes below, then press SEND LETTER.</p>
        </div>
        <Link href="/activities" className="link-kid text-sm whitespace-nowrap">
          Back to Activities
        </Link>
      </div>

      <LetterToHuzoorForm />
    </div>
  );
}

