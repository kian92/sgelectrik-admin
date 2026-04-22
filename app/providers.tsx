"use client";

import { SessionProvider } from "next-auth/react";
import { DealerAuthProvider } from "./contexts/dealer-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DealerAuthProvider>{children}</DealerAuthProvider>
    </SessionProvider>
  );
}
