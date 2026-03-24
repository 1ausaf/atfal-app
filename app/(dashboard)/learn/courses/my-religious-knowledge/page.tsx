import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MyReligiousKnowledgeMap } from "@/components/learn/my-religious-knowledge-map";

export default async function MyReligiousKnowledgePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "tifl") redirect("/dashboard");

  return (
    <div className="max-w-6xl mx-auto p-4">
      <MyReligiousKnowledgeMap />
    </div>
  );
}
