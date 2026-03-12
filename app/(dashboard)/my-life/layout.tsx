import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function MyLifeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "tifl") redirect("/dashboard");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <Link
          href="/my-life"
          className="text-xl font-bold text-gta-text dark:text-slate-100"
        >
          My Life
        </Link>
      </div>
      {children}
    </div>
  );
}
