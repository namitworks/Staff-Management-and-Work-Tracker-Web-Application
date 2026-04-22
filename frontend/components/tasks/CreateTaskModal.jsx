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

const taskSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  project_id: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["todo", "in_progress", "review", "done"]),
  assigned_to: z.string().optional(),
  deadline: z.string().optional(),
  estimated_hrs: z
    .string()
    .optional()
    .refine((value) => !value || (!Number.isNaN(Number(value)) && Number(value) >= 0), "Estimated hours must be a positive number"),
  tags: z.string().optional()
});

const defaultValues = {
  title: "",
  description: "",
  project_id: "",
  priority: "medium",
  status: "todo",
  assigned_to: "",
  deadline: "",
  estimated_hrs: "",
  tags: ""
};

export default function CreateTaskModal({
  open,
  onOpenChange,
  onSubmit,
  loading = false,
  staff = [],
  projects = [],
  initialData = null
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(taskSchema),
    defaultValues
  });

  useEffect(() => {
    if (!open) return;
    if (initialData) {
      reset({
        title: initialData.title || "",
        description: initialData.description || "",
        project_id: initialData.project_id ? String(initialData.project_id) : "",
        priority: initialData.priority || "medium",
        status: initialData.status || "todo",
        assigned_to: initialData.assigned_to ? String(initialData.assigned_to) : "",
        deadline: initialData.deadline ? String(initialData.deadline).slice(0, 10) : "",
        estimated_hrs: initialData.estimated_hrs ? String(initialData.estimated_hrs) : "",
        tags: initialData.tags || ""
      });
      return;
    }
    reset(defaultValues);
  }, [open, initialData, reset]);

  const submitForm = (values) => {
    onSubmit({
      title: values.title.trim(),
      description: values.description || null,
      project_id: values.project_id ? Number(values.project_id) : null,
      priority: values.priority,
      status: values.status,
      assigned_to: values.assigned_to ? Number(values.assigned_to) : null,
      deadline: values.deadline || null,
      estimated_hrs: values.estimated_hrs ? Number(values.estimated_hrs) : 0,
      tags: values.tags || null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Task" : "Create Task"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update task details and assignment." : "Create and assign a new task."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitForm)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input
                {...register("title")}
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                placeholder="Task title"
              />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Project</label>
              <select {...register("project_id")} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              {...register("description")}
              className="min-h-[90px] w-full rounded-md border border-slate-200 p-3 text-sm"
              placeholder="Describe the task"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Priority</label>
              <select {...register("priority")} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <select {...register("status")} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Assign To</label>
              <select {...register("assigned_to")} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm">
                <option value="">Unassigned</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Deadline</label>
              <input {...register("deadline")} type="date" className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Estimated Hours</label>
              <input
                {...register("estimated_hrs")}
                type="number"
                step="0.5"
                min="0"
                className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                placeholder="0"
              />
              {errors.estimated_hrs && <p className="text-xs text-red-500">{errors.estimated_hrs.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Tags</label>
              <input {...register("tags")} className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm" placeholder="ui, urgent" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#1A3A5C] text-white hover:bg-[#15304A]" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {initialData ? "Save Changes" : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
