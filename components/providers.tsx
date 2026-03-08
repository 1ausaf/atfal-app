"use client";

import { SessionProvider } from "next-auth/react";
import { PointsEarnedProvider } from "@/components/points-earned-toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PointsEarnedProvider>{children}</PointsEarnedProvider>
    </SessionProvider>
  );
}
