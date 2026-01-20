import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Sparkles,
  FileText,
  Users,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Calendar,
  Zap
} from 'lucide-react';

interface AnalyticsData {
  projectProgress: number;
  totalRequirements: number;
  completedRequirements: number;
  aiGenerations: number;
  totalPhases: number;
  completedPhases: number;
  estimatedCompletion: string;
  riskLevel: 'low' | 'medium' | 'high';
  weeklyActivity: { day: string; count: number }[];
  phaseBreakdown: { name: string; progress: number; status: string }[];
}

export const AnalyticsDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalytics({
        projectProgress: 65,
        totalRequirements: 24,
        completedRequirements: 16,
        aiGenerations: 47,
        totalPhases: 8,
        completedPhases: 5,
        estimatedCompletion: 'March 15, 2026',
        riskLevel: 'low',
        weeklyActivity: [
          { day: 'Mon', count: 12 },
          { day: 'Tue', count: 18 },
          { day: 'Wed', count: 8 },
          { day: 'Thu', count: 22 },
          { day: 'Fri', count: 15 },
          { day: 'Sat', count: 5 },
          { day: 'Sun', count: 3 }
        ],
        phaseBreakdown: [
          { name: 'Planning', progress: 100, status: 'completed' },
          { name: 'Feasibility', progress: 100, status: 'completed' },
          { name: 'Requirements', progress: 100, status: 'completed' },
          { name: 'Design', progress: 100, status: 'completed' },
          { name: 'Development', progress: 100, status: 'completed' },
          { name: 'Testing', progress: 45, status: 'in_progress' },
          { name: 'Deployment', progress: 0, status: 'pending' },
          { name: 'Validation', progress: 0, status: 'pending' }
        ]
      });
      setIsLoading(false);
    }, 1000);
  }, [id]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return { bg: 'rgba(16,185,129,0.2)', text: '#10b981', label: 'Low Risk' };
      case 'medium': return { bg: 'rgba(212,175,55,0.2)', text: '#d4af37', label: 'Medium Risk' };
      case 'high': return { bg: 'rgba(239,68,68,0.2)', text: '#f87171', label: 'High Risk' };
      default: return { bg: '#152238', text: '#9ca3af', label: 'Unknown' };
    }
  };

  const maxActivity = Math.max(...(analytics?.weeklyActivity.map(d => d.count) || [1]));

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center" style={{ backgroundColor: '#0a0f1a' }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400">Loading analytics...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-4rem)]" style={{ backgroundColor: '#0a0f1a' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(to bottom right, #d4af37, #b8962e)', boxShadow: '0 10px 25px -5px rgba(212,175,55,0.3)' }}>
              <BarChart3 className="w-7 h-7" style={{ color: '#0a0f1a' }} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
              <p className="text-gray-400">Project insights and performance metrics</p>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(212,175,55,0.2)' }}>
                  <TrendingUp className="w-5 h-5" style={{ color: '#d4af37' }} />
                </div>
                <span className="text-gray-400 text-sm">Progress</span>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.projectProgress}%</p>
              <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#152238' }}>
                <div className="h-full rounded-full" style={{ width: `${analytics?.projectProgress}%`, background: 'linear-gradient(to right, #d4af37, #b8962e)' }} />
              </div>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(59,130,246,0.2)' }}>
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-gray-400 text-sm">Requirements</span>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.completedRequirements}/{analytics?.totalRequirements}</p>
              <p className="text-sm text-gray-500 mt-1">Completed</p>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(168,85,247,0.2)' }}>
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-gray-400 text-sm">AI Generations</span>
              </div>
              <p className="text-3xl font-bold text-white">{analytics?.aiGenerations}</p>
              <p className="text-sm text-gray-500 mt-1">Total calls</p>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: getRiskColor(analytics?.riskLevel || 'low').bg }}>
                  <AlertTriangle className="w-5 h-5" style={{ color: getRiskColor(analytics?.riskLevel || 'low').text }} />
                </div>
                <span className="text-gray-400 text-sm">Risk Level</span>
              </div>
              <p className="text-3xl font-bold text-white">{getRiskColor(analytics?.riskLevel || 'low').label}</p>
              <p className="text-sm text-gray-500 mt-1">Current status</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Weekly Activity */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
              <div className="flex items-center gap-3 mb-6">
                <Activity className="w-5 h-5" style={{ color: '#d4af37' }} />
                <h3 className="text-lg font-bold text-white">Weekly Activity</h3>
              </div>
              <div className="flex items-end justify-between h-40 gap-2">
                {analytics?.weeklyActivity.map((day) => (
                  <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full rounded-t-lg transition-all"
                      style={{ 
                        height: `${(day.count / maxActivity) * 100}%`,
                        background: 'linear-gradient(to top, #d4af37, #b8962e)',
                        minHeight: '8px'
                      }}
                    />
                    <span className="text-xs text-gray-500">{day.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Phase Progress */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
              <div className="flex items-center gap-3 mb-6">
                <Target className="w-5 h-5" style={{ color: '#d4af37' }} />
                <h3 className="text-lg font-bold text-white">Phase Progress</h3>
              </div>
              <div className="space-y-4">
                {analytics?.phaseBreakdown.map((phase) => (
                  <div key={phase.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-300">{phase.name}</span>
                      <span className="text-xs text-gray-500">{phase.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#152238' }}>
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${phase.progress}%`,
                          background: phase.status === 'completed' 
                            ? '#10b981' 
                            : phase.status === 'in_progress' 
                            ? 'linear-gradient(to right, #d4af37, #b8962e)' 
                            : '#374151'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-5 h-5" style={{ color: '#d4af37' }} />
                <h3 className="text-lg font-bold text-white">Estimated Timeline</h3>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{analytics?.estimatedCompletion}</p>
                  <p className="text-sm text-gray-500 mt-1">Projected completion date</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold" style={{ color: '#d4af37' }}>{analytics?.completedPhases}/{analytics?.totalPhases}</p>
                  <p className="text-sm text-gray-500">Phases complete</p>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#111b2e', border: '1px solid #1e3a5f' }}>
              <div className="flex items-center gap-3 mb-6">
                <Zap className="w-5 h-5" style={{ color: '#d4af37' }} />
                <h3 className="text-lg font-bold text-white">AI Insights</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#0d1525' }}>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">Project is on track with 65% completion</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#0d1525' }}>
                  <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#d4af37' }} />
                  <p className="text-sm text-gray-300">AI has generated content for 6 out of 8 phases</p>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#0d1525' }}>
                  <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-300">Requirement completion rate increased by 15% this week</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AnalyticsDashboardPage;
