"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Filter, AlertCircle, Info, CheckCircle, Clock } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/notifications");
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
      toast.success("All marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success("Notification deleted");
    } catch (err) {
      toast.error("Failed to delete notification");
    }
  };

  const clearAll = async () => {
    try {
      await api.delete("/notifications/clear-all");
      setNotifications([]);
      toast.success("All notifications cleared");
    } catch (err) {
      toast.error("Failed to clear notifications");
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === "unread") return !n.is_read;
    if (filter === "all") return true;
    return n.category === filter;
  });

  const getIcon = (category) => {
    switch (category) {
      case "task": return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case "leave": return <Clock className="w-5 h-5 text-amber-500" />;
      case "attendance": return <Info className="w-5 h-5 text-green-500" />;
      case "performance": return <AlertCircle className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500 text-sm">Stay updated with your latest activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllAsRead}
            disabled={!notifications.some(n => !n.is_read)}
          >
            <Check className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            disabled={notifications.length === 0}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button 
          variant={filter === "all" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setFilter("all")}
          className="rounded-full"
        >
          All
        </Button>
        <Button 
          variant={filter === "unread" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setFilter("unread")}
          className="rounded-full"
        >
          Unread
        </Button>
        <Button 
          variant={filter === "task" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setFilter("task")}
          className="rounded-full"
        >
          Tasks
        </Button>
        <Button 
          variant={filter === "leave" ? "default" : "ghost"} 
          size="sm" 
          onClick={() => setFilter("leave")}
          className="rounded-full"
        >
          Leaves
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 w-full bg-slate-100 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredNotifications.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4 bg-slate-50/50 border-dashed">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <Bell className="w-8 h-8 text-slate-300" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-700">No notifications found</h3>
            <p className="text-slate-500 text-sm">You&apos;re all caught up!</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => (
            <Card 
              key={notif.id} 
              className={`p-4 transition-all duration-200 border-l-4 ${!notif.is_read ? 'border-l-brand-orange bg-brand-orange/[0.01]' : 'border-l-slate-200 opacity-80'}`}
            >
              <div className="flex gap-4">
                <div className="mt-1">
                  {getIcon(notif.category)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-base ${!notif.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-slate-400">
                      {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {notif.message}
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize text-[10px] py-0 px-2 h-5">
                        {notif.category}
                      </Badge>
                      {notif.link && (
                        <a 
                          href={notif.link} 
                          className="text-xs font-bold text-brand-orange hover:underline"
                        >
                          View details
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!notif.is_read && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-green-600"
                          onClick={() => markAsRead(notif.id)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600"
                        onClick={() => deleteNotification(notif.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
