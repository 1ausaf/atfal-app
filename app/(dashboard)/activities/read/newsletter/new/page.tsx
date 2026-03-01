import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AddNewsletterForm } from "./add-newsletter-form";

export default async function NewNewsletterPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim" && session.user.role !== "local_nazim") redirect("/activities/read/newsletter");

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Add newsletter document</h1>
      <AddNewsletterForm />
    </div>
  );
}
