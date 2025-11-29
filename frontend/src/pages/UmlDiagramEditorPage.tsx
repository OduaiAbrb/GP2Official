import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { api } from '@/lib/api';
import type { Artifact, Project } from '@/types';
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Save,
  Sparkles,
  PenTool,
  Trash2,
} from 'lucide-react';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const umlTypes = [
  { id: 'use_case', label: 'Use Case Diagram' },
  { id: 'class_diagram', label: 'Class Diagram' },
  { id: 'sequence', label: 'Sequence Diagram' },
];

const normalizeType = (type?: string) => {
  const normalized = (type || '').toLowerCase();
  const found = umlTypes.find((t) => t.id === normalized);
  return found?.id || 'use_case';
};

export const UmlDiagramEditorPage: React.FC = () => {
  const { id: projectIdParam, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const umlType = useMemo(() => normalizeType(type), [type]);

  const [project, setProject] = useState<Project | null>(null);
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [plantuml, setPlantuml] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'You are editing the generated UML. Ask me to add, remove, rename, or connect elements and I will update the PlantUML.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [previewHeight, setPreviewHeight] = useState(720);
  const [previewZoom, setPreviewZoom] = useState(100);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [livePreviewLoading, setLivePreviewLoading] = useState(false);
  const [penEnabled, setPenEnabled] = useState(true);
  const [penDrawing, setPenDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#f97316');
  const [penWidth, setPenWidth] = useState(3);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const penCanvasRef = useRef<HTMLCanvasElement>(null);
  const livePreviewAbort = useRef<AbortController | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const projectId = projectIdParam!;

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    const load = async () => {
      try {
        const [proj, diag] = await Promise.all([
          api.getProject(projectId),
          api.getUmlDiagram(projectId, umlType),
        ]);
        setProject(proj);
        setArtifact(diag);
        const source = diag.content_json?.plantuml || '';
        setPlantuml(source);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load diagram');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId, umlType]);

  const currentTypeInfo = umlTypes.find((t) => t.id === umlType)!;
  const diagramLabel = currentTypeInfo.label;
  const previewUrl = useMemo(() => {
    if (!artifact?.metadata?.plantuml_svg_url) return undefined;
    const stamped = artifact.updated_at ? new Date(artifact.updated_at).getTime() : Date.now();
    return `${artifact.metadata.plantuml_svg_url}?v=${stamped}`;
  }, [artifact]);
  const displayPreviewUrl = livePreviewUrl || previewUrl;

  const handleSave = async () => {
    if (!projectId || !plantuml.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.saveUmlDiagram(projectId, umlType, plantuml);
      setArtifact(updated);
      setPlantuml(updated.content_json?.plantuml || plantuml);
      setLivePreviewUrl(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save diagram');
    } finally {
      setSaving(false);
    }
  };

  const handleChatSend = async () => {
    if (!projectId || !chatInput.trim()) return;
    const content = chatInput.trim();
    setChatInput('');
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
    };
    setChatMessages((prev) => [...prev, userMessage]);
    setChatLoading(true);
    setError(null);
    try {
      const updated = await api.chatUmlDiagram(projectId, umlType, content);
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: 'Diagram updated. Review the changes in the PlantUML source and preview.',
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
      setArtifact(updated);
      setPlantuml(updated.content_json?.plantuml || plantuml);
      setLivePreviewUrl(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'AI edit failed');
    } finally {
      setChatLoading(false);
    }
  };

  const handleResetToGenerated = () => {
    if (artifact?.content_json?.plantuml) {
      setPlantuml(artifact.content_json.plantuml);
      setError(null);
    }
  };

  const refreshCanvasSize = useCallback(() => {
    if (!previewContainerRef.current || !penCanvasRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const canvas = penCanvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, []);

  useEffect(() => {
    refreshCanvasSize();
    window.addEventListener('resize', refreshCanvasSize);
    return () => window.removeEventListener('resize', refreshCanvasSize);
  }, [refreshCanvasSize, previewHeight, previewZoom]);

  const getCanvasPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = penCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePenPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penEnabled) return;
    const canvas = penCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const { x, y } = getCanvasPosition(event);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvas.setPointerCapture(event.pointerId);
    setPenDrawing(true);
    event.preventDefault();
  };

  const handlePenPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penEnabled || !penDrawing) return;
    const ctx = penCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPosition(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    event.preventDefault();
  };

  const stopDrawing = (event?: React.PointerEvent<HTMLCanvasElement>) => {
    if (!penDrawing) return;
    const canvas = penCanvasRef.current;
    const ctx = penCanvasRef.current?.getContext('2d');
    ctx?.closePath();
    if (canvas && event) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch {
        // ignore
      }
    }
    setPenDrawing(false);
  };

  const handlePenClear = () => {
    const ctx = penCanvasRef.current?.getContext('2d');
    const canvas = penCanvasRef.current;
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    if (!plantuml.trim()) {
      setLivePreviewUrl(null);
      return;
    }
    setLivePreviewLoading(true);
    if (livePreviewAbort.current) {
      livePreviewAbort.current.abort();
    }
    const controller = new AbortController();
    livePreviewAbort.current = controller;
    const debounce = setTimeout(async () => {
      try {
        const response = await fetch('https://www.plantuml.com/plantuml/svg', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=UTF-8',
          },
          body: plantuml,
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error('Failed to render diagram');
        }
        const svgText = await response.text();
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        const blob = new Blob([svgText], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;
        setLivePreviewUrl(url);
      } catch (err) {
        if ((err as any).name !== 'AbortError') {
          console.error('Live preview failed', err);
        }
      } finally {
        setLivePreviewLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(debounce);
      controller.abort();
    };
  }, [plantuml]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button
            variant="ghost"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
          <div className="text-right">
            <p className="text-xs uppercase text-gray-500">Editing</p>
            <p className="text-sm font-semibold text-gray-900">
              {diagramLabel} · {project?.name || 'Project'}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_320px]">
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>PlantUML Source</CardTitle>
                <p className="text-xs text-gray-500">
                  Edit the generated code directly. Save to keep changes with the project.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleResetToGenerated} disabled={!artifact}>
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !plantuml.trim()}>
                  {saving ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-3 w-3 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <textarea
                className="w-full h-[640px] border border-gray-200 rounded-md px-3 py-2 text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                value={plantuml}
                onChange={(e) => setPlantuml(e.target.value)}
                spellCheck={false}
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle>Diagram Preview</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={penEnabled ? 'default' : 'outline'}
                      onClick={() => setPenEnabled((prev) => !prev)}
                    >
                      <PenTool className="h-3.5 w-3.5 mr-1" />
                      {penEnabled ? 'Pen On' : 'Pen Tool'}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handlePenClear}
                      disabled={!penEnabled}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Clear Sketch
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 md:grid-cols-2">
                  <label className="flex flex-col">
                    Height ({previewHeight}px)
                    <input
                      type="range"
                      min={480}
                      max={1000}
                      step={20}
                      value={previewHeight}
                      onChange={(e) => setPreviewHeight(Number(e.target.value))}
                    />
                  </label>
                  <label className="flex flex-col">
                    Zoom ({previewZoom}%)
                    <input
                      type="range"
                      min={60}
                      max={160}
                      step={5}
                      value={previewZoom}
                      onChange={(e) => setPreviewZoom(Number(e.target.value))}
                    />
                  </label>
                  {penEnabled && (
                    <>
                      <label className="flex flex-col">
                        Pen Color
                        <input
                          type="color"
                          value={penColor}
                          onChange={(e) => setPenColor(e.target.value)}
                          className="h-8 w-16 p-0 border border-gray-300 rounded"
                        />
                      </label>
                      <label className="flex flex-col">
                        Pen Width ({penWidth}px)
                        <input
                          type="range"
                          min={1}
                          max={8}
                          value={penWidth}
                          onChange={(e) => setPenWidth(Number(e.target.value))}
                        />
                      </label>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-gray-500">
                  Pen tool lets you sketch quick annotations directly over the preview. Toggle it off to return to panning/scrolling.
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div
                className="relative border border-gray-200 rounded-lg bg-white flex-1 overflow-auto"
                style={{ height: previewHeight }}
                ref={previewContainerRef}
              >
                <div
                  className="flex items-center justify-center w-full h-full"
                  style={{
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: 'top left',
                    minHeight: previewHeight,
                  }}
                >
                  {displayPreviewUrl ? (
                    <img
                      src={displayPreviewUrl}
                      alt={`${diagramLabel} preview`}
                      className="max-w-full max-h-full object-contain bg-white"
                    />
                  ) : plantuml ? (
                    <pre className="p-4 text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {plantuml}
                    </pre>
                  ) : (
                    <div className="text-center text-gray-500 text-sm px-4">
                      No preview available. Add valid PlantUML and save or edit the source to generate a diagram.
                    </div>
                  )}
                </div>
                <canvas
                  ref={penCanvasRef}
                  className="absolute inset-0 cursor-crosshair"
                  style={{ pointerEvents: penEnabled ? 'auto' : 'none' }}
                  onPointerDown={handlePenPointerDown}
                  onPointerMove={handlePenPointerMove}
                  onPointerUp={(event) => stopDrawing(event)}
                  onPointerLeave={(event) => stopDrawing(event)}
                />
                {livePreviewLoading && (
                  <div className="absolute top-2 right-2 bg-white/80 rounded-md px-2 py-1 text-xs text-gray-600 flex items-center gap-1">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Refreshing preview...
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Live preview updates automatically with your edits. Save to persist changes to the project.
              </p>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Diagram Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-3">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-50 text-blue-800 ml-auto max-w-[90%]'
                        : 'bg-gray-100 text-gray-800 mr-auto max-w-[90%]'
                    }`}
                  >
                    <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </div>
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                ))}
              </div>
              <div>
                <textarea
                  className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 min-h-[90px] resize-none"
                  placeholder="e.g. Add a Payment Service between API and Database and connect the relationships"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                />
                <Button
                  onClick={handleChatSend}
                  disabled={chatLoading || !chatInput.trim()}
                  className="w-full mt-2"
                >
                  {chatLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Applying changes...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Instruction
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default UmlDiagramEditorPage;
