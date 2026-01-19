import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  Upload,
  Lightbulb,
  HelpCircle,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Search,
  Filter,
  Grid3X3,
  List,
  Trash2,
  Edit3,
  ExternalLink,
  BarChart3,
  FileText,
  Building2,
  Briefcase,
  Users
} from 'lucide-react';
import type { Project } from '@/types';

const quickActions = [
  { icon: Plus, label: 'New Project', description: 'Start from scratch', action: 'new', color: 'gold' },
  { icon: Upload, label: 'Import', description: 'Upload documents', action: 'import', color: 'blue' },
  { icon: Lightbulb, label: 'AI Insights', description: 'Get recommendations', action: 'insights', color: 'purple' },
  { icon: HelpCircle, label: 'Documentation', description: 'Learn more', action: 'docs', color: 'green' },
];

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
    setIsVisible(true);
  }, []);

  const loadProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(projectId);
      setProjects(prev => prev.filter(p => (p.id || p.project_id) !== projectId));
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
    setActiveMenu(null);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; bgColor: string; borderColor: string; icon: React.ElementType; label: string }> = {
      draft: { color: 'text-gray-400', bgColor: 'bg-gray-500/10', borderColor: 'border-gray-500/30', icon: Clock, label: 'Draft' },
      planning: { color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30', icon: Loader2, label: 'Planning' },
      active: { color: 'text-green-400', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30', icon: CheckCircle, label: 'Active' },
      completed: { color: 'text-[#d4af37]', bgColor: 'bg-[#d4af37]/10', borderColor: 'border-[#d4af37]/30', icon: CheckCircle, label: 'Completed' },
      archived: { color: 'text-orange-400', bgColor: 'bg-orange-500/10', borderColor: 'border-orange-500/30', icon: AlertCircle, label: 'Archived' },
    };
    return configs[status] || configs.draft;
  };

  const handleQuickAction = (action: string) => {
    if (action === 'new' || action === 'import') {
      navigate('/projects/new');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#b8962e] flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Sparkles className="w-8 h-8 text-[#0a0f1a]" />
              </div>
              <div className="absolute inset-0 w-16 h-16 mx-auto rounded-2xl bg-[#d4af37]/30 blur-xl animate-pulse" />
            </div>
            <p className="text-gray-400 text-lg">Loading your projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pb-12">
        {/* Header */}
        <div className={`mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-8 bg-gradient-to-b from-[#d4af37] to-[#9a7b24] rounded-full" />
                <h1 className="text-4xl font-bold text-white">Projects</h1>
              </div>
              <p className="text-gray-400 text-lg ml-5">
                Manage and track all your enterprise project plans
              </p>
            </div>
            
            <button
              onClick={() => navigate('/projects/new')}
              className="btn-primary group"
              data-testid="new-project-btn"
            >
              <Plus className="w-5 h-5" />
              New Project
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-10 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            const colorClasses = {
              gold: 'from-[#d4af37] to-[#9a7b24] hover:shadow-[#d4af37]/20',
              blue: 'from-blue-500 to-blue-600 hover:shadow-blue-500/20',
              purple: 'from-purple-500 to-purple-600 hover:shadow-purple-500/20',
              green: 'from-emerald-500 to-emerald-600 hover:shadow-emerald-500/20',
            }[action.color];
            
            return (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action)}
                className="group relative p-6 rounded-2xl bg-[#0d1525] border border-[#1e3a5f]/50 hover:border-[#d4af37]/30 transition-all duration-500 text-left overflow-hidden hover-lift"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white mb-1">{action.label}</h3>
                <p className="text-sm text-gray-500">{action.description}</p>
              </button>
            );
          })}
        </div>

        {/* Search & Filters */}
        <div className={`flex flex-col md:flex-row gap-4 mb-8 transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-12 w-full"
              data-testid="search-projects-input"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <button className="btn-secondary px-4 py-3">
              <Filter className="w-5 h-5" />
              <span className="hidden md:inline">Filters</span>
            </button>
            
            <div className="flex items-center bg-[#0d1525] rounded-xl p-1 border border-[#1e3a5f]/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#d4af37] text-[#0a0f1a]' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#d4af37] text-[#0a0f1a]' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects */}
        {filteredProjects.length === 0 ? (
          <div className={`text-center py-20 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="w-24 h-24 rounded-2xl bg-[#111b2e] flex items-center justify-center mx-auto mb-6 border border-[#1e3a5f]/50">
              <FolderOpen className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">No projects yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Create your first enterprise project and let AI help you build comprehensive documentation
            </p>
            <button onClick={() => navigate('/projects/new')} className="btn-primary">
              <Plus className="w-5 h-5" />
              Create First Project
            </button>
          </div>
        ) : (
          <div className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {viewMode === 'grid' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project, index) => {
                  const projectId = project.id || project.project_id || '';
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon = statusConfig.icon;
                  const isHovered = hoveredProject === projectId;
                  
                  return (
                    <div
                      key={projectId}
                      className="group relative card p-6 cursor-pointer animate-reveal-up"
                      onClick={() => navigate(`/projects/${projectId}`)}
                      onMouseEnter={() => setHoveredProject(projectId)}
                      onMouseLeave={() => setHoveredProject(null)}
                      style={{ animationDelay: `${index * 75}ms` }}
                      data-testid={`project-card-${projectId}`}
                    >
                      {/* Status Badge */}
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor} mb-4`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>
                      
                      {/* Project Info */}
                      <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#d4af37] transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-6 line-clamp-2">
                        {project.description || 'No description provided'}
                      </p>
                      
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(project.created_at)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          {project.template_type || 'Custom'}
                        </div>
                      </div>
                      
                      {/* Hover Actions */}
                      <div className={`absolute top-4 right-4 flex items-center gap-1 transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/projects/${projectId}`);
                          }}
                          className="p-2 rounded-lg bg-[#1e3a5f]/50 hover:bg-[#d4af37] text-gray-400 hover:text-[#0a0f1a] transition-all"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === projectId ? null : projectId);
                          }}
                          className="p-2 rounded-lg bg-[#1e3a5f]/50 hover:bg-[#1e3a5f] text-gray-400 hover:text-white transition-all"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {activeMenu === projectId && (
                          <div 
                            className="absolute top-full right-0 mt-2 w-40 bg-[#111b2e] border border-[#1e3a5f]/50 rounded-xl shadow-xl overflow-hidden z-10 animate-reveal-down"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => navigate(`/projects/${projectId}`)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-300 hover:bg-[#1e3a5f]/30 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => deleteProject(projectId)}
                              className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project, index) => {
                  const projectId = project.id || project.project_id || '';
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <div
                      key={projectId}
                      className="group flex items-center gap-6 p-5 rounded-xl bg-[#0d1525] border border-[#1e3a5f]/50 hover:border-[#d4af37]/30 cursor-pointer transition-all duration-300 animate-reveal-up"
                      onClick={() => navigate(`/projects/${projectId}`)}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4af37]/20 to-[#9a7b24]/20 flex items-center justify-center flex-shrink-0 border border-[#d4af37]/30">
                        <FolderOpen className="w-6 h-6 text-[#d4af37]" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white group-hover:text-[#d4af37] transition-colors truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">
                          {project.description || 'No description'}
                        </p>
                      </div>
                      
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color} border ${statusConfig.borderColor}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </div>
                      
                      <div className="text-sm text-gray-500 hidden md:block">
                        {formatDate(project.created_at)}
                      </div>
                      
                      <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-[#d4af37] group-hover:translate-x-1 transition-all" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Stats Banner */}
        {projects.length > 0 && (
          <div className={`mt-12 p-8 rounded-2xl bg-gradient-to-r from-[#d4af37]/10 to-[#1e3a5f]/20 border border-[#d4af37]/20 transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex flex-wrap items-center justify-between gap-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#d4af37]/20 flex items-center justify-center border border-[#d4af37]/30">
                  <TrendingUp className="w-7 h-7 text-[#d4af37]" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">Project Overview</h4>
                  <p className="text-sm text-gray-400">Your enterprise portfolio at a glance</p>
                </div>
              </div>
              
              <div className="flex items-center gap-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-[#d4af37]">{projects.length}</div>
                  <div className="text-xs text-gray-500 mt-1">Total Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-400">
                    {projects.filter(p => p.status === 'active' || p.status === 'completed').length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400">
                    {projects.filter(p => p.status === 'draft' || p.status === 'planning').length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">In Progress</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProjectsPage;
