"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Plus, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

export default function LeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [leavesRes, userRes] = await Promise.all([
          api.get("/leaves"),
          api.get("/auth/me")
        ]);
        setLeaves(leavesRes.data.data);
        setUser(userRes.data.data);
      } catch (error) {
        console.error("Failed to fetch leaves data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/leaves/${id}/status`, { status });
      // Refresh list
      const { data } = await api.get("/leaves");
      setLeaves(data.data);
    } catch (error) {
      console.error("Failed to update leave status:", error);
    }
  };

  const [showApplyForm, setShowApplyForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "annual",
    from_date: "",
    to_date: "",
    reason: ""
  });

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post("/leaves", formData);
      setShowApplyForm(false);
      setFormData({ type: "annual", from_date: "", to_date: "", reason: "" });
      // Refresh list
      const { data } = await api.get("/leaves");
      setLeaves(data.data);
    } catch (error) {
      console.error("Failed to submit leave request:", error);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  const isAdmin = user?.role === 'admin' || user?.role === 'team_lead';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Leave Management</h1>
        {!isAdmin && (
          <Button 
            onClick={() => setShowApplyForm(!showApplyForm)}
            className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl"
          >
            {showApplyForm ? "Cancel Request" : <><Plus className="w-4 h-4" /> Apply for Leave</>}
          </Button>
        )}
      </div>

      {showApplyForm && (
        <Card className="border-0 shadow-premium overflow-hidden rounded-2xl animate-in slide-in-from-top-4">
          <div className="h-2 w-full bg-brand-orange"></div>
          <CardHeader>
            <CardTitle className="text-lg text-brand-navy">Apply for Leave</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Leave Type</label>
                  <select 
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required
                  >
                    <option value="annual">Annual Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="casual">Casual Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">From Date</label>
                  <input 
                    type="date"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                    value={formData.from_date}
                    onChange={(e) => setFormData({...formData, from_date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold">To Date</label>
                  <input 
                    type="date"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-orange/20"
                    value={formData.to_date}
                    onChange={(e) => setFormData({...formData, to_date: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Reason</label>
                <textarea 
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-orange/20 min-h-[100px]"
                  placeholder="Explain why you are taking the leave..."
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  required
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={formLoading}
                  className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl px-10 h-11"
                >
                  {formLoading ? "Submitting..." : "Submit Leave Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Leave Requests</CardTitle>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-6 py-4">Staff</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Duration</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaves.length > 0 ? (
                    leaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-800">{leave.staff_name}</p>
                          <p className="text-xs text-slate-500">{new Date(leave.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4 capitalize text-sm">{leave.type}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex flex-col">
                            <span>{new Date(leave.from_date).toLocaleDateString()}</span>
                            <span className="text-slate-400">to</span>
                            <span>{new Date(leave.to_date).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                          {leave.reason}
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={leave.status === 'approved' ? 'default' : leave.status === 'rejected' ? 'destructive' : 'secondary'}
                            className="capitalize"
                          >
                            {leave.status}
                          </Badge>
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            {leave.status === 'pending' && (
                              <div className="flex items-center justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleStatusUpdate(leave.id, 'approved')}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleStatusUpdate(leave.id, 'rejected')}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-slate-500">
                        No leave requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
