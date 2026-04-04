import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { ExportButtons } from '@/components/ExportButtons';
import { api } from '@/lib/api';
import type { Artifact, Project, Requirement, Task } from '@/types';
import { phaseConfigs, phaseHexColors } from '@/constants/phases';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import Joyride, { STATUS as JoyrideStatus, Step } from 'react-joyride';
import { formatDate } from '@/lib/utils';
import { workspacePresets } from '@/constants/workspacePresets';
import { AIAgentsPanel } from '@/components/AIAgentsPanel';

type DraftSectionKey = 'overview';

/* =========================================================
   PHASE TREE COMPONENT
   Renders an SVG tree with phases as interactive leaves
   ========================================================= */
const PhaseTree: React.FC<{
  phases: typeof phaseConfigs;
  phaseStatus: Record<string, string>;
  phaseOutputs: Record<string, string>;
  onPhaseClick: (phaseId: string) => void;
  projectId: string;
}> = ({ phases, phaseStatus, phaseOutputs, onPhaseClick }) => {
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);

  // Tree layout: trunk center-bottom, branches spreading up
  // All 10 phases arranged as a living tree
  const treeNodes = [
    { id: 'planning',               x: 400, y: 510, label: 'Planning',      level: 0 },
    { id: 'feasibility_study',      x: 250, y: 420, label: 'Feasibility',   level: 1 },
    { id: 'requirements_gathering', x: 550, y: 420, label: 'Requirements',  level: 1 },
    { id: 'validation',             x: 150, y: 325, label: 'Validation',    level: 2 },
    { id: 'design',                 x: 400, y: 325, label: 'Design',        level: 2 },
    { id: 'development',            x: 650, y: 325, label: 'Development',   level: 2 },
    { id: 'tasks',                  x: 200, y: 225, label: 'Tasks',         level: 3 },
    { id: 'cost_benefit',           x: 450, y: 225, label: 'Costs',         level: 3 },
    { id: 'risks',                  x: 600, y: 140, label: 'Risks',         level: 4 },
    { id: 'summary',                x: 400, y: 55,  label: 'Summary',       level: 5 },
  ];

  // Branch connections (parent → child)
  const branches: [string, string][] = [
    ['planning',               'feasibility_study'],
    ['planning',               'requirements_gathering'],
    ['feasibility_study',      'validation'],
    ['feasibility_study',      'design'],
    ['requirements_gathering', 'design'],
    ['requirements_gathering', 'development'],
    ['validation',             'tasks'],
    ['design',                 'cost_benefit'],
    ['development',            'cost_benefit'],
    ['tasks',                  'risks'],
    ['cost_benefit',           'risks'],
    ['risks',                  'summary'],
  ];

  const getNodeColor = (phaseId: string) => {
    const status = (phaseStatus[phaseId] || 'locked').toLowerCase();
    if (status === 'completed')                   return 'var(--blue-400)'; // bright forest green
    if (status === 'active' || status === 'in_progress') return 'var(--orange-400)'; // warm amber
    if (status === 'ready' || status === 'planning')     return 'var(--blue-300)'; // light green
    return 'var(--brand-700)'; // dark/locked
  };

  const getTextColor = (phaseId: string) => {
    const status = (phaseStatus[phaseId] || 'locked').toLowerCase();
    if (status === 'completed' || status === 'active' || status === 'ready' || status === 'planning') {
      return 'var(--brand-900)';
    }
    return 'var(--text-muted)';
  };

  const nodeMap = Object.fromEntries(treeNodes.map(n => [n.id, n]));

  return (
    <div className="relative w-full" style={{ height: '560px' }}>
      <svg width="100%" height="100%" viewBox="0 0 800 560" preserveAspectRatio="xMidYMid meet">
        {/* Deep root glow */}
        <ellipse cx="400" cy="555" rx="70" ry="8" fill="#2c1810" fillOpacity="0.6" />

        {/* Tree trunk - thick bark brown */}
        <line x1="400" y1="558" x2="400" y2="510"
          stroke="#3d2b1f" strokeWidth="16" strokeLinecap="round" />
        <line x1="400" y1="558" x2="400" y2="515"
          stroke="#5c4033" strokeWidth="9" strokeLinecap="round" />

        {/* Ambient ground mist */}
        <ellipse cx="400" cy="556" rx="90" ry="6" fill="var(--brand-800)" fillOpacity="0.5" />

        {/* Branches */}
        {branches.map(([from, to], i) => {
          const fromNode = nodeMap[from];
          const toNode   = nodeMap[to];
          if (!fromNode || !toNode) return null;
          const isHighlighted = hoveredPhase === to || hoveredPhase === from;
          const midY = (fromNode.y + toNode.y) / 2;

          return (
            <path
              key={i}
              d={`M ${fromNode.x} ${fromNode.y} C ${fromNode.x} ${midY}, ${toNode.x} ${midY}, ${toNode.x} ${toNode.y}`}
              stroke={isHighlighted ? 'var(--blue-400)' : 'var(--blue-600)'}
              strokeWidth={isHighlighted ? 4.5 : 3}
              fill="none"
              strokeLinecap="round"
              style={{ transition: 'stroke 0.35s ease, stroke-width 0.35s ease' }}
            />
          );
        })}

        {/* Floating ambient particles */}
        {[0,1,2,3,4].map(i => {
          const px = 120 + i * 130;
          const py = 30 + (i % 3) * 20;
          return (
            <circle key={i} cx={px} cy={py} r="3"
              fill="var(--blue-400)" fillOpacity={0.2 + i * 0.05}
              style={{ animation: `float ${3 + i * 0.6}s ease-in-out ${i * 0.4}s infinite` }}
            />
          );
        })}

        {/* Phase leaf nodes */}
        {treeNodes.map((node) => {
          const phaseConfig = phases.find(p => p.id === node.id);
          const nodeColor   = getNodeColor(node.id);
          const textColor   = getTextColor(node.id);
          const isHovered   = hoveredPhase === node.id;
          const hasOutput   = Boolean(phaseOutputs[node.id]);
          const r = isHovered ? 50 : 44;

          return (
            <g
              key={node.id}
              onClick={() => onPhaseClick(node.id)}
              onMouseEnter={() => setHoveredPhase(node.id)}
              onMouseLeave={() => setHoveredPhase(null)}
              style={{ cursor: 'pointer' }}
              className="tree-node"
            >
              {/* Outer glow ring (always subtle) */}
              <circle cx={node.x} cy={node.y} r={r + 14}
                fill={nodeColor} fillOpacity={isHovered ? 0.18 : 0.06}
                style={{ transition: 'all 0.35s ease' }}
              />

              {/* Main leaf/node circle */}
              <circle
                cx={node.x} cy={node.y} r={r}
                fill={nodeColor}
                stroke={isHovered ? 'var(--blue-300)' : 'var(--brand-700)'}
                strokeWidth={isHovered ? 3 : 1.5}
                style={{
                  transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  filter: isHovered ? `drop-shadow(0 0 14px ${nodeColor}90)` : 'none',
                }}
              />

              {/* Step number */}
              <text x={node.x} y={node.y - 9} textAnchor="middle"
                fill={textColor} fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
                {phaseConfig?.stepNumber || ''}
              </text>

              {/* Phase label */}
              <text x={node.x} y={node.y + 7} textAnchor="middle"
                fill={textColor} fontSize="9.5" fontWeight="700" fontFamily="Inter, sans-serif">
                {node.label}
              </text>

              {/* Output dot indicator */}
              {hasOutput && (
                <g>
                  <circle cx={node.x + r - 8} cy={node.y - r + 8} r={8} fill="var(--orange-400)" />
                  <text x={node.x + r - 8} y={node.y - r + 12}
                    textAnchor="middle" fill="var(--brand-900)" fontSize="9" fontWeight="800">
                    ✓
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredPhase && (() => {
        const phase  = phases.find(p => p.id === hoveredPhase);
        const status = (phaseStatus[hoveredPhase] || 'locked').toLowerCase();
        if (!phase) return null;
        return (
          <div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-xl px-5 py-3 text-center pointer-events-none z-10"
            style={{
              minWidth: '220px',
              background: 'var(--brand-800)',
              border: '1px solid var(--blue-600)',
              boxShadow: '0 8px 32px rgba(74,222,128,0.15)',
            }}
          >
            <p className="text-sm font-semibold text-[var(--blue-300)]">{phase.title}</p>
            {phase.description && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{phase.description.slice(0, 70)}...</p>
            )}
            <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              status === 'completed'
                ? 'bg-green-500/20 text-green-400'
                : status === 'active' || status === 'in_progress'
                ? 'bg-amber-500/20 text-amber-400'
                : status === 'ready'
                ? 'bg-[var(--blue-400)]/20 text-[var(--blue-400)]'
                : 'bg-[var(--brand-700)]/50 text-[var(--text-muted)]'
            }`}>
              {status}
            </span>
          </div>
        );
      })()}
    </div>
  );
};

/* =========================================================
   MAIN PROJECT DETAIL PAGE
   ========================================================= */
export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject]         = useState<Project | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [tasks, setTasks]             = useState<Task[]>([]);
  const [artifacts, setArtifacts]     = useState<Artifact[]>([]);
  const [phaseStatus, setPhaseStatus] = useState<Record<string, string>>({});
  const [tourRun, setTourRun]         = useState(false);
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [updatingPreset, setUpdatingPreset] = useState(false);
  const [treeView, setTreeView]       = useState(true); // Toggle between tree and list view

  const tourSteps: Step[] = [
    {
      target: '.phase-board',
      content: 'Your project phases grow as leaves on the tree. Click any leaf to work on that phase.',
    },
    {
      target: '.side-summary',
      content: 'This panel keeps project summary, metrics, and AI workflow actions within reach.',
    },
  ];

  const activePreset   = project?.ui_preferences?.preset || 'default';
  const presetConfig   = workspacePresets.find((preset) => preset.id === activePreset) || workspacePresets[0];
  const showSummaryPanel = presetConfig.layout.showSummary !== false;
  const condensePhases   = !!presetConfig.layout.condensePhases;
  const phaseRowPadding  = condensePhases ? 'py-3 px-2' : 'py-4 px-2';

  const handleTourCallback = (data: any) => {
    const { status } = data;
    if ([JoyrideStatus.FINISHED, JoyrideStatus.SKIPPED].includes(status)) {
      setTourRun(false);
      localStorage.setItem('acorn_phase_tour', 'seen');
    }
  };

  const handlePresetChange = async (presetId: string) => {
    if (!project || updatingPreset || presetId === activePreset) return;
    const projectIdentifier = project.project_id || project.id;
    if (!projectIdentifier) return;
    const previousPreset = activePreset;
    setUpdatingPreset(true);
    setProject((prev) =>
      prev ? { ...prev, ui_preferences: { ...(prev.ui_preferences || {}), preset: presetId } } : prev
    );
    try {
      const updated = await api.updateProject(projectIdentifier, {
        ui_preferences: { ...(project.ui_preferences || {}), preset: presetId },
      } as any);
      setProject(updated);
    } catch (err) {
      console.error('Failed to update preset', err);
      setProject((prev) =>
        prev ? { ...prev, ui_preferences: { ...(prev.ui_preferences || {}), preset: previousPreset } } : prev
      );
    } finally {
      setUpdatingPreset(false);
    }
  };

  useEffect(() => {
    if (id) loadProjectData();
  }, [id]);

  useEffect(() => {
    const seenTour = localStorage.getItem('acorn_phase_tour');
    if (!seenTour) setTourRun(true);
  }, []);

  const loadProjectData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const projectData = await api.getProject(id);
      setProject(projectData);
      if (projectData.phase_status) setPhaseStatus(projectData.phase_status);

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
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'ACTIVE':
      case 'PLANNING':  return 'warning';
      default:          return 'default';
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
      const phase    = artifact.type.replace('PHASE_', '').toLowerCase();
      const markdown = (artifact.content_json as any)?.markdown;
      if (markdown) acc[phase] = markdown;
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
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
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
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href  = url;
    link.download = `${project.name}-phases.md`.replace(/\s+/g, '-').toLowerCase();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePhaseClick = (phaseId: string) => {
    if (!project) return;
    navigate(`/projects/${project.project_id || project.id}/phases/${phaseId}`);
  };

  const statusPillStyles: Record<string, string> = {
    completed:   'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    ready:       'bg-[var(--blue-400)]/20 text-[var(--blue-400)] border border-[var(--blue-400)]/30',
    in_progress: 'bg-[var(--orange-400)]/20 text-[var(--orange-400)] border border-[var(--orange-400)]/30',
    locked:      'bg-[var(--brand-700)]/30 text-[var(--text-muted)] border border-[var(--brand-700)]',
  };

  const statusLabels: Record<string, string> = {
    completed:   'Content ready',
    ready:       'Ready',
    in_progress: 'In progress',
    locked:      'Locked',
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--blue-400)] to-[var(--blue-500)] flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-900)]" />
              </div>
              <div className="absolute inset-0 w-16 h-16 mx-auto rounded-2xl bg-[var(--blue-400)]/20 blur-xl animate-pulse" />
            </div>
            <p className="text-[var(--text-muted)]">Loading project...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Project not found</h2>
          <Button onClick={() => navigate('/projects')} className="bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] text-[var(--brand-900)]">Back to Projects</Button>
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
            primaryColor: 'var(--blue-400)',
          },
        }}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Project Header Card */}
        <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl shadow-lg overflow-hidden">
          {/* Header gradient bar - forest green */}
          <div className="h-1.5 bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)]" />

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => navigate('/projects')}
                className="inline-flex items-center text-sm font-medium text-[var(--text-muted)] hover:text-[var(--blue-400)] transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Projects
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button variant="outline" onClick={() => goToDraft('overview')} className="text-xs sm:text-sm px-2 sm:px-4 border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                  <span className="hidden sm:inline">Open </span>Draft
                </Button>
                <Button
                  className="bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] hover:from-[var(--blue-300)] hover:to-[var(--blue-400)] text-[var(--brand-900)] font-semibold shadow-lg shadow-[var(--blue-400)]/20 text-xs sm:text-sm px-2 sm:px-4"
                  onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${phaseConfigs[0]?.id}`)}
                >
                  <span className="hidden sm:inline">Continue </span>Planning
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">{project.name}</h1>
                {project.description && (
                  <p className="text-[var(--text-muted)] max-w-2xl">{project.description}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--blue-400)]/20 text-[var(--blue-400)] border border-[var(--blue-400)]/30 text-xs font-semibold uppercase tracking-wide">
                  {project.status}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--brand-700)]/50 text-[#a8d5a8] border border-[var(--brand-700)] text-xs font-medium">
                  {project.template_type.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-[var(--blue-300)]/10 text-[var(--blue-300)] border border-[var(--blue-300)]/30 text-xs font-medium">
                  {project.owner_name || 'Unassigned'}
                </span>
              </div>
            </div>

            {/* Workspace Preset Switcher */}
            <div className="pt-4 border-t border-[var(--brand-700)]/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">Workspace Mode</p>
              <div className="flex flex-wrap items-center gap-2">
                {workspacePresets.map((preset) => {
                  const isActive = preset.id === activePreset;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetChange(preset.id)}
                      disabled={updatingPreset}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[var(--blue-400)] text-[var(--brand-900)] shadow-lg shadow-[var(--blue-400)]/20'
                          : 'bg-[var(--brand-750)] text-[var(--text-muted)] hover:bg-[var(--brand-700)] hover:text-[var(--text-primary)] border border-[var(--brand-700)]'
                      } ${updatingPreset ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">{presetConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={`grid gap-4 sm:gap-6 ${showSummaryPanel ? 'lg:grid-cols-[280px_minmax(0,1fr)]' : ''}`}>
          {showSummaryPanel && (
            <aside className="space-y-6 side-summary">
              <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4 sm:space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Project Summary</h2>
                  <dl className="mt-4 space-y-3 text-sm text-[var(--text-muted)]">
                    <div className="flex justify-between">
                      <span>Status</span>
                      <span className="font-medium text-[var(--blue-400)]">{project.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type</span>
                      <span className="font-medium text-[var(--text-primary)]">{project.template_type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Owner</span>
                      <span className="font-medium text-[var(--text-primary)]">{project.owner_name || 'Unassigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created</span>
                      <span className="font-medium text-[var(--text-primary)]">{formatDate(project.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated</span>
                      <span className="font-medium text-[var(--text-primary)]">{formatDate(project.updated_at)}</span>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-muted)] mb-3">Key Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Requirements', value: requirements.length, phase: 'requirements_gathering' },
                      { label: 'Tasks',         value: tasks.length,        phase: 'tasks' },
                      { label: 'Artifacts',     value: artifacts.length,    phase: 'summary' },
                      { label: 'Total Hours',   value: totalHours.toFixed(0), phase: 'tasks' },
                    ].map((metric) => (
                      <button
                        key={metric.label}
                        onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${metric.phase}`)}
                        className="rounded-xl border border-[var(--brand-700)] px-3 py-4 bg-[var(--brand-800)] text-center hover:border-[var(--blue-400)]/50 hover:bg-[var(--brand-750)] transition-all cursor-pointer group"
                      >
                        <div className="text-2xl font-semibold text-[var(--text-primary)] group-hover:text-[var(--blue-400)] transition-colors">{metric.value}</div>
                        <div className="text-xs text-[var(--text-muted)] group-hover:text-[var(--blue-400)]/80 transition-colors">{metric.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-[var(--text-muted)]">
                  <p className="mb-2">Need to unlock future workstream?</p>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={handleUnlockPhases}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleUnlockPhases();
                      }
                    }}
                    className="text-[var(--blue-400)] font-medium hover:text-[var(--blue-300)] cursor-pointer"
                  >
                    Unlock all phases
                  </span>
                </div>
              </div>

              <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-6 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">Project Brief</h2>
                  <Button variant="outline" size="sm" onClick={() => goToDraft('overview')} className="border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                    Open Draft
                  </Button>
                </div>
                <p className="text-sm text-[var(--text-muted)] whitespace-pre-wrap">
                  {project.brief_text || 'No brief provided.'}
                </p>
              </div>

              <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-6 shadow-lg space-y-4">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">Governance &amp; Updates</h2>
                <p className="text-sm text-[var(--text-muted)]">Manage membership, branching, and development logs.</p>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => navigate(`/projects/${project.project_id || project.id}/governance`)} className="border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                    Governance hub
                  </Button>
                  <Button onClick={() => navigate(`/projects/${project.project_id || project.id}/updates`)} className="bg-gradient-to-r from-[var(--blue-400)] to-[var(--blue-500)] text-[var(--brand-900)] font-semibold">
                    Development updates
                  </Button>
                </div>
              </div>
            </aside>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* Phases Section */}
            <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-4 sm:p-6 shadow-lg phase-board">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)]">Project Phases</h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] hidden sm:block">
                    Click any leaf to work on that phase. Green = complete, amber = in progress.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* View toggle */}
                  <div className="flex items-center bg-[var(--brand-800)] rounded-xl p-1 border border-[var(--brand-700)]/50">
                    <button
                      onClick={() => setTreeView(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        treeView ? 'bg-[var(--blue-400)] text-[var(--brand-900)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      Tree
                    </button>
                    <button
                      onClick={() => setTreeView(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        !treeView ? 'bg-[var(--blue-400)] text-[var(--brand-900)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      List
                    </button>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportAllPhases} disabled={!Object.keys(phaseOutputs).length} className="border-[var(--brand-700)] text-[var(--text-muted)] hover:border-[var(--blue-400)]/50 hover:text-[var(--blue-400)]">
                    Export All
                  </Button>
                </div>
              </div>

              {/* Tree View */}
              {treeView ? (
                <div className="relative">
                  <PhaseTree
                    phases={phaseConfigs}
                    phaseStatus={phaseStatus}
                    phaseOutputs={phaseOutputs}
                    onPhaseClick={handlePhaseClick}
                    projectId={project.project_id || project.id || ''}
                  />

                  {/* Phase color legend */}
                  <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-[var(--brand-700)]/30">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--blue-400)]" />
                      <span className="text-xs text-[var(--text-muted)]">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--orange-400)]" />
                      <span className="text-xs text-[var(--text-muted)]">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--blue-300)]" />
                      <span className="text-xs text-[var(--text-muted)]">Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--brand-700)] border border-[var(--blue-600)]" />
                      <span className="text-xs text-[var(--text-muted)]">Locked</span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <div className="w-3.5 h-3.5 rounded-full bg-[var(--orange-400)]" />
                      <span className="text-xs text-[var(--text-muted)]">dot = output available</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* List View */
                <div className="divide-y divide-[var(--brand-700)]/30">
                  {phaseConfigs.map((phase) => {
                    const status = (phaseStatus[phase.id] || 'locked').toLowerCase();
                    const pillClass =
                      status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : status === 'active' || status === 'planning'
                        ? 'bg-[var(--orange-400)]/20 text-[var(--orange-400)] border border-[var(--orange-400)]/30'
                        : 'bg-[var(--brand-700)]/30 text-[var(--text-muted)] border border-[var(--brand-700)]';
                    const pillLabel = statusLabels[status] || status;
                    const hasOutput = Boolean(phaseOutputs[phase.id]);

                    return (
                      <div
                        key={phase.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(`/projects/${project.project_id || project.id}/phases/${phase.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            navigate(`/projects/${project.project_id || project.id}/phases/${phase.id}`);
                          }
                        }}
                        className={`w-full text-left ${phaseRowPadding} hover:bg-[var(--brand-750)] transition cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blue-400)] rounded-xl`}
                      >
                        <div className="flex items-start gap-3 sm:gap-4">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--blue-400)]/20 text-[var(--blue-400)] border border-[var(--blue-400)]/30 flex items-center justify-center text-xs sm:text-sm font-semibold flex-shrink-0">
                            {phase.stepNumber}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className={`font-semibold text-[var(--text-primary)] ${condensePhases ? 'text-sm' : 'text-base'}`}>{phase.title}</p>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${pillClass}`}>
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
                                    className="text-xs font-semibold text-[var(--blue-400)] hover:text-[var(--blue-300)]"
                                  >
                                    Export
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className={`mt-1 text-[var(--text-muted)] line-clamp-2 ${condensePhases ? 'text-xs' : 'text-sm'}`}>{phase.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-4">
              <div className="bg-[var(--brand-850)] border border-[var(--brand-700)]/50 rounded-2xl p-6 shadow-lg">
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Project Details</h2>
                <dl className="space-y-3 text-sm text-[var(--text-muted)]">
                  <div className="flex justify-between">
                    <span>Type</span>
                    <span className="font-medium text-[var(--text-primary)]">{project.template_type.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Owner</span>
                    <span className="font-medium text-[var(--text-primary)]">{project.owner_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Created</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatDate(project.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Updated</span>
                    <span className="font-medium text-[var(--text-primary)]">{formatDate(project.updated_at)}</span>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Agents floating panel */}
      {project && (
        <AIAgentsPanel
          projectId={(project.project_id || project.id) ?? ''}
          projectName={project.name}
          description={project.description}
          requirements={requirements.map(r => ({
            id: r.requirement_id || '',
            title: r.title || '',
            description: r.description || '',
            type: r.type || '',
            priority: r.priority || '',
            status: r.status || '',
          }))}
        />
      )}
    </Layout>
  );
};
