"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, Star, TrendingUp } from "lucide-react";
import { toast, Toaster } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AddNoteModal from "@/components/performance/AddNoteModal";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

const CATEGORY_LABELS = {
  technical: "Technical",
  communication: "Communication",
  teamwork: "Teamwork",
  punctuality: "Punctuality",
  leadership: "Leadership",
  general: "General"
};

const formatCategory = (value) => CATEGORY_LABELS[value] || value;

const renderStars = (rating) =>
  Array.from({ length: 5 }).map((_, index) => (
    <Star
      key={index}
      className={`h-4 w-4 ${index < Number(rating) ? "fill-amber-400 text-amber-500" : "text-slate-300"}`}
    />
  ));

export default function PerformancePage() {
  const [user, setUser] = useState(null);
  const [staffOptions, setStaffOptions] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: null, note: "", rating: 4, category: "general", date: "" });

  const isAdmin = user?.role === "admin";

  const loadPerformanceData = async (targetUserId) => {
    if (!targetUserId) return;
    const [summaryRes, notesRes] = await Promise.all([
      api.get(`/performance/summary/${targetUserId}`),
      api.get(`/performance/${targetUserId}`)
    ]);
    setSummary(summaryRes.data.data);
    setNotes(notesRes.data.data || []);
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        const meRes = await api.get("/auth/me");
        const me = meRes.data.data;
        setUser(me);

        if (me.role === "admin") {
          const staffRes = await api.get("/staff");
          const staff = staffRes.data.data || [];
          setStaffOptions(staff);
          const firstStaffId = staff[0]?.id || null;
          setSelectedUserId(firstStaffId);
          if (firstStaffId) await loadPerformanceData(firstStaffId);
        } else {
          setSelectedUserId(me.id);
          await loadPerformanceData(me.id);
        }
      } catch (error) {
        console.error("Failed to load performance page:", error);
        toast.error("Failed to load performance data");
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    if (!selectedUserId || !user?.id) return;
    loadPerformanceData(selectedUserId).catch((error) => {
      console.error("Failed to refresh performance data:", error);
      toast.error("Failed to refresh performance data");
    });
  }, [selectedUserId, user?.id]);

  const handleAddNote = async (payload) => {
    try {
      setIsSubmitting(true);
      await api.post("/performance", payload);
      toast.success("Performance note added");
      setIsAddModalOpen(false);
      await loadPerformanceData(selectedUserId);
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to add note";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!deleteTargetId) return;
    try {
      setIsSubmitting(true);
      await api.delete(`/performance/${deleteTargetId}`);
      toast.success("Performance note deleted");
      setDeleteTargetId(null);
      await loadPerformanceData(selectedUserId);
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to delete note";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (note) => {
    setEditForm({
      id: note.id,
      note: note.note,
      rating: note.rating,
      category: note.category,
      date: note.date ? new Date(note.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateNote = async () => {
    if (!editForm.id) return;
    if (!editForm.note || editForm.note.trim().length < 10) {
      toast.error("Note must be at least 10 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.put(`/performance/${editForm.id}`, {
        note: editForm.note.trim(),
        rating: Number(editForm.rating),
        category: editForm.category,
        date: editForm.date
      });
      toast.success("Performance note updated");
      setIsEditModalOpen(false);
      await loadPerformanceData(selectedUserId);
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to update note";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryChartData = useMemo(() => {
    if (!summary?.rating_by_category) return [];
    return summary.rating_by_category.map((row) => ({
      category: formatCategory(row.category),
      rating: row.average_rating
    }));
  }, [summary]);

  const trendData = useMemo(() => {
    if (!summary?.trend) return [];
    return summary.trend.map((row) => ({
      month: row.month,
      rating: row.average_rating
    }));
  }, [summary]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Performance Management</h1>
          {isAdmin && (
            <select
              value={selectedUserId || ""}
              onChange={(event) => setSelectedUserId(Number(event.target.value))}
              className="h-10 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm"
            >
              {staffOptions.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {isAdmin && (
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Performance Note
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Overall Rating</p>
            <p className="mt-2 text-3xl font-bold text-brand-navy">{summary?.average_rating || 0} / 5.0</p>
            <div className="mt-2 flex items-center gap-1">{renderStars(Math.round(summary?.average_rating || 0))}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Total Reviews</p>
            <p className="mt-2 text-3xl font-bold text-slate-800">{summary?.total_notes || 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Best Category</p>
            <p className="mt-2 text-xl font-bold text-green-700">
              {summary?.best_category ? formatCategory(summary.best_category) : "--"}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Latest Review Date</p>
            <p className="mt-2 text-base font-semibold text-slate-800">
              {summary?.latest_review_date
                ? new Date(summary.latest_review_date).toLocaleDateString("en-NZ")
                : "--"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-0 shadow-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="h-5 w-5 text-brand-orange" />
              Rating by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 5]} />
                <YAxis type="category" dataKey="category" width={110} />
                <Tooltip />
                <Bar dataKey="rating" fill="#1A3A5C" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <CalendarDays className="h-5 w-5 text-brand-orange" />
              Rating Trend (Last 6 Months)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="rating" stroke="#1A3A5C" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-premium">
        <CardHeader>
          <CardTitle>Performance Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.length === 0 && (
            <p className="text-sm text-slate-500">No performance notes available.</p>
          )}

          {notes.map((note) => (
            <div key={note.id} className="rounded-xl border border-slate-100 bg-white p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-slate-100 text-slate-700">{formatCategory(note.category)}</Badge>
                  <div className="flex items-center gap-1">{renderStars(note.rating)}</div>
                </div>
                <p className="text-xs text-slate-500">
                  {new Date(note.date).toLocaleDateString("en-NZ")} | Added by {note.added_by_name}
                </p>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-700">{note.note}</p>

              {isAdmin && (
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(note)}>
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setDeleteTargetId(note.id)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {isAdmin && (
        <AddNoteModal
          isOpen={isAddModalOpen}
          onOpenChange={setIsAddModalOpen}
          staffOptions={staffOptions}
          initialUserId={selectedUserId}
          onSubmit={handleAddNote}
          isSubmitting={isSubmitting}
        />
      )}

      <AlertDialog open={Boolean(deleteTargetId)} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Performance Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the selected performance note.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-red-600 text-white hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Performance Note</DialogTitle>
            <DialogDescription>Update note text, rating, category, and date.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select
                  value={editForm.category}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  value={editForm.date}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, date: event.target.value }))}
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Rating</label>
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, rating: value }))}
                      className="rounded p-1"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          value <= Number(editForm.rating) ? "fill-amber-400 text-amber-500" : "text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Note</label>
              <textarea
                value={editForm.note}
                onChange={(event) => setEditForm((prev) => ({ ...prev, note: event.target.value }))}
                rows={5}
                className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateNote} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
