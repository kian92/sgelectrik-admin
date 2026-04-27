"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useDealerAuth } from "@/app/contexts/dealer-auth";
import {
  BatteryCharging,
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  LogOut,
  Menu,
  X,
  ClipboardList,
  Building2,
  ChevronRight,
  FileDigit,
  Zap,
  Wrench,
  Car,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "./lib/utils";

const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/claims", label: "Dealer Claims", icon: ClipboardList },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/dealers", label: "Dealers", icon: Building2 },
  { href: "/admin/coe-prices", label: "COE Prices", icon: FileDigit },
  { href: "/admin/charging", label: "Charging Map", icon: Zap },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
  { href: "/admin/workshops", label: "Workshops", icon: Wrench },
  { href: "/admin/rentals", label: "EV Rentals", icon: Car },
];

const DEALER_NAV = [
  { href: "/dealer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dealer/listings", label: "My Listings", icon: FileText },
  { href: "/dealer/rentals", label: "My Rentals", icon: Car },
  { href: "/dealer/leads", label: "My Leads", icon: Users },
  { href: "/dealer/workshops", label: "Workshops", icon: Wrench },
];

function Sidebar({
  mobile,
  onClose,
}: {
  mobile?: boolean;
  onClose?: () => void;
}) {
  const { dealer, isAdmin } = useDealerAuth();
  const pathname = usePathname();
  const nav = isAdmin ? ADMIN_NAV : DEALER_NAV;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-slate-900 text-white",
        mobile ? "w-72" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-slate-700/50 flex-shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <BatteryCharging className="h-5 w-5 text-emerald-400" />
          <span className="font-bold text-sm tracking-tight">SGElectrik</span>
          <span className="text-xs text-slate-400 font-normal">Backoffice</span>
        </Link>
        {mobile && (
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User card */}
      <div className="px-4 py-4 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-3 bg-slate-800 rounded-xl px-3 py-2.5">
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {dealer?.shortName?.charAt(0) ?? dealer?.name?.charAt(0) ?? "U"}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate">{dealer?.name}</div>
            <div className="text-xs text-slate-400 truncate">
              {dealer?.area ?? dealer?.email}
            </div>
          </div>
          <span
            className={cn(
              "ml-auto text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0",
              isAdmin
                ? "bg-amber-500/20 text-amber-400"
                : "bg-emerald-500/20 text-emerald-400",
            )}
          >
            {isAdmin ? "Admin" : "Dealer"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {label}
              {active && (
                <ChevronRight className="h-3.5 w-3.5 ml-auto text-emerald-400/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 flex-shrink-0">
        <button
          onClick={() => signOut({ callbackUrl: "/backoffice-login" })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function BackofficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col flex-shrink-0">
        <div className="sticky top-0 h-screen">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="flex-shrink-0">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 h-14 px-4 bg-white border-b border-slate-200 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="flex-shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <BatteryCharging className="h-4 w-4 text-emerald-500" />
            <span className="font-bold text-sm">SGElectrik Backoffice</span>
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
