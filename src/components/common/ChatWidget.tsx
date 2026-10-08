import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  X,
  Send,
  Search,
  Plus,
  ArrowLeft,
  User as UserIcon,
  Loader2,
  CheckCheck
} from 'lucide-react';

interface PublicUser {
  id: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
}

interface Conversation {
  id: string;
  participants: { id: string; name: string; role: string }[];
  subject: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

type ChatView = 'list' | 'chat' | 'new';

export const ChatWidget: React.FC = () => {
  const { user, addToast } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<ChatView>('list');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgInput, setMsgInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const token = () => localStorage.getItem('hopecare_token') || '';

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations when widget opens
  useEffect(() => {
    if (isOpen && user) {
      loadConversations();
    }
  }, [isOpen, user]);

  // Poll for new messages every 5 seconds when chat is open
  useEffect(() => {
    if (isOpen && user && view === 'chat' && activeConv) {
      pollRef.current = setInterval(() => {
        loadMessages(activeConv.id, true);
      }, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, user, view, activeConv]);

  // Load users for new chat
  useEffect(() => {
    if (view === 'new' && user) {
      fetch('/api/users/public', { headers: { Authorization: `Bearer ${token()}` } })
        .then(r => r.json())
        .then((data: PublicUser[]) => setPublicUsers(data))
        .catch(() => {});
    }
  }, [view, user]);

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) return;
      const data: Conversation[] = await res.json();
      setConversations(data);
      setUnreadTotal(data.reduce((acc, c) => acc + (c.unreadCount || 0), 0));
    } catch {}
  };

