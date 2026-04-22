"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSession } from "next-auth/react";

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
  refresh: () => Promise<void>;
};

const DealerAuthContext = createContext<DealerAuthContextType>({
  dealer: null,
  loading: true,
  isAdmin: false,
  refresh: async () => {},
});

export function DealerAuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status, update } = useSession();

  const dealer: Dealer | null = session?.user
    ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role,
        status: session.user.status,
        slug: session.user.slug,
        shortName: session.user.shortName,
        area: session.user.area ?? null,
        phone: session.user.phone ?? null,
        avatar: session.user.avatar ?? null,
        provider: session.user.provider ?? undefined,
      }
    : null;

  const refresh = async () => {
    await update(); // triggers JWT refresh → fetches latest DB data
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
