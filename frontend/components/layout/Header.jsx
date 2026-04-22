"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, User, Menu, X } from "lucide-react";
import api from "@/lib/api";

export default function Header({ toggleSidebar, isSidebarOpen }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.data);
      } catch (err) {
        console.error("Failed to fetch user in header", err);
      }
    };
    fetchUser();
  }, []);

  // Simple breadcrumb extraction
  const getPageTitle = () => {
    const segments = pathname.split("/").filter(Boolean);
    if (!segments.length) return "Dashboard";
    const title = segments[0];
    return title.charAt(0).toUpperCase() + title.slice(1);
  };

  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-[72px] px-4 md:px-8 glass shadow-sm transition-all duration-300 w-full">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 md:hidden text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
          {getPageTitle()}
        </h2>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 text-slate-500 transition-all duration-200 rounded-full hover:bg-slate-100 hover:text-brand-orange"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-orange rounded-full border-2 border-white"></span>
          </button>

          {showNotifications && (
            <>
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setShowNotifications(false)}
              />
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-premium border border-slate-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-brand-navy">Notifications</h3>
                  <span className="text-[10px] bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full font-bold">2 NEW</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <div className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                    <p className="text-sm font-semibold text-slate-800">Welcome to DD Infoways!</p>
                    <p className="text-xs text-slate-500 mt-1">Your account has been successfully set up.</p>
                    <p className="text-[10px] text-brand-orange mt-2 font-medium">Just now</p>
                  </div>
                  <div className="p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors opacity-60">
                    <p className="text-sm font-semibold text-slate-800">System Update</p>
                    <p className="text-xs text-slate-500 mt-1">New dashboard features have been released.</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">2 hours ago</p>
                  </div>
                </div>
                <div className="p-3 text-center bg-slate-50/30 border-t border-slate-50">
                  <button className="text-xs font-bold text-brand-navy hover:text-brand-orange transition-colors">Mark all as read</button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 pl-5 border-l border-slate-200">
          <div className="hidden text-right md:block">
            <p className="text-sm font-bold text-slate-900 leading-none mb-1">{user?.name || "Loading..."}</p>
            <p className="text-xs text-slate-500 font-medium leading-none">{user?.email || ""}</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 text-brand-orange bg-brand-orange/10 border border-brand-orange/20 shadow-inner rounded-full transition-transform hover:scale-105 cursor-pointer">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
