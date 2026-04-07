import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { WorldguessrChatPopup } from "@/components/worldguessr/worldguessr-chat-popup";

export default async function WorldGuessrPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">WorldGuessr</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        Play inside GTA Centre Atfal. Popups and top-level navigation are blocked for safety.
      </p>

      <div className="card-kid p-3 sm:p-4">
        <iframe
          title="WorldGuessr"
          src="https://www.worldguessr.com/"
          className="w-full min-h-[75vh] rounded-xl bg-slate-100 dark:bg-slate-900"
          sandbox="allow-scripts allow-same-origin allow-forms allow-pointer-lock"
          referrerPolicy="no-referrer"
          allow="fullscreen; geolocation"
        />
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          If this game does not load, the provider may be blocking iframe embeds.
        </p>
      </div>
      <WorldguessrChatPopup currentUserId={session.user.id} />
    </div>
  );
}
