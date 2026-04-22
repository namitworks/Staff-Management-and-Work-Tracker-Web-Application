"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Globe, Headphones, Monitor, Plus } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CreateProjectModal from "@/components/projects/CreateProjectModal";

const STATUS_BADGE = {
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  on_hold: "bg-amber-100 text-amber-700"
};

const TYPE_ICON = {
  website: Globe,
  pos_onboarding: Monitor,
  support: Headphones,
  other: Globe
};

const formatDateRange = (start, end) => {
  const formattedStart = start ? new Date(start).toLocaleDateString("en-NZ", { day: "2-digit", month: "short" }) : "TBD";
  const formattedEnd = end ? new Date(end).toLocaleDateString("en-NZ", { day: "2-digit", month: "short" }) : "TBD";
  return `${formattedStart} → ${formattedEnd}`;
};

export default function ProjectsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  const fetchPageData = async () => {
    const [meRes, projectsRes, tasksRes] = await Promise.all([api.get("/auth/me"), api.get("/projects"), api.get("/tasks")]);
    setUser(meRes.data.data);
    setProjects(projectsRes.data.data || []);
    setTasks(tasksRes.data.data || []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        await fetchPageData();
      } catch (error) {
        console.error("Projects load error:", error);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const staffByProject = useMemo(() => {
    const map = new Map();
    tasks.forEach((task) => {
      if (!task.project_id || !task.assigned_to) return;
      if (!map.has(task.project_id)) map.set(task.project_id, []);
      const list = map.get(task.project_id);
      if (!list.some((item) => item.id === task.assigned_to)) {
        list.push({
          id: task.assigned_to,
          name: task.assignee_name || "Staff",
          avatar_url: task.assignee_avatar || null
        });
      }
    });
    return map;
  }, [tasks]);

  const summary = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((project) => project.status === "active").length;
    const completed = projects.filter((project) => project.status === "completed").length;
    const onHold = projects.filter((project) => project.status === "on_hold").length;
    const totalTasks = projects.reduce((sum, project) => sum + (Number(project.total_tasks) || 0), 0);
    return { total, active, completed, onHold, totalTasks };
  }, [projects]);

  const handleCreateProject = async (payload) => {
    try {
      setSaving(true);
      await api.post("/projects", payload);
      toast.success("Project created");
      setIsModalOpen(false);
      await fetchPageData();
    } catch (error) {
      console.error("Create project error:", error);
      toast.error(error.response?.data?.message || "Failed to create project");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((key) => (
            <Skeleton key={key} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((key) => (
            <Skeleton key={key} className="h-72 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-sm text-slate-500">Plan, monitor, and deliver client work.</p>
        </div>
        {isAdmin ? (
          <Button className="bg-[#1A3A5C] text-white hover:bg-[#15304A]" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Project
          </Button>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{summary.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{summary.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">On Hold</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{summary.onHold}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">Total Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-900">{summary.totalTasks}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((project) => {
          const ProjectIcon = TYPE_ICON[project.type] || Globe;
          const members = staffByProject.get(project.id) || [];
          const totalTasks = Number(project.total_tasks) || 0;
          const completedTasks = Number(project.completed_tasks) || 0;
          const progress = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : Number(project.progress) || 0;

          return (
            <Card key={project.id} className="overflow-hidden border-slate-200">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-[#E6EEF6] p-2 text-[#1A3A5C]">
                      <ProjectIcon className="h-4 w-4" />
                    </div>
                    <h3 className="line-clamp-1 text-base font-semibold text-slate-900">{project.name}</h3>
                  </div>
                  <Badge className={STATUS_BADGE[project.status] || STATUS_BADGE.active}>{project.status.replace("_", " ")}</Badge>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="outline">{project.type.replace("_", " ")}</Badge>
                  <span className="text-slate-500">{project.client_name || "No client set"}</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-[#2E75B6]" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <p className="text-xs text-slate-500">
                    {completedTasks}/{totalTasks} tasks done
                  </p>
                </div>

                <div className="text-xs text-slate-500">{formatDateRange(project.start_date, project.end_date)}</div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {members.slice(0, 4).map((member) => (
                      <div
                        key={member.id}
                        className="-ml-1.5 flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-100 text-[11px] font-semibold text-slate-700 first:ml-0"
                        title={member.name}
                      >
                        {member.avatar_url ? <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" /> : member.name?.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {members.length > 4 ? <span className="ml-1 text-xs text-slate-500">+{members.length - 4}</span> : null}
                  </div>
                  <Link href={`/projects/${project.id}`}>
                    <Button size="sm" variant="outline">
                      View Tasks
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {projects.length === 0 ? (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-12 text-center text-slate-500">No projects yet.</CardContent>
          </Card>
        ) : null}
      </div>

      <CreateProjectModal open={isModalOpen} onOpenChange={setIsModalOpen} onSubmit={handleCreateProject} loading={saving} />
    </div>
  );
}
