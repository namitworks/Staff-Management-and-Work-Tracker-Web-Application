"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  User,
  Calendar,
  Building,
  Mail,
  Phone,
  MapPin,
  Clock,
  FileText,
  TrendingUp,
  Banknote
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import IdCardModal from "@/components/staff/IdCardModal";
import api from "@/lib/api";

const tabs = [
  { id: 'overview', name: 'Overview', icon: User },
  { id: 'attendance', name: 'Attendance', icon: Clock },
  { id: 'leave', name: 'Leave', icon: FileText },
  { id: 'performance', name: 'Performance', icon: TrendingUp },
  { id: 'salary', name: 'Salary', icon: Banknote },
];

export default function StaffProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [staff, setStaff] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStaffDetails = async () => {
      try {
        const [staffRes, userRes] = await Promise.all([
          api.get(`/staff/${id}`),
          api.get("/auth/me")
        ]);
        
        if (staffRes.data.success) {
          setStaff(staffRes.data.data);
        }
        if (userRes.data.success) {
          setCurrentUser(userRes.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStaffDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="w-32 h-8" />
        <Card className="h-96" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-500">
        <p>Staff member not found.</p>
        <Button variant="link" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-800">Staff Profile</h1>
        </div>
        <div className="flex items-center gap-2 px-1">
          {(currentUser?.role === 'admin' || currentUser?.role === 'team_lead') && (
            <IdCardModal staff={staff} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Side: Basic Info Card */}
        <Card className="w-full lg:w-80 shrink-0">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center text-[#1A3A5C]">
              {staff.avatar_url ? (
                <img src={staff.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-12 h-12" />
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{staff.name}</h2>
            <p className="text-sm text-slate-500 capitalize">{staff.role.replace('_', ' ')}</p>
            <Badge className="mt-4" variant={staff.status === 'active' ? 'default' : 'secondary'}>
              {staff.status}
            </Badge>

            <div className="mt-8 space-y-4 text-left">
              <div className="flex items-center gap-3 text-sm text-slate-600 lowercase">
                <Mail className="w-4 h-4 text-slate-400" />
                {staff.email}
              </div>
              {staff.phone && (
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {staff.phone}
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Building className="w-4 h-4 text-slate-400" />
                {staff.department || 'No department'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Side: Detailed Tabs */}
        <div className="flex-1 space-y-6">
          <div className="flex gap-2 p-1 overflow-x-auto bg-slate-100 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                    activeTab === tab.id 
                      ? "bg-white text-slate-900 shadow-sm" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          <Card>
            <CardContent className="p-8">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase">Staff ID</p>
                      <p className="text-slate-800 font-bold">{staff.staff_id || 'Not Assigned'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase">Joining Date</p>
                      <p className="text-slate-800">{staff.joining_date ? new Date(staff.joining_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Address</p>
                    <p className="text-slate-800 flex items-start gap-2">
                       <MapPin className="w-4 h-4 mt-1 text-slate-400 shrink-0" />
                       {staff.address || 'Address not listed'}
                    </p>
                  </div>
                </div>
              )}
              {activeTab !== 'overview' && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <p>Detailed {activeTab} history will be implemented in Step 3.5.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
