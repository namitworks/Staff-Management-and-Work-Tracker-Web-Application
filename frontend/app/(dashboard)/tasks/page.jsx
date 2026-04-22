"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { 
  Plus, 
  MoreHorizontal, 
  UserCircle,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/lib/api";

const COLUMNS = {
  todo: { id: 'todo', title: 'To Do', color: 'bg-slate-200' },
  in_progress: { id: 'in_progress', title: 'In Progress', color: 'bg-blue-200' },
  review: { id: 'review', title: 'Review', color: 'bg-orange-200' },
  done: { id: 'done', title: 'Done', color: 'bg-green-200' },
};

export default function KanbanBoardPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project');
  
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, tasksRes] = await Promise.all([
          api.get("/auth/me"),
          api.get(projectId ? `/tasks?project_id=${projectId}` : "/tasks")
        ]);
        setUser(userRes.data.data);
        
        // Group tasks by status
        const initialTasks = {
          todo: [],
          in_progress: [],
          review: [],
          done: []
        };
        
        tasksRes.data.data.forEach(task => {
          if (initialTasks[task.status]) {
            initialTasks[task.status].push(task);
          } else {
            initialTasks.todo.push(task); // Fallback
          }
        });
        
        setTasks(initialTasks);
      } catch (error) {
        console.error("Failed to fetch tasks data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    // Permission check - optimistic UI update
    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;
    const taskData = tasks[sourceCol].find(t => t.id.toString() === draggableId);

    if (user?.role === 'staff' && taskData?.assigned_to !== user?.id) {
       alert("You don't have permission to move tasks assigned to others.");
       return;
    }

    const newTasks = { ...tasks };
    
    // Remove from source
    const [movedTask] = newTasks[sourceCol].splice(source.index, 1);
    
    // Add to destination
    movedTask.status = destCol;
    newTasks[destCol].splice(destination.index, 0, movedTask);
    
    setTasks(newTasks);

    // API Call
    try {
      await api.put(`/tasks/${draggableId}/status`, { status: destCol });
    } catch (error) {
      console.error("Failed to save task move", error);
      alert("Failed to sync move with server.");
      // Ideally, revert state here if strict consistency is needed
    }
  };

  const toggleChecklist = async (checkId, currentState) => {
      try {
          await api.put(`/tasks/checklist/${checkId}`, { is_completed: !currentState });
          // In a real app we would surgically update the state, for simplicity we just let the UI reflect optimistic update for now.
      } catch (e) {
          console.error(e);
      }
  }

  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [staff, setStaff] = useState([]);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assigned_to: "",
    project_id: projectId || "",
    priority: "medium",
    deadline: new Date().toISOString().split('T')[0],
    status: "todo"
  });

  useEffect(() => {
    const fetchStaff = async () => {
        try {
            const { data } = await api.get("/staff");
            setStaff(data.data);
        } catch (e) {
            console.error(e);
        }
    }
    fetchStaff();
  }, []);

  const handleAddTask = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      const taskToSubmit = {
        ...newTask,
        project_id: newTask.project_id === "" ? null : newTask.project_id
      };
      await api.post("/tasks", taskToSubmit);
      setShowAddForm(false);
      // Refresh
      const { data } = await api.get(projectId ? `/tasks?project_id=${projectId}` : "/tasks");
      const initialTasks = { todo: [], in_progress: [], review: [], done: [] };
      data.data.forEach(task => {
          if (initialTasks[task.status]) initialTasks[task.status].push(task);
          else initialTasks.todo.push(task);
      });
      setTasks(initialTasks);
      setNewTask({ ...newTask, title: "", description: "" });
    } catch (error) {
      console.error("Failed to add task:", error);
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex gap-6 h-[calc(100vh-120px)]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 min-w-[280px] bg-slate-100 rounded-xl p-4">
             <Skeleton className="h-4 w-24 mb-4" />
             <Skeleton className="h-28 w-full mb-3 rounded-lg" />
             <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'team_lead';

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Task Board</h1>
           {projectId && <p className="text-sm text-slate-500">Filtered by Project</p>}
        </div>
        {isAdmin && (
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-light text-white rounded-xl"
          >
            {showAddForm ? "Cancel" : <><Plus className="w-4 h-4" /> Add Task</>}
          </Button>
        )}
      </div>

      {showAddForm && (
        <Card className="mb-6 border-0 shadow-premium overflow-hidden rounded-2xl animate-in slide-in-from-top-4 shrink-0">
          <div className="h-2 w-full bg-brand-orange"></div>
          <CardHeader>
             <CardTitle className="text-lg">Assign New Task</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
             <form onSubmit={handleAddTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                      <input 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        placeholder="Task title..."
                        required
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Assign To</label>
                      <select 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                        value={newTask.assigned_to}
                        onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})}
                        required
                      >
                         <option value="">Select Staff</option>
                         {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Priority</label>
                      <select 
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                        value={newTask.priority}
                        onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                      >
                         <option value="low">Low</option>
                         <option value="medium">Medium</option>
                         <option value="high">High</option>
                         <option value="urgent">Urgent</option>
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Deadline</label>
                      <input 
                        type="date"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                        value={newTask.deadline}
                        onChange={(e) => setNewTask({...newTask, deadline: e.target.value})}
                        required
                      />
                   </div>
                   <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Project ID (Optional)</label>
                        <input 
                            className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                            value={newTask.project_id}
                            onChange={(e) => setNewTask({...newTask, project_id: e.target.value})}
                            placeholder="e.g. 1"
                        />
                   </div>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                    <textarea 
                        className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm min-h-[80px]"
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        placeholder="What needs to be done?"
                    />
                </div>
                <div className="flex justify-end gap-3">
                   <Button type="submit" disabled={formLoading} className="bg-brand-navy hover:bg-brand-navy/90 text-white rounded-xl h-10 px-8">
                      {formLoading ? "Assigning..." : "Assign Task"}
                   </Button>
                </div>
             </form>
          </CardContent>
        </Card>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4 h-full">
          {Object.values(COLUMNS).map(column => (
            <div key={column.id} className="flex-1 min-w-[320px] max-w-[380px] flex flex-col bg-slate-100/50 rounded-2xl overflow-hidden border border-slate-200/50">
              <div className="p-4 border-b border-slate-200/50 flex items-center justify-between bg-white/50 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className="font-semibold text-slate-700">{column.title}</h3>
                </div>
                <Badge variant="secondary" className="bg-slate-200 text-slate-600">{tasks[column.id]?.length || 0}</Badge>
              </div>
              
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 overflow-y-auto custom-scrollbar transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200/50' : ''}`}
                  >
                    {tasks[column.id]?.map((task, index) => (
                      <Draggable key={task.id.toString()} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3 group transition-all ${snapshot.isDragging ? 'shadow-lg rotate-2 scale-105 opacity-90' : 'hover:shadow-md hover:border-brand-orange/30'}`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <Badge variant={task.priority === 'urgent' ? 'destructive' : 'secondary'} className={`text-[10px] uppercase font-bold ${task.priority === 'urgent' ? 'bg-red-500' : 'bg-slate-100 text-slate-500'}`}>
                                {task.priority}
                              </Badge>
                              <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                              </Button>
                            </div>
                            
                            <h4 className="font-semibold text-slate-800 text-sm mb-1 line-clamp-2">{task.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-4">{task.description}</p>
                            
                            {/* Checklists */}
                            {task.checklist && task.checklist.length > 0 && (
                                <div className="mb-4 space-y-1.5">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Checklist</p>
                                    {task.checklist.map(item => (
                                        <div key={item.id} className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 text-brand-orange focus:ring-brand-orange w-3.5 h-3.5"
                                                defaultChecked={item.is_completed}
                                                onChange={() => toggleChecklist(item.id, item.is_completed)}
                                            />
                                            <span className={`text-xs ${item.is_completed ? 'line-through text-slate-400' : 'text-slate-600'}`}>
                                                {item.item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                                <Clock className="w-3.5 h-3.5 text-brand-orange" />
                                {new Date(task.deadline).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                              </div>
                              <div className="w-6 h-6 rounded-full bg-brand-navy/10 border border-brand-navy/20 flex items-center justify-center text-[10px] font-bold text-brand-navy" title={task.assignee_name}>
                                {task.assignee_name ? task.assignee_name.charAt(0).toUpperCase() : '?'}
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
