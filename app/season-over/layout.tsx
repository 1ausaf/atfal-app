export default function SeasonOverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh min-h-screen overflow-x-hidden bg-[#050a12] text-slate-100 antialiased">
      {children}
    </div>
  );
}
