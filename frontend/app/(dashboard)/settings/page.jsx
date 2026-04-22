"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must include one uppercase letter")
      .regex(/[0-9]/, "Must include one number")
      .regex(/[^A-Za-z0-9]/, "Must include one special character"),
    confirmPassword: z.string().min(1, "Please confirm your password")
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  });

const defaultCompany = {
  company_name: "DDinfoways Limited",
  company_address: "",
  company_email: "",
  company_website: "",
  company_phone: "",
  logo_url: ""
};

const defaultWorkHours = {
  work_start: "09:00",
  work_end: "17:30",
  late_threshold: "09:30",
  working_days: ["mon", "tue", "wed", "thu", "fri"]
};

const defaultLeavePolicy = {
  annual_leave_days: 20,
  sick_leave_days: 10,
  personal_leave_days: 5,
  leave_year_start_month: "January"
};

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("company");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1);

  const [companySettings, setCompanySettings] = useState(defaultCompany);
  const [workingHours, setWorkingHours] = useState(defaultWorkHours);
  const [leavePolicy, setLeavePolicy] = useState(defaultLeavePolicy);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.data);

        const cachedCompany = localStorage.getItem("dd_company_settings");
        const cachedHours = localStorage.getItem("dd_working_hours");
        const cachedLeave = localStorage.getItem("dd_leave_policy");
        if (cachedCompany) setCompanySettings(JSON.parse(cachedCompany));
        if (cachedHours) setWorkingHours(JSON.parse(cachedHours));
        if (cachedLeave) setLeavePolicy(JSON.parse(cachedLeave));
      } catch (error) {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const isAdmin = user?.role === "admin";
  const tabs = useMemo(
    () =>
      isAdmin
        ? [
            { id: "company", label: "Company Settings" },
            { id: "working-hours", label: "Working Hours" },
            { id: "leave-policy", label: "Leave Policy" },
            { id: "my-account", label: "My Account" },
            { id: "system", label: "System" }
          ]
        : [{ id: "my-account", label: "My Account" }],
    [isAdmin]
  );

  useEffect(() => {
    if (!tabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(tabs[0]?.id || "my-account");
    }
  }, [activeTab, tabs]);

  const saveLocalSetting = async (key, payload, message) => {
    try {
      setSaving(true);
      localStorage.setItem(key, JSON.stringify(payload));
      toast.success(message);
    } catch (_error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async () => {
    const validation = passwordSchema.safeParse(passwordData);
    if (!validation.success) {
      const errors = {};
      validation.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (field && !errors[field]) errors[field] = issue.message;
      });
      setPasswordErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setPasswordErrors({});
      await api.put("/auth/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage system preferences and your account.</p>
      </div>

      <div className="overflow-x-auto rounded-lg bg-slate-100 p-1">
        <div className="flex w-max items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "company" && isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingsGrid>
              <Input label="Company Name" value={companySettings.company_name} onChange={(value) => setCompanySettings((prev) => ({ ...prev, company_name: value }))} />
              <Input
                label="Company Email"
                value={companySettings.company_email}
                onChange={(value) => setCompanySettings((prev) => ({ ...prev, company_email: value }))}
              />
              <Input
                label="Company Website"
                value={companySettings.company_website}
                onChange={(value) => setCompanySettings((prev) => ({ ...prev, company_website: value }))}
              />
              <Input
                label="Company Phone"
                value={companySettings.company_phone}
                onChange={(value) => setCompanySettings((prev) => ({ ...prev, company_phone: value }))}
              />
              <Input
                label="Company Address"
                value={companySettings.company_address}
                onChange={(value) => setCompanySettings((prev) => ({ ...prev, company_address: value }))}
              />
              <Input
                label="Logo URL"
                value={companySettings.logo_url}
                onChange={(value) => setCompanySettings((prev) => ({ ...prev, logo_url: value }))}
                placeholder="https://..."
              />
            </SettingsGrid>
            <Button onClick={() => saveLocalSetting("dd_company_settings", companySettings, "Company settings saved")} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "working-hours" && isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Working Hours</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingsGrid>
              <Input
                type="time"
                label="Work Start Time"
                value={workingHours.work_start}
                onChange={(value) => setWorkingHours((prev) => ({ ...prev, work_start: value }))}
              />
              <Input type="time" label="Work End Time" value={workingHours.work_end} onChange={(value) => setWorkingHours((prev) => ({ ...prev, work_end: value }))} />
              <Input
                type="time"
                label="Late Arrival Threshold"
                value={workingHours.late_threshold}
                onChange={(value) => setWorkingHours((prev) => ({ ...prev, late_threshold: value }))}
              />
            </SettingsGrid>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Working Days</p>
              <div className="flex flex-wrap gap-2">
                {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => (
                  <button
                    key={day}
                    onClick={() =>
                      setWorkingHours((prev) => ({
                        ...prev,
                        working_days: prev.working_days.includes(day)
                          ? prev.working_days.filter((item) => item !== day)
                          : [...prev.working_days, day]
                      }))
                    }
                    className={`rounded-md border px-3 py-1 text-sm capitalize ${
                      workingHours.working_days.includes(day) ? "border-[#1A3A5C] bg-[#1A3A5C] text-white" : "border-slate-200 text-slate-700"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={() => saveLocalSetting("dd_working_hours", workingHours, "Working hours saved")} disabled={saving}>
              Save Changes
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "leave-policy" && isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>Leave Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingsGrid>
              <Input
                type="number"
                label="Annual Leave Days"
                value={String(leavePolicy.annual_leave_days)}
                onChange={(value) => setLeavePolicy((prev) => ({ ...prev, annual_leave_days: Number(value) }))}
              />
              <Input
                type="number"
                label="Sick Leave Days"
                value={String(leavePolicy.sick_leave_days)}
                onChange={(value) => setLeavePolicy((prev) => ({ ...prev, sick_leave_days: Number(value) }))}
              />
              <Input
                type="number"
                label="Personal Leave Days"
                value={String(leavePolicy.personal_leave_days)}
                onChange={(value) => setLeavePolicy((prev) => ({ ...prev, personal_leave_days: Number(value) }))}
              />
              <Select
                label="Leave Year Start Month"
                value={leavePolicy.leave_year_start_month}
                onChange={(value) => setLeavePolicy((prev) => ({ ...prev, leave_year_start_month: value }))}
                options={[
                  "January",
                  "February",
                  "March",
                  "April",
                  "May",
                  "June",
                  "July",
                  "August",
                  "September",
                  "October",
                  "November",
                  "December"
                ]}
              />
            </SettingsGrid>
            <Button onClick={() => saveLocalSetting("dd_leave_policy", leavePolicy, "Leave policy saved")} disabled={saving}>
              Save Changes
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "my-account" ? (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <SettingsGrid>
              <Input
                type="password"
                label="Current Password"
                value={passwordData.currentPassword}
                onChange={(value) => setPasswordData((prev) => ({ ...prev, currentPassword: value }))}
                error={passwordErrors.currentPassword}
              />
              <Input
                type="password"
                label="New Password"
                value={passwordData.newPassword}
                onChange={(value) => setPasswordData((prev) => ({ ...prev, newPassword: value }))}
                error={passwordErrors.newPassword}
              />
              <Input
                type="password"
                label="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={(value) => setPasswordData((prev) => ({ ...prev, confirmPassword: value }))}
                error={passwordErrors.confirmPassword}
              />
            </SettingsGrid>
            <Button onClick={handlePasswordSave} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Password
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "system" && isAdmin ? (
        <Card>
          <CardHeader>
            <CardTitle>System</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <ReadonlyField label="System Version" value="v1.0.0" />
              <ReadonlyField label="Environment" value="Demo" />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  toast.info("Coming Soon");
                }}
              >
                Export All Data
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setResetStep(1);
                  setResetDialogOpen(true);
                }}
              >
                Reset Demo Data
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{resetStep === 1 ? "Reset demo data?" : "Final confirmation required"}</AlertDialogTitle>
            <AlertDialogDescription>
              {resetStep === 1
                ? "This is a destructive action used before production go-live."
                : "This will reset demo data. Do you want to continue?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setResetStep(1);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => {
                if (resetStep === 1) {
                  setResetStep(2);
                  setResetDialogOpen(true);
                  return;
                }
                setResetDialogOpen(false);
                setResetStep(1);
                toast.info("Demo reset flow will be implemented before production.");
              }}
            >
              {resetStep === 1 ? "Continue" : "Confirm Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SettingsGrid({ children }) {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>;
}

function Input({ label, value, onChange, type = "text", placeholder = "", error = "" }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`h-10 w-full rounded-md border px-3 text-sm ${error ? "border-red-400" : "border-slate-200"}`}
      />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReadonlyField({ label, value }) {
  return (
    <div className="rounded-md border border-slate-200 p-3">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{value}</p>
    </div>
  );
}
