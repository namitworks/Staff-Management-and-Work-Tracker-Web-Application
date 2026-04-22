"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function NewStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "Password@123", // Default password
    role: "staff",
    department: "",
    phone: "",
    address: "",
    joining_date: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const { data } = await api.post("/staff", formData);
      if (data.success) {
        router.push("/staff");
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setErrorMsg(error.response.data.message || "Failed to create staff member.");
      } else {
        setErrorMsg("Network error. Could not connect to the API.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/staff">
          <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Add New Staff</h1>
          <p className="text-sm text-slate-500">Create a new employee profile and generate credentials.</p>
        </div>
      </div>

      <Card className="border-0 shadow-premium overflow-hidden rounded-2xl">
        <div className="h-2 w-full bg-brand-orange"></div>
        <CardHeader className="bg-slate-50/50 pb-6 border-b border-slate-100">
          <CardTitle className="text-lg text-brand-navy">Employee Information</CardTitle>
          <CardDescription>All fields marked with an asterisk (*) are required.</CardDescription>
        </CardHeader>
        
        <CardContent className="p-8">
          {errorMsg && (
            <div className="p-4 mb-6 text-sm font-medium text-red-600 bg-red-50/50 border border-red-100 rounded-lg backdrop-blur-sm">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Full Name *</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. John Doe"
                  required
                  className="rounded-xl h-11 bg-slate-50/50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Email Address *</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. john@ddinfoways.co.nz"
                  required
                  className="rounded-xl h-11 bg-slate-50/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">System Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-xl h-11 border border-slate-200 bg-slate-50/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all"
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Department</label>
                <Input
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Engineering"
                  className="rounded-xl h-11 bg-slate-50/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. +64 21 000 0000"
                  className="rounded-xl h-11 bg-slate-50/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Joining Date</label>
                <Input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleChange}
                  className="rounded-xl h-11 bg-slate-50/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Physical Address</label>
              <Input
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="e.g. 123 Main St, Auckland"
                className="rounded-xl h-11 bg-slate-50/50"
              />
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500 max-w-sm">
                The new user will be assigned a temporary default password: <strong>Password@123</strong>. They should change it upon first login.
              </p>
              <div className="flex gap-3">
                <Link href="/staff">
                  <Button type="button" variant="outline" className="rounded-xl h-11 px-6">
                    Cancel
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="rounded-xl h-11 px-8 bg-brand-orange hover:bg-brand-orange-light text-white shadow-[0_4px_15px_rgba(234,88,12,0.3)]"
                >
                  {loading ? "Saving..." : <span className="flex items-center gap-2"><Save className="w-4 h-4"/> Create Profile</span>}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
