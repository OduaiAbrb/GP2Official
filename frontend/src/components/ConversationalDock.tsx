import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Loader2, MessageCircle, X } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

interface ConversationalDockProps {
  projectId: string;
  phaseId?: string;
  open: boolean;
  onClose: () => void;
}

export const ConversationalDock: React.FC<ConversationalDockProps> = ({ projectId, phaseId, open, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      }, 50);
    }
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const response = await api.chatAssistant(projectId, { prompt: userMessage.text, phase_id: phaseId });
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: response.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'Sorry, I could not process that request. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col z-50">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-indigo-600" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Project Assistant</p>
            <p className="text-xs text-gray-500">Ask questions about this project</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm">
            Need help? Ask things like &ldquo;Explain the feasibility assumptions&rdquo; or &ldquo;Break the login requirement into tasks.&rdquo;
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-2xl ${
              msg.role === 'user' ? 'bg-indigo-50 text-gray-900 self-end' : 'bg-gray-50 text-gray-700'
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Thinking...
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-2">
          <textarea
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
            rows={2}
            placeholder="Ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button disabled={loading || !input.trim()} onClick={sendMessage}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};
