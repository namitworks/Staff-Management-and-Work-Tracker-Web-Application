"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  LogIn,
  LogOut,
  MapPin,
  Users
} from "lucide-react";
import { toast, Toaster } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const NZ_TIMEZONE = "Pacific/Auckland";
const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
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
];

const getNzMonthYear = (date = new Date()) => {
  const month = Number(
    new Intl.DateTimeFormat("en-NZ", { timeZone: NZ_TIMEZONE, month: "2-digit" }).format(date)
  );
  const year = Number(
    new Intl.DateTimeFormat("en-NZ", { timeZone: NZ_TIMEZONE, year: "numeric" }).format(date)
  );
  return { month, year };
};

const formatTimeNz = (value) => {
  if (!value) return "--";
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: NZ_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
};

const formatDateNz = (value, options) =>
  new Intl.DateTimeFormat("en-NZ", { timeZone: NZ_TIMEZONE, ...options }).format(new Date(value));

const statusBadgeClass = (status) => {
  if (status === "present") return "bg-green-100 text-green-800";
  if (status === "late") return "bg-amber-100 text-amber-800";
  if (status === "half_day") return "bg-yellow-100 text-yellow-800";
  if (status === "absent") return "bg-slate-200 text-slate-700";
  return "bg-slate-200 text-slate-700";
};

const heatmapCellClass = (day) => {
  if (!day) return "bg-transparent border-transparent";
  if (day.is_today) return "bg-blue-500/20 border-blue-500";
  if (day.is_weekend) return "bg-slate-200 border-slate-300";
  if (day.status === "present") return "bg-green-500/30 border-green-500/40";
  if (day.status === "late") return "bg-amber-500/35 border-amber-500/40";
  if (day.status === "half_day") return "bg-yellow-400/35 border-yellow-500/40";
  return "bg-red-500/25 border-red-500/30";
};

const hoursToHuman = (hours) => {
  if (hours === null || hours === undefined) return "--";
  const totalMinutes = Math.round(Number(hours) * 60);
  const hr = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  return `${hr} hrs ${min} mins`;
};

