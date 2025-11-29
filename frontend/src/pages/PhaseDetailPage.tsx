import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import type { Artifact, Project, Task } from '@/types';
import { phaseConfigs, getPhaseConfig } from '@/constants/phases';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Download,
  Loader2,
  Share2,
  Sparkles,
  ListChecks,
  Grid2X2,
  BarChart3,
  Wand2,
} from 'lucide-react';

export const PhaseDetailPage: React.FC = () => {
  const { id, phaseId } = useParams<{ id: string; phaseId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [phaseStatus, setPhaseStatus] = useState<Record<string, string>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [localTaskStatus, setLocalTaskStatus] = useState<Record<string, string>>({});
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    start_date: '',
    due_date: '',
    priority: 'medium',
    status: 'planned',
    dependencies: '',
    milestone: false,
  });
  const [creatingTask, setCreatingTask] = useState(false);
  const [aiAddingTasks, setAiAddingTasks] = useState(false);
  const [ganttScale, setGanttScale] = useState<'auto' | '2w' | '1m' | '3m' | '6m'>('auto');
  const [barHeight, setBarHeight] = useState(22);
  const [taskFilter, setTaskFilter] = useState<'all' | 'planned' | 'in_progress' | 'completed'>('all');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncingCanvas, setSyncingCanvas] = useState(false);
  const phaseConfig = getPhaseConfig(phaseId || '');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const [proj, arts, status, taskData] = await Promise.all([
          api.getProject(id),
          api.getArtifacts(id),
          api.getPhaseStatus(id),
          api.getTasks(id),
        ]);
        setProject(proj);
        setArtifacts(arts);
        setPhaseStatus(status.phases);
        setTasks(taskData);
      } catch (err) {
        setError('Failed to load phase info');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const phaseMarkdown = useMemo(() => {
    if (!phaseId) return '';
    const artifact = artifacts.find(
      (art) => art.type === `PHASE_${phaseId.toUpperCase()}`
    );
    return artifact?.content_json?.markdown || '';
  }, [artifacts, phaseId]);

  const handleGenerate = async () => {
    if (!id || !phaseId) return;
    setIsGenerating(true);
    setError(null);
    try {
      const response = await api.generatePhase(id, phaseId, input);
      setPhaseStatus(response.phase_status);
      const updatedArtifacts = await api.getArtifacts(id);
      setArtifacts(updatedArtifacts);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate phase output');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenCanvas = async () => {
    if (!id || !phaseConfig) return;
    setSyncingCanvas(true);
    setError(null);
    try {
      await api.syncDiagramCanvas(id, phaseConfig.canvasMode);
      const params = phaseConfig.canvasMode === 'freeform' ? '' : `?mode=${phaseConfig.canvasMode}`;
      navigate(`/projects/${id}/diagram-studio${params}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to open canvas');
    } finally {
      setSyncingCanvas(false);
    }
  };

  const handleDownload = () => {
    if (!phaseMarkdown || !phaseConfig || !project) return;
    const blob = new Blob([phaseMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}-${phaseConfig.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleLocalTaskStatus = (taskId: string) => {
    setLocalTaskStatus((prev) => {
      const next = { ...prev };
      const current = (prev[taskId] || '').toLowerCase();
      next[taskId] = current === 'completed' ? 'pending' : 'completed';
      return next;
    });
  };

  const matrixBuckets = useMemo(() => {
    const buckets = {
      urgentImportant: [] as Task[],
      urgentNotImportant: [] as Task[],
      notUrgentImportant: [] as Task[],
      notUrgentNotImportant: [] as Task[],
    };
    const now = new Date();
    tasks.forEach((task) => {
      const due = task.due_date ? new Date(task.due_date) : null;
      const urgent = due ? due.getTime() - now.getTime() < 1000 * 60 * 60 * 24 * 3 : false;
      const important = (task.priority || '').toLowerCase() !== 'low';
      if (urgent && important) buckets.urgentImportant.push(task);
      else if (urgent && !important) buckets.urgentNotImportant.push(task);
      else if (!urgent && important) buckets.notUrgentImportant.push(task);
      else buckets.notUrgentNotImportant.push(task);
    });
    return buckets;
  }, [tasks]);

  const ganttData = useMemo(() => {
    if (!tasks.length) {
      return { bars: [], connectors: [], start: new Date(), end: new Date(), height: 200 };
    }
    const defaults = tasks.map((t, idx) => {
      const start = t.start_date ? new Date(t.start_date) : new Date(Date.now() + idx * 86400000);
      const end = t.due_date ? new Date(t.due_date) : new Date(start.getTime() + 86400000 * 3);
      return { ...t, start, end };
    });
    let min = defaults.reduce((acc, t) => (t.start < acc ? t.start : acc), defaults[0].start);
    let max = defaults.reduce((acc, t) => (t.end > acc ? t.end : acc), defaults[0].end);
    if (ganttScale !== 'auto') {
      const now = new Date();
      const ranges: Record<typeof ganttScale, number> = {
        '2w': 14,
        '1m': 30,
        '3m': 90,
        '6m': 180,
        auto: 0,
      };
      const days = ranges[ganttScale];
      min = now;
      max = new Date(now.getTime() + days * 86400000);
    }
    const totalMs = max.getTime() - min.getTime() || 1;
    const bars = defaults.map((t, idx) => {
      const x = Math.max(0, ((t.start.getTime() - min.getTime()) / totalMs) * 100);
      const width = Math.max(4, ((t.end.getTime() - t.start.getTime()) / totalMs) * 100);
      const status = (localTaskStatus[t.task_id] || t.status || '').toLowerCase();
      const color = status === 'completed' ? '#16a34a' : status === 'in_progress' ? '#2563eb' : '#c084fc';
      const isMilestone = (t.tags || []).includes('milestone');
      return { id: t.task_id, title: t.title, x, width, y: 50 + idx * (barHeight + 16), color, isMilestone };
    });
    const connectors: { x1: number; x2: number; y1: number; y2: number }[] = [];
    return { bars, connectors, start: min, end: max, height: 80 + bars.length * (barHeight + 16) };
  }, [tasks, localTaskStatus, ganttScale, barHeight]);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!project || !phaseConfig) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Phase not found</h2>
          <Button onClick={() => navigate(`/projects/${id}`)}>Back to Project</Button>
        </div>
      </Layout>
    );
  }

  const status = phaseStatus[phaseConfig.id] || 'locked';

  if (phaseId === 'tasks') {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
            <div className="text-right">
              <p className="text-xs uppercase text-gray-500">Phase</p>
              <p className="text-lg font-semibold text-gray-900">Tasks • {project?.name || 'Project'}</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Tasks ({tasks.length})</CardTitle>
                  <CardDescription>Chat, prioritize, and visualize the plan.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border border-gray-200 rounded-lg p-3 space-y-3 bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-4 w-4 text-emerald-500" />
                        <p className="font-semibold text-gray-800 text-sm">Add task</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          if (!id) return;
                          setAiAddingTasks(true);
                          try {
                            await api.generateProject(id, {
                              detail_level: 'light',
                              include_tasks: true,
                              regenerate_requirements: false,
                              generate_srs: false,
                              generate_risks: false,
                              generate_costs: false,
                            });
                            const refreshed = await api.getTasks(id);
                            setTasks(refreshed);
                          } catch (aiErr) {
                            console.error('AI task gen failed', aiErr);
                          } finally {
                            setAiAddingTasks(false);
                          }
                        }}
                        disabled={aiAddingTasks}
                      >
                        {aiAddingTasks ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Working
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3 w-3 mr-1" /> Ask AI
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                        placeholder="Title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      />
                      <textarea
                        className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                        placeholder="Description"
                        value={newTask.description}
                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        rows={2}
                      />
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <label className="flex flex-col gap-1">
                          Start
                          <input
                            type="date"
                            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                            value={newTask.start_date}
                            onChange={(e) => setNewTask({ ...newTask, start_date: e.target.value })}
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          Due
                          <input
                            type="date"
                            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                            value={newTask.due_date}
                            onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                          />
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <label className="flex flex-col gap-1">
                          Priority
                          <select
                            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                            value={newTask.priority}
                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          Status
                          <select
                            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                            value={newTask.status}
                            onChange={(e) => setNewTask({ ...newTask, status: e.target.value })}
                          >
                            <option value="planned">Planned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </label>
                        <label className="flex flex-col gap-1">
                          Dependencies (IDs)
                          <input
                            className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                            placeholder="task_1, task_2"
                            value={newTask.dependencies}
                            onChange={(e) => setNewTask({ ...newTask, dependencies: e.target.value })}
                          />
                        </label>
                        <label className="flex items-center gap-2 mt-1">
                          <input
                            type="checkbox"
                            checked={newTask.milestone}
                            onChange={(e) => setNewTask({ ...newTask, milestone: e.target.checked })}
                          />
                          <span className="text-xs text-gray-600">Mark as milestone</span>
                        </label>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={async () => {
                            if (!id || !newTask.title.trim()) return;
                            setCreatingTask(true);
                            try {
                              const payload: any = {
                                title: newTask.title,
                                description: newTask.description,
                                start_date: newTask.start_date || undefined,
                                due_date: newTask.due_date || undefined,
                                priority: newTask.priority,
                                status: newTask.status,
                                dependencies: newTask.dependencies
                                  ? newTask.dependencies
                                      .split(',')
                                      .map((d) => d.trim())
                                      .filter(Boolean)
                                  : [],
                                tags: newTask.milestone ? ['milestone'] : [],
                              };
                              const created = await api.createTask(id, payload);
                              setTasks((prev) => [created, ...prev]);
                              setNewTask({
                                title: '',
                                description: '',
                                start_date: '',
                                due_date: '',
                                priority: 'medium',
                                status: 'planned',
                                dependencies: '',
                                milestone: false,
                              });
                            } catch (createErr) {
                              console.error('Create task failed', createErr);
                            } finally {
                              setCreatingTask(false);
                            }
                          }}
                          disabled={creatingTask}
                        >
                          {creatingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add task'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-white">
                    <div className="flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-emerald-500" />
                      <p className="font-semibold text-gray-800 text-sm">To-do</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1">
                          Status
                          <select
                            className="border border-gray-200 rounded px-1 py-0.5"
                            value={taskFilter}
                            onChange={(e) => setTaskFilter(e.target.value as any)}
                          >
                            <option value="all">All</option>
                            <option value="planned">Planned</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(
                                  (tasks.filter((t) => (localTaskStatus[t.task_id] || t.status || '').toLowerCase() === 'completed').length /
                                    (tasks.length || 1)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-500">
                          {tasks.filter((t) => (localTaskStatus[t.task_id] || t.status || '').toLowerCase() === 'completed').length} /
                          {tasks.length} done
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {tasks.length ? (
                        tasks
                          .filter((task) => {
                            if (taskFilter === 'all') return true;
                            return ((localTaskStatus[task.task_id] || task.status || '').toLowerCase() || '') === taskFilter;
                          })
                          .map((task) => {
                            const status = localTaskStatus[task.task_id] || task.status;
                            const done = (status || '').toLowerCase() === 'completed';
                            return (
                              <label
                                key={task.task_id}
                              className="flex items-start gap-2 text-sm border border-gray-100 rounded-md p-2 hover:border-gray-200"
                            >
                              <input
                                type="checkbox"
                                checked={done}
                                onChange={() => toggleLocalTaskStatus(task.task_id)}
                                className="mt-1"
                              />
                              <div>
                                <p className={`font-semibold ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                  {task.title}
                                </p>
                                <p className="text-xs text-gray-500">{task.description}</p>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <p className="text-xs text-gray-500">No tasks yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-3 space-y-2 bg-white">
                    <div className="flex items-center gap-2">
                      <Grid2X2 className="h-4 w-4 text-blue-500" />
                      <p className="font-semibold text-gray-800 text-sm">Eisenhower Matrix</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ['Urgent & Important', matrixBuckets.urgentImportant],
                        ['Urgent & Not Important', matrixBuckets.urgentNotImportant],
                        ['Not Urgent & Important', matrixBuckets.notUrgentImportant],
                        ['Not Urgent & Not Important', matrixBuckets.notUrgentNotImportant],
                      ].map(([label, bucket], idx) => (
                        <div key={label as string} className="border border-gray-200 rounded-md p-2 bg-gray-50">
                          <p className="font-semibold text-gray-700 mb-1">{label}</p>
                          {(bucket as Task[]).length ? (
                            (bucket as Task[]).map((task) => (
                              <div key={`${task.task_id}_${idx}`} className="mb-1">
                                <p className="font-semibold text-gray-800">{task.title}</p>
                                <p className="text-[11px] text-gray-500 line-clamp-2">{task.description}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] text-gray-500">No tasks here.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border border-blue-100 bg-blue-50 text-blue-900 rounded-lg p-3 text-sm">
                  <p className="font-semibold mb-1">AI actions</p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // simple client-side helper: fill missing dates sequentially
                        let cursor = new Date();
                        const updated = tasks.map((t, idx) => {
                          const start = t.start_date ? new Date(t.start_date) : new Date(cursor.getTime() + idx * 86400000);
                          const end = t.due_date ? new Date(t.due_date) : new Date(start.getTime() + 86400000 * 2);
                          return { ...t, start_date: start.toISOString(), due_date: end.toISOString() };
                        });
                        setTasks(updated as any);
                      }}
                    >
                      Autofill missing dates
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const sorted = [...tasks].sort((a, b) => (a.priority || '').localeCompare(b.priority || ''));
                        setTasks(sorted);
                      }}
                    >
                      Reorder by priority
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const deduped: Record<string, Task> = {};
                        tasks.forEach((t) => {
                          deduped[t.task_id] = t;
                        });
                        setTasks(Object.values(deduped));
                      }}
                    >
                      Clean duplicates
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-purple-500" />
                      <p className="text-sm font-semibold text-gray-800">Timeline</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>
                        {new Date(ganttData.start).toLocaleDateString()} -{' '}
                        {new Date(ganttData.end).toLocaleDateString()}
                      </span>
                      <select
                        className="border border-gray-200 rounded-md px-2 py-1 text-xs bg-white"
                        value={ganttScale}
                        onChange={(e) => setGanttScale(e.target.value as any)}
                      >
                        <option value="auto">Auto</option>
                        <option value="2w">Next 2w</option>
                        <option value="1m">Next 1m</option>
                        <option value="3m">Next 3m</option>
                        <option value="6m">Next 6m</option>
                      </select>
                      <label className="flex items-center gap-1">
                        Height
                        <input
                          type="range"
                          min={14}
                          max={32}
                          value={barHeight}
                          onChange={(e) => setBarHeight(Number(e.target.value))}
                        />
                      </label>
                    </div>
                  </div>
                  <div
                    className="relative border border-gray-200 rounded-lg bg-gray-50 p-4 overflow-x-auto overflow-y-hidden"
                    style={{ height: ganttData.height, minWidth: '100%' }}
                  >
                    <div className="min-w-[1000px] h-full relative">
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {/* time ticks */}
                        {Array.from({ length: 12 }).map((_, idx) => {
                          const pct = (idx / 11) * 100;
                          const date = new Date(
                            ganttData.start.getTime() +
                              ((ganttData.end.getTime() - ganttData.start.getTime()) * idx) / 11
                          ).toLocaleDateString();
                          return (
                            <g key={`tick_${idx}`}>
                              <line
                                x1={`${pct}%`}
                                x2={`${pct}%`}
                                y1={0}
                                y2={ganttData.height}
                                stroke="#e5e7eb"
                                strokeWidth={1}
                                strokeDasharray="4 4"
                              />
                              <text x={`${pct}%`} y={14} textAnchor="middle" fontSize="10" fill="#475569">
                                {date}
                              </text>
                            </g>
                          );
                        })}
                        {ganttData.bars.map((bar) => (
                          <g key={bar.id}>
                            <rect
                              x={`${bar.x}%`}
                              y={bar.y}
                              width={`${Math.max(4, bar.width)}%`}
                              height={barHeight}
                              rx="4"
                              fill={bar.color}
                              opacity="0.9"
                            />
                            <text
                              x={`${bar.x + bar.width / 2}%`}
                              y={bar.y + barHeight - 6}
                              textAnchor="middle"
                              fontSize="10"
                            >
                              {bar.title}
                            </text>
                            {bar.isMilestone && (
                              <polygon
                                points={`${bar.x + bar.width}% ${bar.y + barHeight / 2 - 6}, ${
                                  bar.x + bar.width + 1.5
                                }% ${bar.y + barHeight / 2}, ${bar.x + bar.width}% ${bar.y + barHeight / 2 + 6}, ${
                                  bar.x + bar.width - 1.5
                                }% ${bar.y + barHeight / 2}`}
                                fill="#f97316"
                              />
                            )}
                          </g>
                        ))}
                      </svg>
                      {!ganttData.bars.length && (
                        <p className="text-xs text-gray-500 text-center mt-6">No tasks to render yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={() => navigate(`/projects/${id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-500">Phase</p>
            <p className="text-lg font-semibold text-gray-900">
              {phaseConfig.title} · {project.name}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>{phaseConfig.title}</CardTitle>
                <CardDescription>{phaseConfig.description}</CardDescription>
              </div>
              <Badge>{status.replace('_', ' ')}</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[120px]"
                placeholder="Describe what you need from the AI for this phase..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <Button onClick={handleGenerate} disabled={isGenerating || status === 'locked'}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Working...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Chat with AI
                  </>
                )}
              </Button>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Phase document preview</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!phaseMarkdown}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Markdown
                </Button>
              </div>
              <div className="border border-gray-200 rounded-lg bg-white p-4 min-h-[300px]">
                {phaseMarkdown ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{phaseMarkdown}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    No document generated yet. Ask the AI to produce the document for this phase.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Canvas</CardTitle>
                <CardDescription>Edit this phase visually.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleOpenCanvas}
                  disabled={syncingCanvas}
                >
                  {syncingCanvas ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Opening canvas...
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Open Diagram Canvas
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phase Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {phaseConfigs.map((cfg) => (
                  <div key={cfg.id} className="flex items-center justify-between">
                    <span>{cfg.title}</span>
                    <Badge
                      variant={
                        phaseStatus[cfg.id] === 'completed'
                          ? 'success'
                          : phaseStatus[cfg.id] === 'ready'
                          ? 'default'
                          : phaseStatus[cfg.id] === 'in_progress'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {phaseStatus[cfg.id] || 'locked'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PhaseDetailPage;
