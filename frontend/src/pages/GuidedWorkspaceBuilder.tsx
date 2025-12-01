import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import type { GuidedWorkspaceConfig } from '@/types';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

type WizardForm = {
  name: string;
  description: string;
  industry: string;
  team_size: string;
  compliance: string[];
  ai_provider: string;
  delivery_model: string;
  collaboration_focus: string;
};

const COMPLIANCE_OPTIONS = ['ISO27001', 'SOC2', 'HIPAA'];

export const GuidedWorkspaceBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<WizardForm>({
    name: '',
    description: '',
    industry: 'fintech',
    team_size: '5-10',
    compliance: [],
    ai_provider: 'openai',
    delivery_model: 'agile',
    collaboration_focus: 'engineering',
  });
  const [templatePreview, setTemplatePreview] = useState<GuidedWorkspaceConfig | null>(null);
  const [resolving, setResolving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCompliance = (item: string) => {
    setForm((prev) => {
      const exists = prev.compliance.includes(item);
      return {
        ...prev,
        compliance: exists ? prev.compliance.filter((c) => c !== item) : [...prev.compliance, item],
      };
    });
  };

  const handleResolve = async () => {
    if (!form.name.trim()) {
      setError('Name your workspace to continue.');
      return;
    }
    setResolving(true);
    setError(null);
    try {
      const config = await api.resolveWorkspaceTemplate({
        industry: form.industry,
        team_size: form.team_size,
        compliance: form.compliance,
        ai_provider: form.ai_provider,
        delivery_model: form.delivery_model,
        collaboration_focus: form.collaboration_focus,
      });
      setTemplatePreview(config);
    } catch (err) {
      console.error(err);
      setError('Failed to resolve workspace template.');
    } finally {
      setResolving(false);
    }
  };

  const handleCreateProject = async () => {
    if (!templatePreview || !form.name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const project = await api.createProject({
        name: form.name,
        description: form.description,
        template_type: 'web_app',
        feature_tier: 'pro',
        ui_preferences: { preset: templatePreview.preset },
        scenario_metadata: {
          wizard: form,
          template: templatePreview,
        },
      } as any);
      navigate(`/projects/${project.project_id || project.id}`);
    } catch (err) {
      console.error(err);
      setError('Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Guided Workspace Builder</h1>
              <p className="text-sm text-gray-500">
                Answer a few questions and we’ll assemble the right phases, prompts, and guardrails for your project.
              </p>
            </div>
          </div>
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-gray-600 space-y-1">
              Project Name
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Next-gen architecture copilot"
              />
            </label>
            <label className="text-sm text-gray-600 space-y-1">
              Industry
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.industry}
                onChange={(e) => setForm((prev) => ({ ...prev, industry: e.target.value }))}
              >
                <option value="fintech">Fintech</option>
                <option value="healthcare">Healthcare</option>
                <option value="ecommerce">E-commerce</option>
                <option value="saas">SaaS</option>
              </select>
            </label>
            <label className="text-sm text-gray-600 space-y-1 md:col-span-2">
              Brief
              <textarea
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.description}
                rows={3}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="What problem are you solving and who are the stakeholders?"
              />
            </label>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <label className="text-sm text-gray-600 space-y-1">
              Team Size
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.team_size}
                onChange={(e) => setForm((prev) => ({ ...prev, team_size: e.target.value }))}
              >
                <option value="1-4">1-4</option>
                <option value="5-10">5-10</option>
                <option value="10-20">10-20</option>
                <option value="20+">20+</option>
              </select>
            </label>
            <label className="text-sm text-gray-600 space-y-1">
              AI Provider
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.ai_provider}
                onChange={(e) => setForm((prev) => ({ ...prev, ai_provider: e.target.value }))}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Gemini</option>
              </select>
            </label>
            <label className="text-sm text-gray-600 space-y-1">
              Delivery Model
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.delivery_model}
                onChange={(e) => setForm((prev) => ({ ...prev, delivery_model: e.target.value }))}
              >
                <option value="agile">Agile</option>
                <option value="waterfall">Waterfall</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p className="font-medium mb-2">Compliance Frameworks</p>
            <div className="flex flex-wrap gap-3">
              {COMPLIANCE_OPTIONS.map((framework) => (
                <label key={framework} className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.compliance.includes(framework)}
                    onChange={() => toggleCompliance(framework)}
                    className="rounded border-gray-300"
                  />
                  {framework}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <label className="text-sm text-gray-600 space-y-1">
              Collaboration Focus
              <select
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.collaboration_focus}
                onChange={(e) => setForm((prev) => ({ ...prev, collaboration_focus: e.target.value }))}
              >
                <option value="engineering">Engineering</option>
                <option value="operations">Operations</option>
                <option value="product">Product</option>
              </select>
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <Button onClick={handleResolve} disabled={resolving}>
              {resolving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Crunching signals...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Generate plan
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => navigate('/projects')}>
              Cancel
            </Button>
          </div>
        </div>

        {templatePreview && (
          <Card className="border-indigo-100 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Recommended Workspace
              </CardTitle>
              <CardDescription>
                Preset: <span className="font-semibold capitalize">{templatePreview.preset}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs uppercase text-gray-500">Phases</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {templatePreview.recommended_phases.map((phase) => (
                    <span key={phase} className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                      {phase.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Required Artifacts</p>
                <ul className="mt-2 text-sm text-gray-700 list-disc list-inside space-y-1">
                  {templatePreview.required_artifacts.map((artifact) => (
                    <li key={artifact}>{artifact}</li>
                  ))}
                </ul>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs uppercase text-gray-500 mb-1">Risk Library</p>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    {templatePreview.risk_library.map((risk) => (
                      <li key={risk}>{risk}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500 mb-1">Integrations</p>
                  <div className="flex flex-wrap gap-2">
                    {templatePreview.integrations.map((integration) => (
                      <span key={integration} className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
                        {integration}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">Notes</p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  {templatePreview.notes.map((note, idx) => (
                    <li key={`${note}-${idx}`}>{note}</li>
                  ))}
                </ul>
              </div>
              <Button
                className="w-full"
                onClick={handleCreateProject}
                disabled={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Seeding workspace...
                  </>
                ) : (
                  'Create Project from Template'
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
