"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const addNoteSchema = z.object({
  user_id: z.coerce.number().int().positive("Staff member is required"),
  category: z.enum(["technical", "communication", "teamwork", "punctuality", "leadership", "general"]),
  rating: z.coerce.number().int().min(1).max(5),
  date: z.string().min(1, "Date is required"),
  note: z.string().min(20, "Note must be at least 20 characters")
});

const CATEGORY_OPTIONS = [
  { value: "technical", label: "Technical" },
  { value: "communication", label: "Communication" },
  { value: "teamwork", label: "Teamwork" },
  { value: "punctuality", label: "Punctuality" },
  { value: "leadership", label: "Leadership" },
  { value: "general", label: "General" }
];

export default function AddNoteModal({
  isOpen,
  onOpenChange,
  staffOptions,
  initialUserId,
  onSubmit,
  isSubmitting
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(addNoteSchema),
    defaultValues: {
      user_id: initialUserId || "",
      category: "general",
      rating: 4,
      date: new Date().toISOString().split("T")[0],
      note: ""
    }
  });

  const currentRating = Number(watch("rating"));

  useEffect(() => {
    if (isOpen) {
      reset({
        user_id: initialUserId || "",
        category: "general",
        rating: 4,
        date: new Date().toISOString().split("T")[0],
        note: ""
      });
    }
  }, [isOpen, initialUserId, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Performance Note</DialogTitle>
          <DialogDescription>
            Add structured feedback with category, rating, and dated note.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Staff</label>
              <select
                {...register("user_id")}
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm"
              >
                <option value="">Select staff member</option>
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name}
                  </option>
                ))}
              </select>
              {errors.user_id && <p className="text-xs text-red-600">{errors.user_id.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Category</label>
              <select
                {...register("category")}
                className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-xs text-red-600">{errors.category.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Rating</label>
              <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-2">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setValue("rating", value)}
                      className="rounded p-1 transition hover:scale-105"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          value <= currentRating ? "fill-amber-400 text-amber-500" : "text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {errors.rating && <p className="text-xs text-red-600">{errors.rating.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Date</label>
              <Input type="date" {...register("date")} />
              {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Note</label>
            <textarea
              {...register("note")}
              rows={5}
              placeholder="Write detailed performance observations..."
              className="w-full rounded-md border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-brand-orange"
            />
            {errors.note && <p className="text-xs text-red-600">{errors.note.message}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
