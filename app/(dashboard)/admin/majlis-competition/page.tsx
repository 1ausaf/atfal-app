import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MajlisCompetitionAdminClient } from "./majlis-competition-client";

export default async function MajlisCompetitionAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gta-text mb-2">Majlis Competition</h1>
      <p className="text-gta-textSecondary mb-5">
        Set season goal and prize, then provide Majlis member counts to generate fairness coefficients.
      </p>
      <MajlisCompetitionAdminClient />
    </div>
  );
}
