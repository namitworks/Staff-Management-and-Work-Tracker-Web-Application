"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  FolderKanban,
  Loader2,
  Users
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "short"
  });
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [refreshingAction, setRefreshingAction] = useState(false);
  const [stats, setStats] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [myAttendance, setMyAttendance] = useState([]);
  const [myPerformance, setMyPerformance] = useState([]);

  const isAdminView = currentUser?.role === "admin" || currentUser?.role === "team_lead";

  const fetchDashboard = async () => {
    const [statsRes, meRes] = await Promise.all([api.get("/dashboard/stats"), api.get("/auth/me")]);
    setStats(statsRes.data.data);
    setCurrentUser(meRes.data.data);

    if (meRes.data.data.role === "staff") {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const [balanceRes, attendanceRes, performanceRes] = await Promise.all([
        api.get(`/leaves/balance/${meRes.data.data.id}`),
        api.get(`/attendance/user/${meRes.data.data.id}?month=${month}&year=${year}`),
        api.get(`/performance/${meRes.data.data.id}`)
      ]);

      setLeaveBalance(balanceRes.data.data);
      setMyAttendance(attendanceRes.data.data?.records || []);
      setMyPerformance((performanceRes.data.data?.notes || []).slice(0, 2));
    }
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await fetchDashboard();
      } catch (error) {
        console.error("Dashboard load error:", error);
        toast.error(error.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const handleCheckInOut = async () => {
    if (!stats?.todays_attendance?.length || !currentUser) return;
    const todayRecord = stats.todays_attendance[0];
    try {
      setRefreshingAction(true);
      if (!todayRecord.check_in) {
        await api.post("/attendance/checkin");
      } else if (!todayRecord.check_out) {
        await api.post("/attendance/checkout");
      }
      await fetchDashboard();
      toast.success("Attendance updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update attendance");
    } finally {
      setRefreshingAction(false);
    }
  };

  const handleLeaveDecision = async (leaveId, action) => {
    try {
      setRefreshingAction(true);
      if (action === "approve") {
        await api.put(`/leaves/${leaveId}/approve`, { admin_note: "Approved from dashboard" });
      } else {
        await api.put(`/leaves/${leaveId}/reject`, { admin_note: "Rejected from dashboard" });
      }
      await fetchDashboard();
      toast.success(`Leave ${action}d`);
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${action} leave`);
    } finally {
      setRefreshingAction(false);
    }
  };

  const taskStatusWeek = useMemo(
    () => [
      { status: "To Do", value: stats?.tasks?.todo || 0 },
      { status: "In Progress", value: stats?.tasks?.in_progress || 0 },
      { status: "Review", value: stats?.tasks?.review || 0 },
      { status: "Done", value: stats?.tasks?.done || 0 }
    ],
    [stats]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((key) => (
            <Skeleton key={key} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!stats || !currentUser) return null;

  return isAdminView ? (
    <AdminDashboard
      stats={stats}
      taskStatusWeek={taskStatusWeek}
      onLeaveDecision={handleLeaveDecision}
      refreshingAction={refreshingAction}
    />
  ) : (
    <StaffDashboard
      stats={stats}
      leaveBalance={leaveBalance}
      myAttendance={myAttendance}
      myPerformance={myPerformance}
      onCheckInOut={handleCheckInOut}
      refreshingAction={refreshingAction}
    />
  );
}

function AdminDashboard({ stats, taskStatusWeek, onLeaveDecision, refreshingAction }) {
  const cards = [
    { label: "Total Staff", value: stats.staff.total, icon: Users, trend: `${stats.staff.new_this_month} new this month` },
    { label: "Present Today", value: stats.attendance.present_today, icon: CalendarClock, trend: `${stats.attendance.absent_today} absent` },
    { label: "Pending Leaves", value: stats.leaves.pending_approvals, icon: ClipboardList, trend: `${stats.leaves.approved_this_month} approved this month` },
    { label: "Active Tasks", value: stats.tasks.total, icon: CheckSquare, trend: `${stats.tasks.completed_this_week} completed this week` },
    { label: "Active Projects", value: stats.projects.active, icon: FolderKanban, trend: `${stats.projects.completed} completed` },
    { label: "Tasks Overdue", value: stats.tasks.overdue, icon: AlertTriangle, trend: "Needs immediate action" }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-slate-500">{card.label}</p>
                  <Icon className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{card.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by Status This Week</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStatusWeek}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2E75B6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance Last 30 Days</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.attendance_trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} />
                <YAxis />
                <Tooltip labelFormatter={(value) => formatDate(value)} />
                <Line type="monotone" dataKey="present_count" stroke="#1A3A5C" strokeWidth={2.5} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.recent_tasks || []).map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.assignee_name || "Unassigned"}</p>
                </div>
                <div className="text-right">
                  <Badge className="capitalize">{task.priority}</Badge>
                  <p className="mt-1 text-xs text-slate-500 capitalize">{task.status.replace("_", " ")}</p>
                </div>
              </div>
            ))}
            <Link href="/tasks" className="block text-sm font-semibold text-[#1A3A5C]">
              View All Tasks
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pending Leave Approvals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.pending_leaves || []).map((leave) => (
              <div key={leave.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{leave.staff_name}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {leave.type} • {formatDate(leave.from_date)} → {formatDate(leave.to_date)} • {leave.total_days} day(s)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onLeaveDecision(leave.id, "approve")} disabled={refreshingAction}>
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onLeaveDecision(leave.id, "reject")} disabled={refreshingAction}>
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            <Link href="/leaves" className="block text-sm font-semibold text-[#1A3A5C]">
              View All Leaves
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Who&apos;s In Today —{" "}
            {new Date().toLocaleDateString("en-NZ", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
              timeZone: "Pacific/Auckland"
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {(stats.todays_attendance || []).map((member) => (
              <div
                key={member.user_id}
                className={`rounded-lg border p-3 ${
                  member.status === "present"
                    ? "border-emerald-300"
                    : member.status === "late"
                      ? "border-amber-300"
                      : "border-slate-200"
                }`}
              >
                <p className="font-medium text-slate-900">{member.name}</p>
                <p className="text-xs text-slate-500">{member.check_in ? `In: ${formatDateTime(member.check_in)}` : "Not checked in"}</p>
                <Badge className="mt-2 capitalize">{member.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StaffDashboard({ stats, leaveBalance, myAttendance, myPerformance, onCheckInOut, refreshingAction }) {
  const today = stats.todays_attendance?.[0] || null;
  const canCheckIn = !today?.check_in;
  const canCheckOut = Boolean(today?.check_in && !today?.check_out);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-600">
              Status: <span className="font-semibold capitalize">{today?.status || "absent"}</span>
            </p>
            <Button onClick={onCheckInOut} disabled={refreshingAction || (!canCheckIn && !canCheckOut)}>
              {refreshingAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {canCheckIn ? "Check In" : canCheckOut ? "Check Out" : "Completed for Today"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.recent_tasks || []).map((task) => (
              <div key={task.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-slate-900">{task.title}</p>
                  <Badge className="capitalize">{task.priority}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500 capitalize">
                  {task.status.replace("_", " ")} • Due: {formatDate(task.deadline)}
                </p>
              </div>
            ))}
            <Link href="/tasks" className="block text-sm font-semibold text-[#1A3A5C]">
              View My Tasks
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My Leave Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Annual remaining: {leaveBalance?.annual_remaining ?? "-"}</p>
            <p>Sick remaining: {leaveBalance?.sick_remaining ?? "-"}</p>
            <p>Personal remaining: {leaveBalance?.personal_remaining ?? "-"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Attendance This Month</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-7 gap-1">
            {myAttendance.slice(0, 31).map((day) => (
              <div
                key={day.date}
                className={`h-7 rounded text-center text-[10px] leading-7 ${
                  day.status === "present"
                    ? "bg-emerald-100 text-emerald-700"
                    : day.status === "late"
                      ? "bg-amber-100 text-amber-700"
                      : day.status === "half_day"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                }`}
                title={`${formatDate(day.date)} - ${day.status}`}
              >
                {new Date(day.date).getDate()}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Performance Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myPerformance.map((note) => (
              <div key={note.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium capitalize">{note.category || "general"}</p>
                <p className="text-xs text-slate-500">Rating {note.rating}/5</p>
                <p className="mt-1 text-sm text-slate-600">{note.note}</p>
              </div>
            ))}
            {!myPerformance.length ? <p className="text-sm text-slate-500">No notes yet.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
