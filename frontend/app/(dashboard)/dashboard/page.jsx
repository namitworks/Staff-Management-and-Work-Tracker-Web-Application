"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, CheckSquare, CalendarClock, Plane } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import api from "@/lib/api";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data.data);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const isStaff = stats?.role === 'staff';

  const statCards = isStaff ? [
    { title: "My Tasks", value: stats?.tasksToday, icon: CheckSquare, route: "/tasks", label: `${stats?.pendingTasks || 0} pending` },
    { title: "Tasks Done", value: stats?.doneTasks, icon: CheckSquare, route: "/tasks", label: "Completed today" },
    { title: "Today's Status", value: stats?.presentToday > 0 ? "Present" : "Absent", icon: CalendarClock, route: "/attendance", label: "Attendance" },
    { title: "My Leaves", value: stats?.pendingLeaves, icon: Plane, route: "/leaves", label: "Pending requests" },
  ] : [
    { title: "Total Staff", value: stats?.totalStaff, icon: Users, route: "/staff", label: "Active employees" },
    { title: "Tasks Today", value: stats?.tasksToday, icon: CheckSquare, route: "/tasks", label: `${stats?.pendingTasks || 0} pending` },
    { title: "Present Today", value: stats?.presentToday, icon: CalendarClock, route: "/attendance", label: "Checked in" },
    { title: "Pending Leaves", value: stats?.pendingLeaves, icon: Plane, route: "/leaves", label: "Awaiting approval" },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="border-none shadow-premium hover:shadow-xl transition-all duration-300 group overflow-hidden">
              <div className="h-1 w-full bg-brand-orange/5 group-hover:bg-brand-orange transition-colors" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  {card.title}
                </CardTitle>
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-brand-orange/10 transition-colors">
                  <Icon className="w-4 h-4 text-slate-400 group-hover:text-brand-orange transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800 tracking-tight">{card.value !== undefined ? card.value : '0'}</div>
                <div className="flex items-center gap-1.5 mt-2">
                   <div className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
                   <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">{card.label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-premium rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md text-slate-800 font-bold">Tasks Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.taskPipeline || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#EA580C" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-none shadow-premium rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md text-slate-800 font-bold">Attendance Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.attendanceTrends || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 11}} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="present" stroke="#0F172A" strokeWidth={4} dot={{r: 5, fill: '#0F172A', strokeWidth: 2, stroke: '#fff'}} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lists Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-premium rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md text-slate-800 font-bold">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentTasks?.length > 0 ? (
                stats.recentTasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50 border-slate-100 hover:border-brand-orange/20 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-slate-200 text-brand-orange">
                         <CheckSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{t.title}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{t.assignee || 'Unassigned'}</p>
                      </div>
                    </div>
                    <Badge className={`rounded-lg py-1 px-3 border-none capitalize ${t.priority === 'urgent' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                      {t.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center flex flex-col items-center justify-center space-y-2 border-2 border-dashed border-slate-100 rounded-2xl">
                   <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                      <CheckSquare className="w-6 h-6" />
                   </div>
                   <p className="text-sm font-medium text-slate-500">No tasks assigned today</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-premium rounded-2xl">
          <CardHeader>
            <CardTitle className="text-md text-slate-800 font-bold">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.pendingLeaves > 0 ? (
              <div className="flex justify-between items-center bg-orange-50/50 p-4 border border-orange-100 rounded-xl text-orange-800 text-sm">
                <span className="font-medium">{stats.pendingLeaves} Leave requests require approval.</span>
                <span className="font-bold cursor-pointer shrink-0 text-brand-orange hover:translate-x-1 transition-transform">Review &rarr;</span>
              </div>
            ) : (
              <div className="py-10 text-center flex flex-col items-center justify-center space-y-2">
                 <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                    <CheckSquare className="w-6 h-6" />
                 </div>
                 <p className="text-sm font-medium text-slate-500">Everything is caught up!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
