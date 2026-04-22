"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarClock, CheckSquare, LayoutDashboard, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/attendance", label: "Attendance", icon: CalendarClock },
  { href: "/staff/me", label: "Profile", icon: User, dynamic: true }
];

export default function MobileBottomNav({ user }) {
  const pathname = usePathname();

  if (user?.role !== "staff") return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-white/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-4">
        {navItems.map((item) => {
          const href = item.dynamic ? `/staff/${user.id}` : item.href;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = item.icon;

          return (
            <Link key={item.label} href={href} className={`flex flex-col items-center py-2 text-xs ${active ? "text-[#1A3A5C]" : "text-slate-500"}`}>
              <Icon className="mb-1 h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
