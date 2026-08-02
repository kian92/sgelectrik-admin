import Link from "next/link";
import { Car, Truck } from "lucide-react";

const TABS = [
  { href: "/dealer/cars", label: "Cars", icon: Car },
  { href: "/dealer/commercial-evs", label: "Commercial EVs", icon: Truck },
] as const;

export function ListingTypeTabs({ active }: { active: "cars" | "commercial-evs" }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 mb-4">
      {TABS.map(({ href, label, icon: Icon }) => {
        const isActive = href === `/dealer/${active}`;
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
