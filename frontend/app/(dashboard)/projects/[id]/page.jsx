"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Plus, UserCircle2 } from "lucide-react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CreateTaskModal from "@/components/tasks/CreateTaskModal";

const STATUS_COLUMNS = [
  { id: "todo", label: "TO DO" },
  { id: "in_progress", label: "IN PROGRESS" },
  { id: "review", label: "REVIEW" },
  { id: "done", label: "DONE" }
];

const PRIORITY_CLASSES = {
  urgent: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-slate-100 text-slate-700"
};

const formatDate = (value) => {
  if (!value) return "TBD";
  return new Date(value).toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [user, setUser] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState("todo");

  const canManage = user?.role === "admin" || user?.role === "team_lead";

  const fetchProject = useCallback(async () => {
    const [meRes, projectRes] = await Promise.all([api.get("/auth/me"), api.get(`/projects/${id}`)]);
    const me = meRes.data.data;
    const payload = projectRes.data.data;
    setUser(me);
    setProject(payload);
    setTasks(payload.tasks || []);

    if (me.role === "admin" || me.role === "team_lead") {
      const staffRes = await api.get("/staff");
      setStaff(staffRes.data.data || []);
    }
  }, [id]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await fetchProject();
      } catch (error) {
        console.error("Project detail load error:", error);
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [fetchProject]);

  const grouped = useMemo(() => {
    const map = { todo: [], in_progress: [], review: [], done: [] };
    tasks.forEach((task) => {
      if (map[task.status]) map[task.status].push(task);
    });
    return map;
  }, [tasks]);

  const counts = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === "done").length;
    const progress = total ? Math.round((done / total) * 100) : 0;
    return { total, done, progress };
  }, [tasks]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const taskId = Number(draggableId);
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    if (user?.role === "staff" && task.assigned_to !== user?.id) {
      toast.error("You can only move your own tasks");
      return;
    }

    const previous = [...tasks];
    setTasks((current) => current.map((item) => (item.id === taskId ? { ...item, status: destination.droppableId } : item)));

    try {
      await api.put(`/tasks/${taskId}/status`, { status: destination.droppableId });
    } catch (error) {
      setTasks(previous);
      toast.error(error.response?.data?.message || "Failed to update task");
    }
  };

  const handleCreateTask = async (payload) => {
    try {
      setSaving(true);
      await api.post("/tasks", {
        ...payload,
        project_id: Number(id),
        status: payload.status || defaultStatus
      });
      toast.success("Task created");
      setIsTaskModalOpen(false);
      await fetchProject();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">Project not found.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <Link href="/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Badge variant="outline">{project.type.replace("_", " ")}</Badge>
              <Badge>{project.status.replace("_", " ")}</Badge>
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(project.start_date)} → {formatDate(project.end_date)}
              </span>
            </div>
          </div>
        </div>
        {canManage ? (
          <Button
            className="bg-[#1A3A5C] text-white hover:bg-[#15304A]"
            onClick={() => {
              setDefaultStatus("todo");
              setIsTaskModalOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Project Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>
              {counts.done}/{counts.total} tasks completed
            </span>
            <span>{counts.progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-[#2E75B6]" style={{ width: `${counts.progress}%` }} />
          </div>
        </CardContent>
      </Card>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-3">
          {STATUS_COLUMNS.map((column) => (
            <div key={column.id} className="min-w-[300px] flex-1 rounded-xl border bg-slate-50/80">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-800">{column.label}</h3>
                <Badge variant="secondary">{grouped[column.id].length}</Badge>
              </div>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="max-h-[62vh] min-h-[200px] space-y-3 overflow-y-auto p-3">
                    {grouped[column.id].map((task, index) => (
                      <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className="rounded-lg border bg-white p-3 shadow-sm"
                          >
                            <div className="mb-2 flex items-start justify-between gap-3">
                              <h4 className="line-clamp-2 text-sm font-semibold text-slate-800">{task.title}</h4>
                              <Badge className={PRIORITY_CLASSES[task.priority] || PRIORITY_CLASSES.low}>{task.priority}</Badge>
                            </div>
                            <div className="text-xs text-slate-500">{task.description || "No description"}</div>
                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                              <UserCircle2 className="h-4 w-4" />
                              <span>{task.assignee_name || "Unassigned"}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              {canManage ? (
                <div className="border-t p-3">
                  <Button
                    variant="outline"
                    className="h-8 w-full text-xs"
                    onClick={() => {
                      setDefaultStatus(column.id);
                      setIsTaskModalOpen(true);
                    }}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add Task
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </DragDropContext>

      <CreateTaskModal
        open={isTaskModalOpen}
        onOpenChange={setIsTaskModalOpen}
        onSubmit={handleCreateTask}
        loading={saving}
        staff={staff}
        projects={[{ id: project.id, name: project.name }]}
      />
    </div>
  );
}
