"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Plus, Search, XCircle } from "lucide-react";
import { toast, Toaster } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ApplyLeaveModal from "@/components/leaves/ApplyLeaveModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

const statusBadgeClass = (status) => {
  if (status === "approved") return "bg-green-100 text-green-800";
  if (status === "pending") return "bg-amber-100 text-amber-800";
  if (status === "rejected") return "bg-red-100 text-red-800";
  if (status === "cancelled") return "bg-slate-200 text-slate-700";
  return "bg-slate-200 text-slate-700";
};

const leaveTypeLabel = (type) => {
  if (type === "annual") return "Annual";
  if (type === "sick") return "Sick";
  if (type === "personal") return "Personal";
  return "Unpaid";
};

const getUsageColor = (percentage) => {
  if (percentage > 80) return "bg-red-500";
  if (percentage >= 50) return "bg-amber-500";
  return "bg-green-500";
};

const isTodayWithinRange = (fromDate, toDate) => {
  const today = new Date();
  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T23:59:59`);
  return today >= start && today <= end;
};

export default function LeavesPage() {
  const [user, setUser] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [cancelLeaveId, setCancelLeaveId] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState({});

  const [filters, setFilters] = useState({
    status: "",
    type: "",
    year: new Date().getFullYear(),
    month: "",
    search: ""
  });

  const isAdmin = user?.role === "admin";

  const fetchLeaves = useCallback(async (authUser) => {
    if (!authUser) return;

    if (authUser.role === "admin") {
      const query = new URLSearchParams({
        page: "1",
        limit: "200"
      });
      if (filters.status) query.append("status", filters.status);
      if (filters.type) query.append("type", filters.type);
      if (filters.year) query.append("year", String(filters.year));
      if (filters.search) query.append("search", filters.search);

      const leavesRes = await api.get(`/leaves?${query.toString()}`);
      const baseRows = leavesRes.data.data || [];
      const monthFiltered = filters.month
        ? baseRows.filter((row) => new Date(row.from_date).getMonth() + 1 === Number(filters.month))
        : baseRows;

      setLeaves(monthFiltered);
      return;
    }

    const [leavesRes, balanceRes] = await Promise.all([
      api.get("/leaves?page=1&limit=200"),
      api.get(`/leaves/balance/${authUser.id}`)
    ]);
    setLeaves(leavesRes.data.data || []);
    setLeaveBalance(balanceRes.data.data);
  }, [filters]);

  const refreshPageData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userRes = await api.get("/auth/me");
      const authUser = userRes.data.data;
      setUser(authUser);
      await fetchLeaves(authUser);
    } catch (error) {
      console.error("Failed to fetch leave data:", error);
      toast.error("Failed to load leave data");
    } finally {
      setIsLoading(false);
    }
  }, [fetchLeaves]);

  useEffect(() => {
    refreshPageData();
  }, [refreshPageData]);

  useEffect(() => {
    if (!user?.id || user.role !== "admin") return;
    fetchLeaves(user).catch((error) => {
      console.error("Failed to apply leave filters:", error);
      toast.error("Failed to update filtered leaves");
    });
  }, [filters, user, fetchLeaves]);

  const handleApproveReject = async (leaveId, action) => {
    const adminNote = adminNotes[leaveId] || "";

    if (action === "reject" && !adminNote.trim()) {
      toast.error("Admin note is required to reject a leave");
      return;
    }

    try {
      setIsUpdating(true);
      await api.put(`/leaves/${leaveId}/${action}`, { admin_note: adminNote.trim() || null });
      toast.success(`Leave ${action}d successfully`);
      setAdminNotes((prev) => ({ ...prev, [leaveId]: "" }));
      await fetchLeaves(user);
    } catch (error) {
      const message = error?.response?.data?.message || `Failed to ${action} leave`;
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelLeave = async () => {
    if (!cancelLeaveId) return;
    try {
      setIsUpdating(true);
      await api.put(`/leaves/${cancelLeaveId}/cancel`);
      toast.success("Leave request cancelled");
      setCancelLeaveId(null);
      await fetchLeaves(user);
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to cancel leave request";
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const adminSummary = useMemo(() => {
    const now = new Date();
    const pending = leaves.filter((leave) => leave.status === "pending").length;
    const approvedThisMonth = leaves.filter((leave) => {
      if (leave.status !== "approved" || !leave.reviewed_at) return false;
      const reviewedDate = new Date(leave.reviewed_at);
      return reviewedDate.getMonth() === now.getMonth() && reviewedDate.getFullYear() === now.getFullYear();
    }).length;
    const rejectedThisMonth = leaves.filter((leave) => {
      if (leave.status !== "rejected" || !leave.reviewed_at) return false;
      const reviewedDate = new Date(leave.reviewed_at);
      return reviewedDate.getMonth() === now.getMonth() && reviewedDate.getFullYear() === now.getFullYear();
    }).length;
    const onLeaveToday = new Set(
      leaves
        .filter((leave) => leave.status === "approved" && isTodayWithinRange(leave.from_date, leave.to_date))
        .map((leave) => leave.user_id)
    ).size;

    return { pending, approvedThisMonth, rejectedThisMonth, onLeaveToday };
  }, [leaves]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isAdmin) {
    const annualUsed = leaveBalance?.annual_used || 0;
    const annualTotal = leaveBalance?.annual_total || 20;
    const sickUsed = leaveBalance?.sick_used || 0;
    const sickTotal = leaveBalance?.sick_total || 10;
    const personalUsed = leaveBalance?.personal_used || 0;
    const personalTotal = leaveBalance?.personal_total || 5;

    const balanceCards = [
      { title: "Annual Leave", used: annualUsed, total: annualTotal },
      { title: "Sick Leave", used: sickUsed, total: sickTotal },
      { title: "Personal Leave", used: personalUsed, total: personalTotal }
    ];

    return (
      <div className="space-y-6">
        <Toaster position="top-right" richColors />

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
          <Button onClick={() => setIsApplyModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Apply for Leave
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {balanceCards.map((card) => {
            const percentage = card.total > 0 ? Math.round((card.used / card.total) * 100) : 0;
            return (
              <Card key={card.title} className="rounded-xl border-0 shadow-sm">
                <CardContent className="space-y-3 pt-6">
                  <p className="text-sm font-semibold text-slate-700">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {card.used} / {card.total} days used
                  </p>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className={`h-2 rounded-full ${getUsageColor(percentage)}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="rounded-2xl border-0 shadow-premium">
          <CardHeader>
            <CardTitle>My Leave History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                    <th className="px-2 py-3">Type</th>
                    <th className="px-2 py-3">From</th>
                    <th className="px-2 py-3">To</th>
                    <th className="px-2 py-3">Days</th>
                    <th className="px-2 py-3">Reason</th>
                    <th className="px-2 py-3">Status</th>
                    <th className="px-2 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="border-b border-slate-50 text-sm">
                      <td className="px-2 py-3">
                        <Badge className="bg-slate-100 text-slate-700">{leaveTypeLabel(leave.type)}</Badge>
                      </td>
                      <td className="px-2 py-3">{new Date(leave.from_date).toLocaleDateString("en-NZ")}</td>
                      <td className="px-2 py-3">{new Date(leave.to_date).toLocaleDateString("en-NZ")}</td>
                      <td className="px-2 py-3">{leave.total_days}</td>
                      <td className="px-2 py-3">{leave.reason}</td>
                      <td className="px-2 py-3">
                        <Badge className={statusBadgeClass(leave.status)}>{leave.status}</Badge>
                      </td>
                      <td className="px-2 py-3">
                        {leave.status === "pending" ? (
                          <Button variant="outline" size="sm" onClick={() => setCancelLeaveId(leave.id)}>
                            Cancel
                          </Button>
                        ) : (
                          "--"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <ApplyLeaveModal
          isOpen={isApplyModalOpen}
          onOpenChange={setIsApplyModalOpen}
          leaveBalance={leaveBalance}
          onSuccess={() => fetchLeaves(user)}
        />

        <AlertDialog open={Boolean(cancelLeaveId)} onOpenChange={(open) => !open && setCancelLeaveId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Leave Request?</AlertDialogTitle>
              <AlertDialogDescription>
                This will cancel your pending leave request. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Request</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancelLeave}
                className="bg-red-600 text-white hover:bg-red-700"
                disabled={isUpdating}
              >
                {isUpdating ? "Cancelling..." : "Cancel Leave"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  const pendingLeaves = leaves.filter((leave) => leave.status === "pending");

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Pending Approvals</p>
            <p className="mt-2 text-3xl font-bold text-amber-700">{adminSummary.pending}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Approved This Month</p>
            <p className="mt-2 text-3xl font-bold text-green-700">{adminSummary.approvedThisMonth}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Rejected This Month</p>
            <p className="mt-2 text-3xl font-bold text-red-700">{adminSummary.rejectedThisMonth}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Staff On Leave Today</p>
            <p className="mt-2 text-3xl font-bold text-brand-navy">{adminSummary.onLeaveToday}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <Clock3 className="h-5 w-5" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingLeaves.length === 0 && (
            <p className="text-sm text-slate-600">No pending approvals right now.</p>
          )}

          {pendingLeaves.map((leave) => (
            <div key={leave.id} className="rounded-xl border border-amber-100 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{leave.staff_name}</p>
                  <p className="text-sm text-slate-600">
                    {leaveTypeLabel(leave.type)} | {new Date(leave.from_date).toLocaleDateString("en-NZ")} to{" "}
                    {new Date(leave.to_date).toLocaleDateString("en-NZ")} | {leave.total_days} day(s)
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{leave.reason}</p>
                </div>
                <Badge className={statusBadgeClass(leave.status)}>{leave.status}</Badge>
              </div>

              <div className="mt-3 space-y-3">
                <input
                  value={adminNotes[leave.id] || ""}
                  onChange={(event) =>
                    setAdminNotes((prev) => ({ ...prev, [leave.id]: event.target.value }))
                  }
                  placeholder="Admin note (required for reject)"
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApproveReject(leave.id, "approve")}
                    className="bg-green-600 text-white hover:bg-green-700"
                    disabled={isUpdating}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleApproveReject(leave.id, "reject")}
                    className="bg-red-600 text-white hover:bg-red-700"
                    disabled={isUpdating}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-premium">
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <CalendarDays className="h-5 w-5 text-brand-orange" />
            All Leaves
          </CardTitle>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              value={filters.type}
              onChange={(event) => setFilters((prev) => ({ ...prev, type: event.target.value }))}
              className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm"
            >
              <option value="">All Types</option>
              <option value="annual">Annual</option>
              <option value="sick">Sick</option>
              <option value="personal">Personal</option>
              <option value="unpaid">Unpaid</option>
            </select>

            <select
              value={filters.month}
              onChange={(event) => setFilters((prev) => ({ ...prev, month: event.target.value }))}
              className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm"
            >
              <option value="">All Months</option>
              {Array.from({ length: 12 }).map((_, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {idx + 1}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={filters.year}
              onChange={(event) => setFilters((prev) => ({ ...prev, year: Number(event.target.value) }))}
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
            />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Search staff"
                className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <th className="px-2 py-3">Staff</th>
                  <th className="px-2 py-3">Type</th>
                  <th className="px-2 py-3">From</th>
                  <th className="px-2 py-3">To</th>
                  <th className="px-2 py-3">Days</th>
                  <th className="px-2 py-3">Applied On</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">Reviewed By</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-slate-50 text-sm">
                    <td className="px-2 py-3 font-semibold text-slate-800">{leave.staff_name}</td>
                    <td className="px-2 py-3">{leaveTypeLabel(leave.type)}</td>
                    <td className="px-2 py-3">{new Date(leave.from_date).toLocaleDateString("en-NZ")}</td>
                    <td className="px-2 py-3">{new Date(leave.to_date).toLocaleDateString("en-NZ")}</td>
                    <td className="px-2 py-3">{leave.total_days}</td>
                    <td className="px-2 py-3">{new Date(leave.created_at).toLocaleDateString("en-NZ")}</td>
                    <td className="px-2 py-3">
                      <Badge className={statusBadgeClass(leave.status)}>{leave.status}</Badge>
                    </td>
                    <td className="px-2 py-3">{leave.reviewed_by_name || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
