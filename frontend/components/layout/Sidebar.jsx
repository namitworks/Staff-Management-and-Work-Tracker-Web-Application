"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FolderKanban, 
  CalendarClock, 
  CalendarDays, 
  TrendingUp, 
  Banknote, 
  Settings,
  LogOut,
  CreditCard
} from "lucide-react";
import { removeToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import api from "@/lib/api";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Staff", href: "/staff", icon: Users },
  { name: "ID Cards", href: "/staff/idcards", icon: CreditCard },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Attendance", href: "/attendance", icon: CalendarClock },
  { name: "Leaves", href: "/leaves", icon: CalendarDays },
  { name: "Performance", href: "/performance", icon: TrendingUp },
  { name: "Salary", href: "/salary", icon: Banknote },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.data);
      } catch (err) {
        console.error("Failed to fetch user in sidebar", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.name === "Staff") return user?.role === 'admin' || user?.role === 'team_lead';
    if (item.name === "ID Cards") return user?.role === 'admin';
    return true;
  });

  return (
    <>
    {/* Mobile Overlay */}
    {isOpen && (
      <div 
        className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
    )}
    
    <div className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-brand-navy text-white shadow-xl z-50 transition-transform duration-300 md:translate-x-0 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}>
      <div className="flex flex-col items-center justify-center py-6 border-b border-white/5 shrink-0 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 md:hidden p-1 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
        <Link href="/dashboard" className="block p-2">
          <img 
            src="/logo.png" 
            alt="DD Infoways" 
            className="h-10 w-auto object-contain drop-shadow-lg"
          />
        </Link>
        <span className="text-[10px] uppercase tracking-[0.2em] text-brand-orange font-bold mt-2 opacity-80">
          Management System
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <nav className="px-4 py-6 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 mx-3 my-1 text-sm font-medium rounded-xl transition-all duration-300 relative group overflow-hidden ${
                  isActive 
                    ? "bg-brand-orange text-white shadow-[0_4px_15px_rgba(234,88,12,0.3)] shadow-brand-orange/30 transform scale-[1.02]" 
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />}
                <Icon className="w-5 h-5 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 mt-auto border-t border-white/5 shrink-0 bg-black/10">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-slate-400 rounded-xl transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Logout
        </button>
      </div>
    </div>
    </>
  );
}
