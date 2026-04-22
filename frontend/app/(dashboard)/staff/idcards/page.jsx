"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CreditCard,
  Search,
  Loader2,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import api from "@/lib/api";
import IdCardModal from "@/components/idcard/IdCardModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function IdCardsPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [isRegenConfirmOpen, setIsRegenConfirmOpen] = useState(false);
  const [staffToRegen, setStaffToRegen] = useState(null);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);
  const [staffToReject, setStaffToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);

      const meRes = await api.get("/auth/me");
      const user = meRes?.data?.data;

      if (!user || user.role !== "admin") {
        toast.error("Only admins can access ID card management");
        router.push("/dashboard");
        return;
      }

      const { data } = await api.get("/staff");
      if (data.success) {
        setStaffList(data.data);
      } else {
        setStaffList([]);
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      toast.error("Failed to load staff data");
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleGenerate = async (userId) => {
    try {
      const { data } = await api.post("/idcards/generate", { user_id: Number(userId) });
      if (data.success) {
        toast.success("ID Card generated");
        await fetchStaff();
        setSelectedStaff(data.data);
        setIsModalOpen(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Generation failed");
    }
  };

  const handleGenerateAllMissing = async () => {
    const missing = staffList.filter((s) => !s.id_card_generated_at);
    if (missing.length === 0) {
      toast.info("No missing ID cards to generate");
      return;
    }

    try {
      setIsGeneratingBulk(true);
      let successCount = 0;
      for (const staff of missing) {
        try {
          await api.post("/idcards/generate", { user_id: staff.id });
          successCount++;
        } catch (err) {
          console.error(`Failed to generate for ${staff.name}`, err);
        }
      }
      toast.success(`Successfully generated ${successCount} ID cards`);
      await fetchStaff();
    } catch (error) {
      toast.error("Bulk generation encountered errors");
    } finally {
      setIsGeneratingBulk(false);
      setIsBulkConfirmOpen(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!staffToReject?.id) return;
    if (!rejectReason.trim()) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      setIsRejecting(true);
      const { data } = await api.put(`/idcards/${staffToReject.id}/reject`, {
        reason: rejectReason.trim(),
      });

      if (data.success) {
        toast.success("ID card request rejected");
        setIsRejectConfirmOpen(false);
        setStaffToReject(null);
        setRejectReason("");
        await fetchStaff();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject request");
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredStaff = staffList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.staff_id && s.staff_id.toLowerCase().includes(search.toLowerCase())) ||
    (s.department && s.department.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = {
    total: staffList.length,
    generated: staffList.filter((s) => s.id_card_generated_at).length,
    pendingRequests: staffList.filter((s) => s.id_card_status === "pending" && !s.id_card_generated_at).length,
    missing: staffList.filter((s) => !s.id_card_generated_at).length,
  };

  const getStatusBadge = (staff) => {
    if (!staff.id_card_generated_at && staff.id_card_status === "pending") {
      return <Badge className="bg-amber-500 hover:bg-amber-600">Request Pending</Badge>;
    }

    if (!staff.id_card_generated_at && staff.id_card_status === "rejected") {
      return <Badge variant="destructive">Request Rejected</Badge>;
    }

    if (!staff.id_card_generated_at) {
      return (
        <Badge variant="secondary" className="bg-slate-100 text-slate-500">
          Not Issued
        </Badge>
      );
    }

    return (
      <Badge className="bg-green-600 hover:bg-green-700 text-white">
        Approved / Active
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff ID Cards</h1>
          <p className="text-slate-500">Admin panel to process requests, generate, and reissue staff ID cards</p>
        </div>
        <Button
          onClick={() => setIsBulkConfirmOpen(true)}
          className="bg-[#1A3A5C] hover:bg-[#2E75B6]"
          disabled={isGeneratingBulk || stats.missing === 0}
        >
          {isGeneratingBulk ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4 mr-2" />
          )}
          Generate All Missing ({stats.missing})
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Staff</p>
              <h3 className="text-2xl font-bold">{stats.total}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Generated</p>
              <h3 className="text-2xl font-bold">{stats.generated}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Pending Requests</p>
              <h3 className="text-2xl font-bold">{stats.pendingRequests}</h3>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-slate-50 text-slate-600 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Not Yet Generated</p>
              <h3 className="text-2xl font-bold">{stats.missing}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b bg-slate-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold">Staff Directory</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="w-full h-12" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Name</TableHead>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Generated On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      No staff found matching your search
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center text-[#1A3A5C] font-bold text-xs">
                            {staff.avatar_url ? (
                              <img src={staff.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              staff.name.charAt(0)
                            )}
                          </div>
                          <span className="font-medium text-slate-700">{staff.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{staff.staff_id || "-"}</TableCell>
                      <TableCell className="text-slate-500">{staff.department || "-"}</TableCell>
                      <TableCell className="text-slate-500">
                        {staff.id_card_generated_at ? new Date(staff.id_card_generated_at).toLocaleDateString("en-NZ") : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{getStatusBadge(staff)}</div>
                          {staff.id_card_status === "rejected" && staff.id_card_rejection_reason && (
                            <p className="text-xs text-slate-500 line-clamp-2">
                              Reason: {staff.id_card_rejection_reason}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {!staff.id_card_generated_at ? (
                          staff.id_card_status === "pending" ? (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => handleGenerate(staff.id)} className="bg-[#1A3A5C]">
                                <ShieldCheck className="w-4 h-4 mr-1" />
                                Approve & Generate
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  setStaffToReject(staff);
                                  setRejectReason("");
                                  setIsRejectConfirmOpen(true);
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => handleGenerate(staff.id)} className="bg-[#1A3A5C]">
                              <ShieldCheck className="w-4 h-4 mr-1" />
                              Generate
                            </Button>
                          )
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedStaff(staff);
                                setIsModalOpen(true);
                              }}
                            >
                              View / Print
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-slate-500"
                              onClick={() => {
                                setStaffToRegen(staff);
                                setIsRegenConfirmOpen(true);
                              }}
                            >
                              Regenerate
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <IdCardModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} staff={selectedStaff} />

      <AlertDialog open={isBulkConfirmOpen} onOpenChange={setIsBulkConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate {stats.missing} ID Cards?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate cards for all staff members who do not have one yet.
              This process might take a moment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerateAllMissing} className="bg-[#1A3A5C]">
              Start Generation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRegenConfirmOpen} onOpenChange={setIsRegenConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate ID Card for {staffToRegen?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will update the issue date and extend validity for another 2 years.
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (staffToRegen?.id) {
                  handleGenerate(staffToRegen.id);
                }
              }}
              className="bg-[#1A3A5C]"
            >
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isRejectConfirmOpen}
        onOpenChange={(open) => {
          setIsRejectConfirmOpen(open);
          if (!open) {
            setStaffToReject(null);
            setRejectReason("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject ID Card Request for {staffToReject?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This request will be marked as rejected and the staff member will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="reject-reason">
              Rejection reason
            </label>
            <Input
              id="reject-reason"
              placeholder="Enter reason for rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              disabled={isRejecting}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                handleRejectRequest();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isRejecting}
            >
              {isRejecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Reject Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
