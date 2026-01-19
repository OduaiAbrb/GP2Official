import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Sparkles, Rocket, Zap, Target, Code, Smartphone, Cloud, Box, CheckCircle, Layers, FileText } from 'lucide-react';

const templateTypes = [
  { value: 'web_app', label: 'Web Application', icon: Code, color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', description: 'Full-featured web platform with modern frontend' },
  { value: 'mobile_app', label: 'Mobile App', icon: Smartphone, color: 'from-violet-500 to-purple-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', description: 'Native iOS & Android applications' },
  { value: 'api', label: 'API Service', icon: Zap, color: 'from-emerald-500 to-teal-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', description: 'RESTful or GraphQL backend APIs' },
  { value: 'desktop', label: 'Desktop App', icon: Box, color: 'from-orange-500 to-amber-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', description: 'Cross-platform desktop software' },
  { value: 'other', label: 'Other', icon: Cloud, color: 'from-slate-500 to-gray-600', bgColor: 'bg-slate-50', borderColor: 'border-slate-200', description: 'Custom project type' },
];

const stepInfo = [
  { number: 1, title: 'Basics', icon: Target },
  { number: 2, title: 'Type', icon: Layers },
  { number: 3, title: 'Brief', icon: FileText },
];

export const NewProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template_type: 'web_app',
    brief_text: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const project = await api.createProject(formData);
      navigate(`/projects/${project.id}`);
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/projects')}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-6 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Projects
            </button>
            
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/25">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    Create New Project
                  </h1>
                  <p className="text-slate-500 mt-1">Set up your project with AI-powered planning</p>
                </div>
              </div>
              
              {/* Live Preview Badge */}
              {formData.name && (
                <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-sm text-slate-600">Preview:</span>
                  <span className="font-semibold text-slate-900">{formData.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 bg-white rounded-2xl p-2 shadow-sm border border-slate-200/60">
            {stepInfo.map((step, index) => (
              <React.Fragment key={step.number}>
                <button
                  type="button"
                  onClick={() => {
                    if (step.number < currentStep) setCurrentStep(step.number);
                    else if (step.number === 2 && formData.name) setCurrentStep(2);
                    else if (step.number === 3 && formData.name) setCurrentStep(3);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 sm:gap-3 py-3 px-2 sm:px-4 rounded-xl transition-all ${
                    currentStep === step.number
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                      : currentStep > step.number
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline font-medium">{step.title}</span>
                  <span className="sm:hidden font-medium text-sm">{step.number}</span>
                </button>
                {index < stepInfo.length - 1 && (
                  <div className={`hidden sm:block w-8 h-0.5 mx-1 rounded-full transition-colors ${
                    currentStep > step.number ? 'bg-emerald-300' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic Info */}
              <div className={`transition-all duration-300 ${
                currentStep === 1 ? 'block' : 'hidden'
              }`}>
                <div className="p-6 sm:p-8 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Target className="w-5 h-5 text-amber-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Basic Information</h2>
                  </div>
                  <p className="text-slate-500 ml-11">Give your project a name and brief description</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., E-commerce Platform, Healthcare App"
                      required
                      className="w-full h-12 text-lg border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Short Description</label>
                    <Input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="A brief one-line overview of your project"
                      className="w-full h-12 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20"
                    />
                  </div>

                  <div className="pt-4">
                    <Button
                      type="button"
                      onClick={nextStep}
                      disabled={!formData.name}
                      className="w-full h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:shadow-none"
                    >
                      Continue to Project Type
                      <Sparkles className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2: Project Type */}
              <div className={`transition-all duration-300 ${
                currentStep === 2 ? 'block' : 'hidden'
              }`}>
                <div className="p-6 sm:p-8 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <Layers className="w-5 h-5 text-violet-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Project Type</h2>
                  </div>
                  <p className="text-slate-500 ml-11">What kind of software are you building?</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templateTypes.map((template) => (
                      <button
                        key={template.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, template_type: template.value })}
                        className={`relative p-5 rounded-2xl border-2 text-left transition-all ${
                          formData.template_type === template.value
                            ? `${template.borderColor} ${template.bgColor} shadow-md`
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center shadow-md`}>
                            <template.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 mb-1">{template.label}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2">{template.description}</p>
                          </div>
                        </div>
                        {formData.template_type === template.value && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1 h-12 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25"
                    >
                      Continue to Brief
                      <Sparkles className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 3: Project Brief */}
              <div className={`transition-all duration-300 ${
                currentStep === 3 ? 'block' : 'hidden'
              }`}>
                <div className="p-6 sm:p-8 border-b border-slate-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Project Brief</h2>
                  </div>
                  <p className="text-slate-500 ml-11">Describe your project vision for AI-powered planning</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Tell us about your project
                    </label>
                    <textarea
                      value={formData.brief_text}
                      onChange={(e) => setFormData({ ...formData, brief_text: e.target.value })}
                      placeholder="Describe features, user needs, technical requirements, goals, and any specific details that will help our AI generate comprehensive requirements..."
                      rows={8}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none text-slate-700"
                    />
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-slate-400">Optional but recommended</span>
                      <span className="text-xs text-slate-400">{formData.brief_text.length} characters</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-100">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <Zap className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-sm">
                      <p className="font-semibold text-slate-900 mb-1">Pro Tip</p>
                      <p className="text-slate-600">The more detailed your brief, the better our AI can generate requirements, architecture, and planning documents!</p>
                    </div>
                  </div>

                  {/* Summary Preview */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">Project Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Name</span>
                        <span className="font-medium text-slate-900">{formData.name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Type</span>
                        <span className="font-medium text-slate-900">
                          {templateTypes.find(t => t.value === formData.template_type)?.label || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Brief</span>
                        <span className="font-medium text-slate-900">
                          {formData.brief_text ? `${formData.brief_text.length} chars` : 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={prevStep}
                      variant="outline"
                      className="flex-1 h-12 border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25 disabled:opacity-70"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Creating Project...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-5 h-5 mr-2" />
                          Create Project
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

    </Layout>
  );
};
