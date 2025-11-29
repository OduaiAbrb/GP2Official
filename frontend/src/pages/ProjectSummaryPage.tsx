import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import type { ActivityLog, Artifact, Project, Requirement, Task, DiagramWorkspace } from '@/types';
import { phaseConfigs } from '@/constants/phases';
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Target,
  BarChart3,
  Sparkles,
  CalendarClock,
  FileText,
  TrendingUp,
  Activity as ActivityIcon,
  ClipboardList,
} from 'lucide-react';

const COMPLETE_STATUSES = ['done', 'completed', 'complete', 'finished', 'shipped', 'approved'];

export const ProjectSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docChanges, setDocChanges] = useState<
    { artifact: Artifact; status: 'new' | 'updated' | 'unchanged' }[]
  >([]);
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);
  const projectId = useMemo(() => project?.project_id || project?.id || id || '', [project?.project_id, project?.id, id]);
  const docSnapshotKey = useMemo(() => (projectId ? `doc-snapshot-${projectId}` : null), [projectId]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [proj, reqs, taskList, artifactList] = await Promise.all([
          api.getProject(id),
          api.getRequirements(id),
          api.getTasks(id),
          api.getArtifacts(id),
        ]);
        let recentActivity: ActivityLog[] = [];
        try {
          recentActivity = await api.getActivity(id, 25);
        } catch {
          recentActivity = [];
        }
        setProject(proj);
        setRequirements(reqs);
        setTasks(taskList);
        setArtifacts(artifactList);
        setActivity(recentActivity);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load project summary');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const completedTasks = useMemo(
    () =>
      tasks.filter((task) =>
        COMPLETE_STATUSES.includes(task.status?.toLowerCase?.() || '')
      ),
    [tasks]
  );
  const activeTasks = tasks.length - completedTasks.length;
  const requirementCoverage = useMemo(() => {
    if (!requirements.length) return 0;
    const covered = requirements.filter((req) =>
      tasks.some((task) => task.requirement_id === req.requirement_id)
    ).length;
    return Math.round((covered / requirements.length) * 100);
  }, [requirements, tasks]);
  const docsCount = artifacts.length;
  const latestActivity = activity.slice(0, 6);
  const velocityWindowMs = 1000 * 60 * 60 * 24 * 7;
  const recentThroughput = activity.filter(
    (log) => new Date(log.created_at).getTime() >= Date.now() - velocityWindowMs
  ).length;
  const phaseTimeline = useMemo(() => {
    const statusMap = project?.phase_status || {};
    return phaseConfigs.map((phase) => ({
      id: phase.id,
      title: phase.title,
      description: phase.description,
      status: statusMap[phase.id] || 'locked',
    }));
  }, [project?.phase_status]);
  const msPerDay = 1000 * 60 * 60 * 24;
  const projectAgeDays = useMemo(() => {
    if (!project?.created_at) return 1;
    return Math.max(1, (Date.now() - new Date(project.created_at).getTime()) / msPerDay);
  }, [project?.created_at]);
  const progressPct = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const averageCompletionPerDay = completedTasks.length ? completedTasks.length / projectAgeDays : 0;
  const velocityPerDay = recentThroughput > 0 ? recentThroughput / 7 : averageCompletionPerDay;
  const tasksRemaining = Math.max(0, tasks.length - completedTasks.length);
  const predictedDaysRemaining = velocityPerDay > 0 ? tasksRemaining / velocityPerDay : null;
  const predictedEtaDate = predictedDaysRemaining
    ? new Date(Date.now() + predictedDaysRemaining * msPerDay)
    : null;
  const timelineConfidence =
    velocityPerDay > 0
      ? predictedDaysRemaining && predictedDaysRemaining <= 7
        ? 'Green light - sprintable finish'
        : 'On track with current throughput'
      : tasks.length
      ? 'Need a completed task to project ETA'
      : 'No tasks defined yet';

  const insights = useMemo(() => {
    const entries: { title: string; detail: string }[] = [];
    if (completedTasks.length) {
      const pct = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
      entries.push({
        title: 'Delivery momentum',
        detail: `${completedTasks.length} of ${tasks.length} tasks closed (${pct}%).`,
      });
    }
    if (requirementCoverage < 100 && requirements.length) {
      entries.push({
        title: 'Traceability gap detected',
        detail: `${requirementCoverage}% of requirements are linked to tasks. Connect remaining items to maintain coverage.`,
      });
    }
    if (recentThroughput > 10) {
      entries.push({
        title: 'Active collaboration',
        detail: `${recentThroughput} updates recorded in the last week. Capture lessons learned in the Planning phase.`,
      });
    }
    if (artifacts.length === 0) {
      entries.push({
        title: 'Artifacts missing',
        detail: 'No formal artifacts detected. Generate an SRS or UML diagram to anchor documentation.',
      });
    }
    if (!entries.length) {
      entries.push({
        title: 'Keep the cadence',
        detail: 'Project data looks balanced. Continue coordinating tasks, docs, and phases together.',
      });
    }
    return entries;
  }, [completedTasks.length, tasks.length, requirementCoverage, requirements.length, recentThroughput, artifacts.length]);

  useEffect(() => {
    if (!docSnapshotKey) return;
    let stored: Record<string, any> = {};
    try {
      const raw = localStorage.getItem(docSnapshotKey);
      stored = raw ? JSON.parse(raw) : {};
    } catch {
      stored = {};
    }
    const changes = artifacts.map((artifact) => {
      const prev = stored[artifact.artifact_id];
      let status: 'new' | 'updated' | 'unchanged' = 'new';
      if (prev) {
        status = prev.updated_at === artifact.updated_at ? 'unchanged' : 'updated';
      }
      return { artifact, status };
    });
    setDocChanges(changes);
  }, [artifacts, docSnapshotKey]);

  const handleCaptureDocSnapshot = () => {
    if (!docSnapshotKey) return;
    const payload: Record<string, any> = {};
    artifacts.forEach((artifact) => {
      payload[artifact.artifact_id] = {
        title: artifact.title,
        type: artifact.type,
        version: artifact.version,
        updated_at: artifact.updated_at,
      };
    });
    localStorage.setItem(docSnapshotKey, JSON.stringify(payload));
    const normalized = artifacts.map((artifact) => ({
      artifact,
      status: 'unchanged' as const,
    }));
    setDocChanges(normalized);
    setSnapshotMessage('Snapshot stored locally. Future visits will highlight changes.');
    setTimeout(() => setSnapshotMessage(null), 5000);
  };

  const latestChanges = docChanges.filter((change) => change.status !== 'unchanged');
  const executiveBrief = useMemo(() => {
    const points: string[] = [];
    points.push(
      `Delivery progress sits at ${progressPct}% with ${completedTasks.length} of ${tasks.length || 0} tasks closed.`
    );
    points.push(
      `Requirements coverage is ${requirementCoverage}% across ${requirements.length} captured requirements.`
    );
    points.push(
      predictedEtaDate
        ? `At the current pace, remaining work lands around ${predictedEtaDate.toLocaleDateString()}.`
        : 'Velocity data is insufficient to forecast a confident ETA. Close a few tasks to unlock a projection.'
    );
    if (recentThroughput > 0) {
      points.push(`Team shipped ${recentThroughput} notable updates in the past week.`);
    }
    return points;
  }, [progressPct, completedTasks.length, tasks.length, requirementCoverage, requirements.length, predictedEtaDate, recentThroughput]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto text-center py-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Unable to load summary</h2>
          <p className="text-gray-600 mb-6">{error || 'Project not found.'}</p>
          <Button onClick={() => navigate('/projects')}>Return to Projects</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <Button variant="ghost" onClick={() => navigate(`/projects/${projectId}`)} className="mb-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Project
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Project Summary</h1>
            <p className="text-gray-600 max-w-2xl">
              A unified cockpit for everything Acorn has generated so far: requirements, tasks, diagrams, and AI
              insights - all stitched into a single storyline.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate(`/projects/${projectId}`)}>
              Open Workspace
            </Button>
            <Button variant="default" onClick={() => navigate(`/projects/${projectId}/draft/overview`)}>
              Continue Planning
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">Tasks Completed</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">
                {completedTasks.length} / {tasks.length}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-gray-500 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {activeTasks} tasks still in motion
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">Requirement Coverage</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">{requirementCoverage}%</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-gray-500 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              {requirements.length} total requirements
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">Artifacts</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">{docsCount}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-gray-500 flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-500" />
              Includes SRS, UML, UX docs
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-gray-500">Activity (7d)</CardTitle>
              <CardDescription className="text-2xl font-semibold text-gray-900">{recentThroughput}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-gray-500 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-amber-500" />
              Logged updates this week
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Predictive timeline</CardTitle>
              <CardDescription>Estimated finish based on recent throughput.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Progress</span>
                  <span className="font-semibold text-gray-900">{progressPct}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                <div className="rounded-lg border border-gray-100 bg-white p-3">
                  <p className="text-xs uppercase text-gray-400">Velocity</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {velocityPerDay > 0 ? velocityPerDay.toFixed(1) : 'N/A'} / day
                  </p>
                  <p className="text-xs text-gray-500">Based on last 7 days of activity</p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white p-3">
                  <p className="text-xs uppercase text-gray-400">Remaining</p>
                  <p className="text-lg font-semibold text-gray-900">{tasksRemaining} tasks</p>
                  <p className="text-xs text-gray-500">Active backlog size</p>
                </div>
              </div>
              <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3 text-sm text-blue-900 flex items-start gap-3">
                <CalendarClock className="h-4 w-4 mt-0.5" />
                <div>
                  <p className="font-semibold">
                    {predictedEtaDate ? `ETA: ${predictedEtaDate.toLocaleDateString()}` : 'Waiting for more signal'}
                  </p>
                  <p className="text-xs text-blue-700">{timelineConfidence}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Executive brief</CardTitle>
              <CardDescription>Auto-generated status digest for stakeholders.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              {executiveBrief.map((line, index) => (
                <div key={index} className="flex items-start gap-2">
                  <ActivityIcon className="h-4 w-4 mt-0.5 text-gray-500" />
                  <p>{line}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Phase progression</CardTitle>
              <CardDescription>Track where you are in the Acorn journey.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {phaseTimeline.map((phase) => (
                <div
                  key={phase.id}
                  className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{phase.title}</p>
                    <p className="text-xs text-gray-500">{phase.description}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full capitalize ${
                      phase.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : phase.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-800'
                        : phase.status === 'ready'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {phase.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Document intelligence</CardTitle>
                <CardDescription>Snapshots across SRS, UML, and other artifacts.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={handleCaptureDocSnapshot}>
                Save snapshot
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshotMessage && (
                <div className="rounded-md border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-800">
                  {snapshotMessage}
                </div>
              )}
              {docChanges.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ClipboardList className="h-4 w-4 text-gray-400" />
                  {latestChanges.length
                    ? `${latestChanges.length} document${
                        latestChanges.length > 1 ? 's' : ''
                      } changed since your last snapshot.`
                    : 'No document changes compared to your saved snapshot.'}
                </div>
              )}
              {docChanges.length === 0 ? (
                <p className="text-sm text-gray-500">No artifacts yet.</p>
              ) : (
                <div className="space-y-2">
                  {docChanges.map(({ artifact, status }) => (
                    <div
                      key={artifact.artifact_id}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{artifact.title}</p>
                        <p className="text-xs text-gray-500">
                          v{artifact.version} - {new Date(artifact.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${
                          status === 'new'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'updated'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Momentum insights</CardTitle>
              <CardDescription>Data-informed nudges to keep the team aligned.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insights.map((item) => (
                <div key={item.title} className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                  <p className="text-sm font-semibold text-blue-900">{item.title}</p>
                  <p className="text-xs text-blue-700">{item.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle>Opportunity radar</CardTitle>
                <CardDescription>Where AI recommends leaning in next.</CardDescription>
              </div>
              <Sparkles className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <div className="rounded-md border border-orange-100 bg-orange-50 p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                <p>
                  {activeTasks} tasks remain open. Send a quick prompt to the Tasks phase to rebalance priorities or
                  create follow-up tickets.
                </p>
              </div>
              <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3 flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5" />
                <p>
                  Capture a milestone snapshot: export requirements/SRS now so stakeholders can sign off on the current
                  iteration.
                </p>
              </div>
              <div className="rounded-md border border-blue-100 bg-blue-50 p-3 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5" />
                <p>Use the "Sync with Phase Data" button inside Diagram Studio to keep visuals aligned with docs.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest events captured by Acorn.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}`)}>
              Go to timeline
            </Button>
          </CardHeader>
          <CardContent>
            {latestActivity.length === 0 ? (
              <p className="text-sm text-gray-500">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {latestActivity.map((log) => (
                  <div key={log.log_id} className="flex items-start gap-3">
                    <div className="mt-1">
                      <BarChart3 className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 font-medium">
                        {log.event_type.replace('_', ' ').toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(log.created_at).toLocaleString()} - {log.details_json?.summary || 'Update recorded'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ProjectSummaryPage;
