import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

const DOC_META: Record<string, { title: string }> = {
  "sagheer-g1": { title: "Mayar-e-Sagheer (Group 1)" },
  "sagheer-g2": { title: "Mayar-e-Sagheer (Group 2)" },
  kabeer: { title: "Mayar-e-Kabeer" },
};

export default async function IjtimaViewerPage({
  params,
}: {
  params: { doc: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const docKey = params.doc;
  const meta = DOC_META[docKey];
  if (!meta) redirect("/activities/ijtima");

  const apiSrc = `/api/ijtima/pdf?doc=${encodeURIComponent(docKey)}`;

  return (
    <div className="max-w-6xl mx-auto min-h-[70dvh] flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gta-text tracking-tight truncate">{meta.title}</h1>
          <p className="text-sm text-gta-textSecondary mt-1">
            If the PDF doesn’t load, try opening it in a new tab.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/activities/ijtima" className="link-kid text-sm">
            Back to IJTIMA
          </Link>
          <a
            href={apiSrc}
            target="_blank"
            rel="noreferrer"
            className="btn-kid-primary px-4 py-2 rounded-gta text-sm font-semibold"
          >
            Open in new tab
          </a>
        </div>
      </div>

      <div className="card-kid p-0 overflow-hidden min-h-[70dvh]">
        <iframe
          title={`${meta.title} PDF`}
          src={apiSrc}
          className="w-full h-[75dvh] bg-white"
        />
      </div>
    </div>
  );
}

