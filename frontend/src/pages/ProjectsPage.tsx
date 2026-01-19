import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { 
  Plus, 
  FolderOpen, 
  Calendar, 
  FileText,
  Upload,
  Lightbulb,
  HelpCircle,
  MoreVertical,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import type { Project } from '@/types';

const quickActions = [
  { icon: Plus, label: 'New Project', description: 'Start from scratch', action: 'new' },
  { icon: Upload, label: 'Import Document', description: 'Upload existing docs', action: 'import' },
  { icon: Lightbulb, label: 'AI Insights', description: 'View recent suggestions', action: 'insights' },
  { icon: HelpCircle, label: 'Documentation', description: 'Learn how to use Acorn', action: 'docs' },
];

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ElementType; label: string }> = {
      draft: { color: 'bg-gray-100 text-gray-600', icon: Clock, label: 'Draft' },
      planning: { color: 'bg-blue-100 text-blue-600', icon: Loader2, label: 'Planning' },
      active: { color: 'bg-green-100 text-green-600', icon: CheckCircle, label: 'Active' },
      completed: { color: 'bg-acorn-blue-100 text-acorn-blue-600', icon: CheckCircle, label: 'Completed' },
      archived: { color: 'bg-orange-100 text-orange-600', icon: AlertCircle, label: 'Archived' },
    };
    return configs[status] || configs.draft;
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new':
        navigate('/projects/new');
        break;
      case 'import':
        navigate('/projects/new');
        break;
      default:
        break;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 text-acorn-blue-500 animate-spin mx-auto" />
            <p className="text-gray-600">Loading your projects...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-500 mt-1">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
          <Button
            onClick={() => navigate('/projects/new')}
            className="bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.action}
              onClick={() => handleQuickAction(action.action)}
              className="bg-white rounded-xl p-4 border border-gray-200 hover:border-acorn-blue-300 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 bg-acorn-blue-50 rounded-lg flex items-center justify-center mb-3 group-hover:bg-acorn-blue-100 transition-colors">
                <action.icon className="w-5 h-5 text-acorn-blue-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
              <p className="text-xs text-gray-500 mt-1">{action.description}</p>
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create your first project to start generating AI-powered requirements and documentation.
            </p>
            <Button
              onClick={() => navigate('/projects/new')}
              className="bg-acorn-orange-500 hover:bg-acorn-orange-600 text-white"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const statusConfig = getStatusConfig(project.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-acorn-blue-200 transition-all cursor-pointer group animate-fadeIn"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-acorn-blue-600 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {project.description || 'No description'}
                      </p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="p-1 hover:bg-gray-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {(project as any).requirements_count || 0}
                      </p>
                      <p className="text-xs text-gray-500">Requirements</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {(project as any).tasks_count || 0}
                      </p>
                      <p className="text-xs text-gray-500">Tasks</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">
                        {(project as any).diagrams_count || 0}
                      </p>
                      <p className="text-xs text-gray-500">Diagrams</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created {formatDate(project.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </Layout>
  );
};
