import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function CoursesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "tifl") redirect("/dashboard");

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-gta-text mb-2">Courses</h1>
      <p className="text-gta-textSecondary mb-6">Choose a course and continue your learning adventure.</p>

      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/learn/salat"
          className="card-kid p-5 hover:scale-[1.02] transition-transform duration-200 border-l-4 border-l-gta-primary"
        >
          <h2 className="text-xl font-bold text-gta-text">SALAT Course</h2>
          <p className="text-sm text-gta-textSecondary mt-2">
            Continue your Salat progress, complete categories, and prepare for tests.
          </p>
        </Link>

        <Link
          href="/learn/courses/my-religious-knowledge"
          className="card-kid p-5 hover:scale-[1.02] transition-transform duration-200 border-l-4 border-l-gta-secondary"
        >
          <h2 className="text-xl font-bold text-gta-text">My Religious Knowledge</h2>
          <p className="text-sm text-gta-textSecondary mt-2">
            A gamified checkpoint map with mastery stars and locked progression.
          </p>
        </Link>
      </div>
    </div>
  );
}
