import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, User as UserIcon, Loader2, Trash2 } from 'lucide-react';

interface ChatItem {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const SUGGESTED_QUESTIONS = [
  'How can I donate via bKash or Nagad?',
  'Find O+ blood donors near Dhaka',
  'How to become a HopeCare volunteer?',
  'Which campaigns need urgent support?'
];

export const HopeCareAiDrawer: React.FC = () => {
  const { isAiChatOpen, setIsAiChatOpen } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatItem[]>([
    {
      id: 'init',
      sender: 'ai',
      text: `Salam & Welcome! I am **HopeCare AI**, your 24/7 humanitarian guide. How can I help you today with charitable donations, finding emergency blood donors, or volunteering?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAiChatOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiChatOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatItem = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();

      const aiMsg: ChatItem = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: data.reply || 'Thank you for your question. You can donate or request blood through our menu above.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          sender: 'ai',
          text: 'I had trouble connecting to the medical AI server. For urgent blood requirements, please call our 24/7 hotline at **+880 1800-467322**.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button with gentle pulse motion */}
      <motion.button
        whileHover={{ scale: 1.08, y: -3 }}
        whileTap={{ scale: 0.94 }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        onClick={() => setIsAiChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 text-white rounded-full shadow-xl shadow-sky-600/30 group font-medium text-sm cursor-pointer"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
        <span className="hidden sm:inline font-bold">Ask HopeCare AI</span>
        <span className="sm:hidden font-bold">AI Help</span>
      </motion.button>

      {/* Floating Chat Drawer with AnimatePresence */}
      <AnimatePresence>
        {isAiChatOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col border-l border-slate-200"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-sky-700 via-teal-700 to-emerald-700 text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                    HopeCare AI Assistant
                    <span className="px-1.5 py-0.2 bg-emerald-400 text-slate-900 text-[10px] rounded-full font-bold">Online</span>
                  </h4>
                  <p className="text-[11px] text-sky-100">Smart donation & blood donor navigation</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMessages([])}
                  title="Clear Chat"
                  className="p-1.5 text-white/70 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsAiChatOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

          {/* Quick Pill Prompts */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTED_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:border-sky-400 hover:text-sky-700 transition shrink-0"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
            {messages.map((m) => {
              const isAi = m.sender === 'ai';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2.5 ${isAi ? '' : 'flex-row-reverse'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isAi ? 'bg-sky-600 text-white' : 'bg-slate-700 text-white'
                    }`}
                  >
                    {isAi ? <Bot className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                      isAi
                        ? 'bg-white border border-slate-200/90 text-slate-800'
                        : 'bg-sky-600 text-white font-medium'
                    }`}
                  >
                    <div className="prose prose-xs max-w-none whitespace-pre-line">
                      {m.text}
                    </div>
                    <span
                      className={`block text-[10px] mt-1 text-right ${
                        isAi ? 'text-slate-400' : 'text-sky-200'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 w-fit text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                <span>HopeCare AI is checking data...</span>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about campaigns, blood groups, hotline..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-1.5">
              HopeCare AI provides guidance, not official medical diagnosis.
            </p>
          </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
