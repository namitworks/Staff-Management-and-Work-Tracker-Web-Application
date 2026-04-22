"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import api from "@/lib/api";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const setup = async () => {
      setIsMounted(true);
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        setCurrentUser(data.data);
      } catch (_error) {
        router.push("/login");
      } finally {
        setIsSidebarOpen(false);
      }
    };

    setup();
  }, [router, pathname]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!isMounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 md:pl-64 overflow-hidden w-full transition-all duration-300">
        <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-8">
          {children}
        </main>
      </div>
      <MobileBottomNav user={currentUser} />
    </div>
  );
}
