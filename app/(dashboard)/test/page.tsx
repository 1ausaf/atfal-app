import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function TestHubPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "local_nazim" && session.user.role !== "regional_nazim" && session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gta-text mb-2">TEST</h1>
      <p className="text-gta-textSecondary mb-5">Manage section-level test requests from tifls.</p>

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/learn/salat/pending"
          className="card-kid p-5 hover:scale-[1.01] transition-transform duration-150 border-l-4 border-l-gta-primary"
        >
          <h2 className="text-lg font-bold text-gta-text">Salat Tests</h2>
          <p className="text-sm text-gta-textSecondary mt-2">
            Review and mark Salat category test requests.
          </p>
        </Link>
        <Link
          href="/test/religious-knowledge"
          className="card-kid p-5 hover:scale-[1.01] transition-transform duration-150 border-l-4 border-l-gta-secondary"
        >
          <h2 className="text-lg font-bold text-gta-text">Religious Knowledge Tests</h2>
          <p className="text-sm text-gta-textSecondary mt-2">
            Review and mark full-section Religious Knowledge test requests.
          </p>
        </Link>
      </div>
    </div>
  );
}
