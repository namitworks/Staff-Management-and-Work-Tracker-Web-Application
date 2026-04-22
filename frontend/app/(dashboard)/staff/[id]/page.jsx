"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CalendarClock,
  CreditCard,
  FileText,
  Loader2,
  TrendingUp,
  User
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import IdCardModal from "@/components/idcard/IdCardModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const tabs = [
  { id: "overview", label: "Overview", icon: User },
  { id: "attendance", label: "Attendance", icon: CalendarClock },
  { id: "leave", label: "Leave", icon: FileText },
  { id: "performance", label: "Performance", icon: TrendingUp },
  { id: "salary", label: "Salary", icon: Banknote },
  { id: "idcard", label: "ID Card", icon: CreditCard },
  { id: "activity", label: "Activity Log", icon: FileText }
];

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString("en-NZ", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Pacific/Auckland"
  });
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Pacific/Auckland"
  });
};

export default function StaffProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const avatarInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isIdCardModalOpen, setIsIdCardModalOpen] = useState(false);
  const [generatingId, setGeneratingId] = useState(false);

  const [formData, setFormData] = useState({});
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [leaveRows, setLeaveRows] = useState([]);
  const [performanceRows, setPerformanceRows] = useState([]);
  const [salaryRows, setSalaryRows] = useState([]);
  const [taskRows, setTaskRows] = useState([]);

  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);

  const isAdmin = currentUser?.role === "admin";
  const isOwnProfile = Number(currentUser?.id) === Number(id);
  const canEditOverview = isAdmin || isOwnProfile;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const meReq = api.get("/auth/me");
        const staffReq = api.get(`/staff/${id}`);
        const attendanceReq = api.get(`/attendance/user/${id}?month=${month}&year=${year}`);
        const performanceReq = api.get(`/performance/${id}`);
        const salaryReq = api.get(`/salary/${id}`);
        const tasksReq = api.get("/tasks");

        const [meRes, staffRes, attendanceRes, performanceRes, salaryRes, tasksRes] = await Promise.all([
          meReq,
          staffReq,
          attendanceReq,
          performanceReq,
          salaryReq,
          tasksReq
        ]);

        const me = meRes.data.data;
        const staffData = staffRes.data.data;
        setCurrentUser(me);
        setStaff(staffData);
        setFormData({
          name: staffData.name || "",
          email: staffData.email || "",
          phone: staffData.phone || "",
          address: staffData.address || "",
          emergency_contact_name: staffData.emergency_contact_name || "",
          emergency_contact_phone: staffData.emergency_contact_phone || "",
          blood_group: staffData.blood_group || "",
          date_of_birth: staffData.date_of_birth ? String(staffData.date_of_birth).slice(0, 10) : "",
          department: staffData.department || "",
          role: staffData.role || "staff",
          joining_date: staffData.joining_date ? String(staffData.joining_date).slice(0, 10) : "",
          employment_type: staffData.employment_type || "full_time",
          reporting_to: staffData.reporting_to || "",
          ird_number: staffData.ird_number || "",
          tax_code: staffData.tax_code || "",
          kiwisaver_rate: staffData.kiwisaver_rate || "",
          bank_name: staffData.bank_name || "",
          bank_account_number: staffData.bank_account_number || ""
        });

        setAttendanceRows(attendanceRes.data.data?.records || []);
        setPerformanceRows(performanceRes.data.data?.notes || []);
        setSalaryRows(salaryRes.data.data || []);

        const allTasks = tasksRes.data.data || [];
        setTaskRows(allTasks.filter((task) => Number(task.assigned_to) === Number(id)));

        const leaveRes = await api.get(`/leaves?limit=100&page=1`);
        const leavesData = leaveRes.data.data || [];
        setLeaveRows(leavesData.filter((leave) => Number(leave.user_id) === Number(id)));

        if (me.role === "admin") {
          const staffListRes = await api.get("/staff");
          const staffList = staffListRes.data.data || [];
          setTeamMembers(staffList.filter((member) => member.role === "admin" || member.role === "team_lead"));
        }
      } catch (error) {
        console.error("Staff profile load error:", error);
        toast.error(error.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const activityLogs = useMemo(() => {
    const logs = [];

    logs.push({
      title: "Last login",
      description: "Most recent account activity",
      timestamp: staff?.updated_at || staff?.created_at || null,
      icon: "login"
    });

    attendanceRows.forEach((record) => {
      if (record.check_in) {
        logs.push({
          title: "Checked in",
          description: `Status: ${record.status || "present"}`,
          timestamp: record.check_in,
          icon: "attendance"
        });
      }
      if (record.check_out) {
        logs.push({
          title: "Checked out",
          description: `Total hours: ${record.total_hours || "-"}`,
          timestamp: record.check_out,
          icon: "attendance"
        });
      }
    });

    taskRows.forEach((task) => {
      logs.push({
        title: "Task updated",
        description: `${task.title} (${task.status})`,
        timestamp: task.updated_at || task.created_at,
        icon: "task"
      });
    });

    leaveRows.forEach((leave) => {
      logs.push({
        title: "Leave application",
        description: `${leave.type} leave (${formatDate(leave.from_date)} - ${formatDate(leave.to_date)})`,
        timestamp: leave.created_at,
        icon: "leave"
      });
    });

    return logs
      .filter((log) => Boolean(log.timestamp))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }, [attendanceRows, leaveRows, staff, taskRows]);

  const handleFieldChange = (field, value) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const resetForm = () => {
    if (!staff) return;
    setFormData((previous) => ({
      ...previous,
      name: staff.name || "",
      email: staff.email || "",
      phone: staff.phone || "",
      address: staff.address || "",
      emergency_contact_name: staff.emergency_contact_name || "",
      emergency_contact_phone: staff.emergency_contact_phone || "",
      blood_group: staff.blood_group || "",
      date_of_birth: staff.date_of_birth ? String(staff.date_of_birth).slice(0, 10) : "",
      department: staff.department || "",
      role: staff.role || "staff",
      joining_date: staff.joining_date ? String(staff.joining_date).slice(0, 10) : "",
      employment_type: staff.employment_type || "full_time",
      reporting_to: staff.reporting_to || "",
      ird_number: staff.ird_number || "",
      tax_code: staff.tax_code || "",
      kiwisaver_rate: staff.kiwisaver_rate || "",
      bank_name: staff.bank_name || "",
      bank_account_number: staff.bank_account_number || ""
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await api.put(`/staff/${id}`, formData);
      const refreshed = await api.get(`/staff/${id}`);
      setStaff(refreshed.data.data);
      setEditMode(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Save profile error:", error);
      toast.error(error.response?.data?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarProgress(0);
  };

  const handleCancelAvatar = () => {
    setAvatarFile(null);
    setAvatarProgress(0);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview("");
    if (avatarInputRef.current) avatarInputRef.current.value = "";
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    try {
      setAvatarUploading(true);
      const payload = new FormData();
      payload.append("avatar", avatarFile);

      const { data } = await api.post(`/staff/${id}/avatar`, payload, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;
          setAvatarProgress(Math.round((event.loaded * 100) / event.total));
        }
      });

      const avatarUrl = data?.data?.avatar_url;
      setStaff((previous) => ({ ...previous, avatar_url: avatarUrl }));
      handleCancelAvatar();
      toast.success("Avatar uploaded successfully");
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload avatar");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleGenerateIdCard = async () => {
    if (!isAdmin) return;
    try {
      setGeneratingId(true);
      const { data } = await api.post("/idcards/generate", { user_id: Number(id) });
      setStaff(data.data);
      toast.success("ID card generated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to generate ID card");
    } finally {
      setGeneratingId(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!staff) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">Staff profile not found.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon-sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Staff Profile</h1>
            <p className="text-sm text-slate-500">{staff.name}</p>
          </div>
        </div>
        <Badge variant={staff.status === "active" ? "default" : "secondary"}>{staff.status}</Badge>
      </div>

      <div className="overflow-x-auto rounded-lg bg-slate-100 p-1">
        <div className="flex w-max items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium ${
                  activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "overview" ? (
        <Card>
          <CardContent className="space-y-8 p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <button
                    disabled={!isAdmin}
                    onClick={() => avatarInputRef.current?.click()}
                    className={`h-24 w-24 overflow-hidden rounded-full border bg-slate-100 ${isAdmin ? "cursor-pointer" : "cursor-default"}`}
                    title={isAdmin ? "Upload avatar" : ""}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                    ) : staff.avatar_url ? (
                      <img src={staff.avatar_url} alt={staff.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-500">
                        <User className="h-8 w-8" />
                      </div>
                    )}
                  </button>
                  <input ref={avatarInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleAvatarSelect} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{staff.name}</p>
                  <p className="text-sm text-slate-500 capitalize">{staff.role.replace("_", " ")}</p>
                  <p className="mt-2 text-xs text-slate-500">Best size: 200×200px, max 2MB</p>
                  {avatarFile ? (
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" onClick={handleUploadAvatar} disabled={avatarUploading}>
                        {avatarUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Upload
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleCancelAvatar} disabled={avatarUploading}>
                        Cancel
                      </Button>
                      {avatarUploading ? <span className="text-xs text-slate-500">{avatarProgress}%</span> : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {canEditOverview ? (
                <div className="flex items-center gap-2">
                  {!editMode ? (
                    <Button onClick={() => setEditMode(true)}>Edit Profile</Button>
                  ) : (
                    <>
                      <Button onClick={handleSaveProfile} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          resetForm();
                          setEditMode(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className="space-y-4 rounded-xl border p-4">
                <h3 className="font-semibold text-slate-900">Personal Info</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Field label="Full Name" value={formData.name} disabled={!editMode} onChange={(value) => handleFieldChange("name", value)} />
                  <Field label="Email" value={formData.email} disabled={!editMode} onChange={(value) => handleFieldChange("email", value)} type="email" />
                  <Field label="Phone" value={formData.phone} disabled={!editMode} onChange={(value) => handleFieldChange("phone", value)} />
                  <Field label="Blood Group" value={formData.blood_group} disabled={!editMode} onChange={(value) => handleFieldChange("blood_group", value)} />
                  <Field
                    label="Emergency Contact Name"
                    value={formData.emergency_contact_name}
                    disabled={!editMode}
                    onChange={(value) => handleFieldChange("emergency_contact_name", value)}
                  />
                  <Field
                    label="Emergency Contact Phone"
                    value={formData.emergency_contact_phone}
                    disabled={!editMode}
                    onChange={(value) => handleFieldChange("emergency_contact_phone", value)}
                  />
                  <Field
                    label="Date of Birth"
                    value={formData.date_of_birth}
                    disabled={!editMode}
                    onChange={(value) => handleFieldChange("date_of_birth", value)}
                    type="date"
                  />
                  <Field label="Address" value={formData.address} disabled={!editMode} onChange={(value) => handleFieldChange("address", value)} />
                </div>
              </section>

              {isAdmin ? (
                <section className="space-y-4 rounded-xl border p-4">
                  <h3 className="font-semibold text-slate-900">Work Info</h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field
                      label="Department"
                      value={formData.department}
                      disabled={!editMode}
                      onChange={(value) => handleFieldChange("department", value)}
                    />
                    <SelectField
                      label="Role / Designation"
                      value={formData.role}
                      disabled={!editMode}
                      onChange={(value) => handleFieldChange("role", value)}
                      options={[
                        { label: "Admin", value: "admin" },
                        { label: "Team Lead", value: "team_lead" },
                        { label: "Staff", value: "staff" }
                      ]}
                    />
                    <Field
                      label="Joining Date"
                      type="date"
                      value={formData.joining_date}
                      disabled={!editMode}
                      onChange={(value) => handleFieldChange("joining_date", value)}
                    />
                    <SelectField
                      label="Employment Type"
                      value={formData.employment_type}
                      disabled={!editMode}
                      onChange={(value) => handleFieldChange("employment_type", value)}
                      options={[
                        { label: "Full Time", value: "full_time" },
                        { label: "Part Time", value: "part_time" },
                        { label: "Contract", value: "contract" }
                      ]}
                    />
                    <SelectField
                      label="Reporting To"
                      value={String(formData.reporting_to || "")}
                      disabled={!editMode}
                      onChange={(value) => handleFieldChange("reporting_to", value ? Number(value) : null)}
                      options={[{ label: "Not set", value: "" }, ...teamMembers.map((member) => ({ label: member.name, value: String(member.id) }))]}
                    />
                  </div>
                </section>
              ) : null}
            </div>

            {isAdmin ? (
              <section className="space-y-4 rounded-xl border p-4">
                <h3 className="font-semibold text-slate-900">Tax & Banking</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <Field label="IRD Number" value={formData.ird_number} disabled={!editMode} onChange={(value) => handleFieldChange("ird_number", value)} />
                  <Field label="Tax Code" value={formData.tax_code} disabled={!editMode} onChange={(value) => handleFieldChange("tax_code", value)} />
                  <Field
                    label="KiwiSaver Rate"
                    value={formData.kiwisaver_rate}
                    disabled={!editMode}
                    onChange={(value) => handleFieldChange("kiwisaver_rate", value)}
                  />
                  <Field label="Bank Name" value={formData.bank_name} disabled={!editMode} onChange={(value) => handleFieldChange("bank_name", value)} />
                  <Field
                    label="Bank Account Number"
                    value={formData.bank_account_number}
                    disabled={!editMode}
                    onChange={(value) => handleFieldChange("bank_account_number", value)}
                  />
                </div>
              </section>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "attendance" ? (
        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">Date</th>
                  <th className="py-2">Check In</th>
                  <th className="py-2">Check Out</th>
                  <th className="py-2">Hours</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceRows.slice(0, 31).map((row) => (
                  <tr key={row.date} className="border-b">
                    <td className="py-2">{formatDate(row.date)}</td>
                    <td className="py-2">{row.check_in ? formatDateTime(row.check_in) : "-"}</td>
                    <td className="py-2">{row.check_out ? formatDateTime(row.check_out) : "-"}</td>
                    <td className="py-2">{row.total_hours ?? "-"}</td>
                    <td className="py-2 capitalize">{row.status || "absent"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "leave" ? (
        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">Type</th>
                  <th className="py-2">From</th>
                  <th className="py-2">To</th>
                  <th className="py-2">Days</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveRows.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-2 capitalize">{row.type}</td>
                    <td className="py-2">{formatDate(row.from_date)}</td>
                    <td className="py-2">{formatDate(row.to_date)}</td>
                    <td className="py-2">{row.total_days}</td>
                    <td className="py-2 capitalize">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "performance" ? (
        <Card>
          <CardHeader>
            <CardTitle>Performance Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {performanceRows.map((row) => (
              <div key={row.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium capitalize text-slate-900">{row.category || "general"}</p>
                  <Badge variant="outline">Rating: {row.rating}/5</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-700">{row.note}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDate(row.date)}</p>
              </div>
            ))}
            {!performanceRows.length ? <p className="text-sm text-slate-500">No performance notes found.</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "salary" ? (
        <Card>
          <CardHeader>
            <CardTitle>Salary Records</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-slate-500">
                  <th className="py-2">Month</th>
                  <th className="py-2">Amount (NZD)</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Paid On</th>
                </tr>
              </thead>
              <tbody>
                {salaryRows.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-2">
                      {row.month}/{row.year}
                    </td>
                    <td className="py-2">${Number(row.amount || 0).toFixed(2)}</td>
                    <td className="py-2 capitalize">{row.status}</td>
                    <td className="py-2">{formatDate(row.paid_on)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "idcard" ? (
        <Card>
          <CardHeader>
            <CardTitle>ID Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">
              Card Status:{" "}
              <span className="font-medium capitalize">{staff.id_card_generated_at ? "generated" : staff.id_card_status || "not generated"}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {staff.id_card_generated_at ? (
                <Button onClick={() => setIsIdCardModalOpen(true)}>View / Print ID Card</Button>
              ) : null}
              {isAdmin ? (
                <Button onClick={handleGenerateIdCard} disabled={generatingId}>
                  {generatingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Generate ID Card
                </Button>
              ) : null}
            </div>
            <IdCardModal isOpen={isIdCardModalOpen} onClose={() => setIsIdCardModalOpen(false)} staff={staff} />
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "activity" ? (
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityLogs.map((log, index) => (
                <div key={`${log.title}-${index}`} className="rounded-lg border p-3">
                  <p className="text-sm font-medium text-slate-900">{log.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{log.description}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTime(log.timestamp)}</p>
                </div>
              ))}
              {!activityLogs.length ? <p className="text-sm text-slate-500">No recent activities.</p> : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({ label, value, onChange, disabled, type = "text" }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <input
        type={type}
        className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  );
}

function SelectField({ label, value, onChange, disabled, options }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase text-slate-500">{label}</span>
      <select
        className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-100"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={`${option.label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