export default function AttendancePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => getNzMonthYear().month);
  const [selectedYear, setSelectedYear] = useState(() => getNzMonthYear().year);
  const [liveTime, setLiveTime] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const [staffToday, setStaffToday] = useState(null);
  const [staffMonthRecords, setStaffMonthRecords] = useState([]);
  const [staffSummary, setStaffSummary] = useState(null);

  const [adminTodayRows, setAdminTodayRows] = useState([]);
  const [adminReportRows, setAdminReportRows] = useState([]);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendanceData = useCallback(async (targetUser) => {
    if (!targetUser?.id) return;

    if (targetUser.role === "admin") {
      const [todayRes, reportRes] = await Promise.all([
        api.get("/attendance/today"),
        api.get(`/attendance/report?month=${selectedMonth}&year=${selectedYear}`)
      ]);

      setAdminTodayRows(todayRes.data.data || []);
      setAdminReportRows(reportRes.data.data || []);
      return;
    }

    const [todayRes, monthRes, summaryRes] = await Promise.all([
      api.get("/attendance/today"),
      api.get(`/attendance/user/${targetUser.id}?month=${selectedMonth}&year=${selectedYear}`),
      api.get(`/attendance/summary/${targetUser.id}`)
    ]);

    setStaffToday(todayRes.data.data);
    setStaffMonthRecords(monthRes.data.data || []);
    setStaffSummary(summaryRes.data.data);
    setSelectedDay((monthRes.data.data || [])[0] || null);
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        const userRes = await api.get("/auth/me");
        setUser(userRes.data.data);
      } catch (error) {
        console.error("Failed to load attendance page:", error);
        toast.error("Failed to load attendance data");
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchAttendanceData(user).catch((error) => {
      console.error("Failed to refresh attendance data:", error);
      toast.error("Failed to refresh attendance data");
    });
  }, [user, fetchAttendanceData]);

  const handlePunchAction = async (action) => {
    try {
      setIsActionLoading(true);
      await api.post(action === "checkin" ? "/attendance/checkin" : "/attendance/checkout");
      toast.success(action === "checkin" ? "Checked in successfully" : "Checked out successfully");
      await fetchAttendanceData(user);
    } catch (error) {
      const message = error?.response?.data?.message || "Attendance action failed";
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!adminReportRows.length) {
      toast.error("No report rows to export");
      return;
    }

    const header = ["Staff Name", "Present", "Absent", "Late", "Half Day", "Attendance %"];
    const rows = adminReportRows.map((row) => [
      row.name,
      row.present,
      row.absent,
      row.late,
      row.half_day,
      `${row.attendance_percentage}%`
    ]);
    const csv = [header, ...rows].map((line) => line.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${selectedYear}-${String(selectedMonth).padStart(2, "0")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const monthYearOptions = useMemo(() => {
    const { year: currentYear } = getNzMonthYear();
    return [currentYear - 1, currentYear, currentYear + 1];
  }, []);

  const calendarCells = useMemo(() => {
    if (!staffMonthRecords.length) return [];
    const firstDate = staffMonthRecords[0]?.date;
    const first = new Date(`${firstDate}T00:00:00`);
    const firstDayIndex = (first.getDay() + 6) % 7;
    return [...Array(firstDayIndex).fill(null), ...staffMonthRecords];
  }, [staffMonthRecords]);

  const liveClock = formatDateNz(liveTime, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const liveDate = formatDateNz(liveTime, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isAdmin) {
    const presentToday = adminTodayRows.filter((row) => row.status !== "absent").length;
    const totalStaff = adminTodayRows.length || 1;
    const presentPct = Math.round((presentToday / totalStaff) * 100);

    return (
      <div className="space-y-6">
        <Toaster position="top-right" richColors />

        <Card className="rounded-2xl border-0 shadow-premium">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
              <Users className="h-5 w-5 text-green-600" />
              Today&apos;s Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">Present today</span>
                <span className="font-bold text-slate-800">
                  {presentToday}/{adminTodayRows.length || 0}
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-green-500 transition-all"
                  style={{ width: `${presentPct}%` }}
                />
              </div>
            </div>

            <div className="space-y-3">
              {adminTodayRows.map((row) => (
                <div
                  key={row.user_id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                      {row.avatar_url ? (
                        <img src={row.avatar_url} alt={row.name} className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        row.name?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{row.name}</p>
                      <p className="text-xs text-slate-500">
                        Check-in: {row.check_in ? formatTimeNz(row.check_in) : "--"}
                      </p>
                    </div>
                  </div>
                  <Badge className={statusBadgeClass(row.status)}>
                    {row.status === "half_day" ? "Half Day" : row.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-premium">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
              <CalendarDays className="h-5 w-5 text-brand-orange" />
              Monthly Report
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(Number(event.target.value))}
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
              >
                {MONTH_NAMES.map((monthName, index) => (
                  <option key={monthName} value={index + 1}>
                    {monthName}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
              >
                {monthYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <Button onClick={handleExportReport} className="bg-brand-navy text-white hover:bg-brand-navy/90">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                    <th className="px-2 py-3">Staff Name</th>
                    <th className="px-2 py-3">Present</th>
                    <th className="px-2 py-3">Absent</th>
                    <th className="px-2 py-3">Late</th>
                    <th className="px-2 py-3">Half Day</th>
                    <th className="px-2 py-3">Attendance %</th>
                  </tr>
                </thead>
                <tbody>
                  {adminReportRows.map((row) => (
                    <tr key={row.user_id} className="border-b border-slate-50 text-sm">
                      <td className="px-2 py-3 font-semibold text-slate-800">{row.name}</td>
                      <td className="px-2 py-3">{row.present}</td>
                      <td className="px-2 py-3">{row.absent}</td>
                      <td className="px-2 py-3">{row.late}</td>
                      <td className="px-2 py-3">{row.half_day}</td>
                      <td className="px-2 py-3">
                        <span
                          className={
                            row.attendance_percentage > 90
                              ? "font-bold text-green-700"
                              : row.attendance_percentage >= 70
                                ? "font-bold text-amber-700"
                                : "font-bold text-red-700"
                          }
                        >
                          {row.attendance_percentage}%
                        </span>
                      </td>
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

  const checkedIn = staffToday?.check_in && !staffToday?.check_out;
  const completed = staffToday?.check_in && staffToday?.check_out;

  return (
    <div className="space-y-6">
      <Toaster position="top-right" richColors />

      <Card className="rounded-2xl border-0 shadow-premium">
        <CardContent className="space-y-8 pt-8">
          <div className="text-center">
            <p className="text-5xl font-bold tracking-tight text-brand-navy">{liveClock}</p>
            <p className="mt-2 text-sm font-medium text-slate-600">{liveDate}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{NZ_TIMEZONE}</p>
          </div>

          <div className="flex justify-center">
            {!staffToday?.check_in && (
              <Button
                disabled={isActionLoading}
                onClick={() => handlePunchAction("checkin")}
                className="h-20 w-60 bg-green-600 text-lg font-bold text-white hover:bg-green-700"
              >
                <LogIn className="mr-2 h-6 w-6" />
                CHECK IN
              </Button>
            )}

            {checkedIn && (
              <Button
                disabled={isActionLoading}
                onClick={() => handlePunchAction("checkout")}
                className="h-20 w-60 bg-red-600 text-lg font-bold text-white hover:bg-red-700"
              >
                <LogOut className="mr-2 h-6 w-6" />
                CHECK OUT
              </Button>
            )}

            {completed && (
              <div className="flex h-20 w-60 items-center justify-center rounded-xl border border-green-200 bg-green-50 font-bold text-green-700">
                <CheckCircle2 className="mr-2 h-6 w-6" />
                Completed for today
              </div>
            )}
          </div>

          <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-700">
            Checked in: <span className="font-semibold">{formatTimeNz(staffToday?.check_in)}</span>
            {" | "}
            Checked out: <span className="font-semibold">{formatTimeNz(staffToday?.check_out)}</span>
            {" | "}
            Total hours: <span className="font-semibold">{hoursToHuman(staffToday?.total_hours)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">This Month Present</p>
            <p className="mt-2 text-3xl font-bold text-green-700">{staffSummary?.present || 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">This Month Absent</p>
            <p className="mt-2 text-3xl font-bold text-red-700">{staffSummary?.absent || 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Late Arrivals</p>
            <p className="mt-2 text-3xl font-bold text-amber-700">{staffSummary?.late || 0}</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-0 shadow-sm">
          <CardContent className="pt-6">
            <p className="text-xs uppercase text-slate-500">Attendance %</p>
            <p className="mt-2 text-3xl font-bold text-brand-navy">{staffSummary?.attendance_percentage || 0}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-0 shadow-premium">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
            <CalendarDays className="h-5 w-5 text-brand-orange" />
            Calendar Heatmap
          </CardTitle>
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
            >
              {MONTH_NAMES.map((monthName, index) => (
                <option key={monthName} value={index + 1}>
                  {monthName}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm"
            >
              {monthYearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {WEEKDAY_HEADERS.map((label) => (
              <div key={label} className="text-center text-xs font-bold uppercase text-slate-500">
                {label}
              </div>
            ))}
            {calendarCells.map((day, index) => (
              <button
                key={day ? day.date : `empty-${index}`}
                disabled={!day}
                title={
                  day
                    ? `${day.date} - ${day.status} - In: ${formatTimeNz(day.check_in)} - Out: ${formatTimeNz(day.check_out)}`
                    : ""
                }
                onClick={() => day && setSelectedDay(day)}
                className={`h-10 rounded-md border text-xs font-semibold transition ${
                  day ? "text-slate-700 hover:scale-[1.04]" : ""
                } ${heatmapCellClass(day)}`}
              >
                {day ? Number(day.date.split("-")[2]) : ""}
              </button>
            ))}
          </div>

          {selectedDay && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
              <p className="font-bold text-slate-800">{selectedDay.date}</p>
              <p className="mt-1 text-slate-600">
                Check-in: {formatTimeNz(selectedDay.check_in)} | Check-out: {formatTimeNz(selectedDay.check_out)} |
                Hours: {hoursToHuman(selectedDay.total_hours)}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge className={statusBadgeClass(selectedDay.status)}>
                  {selectedDay.status === "half_day" ? "Half Day" : selectedDay.status}
                </Badge>
                {selectedDay.location && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {selectedDay.location}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-0 shadow-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
            <Clock3 className="h-5 w-5 text-brand-orange" />
            Monthly Attendance Table
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <th className="px-2 py-3">Date</th>
                  <th className="px-2 py-3">Day</th>
                  <th className="px-2 py-3">Check In</th>
                  <th className="px-2 py-3">Check Out</th>
                  <th className="px-2 py-3">Hours</th>
                  <th className="px-2 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {staffMonthRecords.map((row) => (
                  <tr key={row.date} className="border-b border-slate-50 text-sm">
                    <td className="px-2 py-3 font-medium text-slate-800">{row.date}</td>
                    <td className="px-2 py-3">{row.weekday}</td>
                    <td className="px-2 py-3">{formatTimeNz(row.check_in)}</td>
                    <td className="px-2 py-3">{formatTimeNz(row.check_out)}</td>
                    <td className="px-2 py-3">{row.total_hours ?? "--"}</td>
                    <td className="px-2 py-3">
                      <Badge className={statusBadgeClass(row.status)}>
                        {row.status === "half_day" ? "Half Day" : row.status}
                      </Badge>
                    </td>
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