  const loadMessages = async (convId: string, silent = false) => {
    try {
      const res = await fetch(`/api/chat/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token()}` }
      });
      if (!res.ok) return;
      const data: ChatMessage[] = await res.json();
      setMessages(data);
    } catch {}
  };

  const openConversation = (conv: Conversation) => {
    setActiveConv(conv);
    setMessages([]);
    setView('chat');
    loadMessages(conv.id);
    if (inputRef.current) inputRef.current.focus();
  };

  const startNewChat = async (recipientId: string) => {
    try {
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`
        },
        body: JSON.stringify({ recipientId })
      });
      const conv: Conversation = await res.json();
      setConversations(prev => {
        const exists = prev.find(c => c.id === conv.id);
        return exists ? prev : [conv, ...prev];
      });
      openConversation(conv);
    } catch {
      addToast('চ্যাট শুরু করতে সমস্যা হয়েছে', 'error');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeConv || isSending) return;
    const text = msgInput.trim();
    setMsgInput('');
    setIsSending(true);

    // Optimistic update
    const optimistic: ChatMessage = {
      id: 'temp-' + Date.now(),
      conversationId: activeConv.id,
      senderId: user!.id,
      senderName: user!.fullName,
      senderRole: user!.role,
      text,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`
        },
        body: JSON.stringify({
          conversationId: activeConv.id,
          senderId: user!.id,
          senderName: user!.fullName,
          senderRole: user!.role,
          text
        })
      });
      const data: ChatMessage = await res.json();
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m));
      // Refresh conversation list (to update last message)
      loadConversations();
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setMsgInput(text);
      addToast('মেসেজ পাঠাতে সমস্যা হয়েছে', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find(p => p.id !== user?.id) || conv.participants[0];
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Don't show if not logged in
  if (!user) return null;

  const filteredUsers = publicUsers.filter(u =>
    u.fullName.toLowerCase().includes(searchUser.toLowerCase())
  );

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col items-end gap-3">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="w-[340px] sm:w-[380px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
              style={{ maxHeight: 'min(560px, calc(100dvh - 100px))' }}
            >
              {/* ===== HEADER ===== */}
              <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-sky-600 to-teal-600 text-white shrink-0">
                <div className="flex items-center gap-2.5">
                  {(view === 'chat' || view === 'new') && (
                    <button
                      onClick={() => { setView('list'); setActiveConv(null); }}
                      className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  {view === 'list' && (
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  )}
                  {view === 'chat' && activeConv && (
                    <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center font-bold text-sm uppercase">
                      {getOtherParticipant(activeConv).name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm leading-tight">
                      {view === 'list' && 'Messages'}
                      {view === 'new' && 'New Chat'}
                      {view === 'chat' && activeConv && getOtherParticipant(activeConv).name}
                    </p>
                    {view === 'chat' && activeConv && (
                      <p className="text-[10px] text-sky-100 capitalize">
                        {getOtherParticipant(activeConv).role.toLowerCase()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {view === 'list' && (
                    <button
                      onClick={() => { setSearchUser(''); setView('new'); }}
                      className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition"
                      title="New chat"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-7 h-7 rounded-full hover:bg-white/20 flex items-center justify-center transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ===== CONVERSATION LIST ===== */}
              {view === 'list' && (
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-14 gap-3 px-6 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center">
                        <MessageSquare className="w-7 h-7 text-sky-400" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">কোনো চ্যাট নেই</p>
                        <p className="text-xs text-slate-400 mt-1">
                          + বাটন চাপুন এবং যেকোনো ইউজারের সাথে চ্যাট শুরু করুন
                        </p>
                      </div>
                      <button
                        onClick={() => { setSearchUser(''); setView('new'); }}
                        className="mt-2 px-5 py-2.5 bg-sky-600 text-white text-xs font-bold rounded-xl hover:bg-sky-700 transition"
                      >
                        নতুন চ্যাট শুরু করুন
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {conversations.map(conv => {
                        const other = getOtherParticipant(conv);
                        return (
                          <button
                            key={conv.id}
                            onClick={() => openConversation(conv)}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {other.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-slate-900 text-xs truncate">{other.name}</p>
                                {conv.lastMessageTime && (
                                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                                    {formatTime(conv.lastMessageTime)}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{conv.lastMessage}</p>
                            </div>
                            {conv.unreadCount > 0 && (
                              <span className="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {conv.unreadCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ===== NEW CHAT - USER PICKER ===== */}
              {view === 'new' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-slate-100 shrink-0">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="ইউজার খুঁজুন..."
                        value={searchUser}
                        onChange={e => setSearchUser(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {filteredUsers.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        {publicUsers.length === 0 ? (
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
                            <span>লোড হচ্ছে...</span>
                          </div>
                        ) : (
                          'কোনো ইউজার পাওয়া যায়নি'
                        )}
                      </div>
                    ) : (
                      filteredUsers.map(u => (
                        <button
                          key={u.id}
                          onClick={() => startNewChat(u.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-sky-50 transition text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                            {u.avatarUrl
                              ? <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full object-cover" />
                              : u.fullName.charAt(0).toUpperCase()
                            }
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{u.fullName}</p>
                            <p className="text-[10px] text-slate-500 capitalize mt-0.5">
                              {u.role === 'ADMIN' ? '🛡️ Admin' : u.role === 'DONOR' ? '❤️ Donor' : u.role.toLowerCase()}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ===== CHAT WINDOW ===== */}
              {view === 'chat' && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/60">
                    {messages.length === 0 && (
                      <div className="text-center text-[11px] text-slate-400 py-8">
                        কথোপকথন শুরু করুন 👋
                      </div>
                    )}
                    {messages.map((m, idx) => {
                      const isMe = m.senderId === user?.id;
                      const showTime =
                        idx === 0 ||
                        new Date(m.timestamp).getTime() - new Date(messages[idx - 1].timestamp).getTime() > 300000;
                      return (
                        <div key={m.id}>
                          {showTime && (
                            <div className="text-center text-[10px] text-slate-400 my-2">
                              {formatTime(m.timestamp)}
                            </div>
                          )}
                          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            {!isMe && (
                              <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold mr-1.5 shrink-0 mt-1">
                                {m.senderName.charAt(0)}
                              </div>
                            )}
                            <div
                              className={`max-w-[72%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                                isMe
                                  ? 'bg-gradient-to-br from-sky-500 to-teal-600 text-white rounded-br-sm'
                                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-xs'
                              } ${m.id.startsWith('temp-') ? 'opacity-70' : ''}`}
                            >
                              {m.text}
                              {isMe && (
                                <CheckCheck className={`w-3 h-3 inline ml-1.5 ${m.id.startsWith('temp-') ? 'text-sky-200' : 'text-sky-200'}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <form
                    onSubmit={sendMessage}
                    className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-slate-100 shrink-0"
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      value={msgInput}
                      onChange={e => setMsgInput(e.target.value)}
                      placeholder="মেসেজ লিখুন..."
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-400 focus:bg-white transition"
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={!msgInput.trim() || isSending}
                      className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-teal-600 text-white flex items-center justify-center disabled:opacity-50 hover:shadow-md transition shrink-0"
                    >
                      {isSending
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Send className="w-4 h-4" />
                      }
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            setIsOpen(prev => !prev);
            if (!isOpen) {
              setView('list');
              loadConversations();
            }
          }}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-teal-600 text-white shadow-xl shadow-sky-500/30 flex items-center justify-center relative"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageSquare className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
          {!isOpen && unreadTotal > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white">
              {unreadTotal > 9 ? '9+' : unreadTotal}
            </span>
          )}
        </motion.button>
      </div>
    </>
  );
};

