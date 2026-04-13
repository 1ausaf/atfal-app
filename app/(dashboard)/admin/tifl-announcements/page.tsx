import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { TiflAnnouncementsAdminClient } from "./tifl-announcements-admin-client";

export default async function TiflAnnouncementsAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "regional_nazim" && session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gta-text mb-2">Tifl announcements</h1>
      <p className="text-gta-textSecondary mb-6">
        Publish messages that appear as a popup for tifls until they close it. Each new announcement is shown once per tifl.
      </p>
      <TiflAnnouncementsAdminClient />
    </div>
  );
}
