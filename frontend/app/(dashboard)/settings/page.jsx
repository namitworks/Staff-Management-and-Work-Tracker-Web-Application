"use client";

import { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Save, 
  ShieldCheck 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    department: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/auth/me");
        // Fetch full profile details
        const profileRes = await api.get(`/staff/${data.data.id}`);
        const fullUser = profileRes.data.data;
        setUser(fullUser);
        setProfileData({
          name: fullUser.name || "",
          email: fullUser.email || "",
          phone: fullUser.phone || "",
          address: fullUser.address || "",
          department: fullUser.department || ""
        });
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await api.put("/auth/update-profile", profileData);
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setMessage({ type: "error", text: "New passwords do not match." });
    }
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to change password." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Account Settings</h1>
        <p className="text-slate-500">Manage your profile information and security preferences.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            {message.text}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Profile Section */}
          <Card className="border-0 shadow-premium rounded-2xl overflow-hidden">
            <div className="h-2 w-full bg-brand-navy"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-navy text-lg">
                <User className="w-5 h-5" /> Public Profile
              </CardTitle>
              <CardDescription>Update your contact and work information.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <Input 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="rounded-xl h-11 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                    <Input 
                        value={profileData.email} 
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="rounded-xl h-11 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Phone</label>
                    <Input 
                        value={profileData.phone} 
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="rounded-xl h-11 bg-slate-50/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Department</label>
                    <Input 
                        value={profileData.department} 
                        disabled
                        className="rounded-xl h-11 bg-slate-100 cursor-not-allowed opacity-70"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Address</label>
                  <Input 
                      value={profileData.address} 
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      className="rounded-xl h-11 bg-slate-50/50"
                  />
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="bg-brand-navy hover:bg-brand-navy/90 rounded-xl px-8 h-11 text-white">
                    {saving ? "Saving..." : <span className="flex items-center gap-2"><Save className="w-4 h-4"/> Update Profile</span>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card className="border-0 shadow-premium rounded-2xl overflow-hidden">
            <div className="h-2 w-full bg-brand-orange"></div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-brand-navy text-lg">
                <Lock className="w-5 h-5" /> Security
              </CardTitle>
              <CardDescription>Change your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Current Password</label>
                    <Input 
                      type="password"
                      value={passwordData.currentPassword} 
                      onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                      className="rounded-xl h-11 bg-slate-50/50"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">New Password</label>
                      <Input 
                        type="password"
                        value={passwordData.newPassword} 
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="rounded-xl h-11 bg-slate-50/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                      <Input 
                        type="password"
                        value={passwordData.confirmPassword} 
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="rounded-xl h-11 bg-slate-50/50"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={saving} className="bg-brand-orange hover:bg-brand-orange-light rounded-xl px-8 h-11 text-white">
                    {saving ? "Processing..." : "Change Password"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm bg-slate-50/50 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Account Status</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-slate-700 capitalize">Active {user?.role}</span>
                </div>
                <p className="mt-4 text-xs text-slate-500 leading-relaxed uppercase font-bold opacity-60">Joined On</p>
                <p className="text-sm text-slate-700">{user?.joining_date ? new Date(user.joining_date).toLocaleDateString() : 'N/A'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
