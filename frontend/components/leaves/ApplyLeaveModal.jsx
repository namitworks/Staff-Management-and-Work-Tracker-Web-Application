"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const leaveSchema = z
  .object({
    type: z.enum(["annual", "sick", "personal", "unpaid"]),
    from_date: z.string().min(1, "From date is required"),
    to_date: z.string().min(1, "To date is required"),
    reason: z.string().min(10, "Reason must be at least 10 characters")
  })
  .refine((data) => new Date(data.from_date) <= new Date(data.to_date), {
    message: "From date cannot be after To date",
    path: ["to_date"]
  });

const getWorkingDays = (fromDate, toDate) => {
  if (!fromDate || !toDate) return 0;

  const start = new Date(`${fromDate}T00:00:00`);
  const end = new Date(`${toDate}T00:00:00`);
  if (start > end) return 0;

  let count = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count += 1;
  }
  return count;
};

export default function ApplyLeaveModal({ isOpen, onOpenChange, leaveBalance, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      type: "annual",
      from_date: "",
      to_date: "",
      reason: ""
    }
  });

  const selectedType = watch("type");
  const fromDate = watch("from_date");
  const toDate = watch("to_date");
  const workingDays = useMemo(() => getWorkingDays(fromDate, toDate), [fromDate, toDate]);

  const remainingByType = useMemo(() => {
    if (!leaveBalance) {
      return { annual: 0, sick: 0, personal: 0, unpaid: Number.MAX_SAFE_INTEGER };
    }

    return {
      annual: leaveBalance.annual_remaining,
      sick: leaveBalance.sick_remaining,
      personal: leaveBalance.personal_remaining,
      unpaid: Number.MAX_SAFE_INTEGER
    };
  }, [leaveBalance]);

  const selectedTypeRemaining = remainingByType[selectedType] ?? 0;
  const isInsufficientBalance = selectedType !== "unpaid" && workingDays > selectedTypeRemaining;

  useEffect(() => {
    if (!isOpen) {
      reset({
        type: "annual",
        from_date: "",
        to_date: "",
        reason: ""
      });
    }
  }, [isOpen, reset]);

  const onSubmit = async (values) => {
    if (isInsufficientBalance) {
      toast.error("Insufficient leave balance for selected range");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/leaves", values);
      toast.success("Leave application submitted");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to submit leave application";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
          <DialogDescription>
            Select leave type, date range, and reason. Weekends are excluded automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Leave Type</label>
            <select
              {...register("type")}
              className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm"
            >
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
            {errors.type && <p className="text-xs text-red-600">{errors.type.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">From Date</label>
              <Input type="date" {...register("from_date")} />
              {errors.from_date && <p className="text-xs text-red-600">{errors.from_date.message}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">To Date</label>
              <Input type="date" {...register("to_date")} />
              {errors.to_date && <p className="text-xs text-red-600">{errors.to_date.message}</p>}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-slate-700">Working days: {workingDays}</p>
            <p className="text-slate-600">
              Remaining {selectedType} leave:{" "}
              <span className={isInsufficientBalance ? "font-semibold text-red-600" : "font-semibold text-slate-800"}>
                {selectedType === "unpaid" ? "Unlimited" : `${selectedTypeRemaining} day(s)`}
              </span>
            </p>
            {isInsufficientBalance && (
              <p className="mt-1 text-xs font-medium text-red-600">
                You do not have enough balance for this request.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Reason</label>
            <textarea
              {...register("reason")}
              rows={4}
              placeholder="Please describe the reason for leave"
              className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-brand-orange"
            />
            {errors.reason && <p className="text-xs text-red-600">{errors.reason.message}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isInsufficientBalance}>
              {isSubmitting ? "Submitting..." : "Submit Leave"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
