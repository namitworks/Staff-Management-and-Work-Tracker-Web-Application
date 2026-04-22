"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, User, Menu, X, CheckSquare, CalendarClock, FileText, TrendingUp, Banknote, Info } from "lucide-react";
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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications");
      if (data.success) {
        setNotifications(data.data.slice(0, 10)); // Only show last 10 in dropdown
        setUnreadCount(data.unread_count ?? data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
    return () => clearInterval(interval);
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await api.put(`/notifications/${notif.id}/read`);
        fetchNotifications();
      }
      setShowNotifications(false);
      if (notif.link) {
        window.location.href = notif.link;
      }
    } catch (err) {
      console.error("Failed to handle notification click", err);
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getCategoryIcon = (category) => {
    if (category === "task") return <CheckSquare className="w-4 h-4 text-blue-600" />;
    if (category === "leave") return <FileText className="w-4 h-4 text-amber-600" />;
    if (category === "attendance") return <CalendarClock className="w-4 h-4 text-emerald-600" />;
    if (category === "performance") return <TrendingUp className="w-4 h-4 text-purple-600" />;
    if (category === "payslip") return <Banknote className="w-4 h-4 text-indigo-600" />;
    return <Info className="w-4 h-4 text-slate-500" />;
  };

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
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
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
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-brand-orange/10 text-brand-orange px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.is_read ? 'bg-brand-orange/[0.02]' : 'opacity-70'}`}
                      >
                        <div className="flex gap-2">
                          <div className="mt-0.5">{getCategoryIcon(notif.category)}</div>
                          <div className="min-w-0">
                            <p className={`text-sm ${!notif.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                              {notif.title}
                            </p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className={`text-[10px] mt-2 font-medium ${!notif.is_read ? 'text-brand-orange' : 'text-slate-400'}`}>
                              {getTimeAgo(notif.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-3 flex items-center justify-between bg-slate-50/30 border-t border-slate-50 px-4">
                  <button 
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-brand-navy hover:text-brand-orange transition-colors"
                  >
                    Mark all as read
                  </button>
                  <a 
                    href="/notifications" 
                    className="text-[11px] font-bold text-brand-orange hover:underline"
                  >
                    View all
                  </a>
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
