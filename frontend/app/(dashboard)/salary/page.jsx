"use client";

import { useState, useEffect } from "react";
import { 
  Banknote, 
  Plus, 
  Calendar,
  Download,
  CheckCircle2,
  Clock,
  MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

export default function SalaryPage() {
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
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
        
        if (userRes.data.data.role === 'staff') {
          setSelectedStaff(userRes.data.data.id);
        } else if (staffList.length > 0) {
          setSelectedStaff(staffList[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch salary setup data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedStaff) {
      const fetchSalary = async () => {
        try {
          const { data } = await api.get(`/salary/${selectedStaff}`);
          setSalaryRecords(data.data);
        } catch (error) {
          console.error("Failed to fetch salary history:", error);
        }
      };
      fetchSalary();
    }
  }, [selectedStaff]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [newSalary, setNewSalary] = useState({
    user_id: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: "",
    status: "unpaid",
    notes: ""
  });

  const handleAddSalary = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post("/salary", newSalary);
      setShowAddForm(false);
      // Refresh
      if (selectedStaff) {
          const { data } = await api.get(`/salary/${selectedStaff}`);
          setSalaryRecords(data.data);
      }
      setNewSalary({ ...newSalary, amount: "", notes: "" });
    } catch (error) {
      console.error("Failed to add salary:", error);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <Skeleton className="h-96 w-full" />;

  const isAdmin = user?.role === 'admin' || user?.role === 'team_lead';

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(amount);
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Payroll & Salary</h1>
        {isAdmin && (
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl"
          >
            {showAddForm ? "Cancel" : <><Plus className="w-4 h-4" /> Generate Payslip</>}
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="border-0 shadow-premium overflow-hidden rounded-2xl animate-in slide-in-from-top-4">
          <div className="h-2 w-full bg-brand-navy"></div>
          <CardHeader>
             <CardTitle className="text-lg">Create Salary Record</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
             <form onSubmit={handleAddSalary} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Staff</label>
                      <select 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                        value={newSalary.user_id}
                        onChange={(e) => setNewSalary({...newSalary, user_id: e.target.value})}
                        required
                      >
                         <option value="">Select Staff</option>
                         {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Month</label>
                      <select 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                        value={newSalary.month}
                        onChange={(e) => setNewSalary({...newSalary, month: parseInt(e.target.value)})}
                        required
                      >
                         {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Amount (NZD)</label>
                      <input 
                        type="number"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                        value={newSalary.amount}
                        onChange={(e) => setNewSalary({...newSalary, amount: e.target.value})}
                        placeholder="0.00"
                        required
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                      <select 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                        value={newSalary.status}
                        onChange={(e) => setNewSalary({...newSalary, status: e.target.value})}
                        required
                      >
                         <option value="unpaid">Unpaid</option>
                         <option value="paid">Paid</option>
                      </select>
                   </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                   <Button type="submit" disabled={formLoading} className="bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl h-10 px-8">
                      {formLoading ? "Recording..." : "Save Record"}
                   </Button>
                </div>
             </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {isAdmin && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Employee List</CardTitle>
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

        <div className={isAdmin ? "lg:col-span-3 space-y-6" : "lg:col-span-4 space-y-6"}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Banknote className="w-5 h-5 text-slate-400" />
                Payment History
              </CardTitle>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="w-4 h-4" /> Export All
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Period</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Paid On</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salaryRecords.length > 0 ? (
                      salaryRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-slate-800">{months[record.month - 1]} {record.year}</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono font-semibold">
                            {formatCurrency(record.amount)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={record.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                              {record.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500">
                            {record.paid_on ? new Date(record.paid_on).toLocaleDateString() : '---'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-slate-400 hover:text-brand-orange"
                                onClick={() => window.print()}
                                title="Print Payslip"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                          No salary records found.
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
    </div>
  );
}
