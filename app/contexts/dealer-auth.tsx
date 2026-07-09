"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

type Dealer = {
  id: number;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: "admin" | "dealer";
  status: string;
  slug: string;
  shortName: string;
  area?: string | null;
  phone?: string | null;
  avatar?: string | null;
  provider?: string;
};

type DealerAuthContextType = {
  dealer: Dealer | null;
  loading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<Dealer | null>;
};

const DealerAuthContext = createContext<DealerAuthContextType>({
  dealer: null,
  loading: true,
  isAdmin: false,
  refresh: async () => null,
});

export function DealerAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();

  const toDealer = (user: Session["user"] | undefined): Dealer | null =>
    user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          status: user.status,
          slug: user.slug,
          shortName: user.shortName,
          area: user.area ?? null,
          phone: user.phone ?? null,
          avatar: user.avatar ?? null,
          provider: user.provider ?? undefined,
        }
      : null;

  const dealer = toDealer(session?.user);

  const refresh = async () => {
    // update() resolves with the freshly-fetched session — use it directly
    // instead of issuing a second, racing fetch("/api/auth/session").
    const updated = await update();
    return toDealer(updated?.user);
  };

  return (
    <DealerAuthContext.Provider
      value={{
        dealer,
        loading: status === "loading",
        isAdmin: dealer?.role === "admin",
        refresh,
      }}
    >
      {children}
    </DealerAuthContext.Provider>
  );
}

export function useDealerAuth() {
  return useContext(DealerAuthContext);
}
