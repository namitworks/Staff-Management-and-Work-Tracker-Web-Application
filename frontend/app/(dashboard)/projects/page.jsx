"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FolderKanban, 
  Plus, 
  Calendar,
  MoreVertical,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, projectsRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/projects")
        ]);
        setUser(userRes.data.data);
        setProjects(projectsRes.data.data);
      } catch (error) {
        console.error("Failed to fetch projects data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'team_lead';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Projects</h1>
        {isAdmin && (
          <Button className="flex items-center gap-2 bg-brand-navy hover:bg-slate-800 rounded-xl">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length > 0 ? (
          projects.map((project) => {
            const progress = project.total_tasks > 0 
              ? Math.round((project.completed_tasks / project.total_tasks) * 100) 
              : 0;

            return (
              <Card key={project.id} className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <Badge variant={project.status === 'active' ? 'default' : 'secondary'} className="mb-2 capitalize bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/20">
                      {project.type.replace('_', ' ')}
                    </Badge>
                    <CardTitle className="text-lg font-bold text-slate-800 line-clamp-1">
                      {project.name}
                    </CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 -mt-2 -mr-2">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                    {project.description || "No description provided."}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-600">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-orange rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(project.created_at).toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <Link href={`/tasks?project=${project.id}`}>
                    <Button variant="ghost" size="sm" className="text-brand-navy hover:text-brand-navy hover:bg-slate-50">
                      View Board &rarr;
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })
        ) : (
          <div className="col-span-3 py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderKanban className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">No Projects</h3>
            <p className="text-sm text-slate-500 mt-1">Get started by creating a new project.</p>
          </div>
        )}
      </div>
    </div>
  );
}
