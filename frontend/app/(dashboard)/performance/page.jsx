"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  Star, 
  Plus, 
  Calendar,
  User,
  MessageSquare
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

export default function PerformancePage() {
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, staffRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/staff")
        ]);
        setUser(userRes.data.data);
        const staffList = staffRes.data.data;
        setStaff(staffList);
        
        // If staff, auto-select yourself
        if (userRes.data.data.role === 'staff') {
          setSelectedStaff(userRes.data.data.id);
        } else if (staffList.length > 0) {
          setSelectedStaff(staffList[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch performance data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      const fetchPerformance = async () => {
        try {
          const { data } = await api.get(`/performance/${selectedStaff}`);
          setPerformance(data.data);
        } catch (error) {
          console.error("Failed to fetch performance reviews:", error);
        }
      };
      fetchPerformance();
    }
  }, [selectedStaff]);

  if (loading) return <Skeleton className="h-96 w-full" />;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Performance Reviews</h1>
        {isAdmin && (
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Review
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Staff Selector (Admin only) */}
        {isAdmin && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Select Staff</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {staff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStaff(s.id)}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      selectedStaff === s.id ? "bg-slate-100 font-semibold text-[#1A3A5C]" : "hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Timeline */}
        <Card className={isAdmin ? "lg:col-span-3" : "lg:col-span-4"}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              Performance Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative border-l-2 border-slate-100 ml-3 pl-8 space-y-8 py-4">
              {performance.length > 0 ? (
                performance.map((record) => (
                  <div key={record.id} className="relative">
                    <div className="absolute -left-[41px] top-0 w-4 h-4 bg-white border-2 border-[#2E75B6] rounded-full" />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(record.date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-0.5 text-yellow-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= record.rating ? "fill-current" : "text-slate-200"}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                        <p className="text-sm text-slate-700 leading-relaxed italic">
                          "{record.note}"
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        Added by {record.added_by_name}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-slate-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No performance reviews found for this member.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
