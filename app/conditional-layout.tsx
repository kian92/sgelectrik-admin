"use client";

import { usePathname } from "next/navigation";
import BackofficeLayout from "./backoffice-layout";

// Pages that should NOT have the sidebar
const NO_LAYOUT_PATHS = ["/backoffice-login", "/backoffice-signup"];

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAuthPage = NO_LAYOUT_PATHS.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return <BackofficeLayout>{children}</BackofficeLayout>;
}
