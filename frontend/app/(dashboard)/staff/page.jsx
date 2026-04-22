"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  Plus, 
  MoreHorizontal, 
  UserCircle,
  Mail,
  Phone,
  Building,
  Calendar,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

import { useRouter } from "next/navigation";

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meRes, staffRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/staff")
        ]);
        
        const currentUser = meRes.data.data;
        setUser(currentUser);
        
        if (currentUser.role !== 'admin' && currentUser.role !== 'team_lead') {
          router.push("/dashboard");
          return;
        }

        setStaff(staffRes.data.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-32 h-10" />
        </div>
        <Card>
          <CardContent className="p-0">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-1/4 h-4" />
                  <Skeleton className="w-1/2 h-3" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Staff Directory</h1>
        <Link href="/staff/new">
          <Button className="flex items-center gap-2 bg-brand-navy hover:bg-brand-navy/90 rounded-xl text-white">
            <Plus className="w-4 h-4" /> Add New Staff
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by name, email, or department..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Name & Role</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((person) => (
                    <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#1A3A5C]">
                            {person.avatar_url ? (
                              <img src={person.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <UserCircle className="w-6 h-6" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{person.name}</p>
                            <p className="text-xs text-slate-500 capitalize">{person.role.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Building className="w-4 h-4 text-slate-400" />
                          {person.department || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600 lowercase">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            {person.email}
                          </div>
                          {person.phone && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {person.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {person.joining_date ? new Date(person.joining_date).toLocaleDateString('en-NZ') : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={person.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                          {person.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/staff/${person.id}`}>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      No staff members found matching your search.
                    </td>
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
