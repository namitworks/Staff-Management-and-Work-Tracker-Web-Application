"use client";

import { useEffect, useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import {
  Calendar,
  LayoutGrid,
  Plus,
  Search,
  SquarePen,
  Table2,
  Trash2,
  UserCircle2
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
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
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-NZ", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
};

const isOverdue = (deadline, status) => {
  if (!deadline || status === "done") return false;
  const now = new Date();
  const due = new Date(deadline);
  due.setHours(23, 59, 59, 999);
  return due < now;
};

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [user, setUser] = useState(null);
  const [view, setView] = useState("kanban");
  const [sortBy, setSortBy] = useState("deadline");
  const [sortOrder, setSortOrder] = useState("asc");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteTaskId, setDeleteTaskId] = useState(null);
  const [defaultCreateStatus, setDefaultCreateStatus] = useState("todo");
  const [filters, setFilters] = useState({
    search: "",
    priority: "",
    assignee: "",
    project: "",
    status: ""
  });

  const canManage = user?.role === "admin" || user?.role === "team_lead";

  const fetchTasks = async () => {
    const { data } = await api.get("/tasks");
    setTasks(data.data || []);
  };

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        setLoading(true);
        const meRes = await api.get("/auth/me");
        const me = meRes.data.data;
        setUser(me);

        const requests = [api.get("/tasks"), api.get("/projects")];
        if (me.role === "admin" || me.role === "team_lead") {
          requests.push(api.get("/staff"));
        }

        const [taskRes, projectRes, staffRes] = await Promise.all(requests);
        setTasks(taskRes.data.data || []);
        setProjects(projectRes.data.data || []);
        setStaff(staffRes?.data?.data || []);
      } catch (error) {
        console.error("Tasks page load error:", error);
        toast.error("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.search) {
        const haystack = `${task.title} ${task.project_name || ""}`.toLowerCase();
        if (!haystack.includes(filters.search.toLowerCase())) return false;
      }
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.assignee && String(task.assigned_to || "") !== filters.assignee) return false;
      if (filters.project && String(task.project_id || "") !== filters.project) return false;
      if (filters.status && task.status !== filters.status) return false;
      return true;
    });
  }, [filters, tasks]);

  const sortedTasks = useMemo(() => {
    const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
    const copy = [...filteredTasks];
    copy.sort((a, b) => {
      let first = 0;
      if (sortBy === "priority") {
        first = (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
      } else if (sortBy === "deadline") {
        first = new Date(a.deadline || "2999-12-31").getTime() - new Date(b.deadline || "2999-12-31").getTime();
      } else {
        first = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      return sortOrder === "asc" ? first : first * -1;
    });
    return copy;
  }, [filteredTasks, sortBy, sortOrder]);

  const kanbanColumns = useMemo(() => {
    const grouped = {
      todo: [],
      in_progress: [],
      review: [],
      done: []
    };
    sortedTasks.forEach((task) => {
      if (grouped[task.status]) grouped[task.status].push(task);
    });
    return grouped;
  }, [sortedTasks]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const taskId = Number(draggableId);
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    if (user?.role === "staff" && task.assigned_to !== user?.id) {
      toast.error("You can only move tasks assigned to you");
      return;
    }

    const previous = [...tasks];
    setTasks((current) =>
      current.map((item) =>
        item.id === taskId ? { ...item, status: destination.droppableId, completed_at: destination.droppableId === "done" ? new Date().toISOString() : null } : item
      )
    );

    try {
      await api.put(`/tasks/${taskId}/status`, { status: destination.droppableId });
    } catch (error) {
      setTasks(previous);
      toast.error(error.response?.data?.message || "Failed to update task status");
    }
  };

  const openCreateModal = (status = "todo") => {
    setDefaultCreateStatus(status);
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (payload) => {
    try {
      setSaving(true);
      if (editingTask?.id) {
        await api.put(`/tasks/${editingTask.id}`, payload);
        toast.success("Task updated");
      } else {
        await api.post("/tasks", { ...payload, status: payload.status || defaultCreateStatus });
        toast.success("Task created");
      }
      setIsTaskModalOpen(false);
      setEditingTask(null);
      await fetchTasks();
    } catch (error) {
      console.error("Save task error:", error);
      toast.error(error.response?.data?.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deleteTaskId) return;
    try {
      await api.delete(`/tasks/${deleteTaskId}`);
      toast.success("Task deleted");
      setDeleteTaskId(null);
      await fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete task");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STATUS_COLUMNS.map((column) => (
            <Skeleton key={column.id} className="h-44 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[420px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Task Manager</h1>
          <p className="text-sm text-slate-500">Track all tasks in Kanban or List view.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border bg-white p-1">
            <Button variant={view === "kanban" ? "default" : "ghost"} size="sm" className="h-8" onClick={() => setView("kanban")}>
              <LayoutGrid className="mr-2 h-4 w-4" />
              Kanban
            </Button>
            <Button variant={view === "list" ? "default" : "ghost"} size="sm" className="h-8" onClick={() => setView("list")}>
              <Table2 className="mr-2 h-4 w-4" />
              List
            </Button>
          </div>
          {canManage && (
            <Button className="bg-[#1A3A5C] text-white hover:bg-[#15304A]" onClick={() => openCreateModal("todo")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Task
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="h-10 w-full rounded-md border border-slate-200 pl-9 pr-3 text-sm"
                placeholder="Search by title"
                value={filters.search}
                onChange={(event) => setFilters((previous) => ({ ...previous, search: event.target.value }))}
              />
            </div>
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              value={filters.priority}
              onChange={(event) => setFilters((previous) => ({ ...previous, priority: event.target.value }))}
            >
              <option value="">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              value={filters.assignee}
              onChange={(event) => setFilters((previous) => ({ ...previous, assignee: event.target.value }))}
            >
              <option value="">All assignees</option>
              {(canManage ? staff : [{ id: user?.id, name: user?.name }]).map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              value={filters.project}
              onChange={(event) => setFilters((previous) => ({ ...previous, project: event.target.value }))}
            >
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              value={filters.status}
              onChange={(event) => setFilters((previous) => ({ ...previous, status: event.target.value }))}
            >
              <option value="">All statuses</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
            <select className="h-10 rounded-md border border-slate-200 px-3 text-sm" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="deadline">Sort by deadline</option>
              <option value="priority">Sort by priority</option>
              <option value="created_at">Sort by created date</option>
            </select>
            <select
              className="h-10 rounded-md border border-slate-200 px-3 text-sm"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {view === "kanban" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-3">
            {STATUS_COLUMNS.map((column) => (
              <div key={column.id} className="min-w-[300px] flex-1 rounded-xl border bg-slate-50/80">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">{column.label}</h3>
                    <Badge variant="secondary">{kanbanColumns[column.id].length}</Badge>
                  </div>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="max-h-[60vh] min-h-[180px] space-y-3 overflow-y-auto p-3">
                      {kanbanColumns[column.id].map((task, index) => (
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

                              <div className="space-y-2 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5">
                                  <UserCircle2 className="h-4 w-4" />
                                  <span>{task.assignee_name || "Unassigned"}</span>
                                </div>
                                <div className={`flex items-center gap-1.5 ${isOverdue(task.deadline, task.status) ? "font-semibold text-red-600" : ""}`}>
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(task.deadline)}</span>
                                </div>
                              </div>

                              {Number(task.progress) > 0 ? (
                                <div className="mt-3">
                                  <div className="mb-1 flex justify-between text-[11px] text-slate-500">
                                    <span>Progress</span>
                                    <span>{task.progress}%</span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-2 rounded-full bg-[#2E75B6]" style={{ width: `${Math.min(100, Number(task.progress))}%` }} />
                                  </div>
                                </div>
                              ) : null}

                              <div className="mt-3 flex flex-wrap items-center gap-1">
                                {String(task.tags || "")
                                  .split(",")
                                  .map((tag) => tag.trim())
                                  .filter(Boolean)
                                  .slice(0, 3)
                                  .map((tag) => (
                                    <Badge key={`${task.id}-${tag}`} variant="outline" className="text-[10px]">
                                      {tag}
                                    </Badge>
                                  ))}
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
                    <Button variant="outline" className="h-8 w-full text-xs" onClick={() => openCreateModal(column.id)}>
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Add Task
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Task List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <p className="line-clamp-1 text-xs text-slate-500">{task.description || "No description"}</p>
                        </div>
                      </TableCell>
                      <TableCell>{task.project_name || "-"}</TableCell>
                      <TableCell>
                        <Badge className={PRIORITY_CLASSES[task.priority] || PRIORITY_CLASSES.low}>{task.priority}</Badge>
                      </TableCell>
                      <TableCell>{task.assignee_name || "Unassigned"}</TableCell>
                      <TableCell>
                        <span className={isOverdue(task.deadline, task.status) ? "font-semibold text-red-600" : ""}>{formatDate(task.deadline)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.status.replace("_", " ")}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          {canManage ? (
                            <>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingTask(task);
                                  setIsTaskModalOpen(true);
                                }}
                              >
                                <SquarePen className="h-4 w-4" />
                              </Button>
                              <Button size="icon-sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => setDeleteTaskId(task.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-slate-500">
                        No tasks found for selected filters.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateTaskModal
        open={isTaskModalOpen}
        onOpenChange={(next) => {
          setIsTaskModalOpen(next);
          if (!next) setEditingTask(null);
        }}
        onSubmit={handleSaveTask}
        loading={saving}
        staff={staff}
        projects={projects}
        initialData={editingTask}
      />

      <AlertDialog open={Boolean(deleteTaskId)} onOpenChange={(open) => (!open ? setDeleteTaskId(null) : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this task?</AlertDialogTitle>
            <AlertDialogDescription>This action is reversible only from database records. Continue with soft delete?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 text-white hover:bg-red-700" onClick={handleDeleteTask}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
