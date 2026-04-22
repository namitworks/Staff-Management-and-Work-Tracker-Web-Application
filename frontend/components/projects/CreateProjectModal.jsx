"use client";

import { useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

const projectSchema = z.object({
  name: z.string().trim().min(3, "Project name must be at least 3 characters"),
  type: z.enum(["website", "pos_onboarding", "support", "other"]),
  status: z.enum(["active", "completed", "on_hold"]),
  client_name: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z
    .string()
    .optional()
    .refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0), "Budget must be a positive number"),
  description: z.string().optional()
});

const defaultValues = {
  name: "",
  type: "website",
  status: "active",
  client_name: "",
  start_date: "",
  end_date: "",
  budget: "",
  description: ""
};

export default function CreateProjectModal({ open, onOpenChange, onSubmit, loading = false, initialData = null }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues
  });

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      reset({
        name: initialData.name || "",
        type: initialData.type || "website",
        status: initialData.status || "active",
        client_name: initialData.client_name || "",
        start_date: initialData.start_date ? String(initialData.start_date).slice(0, 10) : "",
        end_date: initialData.end_date ? String(initialData.end_date).slice(0, 10) : "",
        budget: initialData.budget ? String(initialData.budget) : "",
        description: initialData.description || ""
      });
      return;
    }
    reset(defaultValues);
  }, [open, initialData, reset]);

  const submitForm = (values) => {
    onSubmit({
      name: values.name.trim(),
      type: values.type,
      status: values.status,
      client_name: values.client_name || null,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
      budget: values.budget ? Number(values.budget) : 0,
      description: values.description || null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Project" : "Create Project"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update project details." : "Set up a project for tasks and collaboration."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input {...register("name")} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Project name" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Type</label>
              <select {...register("type")} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
                <option value="website">Website</option>
                <option value="pos_onboarding">POS Onboarding</option>
                <option value="support">Support</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select {...register("status")} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Client Name</label>
              <input {...register("client_name")} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="Client" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Budget (NZD)</label>
              <input
                {...register("budget")}
                type="number"
                min="0"
                step="0.01"
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                placeholder="0.00"
              />
              {errors.budget && <p className="text-xs text-red-500">{errors.budget.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Start Date</label>
              <input {...register("start_date")} type="date" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">End Date</label>
              <input {...register("end_date")} type="date" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              {...register("description")}
              className="min-h-[90px] w-full rounded-md border border-slate-200 p-3 text-sm"
              placeholder="Project scope, outcomes, or notes"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1A3A5C] text-white hover:bg-[#15304A]" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {initialData ? "Save Changes" : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
