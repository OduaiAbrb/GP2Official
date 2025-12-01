import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { Artifact, Project, Requirement, Task, AiRun, ScenarioDiff } from '@/types';
import { phaseConfigs } from '@/constants/phases';
import {
  AlertCircle,
  ArrowLeft,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Loader2,
  Sparkles,
  Users,
  UserPlus,
  UserMinus,
  Shield,
} from 'lucide-react';
import Joyride, { STATUS as JoyrideStatus, Step } from 'react-joyride';
import { formatDate, formatDateTime } from '@/lib/utils';
import { workspacePresets } from '@/constants/workspacePresets';
import { useAuthStore } from '@/store/authStore';
import { ROLE_OPTIONS, MIN_TEAM_ADMIN_AUTHORITY } from '@/constants/roles';

type DraftSectionKey = 'overview';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [aiRuns, setAiRuns] = useState<AiRun[]>([]);
  const [aiRunsLoading, setAiRunsLoading] = useState(false);
  const [phaseStatus, setPhaseStatus] = useState<Record<string, string>>({});
  const [tourRun, setTourRun] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingPreset, setUpdatingPreset] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [inviteNotes, setInviteNotes] = useState('');
  const [teamActionLoading, setTeamActionLoading] = useState(false);
  const [scenarioBranches, setScenarioBranches] = useState<Project[]>([]);
  const [branchForm, setBranchForm] = useState({
    label: '',
    description: '',
    provider: 'openai',
    budget: '',
    includeTasks: true,
    includeRequirements: true,
    includeArtifacts: true,
  });
  const [creatingBranch, setCreatingBranch] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branchDiff, setBranchDiff] = useState<ScenarioDiff | null>(null);
  const [branchDiffLoading, setBranchDiffLoading] = useState(false);
  const { user } = useAuthStore();

  const tourSteps: Step[] = [
    {
      target: '.phase-board',
      content: 'Work through each phase sequentially. Unlock the next phase as you complete the current one.',
    },
    {
      target: '.side-summary',
      content: 'This panel keeps project summary, metrics, and AI workflow actions within reach.',
    },
  ];

  const activePreset = project?.ui_preferences?.preset || 'default';
  const presetConfig =
    workspacePresets.find((preset) => preset.id === activePreset) || workspacePresets[0];
  const showSummaryPanel = presetConfig.layout.showSummary !== false;
  const showAiRuns = presetConfig.layout.showAiRuns !== false;
  const condensePhases = presetConfig.layout.condensePhases;
  const phaseRowPadding = condensePhases ? 'px-4 py-3' : 'px-6 py-4';
  const teamMembers = project?.team_members || [];
  const userAuthority = user?.role_authority || 0;
  const canManageTeam = userAuthority >= MIN_TEAM_ADMIN_AUTHORITY;

  const handleTourCallback = (data: any) => {
    const { status } = data;
    if ([JoyrideStatus.FINISHED, JoyrideStatus.SKIPPED].includes(status)) {
      setTourRun(false);
      localStorage.setItem('acorn_phase_tour', 'seen');
    }
  };

  const handlePresetChange = async (presetId: string) => {
    if (!project) return;
    setUpdatingPreset(true);
    try {
      const updated = await api.updateProject(project.project_id || project.id || '', {
        ui_preferences: { ...(project.ui_preferences || {}), preset: presetId },
      } as any);
      setProject(updated);
    } catch (err) {
      console.error('Failed to update preset', err);
    } finally {
      setUpdatingPreset(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  useEffect(() => {
    const seenTour = localStorage.getItem('acorn_phase_tour');
    if (!seenTour) {
      setTourRun(true);
    }
  }, []);

  const fetchAiRuns = async (projectId: string) => {
    if (!projectId) return;
    try {
      setAiRunsLoading(true);
      const runs = await api.getAiRuns(projectId, 20);
      setAiRuns(runs);
    } catch (err) {
      console.error('Failed to load AI run history', err);
    } finally {
      setAiRunsLoading(false);
    }
  };

  const loadScenarioBranches = async (projectId: string) => {
    try {
      const branches = await api.getScenarioBranches(projectId);
      setScenarioBranches(branches);
    } catch (err) {
      console.error('Failed to load scenario branches', err);
    }
  };

  const loadBranchDiff = async (projectId: string, branchId: string) => {
    try {
      setBranchDiffLoading(true);
      const diff = await api.getScenarioBranchDiff(projectId, branchId);
      setBranchDiff(diff);
    } catch (err) {
      console.error('Failed to load branch comparison', err);
    } finally {
      setBranchDiffLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!id || !branchForm.label.trim()) return;
    try {
      setCreatingBranch(true);
      const payload = {
        label: branchForm.label,
        description: branchForm.description,
        overrides: {
          provider: branchForm.provider,
          budget: branchForm.budget,
        },
        include_tasks: branchForm.includeTasks,
        include_requirements: branchForm.includeRequirements,
        include_artifacts: branchForm.includeArtifacts,
      };
      const branch = await api.createScenarioBranch(id, payload);
      setScenarioBranches((prev) => [branch, ...prev]);
      setBranchForm({
        label: '',
        description: '',
        provider: branchForm.provider,
        budget: '',
        includeTasks: true,
        includeRequirements: true,
        includeArtifacts: true,
      });
    } catch (err) {
      console.error('Failed to create scenario branch', err);
    } finally {
      setCreatingBranch(false);
    }
  };

  const handleSelectBranch = (branchId: string) => {
    if (!id) return;
    setSelectedBranchId(branchId);
    loadBranchDiff(id, branchId);
  };

  const handleInviteMember = async () => {
    if (!project || !inviteEmail.trim()) return;
    setTeamActionLoading(true);
    setError(null);
    try {
      const updated = await api.addTeamMember(project.project_id || project.id || '', {
        email: inviteEmail.trim(),
        project_role: inviteRole,
        notes: inviteNotes.trim() || undefined,
      });
      setProject(updated);
      setInviteEmail('');
      setInviteNotes('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update team');
    } finally {
      setTeamActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!project) return;
    setTeamActionLoading(true);
    setError(null);
    try {
      const updated = await api.removeTeamMember(project.project_id || project.id || '', memberId);
      setProject(updated);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update team');
    } finally {
      setTeamActionLoading(false);
    }
  };

  const loadProjectData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const projectData = await api.getProject(id);
      setProject(projectData);
      if (projectData.phase_status) {
        setPhaseStatus(projectData.phase_status);
      }

      const [reqData, taskData, artifactData] = await Promise.all([
        api.getRequirements(id),
        api.getTasks(id),
        api.getArtifacts(id),
      ]);
      setRequirements(reqData);
      setTasks(taskData);
      setArtifacts(artifactData);

      try {
        const statusResponse = await api.getPhaseStatus(id);
        setPhaseStatus(statusResponse.phases);
      } catch (statusErr) {
        console.error('Failed to refresh phase status', statusErr);
      }
      await fetchAiRuns(id);
      loadScenarioBranches(id);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'ACTIVE':
      case 'PLANNING':
        return 'warning';
      default:
        return 'default';
    }
  };

  const projectDraftBase = project?.project_id || project?.id || '';

  const goToDraft = (sectionKey: DraftSectionKey) => {
    if (!projectDraftBase) return;
    navigate(`/projects/${projectDraftBase}/draft/${sectionKey}`);
  };

  const handleUnlockPhases = async () => {
    if (!id) return;
    try {
      const status = await api.unlockPhases(id);
      setPhaseStatus(status);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to unlock phases');
    }
  };

  const phaseOutputs = artifacts.reduce<Record<string, string>>((acc, artifact) => {
    if (artifact.type?.startsWith('PHASE_')) {
      const phase = artifact.type.replace('PHASE_', '').toLowerCase();
      const markdown = (artifact.content_json as any)?.markdown;
      if (markdown) {
        acc[phase] = markdown;
      }
    }
    return acc;
  }, {});

  const completedTasks = useMemo(
    () => tasks.filter((task) => (task.status || '').toLowerCase() === 'completed'),
    [tasks]
  );

  const progressPct = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

  const requirementCoverage = useMemo(() => {
    if (!requirements.length) return 0;
    const covered = requirements.filter((req) =>
      tasks.some((task) => task.requirement_id === req.requirement_id)
    ).length;
    return Math.round((covered / requirements.length) * 100);
  }, [requirements, tasks]);

  const totalHours = tasks.reduce((sum, t) => sum + (t.estimate_hours || 0), 0);

  const handleExportPhase = (phaseId: string) => {
    const markdown = phaseOutputs[phaseId];
    if (!markdown || !project) return;
    const phaseTitle = phaseConfigs.find((p) => p.id === phaseId)?.title || phaseId;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}-${phaseTitle}.md`.replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportAllPhases = () => {
    if (!project) return;
    const sections = phaseConfigs
      .map((phase) => {
        const markdown = phaseOutputs[phase.id];
        if (!markdown) return null;
        return `# ${phase.title}\n\n${markdown}`;
      })
      .filter(Boolean)
      .join('\n\n---\n\n');
    if (!sections) return;
    const blob = new Blob([sections], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name}-phases.md`.replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const statusPillStyles: Record<string, string> = {
    completed: 'bg-emerald-50 text-emerald-700',
    ready: 'bg-emerald-50 text-emerald-700',
    in_progress: 'bg-indigo-50 text-indigo-700',
    locked: 'bg-gray-100 text-gray-500',
  };

  const statusLabels: Record<string, string> = {
    completed: 'Content ready',
    ready: 'Ready',
    in_progress: 'In progress',
    locked: 'Locked',
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Joyride
        steps={tourSteps}
        run={tourRun}
        continuous
        showSkipButton
        callback={handleTourCallback}
        styles={{
          options: {
            primaryColor: '#4F46E5',
          },
        }}
      />
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <button
            onClick={() => navigate('/projects')}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl px-6 py-5 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-gray-900">{project.name}</h1>
              <div className="text-sm text-gray-500 flex flex-wrap items-center gap-2">
                <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
                <span className="text-gray-400">•</span>
                <span>{project.template_type.replace('_', ' ')}</span>
                <span className="text-gray-400">•</span>
                <span>{project.owner_name || 'Unassigned'}</span>
              </div>
              {project.description && (
                <p className="text-sm text-gray-600 mt-1 max-w-2xl">{project.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => goToDraft('overview')}>
                Open Draft
              </Button>
              <Button
                variant="default"
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${phaseConfigs[0]?.id}`)}
              >
                Continue Planning
              </Button>
            </div>
            <div className="w-full flex flex-col sm:flex-row sm:items-center gap-2 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-xs uppercase tracking-wide text-gray-500">Workspace</span>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                  value={activePreset}
                  disabled={updatingPreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                >
                  {workspacePresets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500">{presetConfig.description}</p>
            </div>
          </div>

          <div className={`grid gap-6 ${showSummaryPanel ? 'lg:grid-cols-[320px_minmax(0,1fr)]' : ''}`}>
            {showSummaryPanel && (
            <aside className="space-y-6 side-summary">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Project Summary</h2>
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="font-medium">{project.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="font-medium">{project.template_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner</span>
                      <span>{project.owner_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated</span>
                      <span>{formatDate(project.updated_at)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    {[
                      { label: 'Requirements', value: requirements.length },
                      { label: 'Tasks', value: tasks.length },
                      { label: 'Artifacts', value: artifacts.length },
                      { label: 'Total Hours', value: totalHours.toFixed(0) },
                    ].map((metric) => (
                      <div key={metric.label} className="rounded-xl border border-gray-100 px-2 py-3">
                        <div className="text-2xl font-semibold text-gray-900">{metric.value}</div>
                        <div className="text-xs text-gray-500">{metric.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <p>Need to rerun AI or unblock phases? Use the workflow tools.</p>
                  <button
                    onClick={handleUnlockPhases}
                    className="text-indigo-600 font-medium hover:text-indigo-700"
                  >
                    Unlock all phases
                  </button>
                </div>
              </div>
            </aside>
            )}

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-6 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Phases</h2>
                    <p className="text-sm text-gray-500">Track progress and open any phase details.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportAllPhases} disabled={!Object.keys(phaseOutputs).length}>
                      Export All
                    </Button>
                  </div>
                </div>
                <div className={`phase-board divide-y divide-gray-100 ${condensePhases ? 'text-sm' : ''}`}>
                  {phaseConfigs.map((phase) => {
                    const status = (phaseStatus[phase.id] || 'locked').toLowerCase();
                    const pillClass = statusPillStyles[status] || 'bg-gray-100 text-gray-500';
                    const pillLabel = statusLabels[status] || status;
                    const hasOutput = Boolean(phaseOutputs[phase.id]);
                    return (
                      <button
                        key={phase.id}
                        onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${phase.id}`)}
                        className={`w-full text-left ${phaseRowPadding} hover:bg-gray-50 focus:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                            {phase.stepNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-gray-900">{phase.title}</p>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pillClass}`}>
                                  {pillLabel}
                                </span>
                                {hasOutput && (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleExportPhase(phase.id);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleExportPhase(phase.id);
                                      }
                                    }}
                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer"
                                  >
                                    Export
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">{phase.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-semibold text-gray-900">Project Brief</h2>
                  <Button variant="outline" size="sm" onClick={() => goToDraft('overview')}>
                    Open Draft
                  </Button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {project.brief_text || 'No brief provided'}
                </p>
              </div>

              <div className={`grid gap-4 ${showAiRuns ? 'md:grid-cols-2' : ''}`}>
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h2 className="text-base font-semibold text-gray-900 mb-4">Project Details</h2>
                  <dl className="space-y-3 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="font-medium text-gray-900">{project.template_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner</span>
                      <span className="font-medium text-gray-900">{project.owner_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span className="font-medium text-gray-900">{formatDate(project.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated</span>
                      <span className="font-medium text-gray-900">{formatDate(project.updated_at)}</span>
                    </div>
                  </dl>
                </div>

                {showAiRuns && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <h2 className="text-base font-semibold text-gray-900">AI Run History</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => id && fetchAiRuns(id)}
                      disabled={aiRunsLoading}
                    >
                      {aiRunsLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Loading
                        </>
                      ) : (
                        'Refresh'
                      )}
                    </Button>
                  </div>
                  {aiRunsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading latest AI activity…
                    </div>
                  ) : aiRuns.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No AI runs recorded for this project yet. Generate a phase or trigger the planner to see activity.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {aiRuns.map((run) => (
                        <div key={run.run_id} className="rounded-xl border border-gray-100 p-3">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full font-semibold ${
                                  run.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : run.status === 'failed'
                                    ? 'bg-red-50 text-red-600'
                                    : 'bg-indigo-50 text-indigo-700'
                                }`}
                              >
                                {run.status.replace('_', ' ')}
                              </span>
                              <span className="font-medium text-gray-700">
                                {run.phase ? `Phase: ${run.phase.replace('_', ' ')}` : run.job_type.replace('_', ' ')}
                              </span>
                            </div>
                            <span>{formatDateTime(run.created_at)}</span>
                          </div>
                          <p className="mt-2 text-sm text-gray-900">
                            {run.prompt_preview || 'Prompt unavailable'}
                          </p>
                          {run.response_preview && (
                            <p className="mt-1 text-xs text-gray-600">{run.response_preview}</p>
                          )}
                          <div className="mt-2 text-[11px] text-gray-500 flex flex-wrap gap-3">
                            {run.provider && run.model && <span>{run.provider} · {run.model}</span>}
                            {run.duration_ms && <span>{(run.duration_ms / 1000).toFixed(1)}s</span>}
                            {run.error_message && <span className="text-red-500">Error: {run.error_message}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                )}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-500" />
                      Team & Roles
                    </h2>
                    <p className="text-sm text-gray-500">
                      Authority controls who can generate AI phases, edit artifacts, and invite collaborators.
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {Math.max(teamMembers.length, 1)} members
                  </Badge>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-4">
                    {canManageTeam ? (
                      <div className="rounded-xl border-2 border-dashed border-amber-200 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                          <UserPlus className="h-4 w-4 text-amber-500" />
                          Invite teammate
                        </div>
                        <input
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                          placeholder="teammate@example.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            className="border border-gray-200 rounded-lg px-2 py-2 text-sm"
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value)}
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                          <input
                            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                            placeholder="Notes (optional)"
                            value={inviteNotes}
                            onChange={(e) => setInviteNotes(e.target.value)}
                          />
                        </div>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          onClick={handleInviteMember}
                          disabled={teamActionLoading || !inviteEmail.trim()}
                        >
                          {teamActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add to project'}
                        </Button>
                        <p className="text-xs text-gray-500">
                          Only Program Managers or Portfolio Admins can invite or change project roles.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-gray-100 p-4 bg-gray-50 text-sm text-gray-600 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-500" />
                        You have read-only access to the roster. Contact a Program Manager to modify team roles.
                      </div>
                    )}

                    <div className="space-y-3">
                      {teamMembers.length ? (
                        teamMembers.map((member) => (
                          <div
                            key={member.user_id}
                            className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{member.full_name || member.email}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs uppercase tracking-wide text-gray-500">{member.role_label}</p>
                              <p className="text-xs text-gray-400">Authority {member.authority}</p>
                            </div>
                            {canManageTeam && member.user_id !== project?.owner_id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveMember(member.user_id)}
                                disabled={teamActionLoading}
                                className="text-red-500 hover:text-red-600"
                              >
                                <UserMinus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">The project owner is the only active member so far.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
                    <p className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Authority ladder
                    </p>
                    <div className="space-y-2">
                      {ROLE_OPTIONS.map((role) => {
                        const assigned = teamMembers.some((member) => member.project_role === role.id);
                        return (
                          <div
                            key={role.id}
                            className={`p-3 rounded-xl border ${assigned ? 'border-indigo-300 bg-white' : 'border-transparent'}`}
                          >
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-gray-900">{role.label}</span>
                              <span className="text-xs text-gray-500">Authority {role.authority}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Scenario Branching</h2>
                    <p className="text-sm text-gray-500">Clone the plan with alternate budgets or providers.</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => id && loadScenarioBranches(id)}>
                    Refresh
                  </Button>
                </div>

                <div className="grid lg:grid-cols-2 gap-4">
                  <div className="border border-dashed border-indigo-200 rounded-xl p-4 space-y-3">
                    <input
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="Branch label (e.g., Gemini, Low budget)"
                      value={branchForm.label}
                      onChange={(e) => setBranchForm((prev) => ({ ...prev, label: e.target.value }))}
                    />
                    <textarea
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      rows={2}
                      placeholder="Notes / assumptions"
                      value={branchForm.description}
                      onChange={(e) => setBranchForm((prev) => ({ ...prev, description: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">LLM Provider</label>
                        <select
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5"
                          value={branchForm.provider}
                          onChange={(e) => setBranchForm((prev) => ({ ...prev, provider: e.target.value }))}
                        >
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="gemini">Gemini</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Budget Override</label>
                        <input
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5"
                          placeholder="$120k"
                          value={branchForm.budget}
                          onChange={(e) => setBranchForm((prev) => ({ ...prev, budget: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                      {[
                        { key: 'includeTasks', label: 'Copy tasks' },
                        { key: 'includeRequirements', label: 'Copy requirements' },
                        { key: 'includeArtifacts', label: 'Copy artifacts' },
                      ].map((option) => (
                        <label key={option.key} className="inline-flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={(branchForm as any)[option.key]}
                            onChange={(e) =>
                              setBranchForm((prev) => ({ ...prev, [option.key]: e.target.checked }))
                            }
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                    <Button
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                      disabled={!branchForm.label.trim() || creatingBranch}
                      onClick={handleCreateBranch}
                    >
                      {creatingBranch ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Branch'}
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-[260px] overflow-y-auto">
                    {scenarioBranches.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No branches generated yet. Create your first branch to compare alternatives.
                      </p>
                    ) : (
                      scenarioBranches.map((branch) => (
                        <div
                          key={branch.project_id || branch.id}
                          className={`p-4 border rounded-xl flex items-center justify-between ${
                            selectedBranchId === (branch.project_id || branch.id)
                              ? 'border-indigo-400 bg-indigo-50/40'
                              : 'border-gray-100'
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{branch.name}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {branch.scenario_label || 'Branch'} · {branch.status}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelectBranch(branch.project_id || branch.id || '')}
                          >
                            Compare
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {branchDiff && (
                  <div className="border border-gray-100 rounded-2xl p-4 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-gray-900">Branch Comparison</h3>
                      {branchDiffLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      {(['baseline', 'branch'] as const).map((key) => {
                        const snapshot = branchDiff[key];
                        return (
                          <div key={key} className="rounded-xl border border-gray-100 p-3">
                            <p className="text-xs uppercase text-gray-500 mb-1">{key === 'baseline' ? 'Baseline' : 'Branch'}</p>
                            <p className="font-semibold text-gray-900">{snapshot.name}</p>
                            <p className="text-xs text-gray-500 capitalize">{snapshot.status}</p>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <p className="text-gray-500">Reqs</p>
                                <p className="font-semibold text-gray-900">{snapshot.requirements}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Tasks</p>
                                <p className="font-semibold text-gray-900">{snapshot.tasks}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Cost</p>
                                <p className="font-semibold text-gray-900">${snapshot.cost_estimate.toFixed(0)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 text-sm">
                      {Object.entries(branchDiff.summary).map(([key, value]) => (
                        <div key={key} className="rounded-lg border border-gray-100 p-3 flex items-center justify-between">
                          <span className="capitalize text-gray-600">{key.replace('_', ' ')}</span>
                          <span className={`font-semibold ${value > 0 ? 'text-emerald-600' : value < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                    {branchDiff.phase_deltas.length > 0 && (
                      <div className="space-y-2 text-xs text-gray-600">
                        <p className="font-medium text-gray-900">Phase deltas</p>
                        {branchDiff.phase_deltas.map((delta) => (
                          <div key={delta.phase} className="flex items-center justify-between">
                            <span className="capitalize">{delta.phase.replace('_', ' ')}</span>
                            <span>
                              {delta.baseline} → <span className="text-indigo-600">{delta.branch}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
