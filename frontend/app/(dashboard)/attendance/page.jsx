"use client";

import { useState, useEffect } from "react";
import { 
  Clock, 
  LogIn, 
  LogOut, 
  Calendar,
  UserCheck,
  UserMinus,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

export default function AttendancePage() {
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStatus = async () => {
    try {
      const { data } = await api.get("/attendance/today");
      setStatus(data.data);
      
      // Fetch user info to get ID
      const userRes = await api.get("/auth/me");
      const userId = userRes.data.data.id;
      
      // Fetch history
      const historyRes = await api.get(`/attendance/history/${userId}`);
      setHistory(historyRes.data.data);
    } catch (error) {
      console.error("Failed to fetch attendance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleAction = async (type) => {
    setActionLoading(true);
    try {
      await api.post(`/attendance/check${type === 'in' ? 'in' : 'out'}`);
      await fetchStatus();
    } catch (error) {
      console.error(`Failed to ${type}:`, error);
      alert(error.response?.data?.message || `Failed to check ${type}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  const isCheckedIn = !!(status?.check_in && !status?.check_out);
  const isCheckedOut = !!(status?.check_in && status?.check_out);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-800">Attendance</h1>
        <p className="text-slate-500">
          {currentTime.toLocaleDateString('en-NZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Punch Card */}
        <Card className="flex flex-col justify-center">
          <CardContent className="pt-10 pb-10 text-center space-y-8">
            <div className="space-y-1">
              <div className="text-5xl font-mono font-bold text-[#1A3A5C]">
                {currentTime.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <p className="text-slate-400 text-sm font-medium tracking-widest uppercase">Current Time</p>
            </div>

            <div className="flex justify-center gap-4">
              {!isCheckedIn && !isCheckedOut ? (
                <Button 
                  size="lg" 
                  className="h-24 w-48 text-lg font-bold flex flex-col gap-1 items-center bg-green-600 hover:bg-green-700"
                  onClick={() => handleAction('in')}
                  disabled={actionLoading}
                >
                  <LogIn className="w-8 h-8" />
                  Check In
                </Button>
              ) : isCheckedIn ? (
                <Button 
                  size="lg" 
                  className="h-24 w-48 text-lg font-bold flex flex-col gap-1 items-center bg-red-600 hover:bg-red-700"
                  onClick={() => handleAction('out')}
                  disabled={actionLoading}
                >
                  <LogOut className="w-8 h-8" />
                  Check Out
                </Button>
              ) : (
                <div className="h-24 w-48 flex flex-col items-center justify-center gap-1 bg-slate-100 rounded-lg text-slate-500 font-bold border border-slate-200">
                  <UserCheck className="w-8 h-8" />
                  Day Completed
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               <Calendar className="w-5 h-5 text-slate-400" />
               Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-md">
                  <LogIn className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-600">Check In</span>
              </div>
              <span className="font-mono text-slate-800">
                {status?.check_in ? new Date(status.check_in).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-md">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-600">Check Out</span>
              </div>
              <span className="font-mono text-slate-800">
                {status?.check_out ? new Date(status.check_out).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
              </span>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-slate-800">
                <span className="font-semibold">Total Working Hours</span>
                <span className="text-xl font-bold">{status?.total_hours || '0.00'} hrs</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent History</CardTitle>
        </CardHeader>
        <CardContent>
           <div className="overflow-x-auto">
             <table className="w-full text-left">
               <thead>
                 <tr className="text-xs uppercase font-bold text-slate-400 border-b border-slate-100">
                   <th className="py-4 px-2">Date</th>
                   <th className="py-4 px-2">Check In</th>
                   <th className="py-4 px-2">Check Out</th>
                   <th className="py-4 px-2">Total Hours</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {history.length > 0 ? (
                   history.map((row) => (
                     <tr key={row.id} className="text-sm text-slate-700">
                       <td className="py-4 px-2 font-medium">{new Date(row.date).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                       <td className="py-4 px-2 font-mono text-blue-600">{new Date(row.check_in).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}</td>
                       <td className="py-4 px-2 font-mono text-orange-600">{row.check_out ? new Date(row.check_out).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</td>
                       <td className="py-4 px-2 font-bold">{row.total_hours || '0.00'} hrs</td>
                     </tr>
                   ))
                 ) : (
                   <tr>
                     <td colSpan="4" className="py-10 text-center text-slate-400">No attendance records found.</td>
                   </tr>
                 )}
               </tbody>
             </table>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
