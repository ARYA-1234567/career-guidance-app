import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, ArrowRight, Loader2, Languages } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface ParsedAIResponse {
  insight: string;
  question: string;
  options: string[];
  isComplete: boolean;
  profileJson?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '';
const AssessmentChat: React.FC = () => {
  const { language, t } = useLanguage();
  const { token, isAuthenticated, user } = useAuth();
  
  // User-specific localStorage key to prevent cross-user data leakage
  const storageKey = `acgs_assessment_${user?.user_id || user?.id || 'guest'}`;
  
  const [messages, setMessages] = useState<Message[]>(() => {
    // Clean up any old global key from before this fix
    localStorage.removeItem('acgs_assessment_history');
    const saved = localStorage.getItem(`acgs_assessment_${user?.user_id || user?.id || 'guest'}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionEnd, setSessionEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);

  const parseUniversalAIResponse = (response: string): ParsedAIResponse => {
    const result: ParsedAIResponse = { insight: '', question: '', options: [], isComplete: false };
    if (!response) return result;

    let cleanText = response;

    // 1. Basic Completion Check
    if (cleanText.includes('PROFILE_COMPLETE') || cleanText.includes('[[FINISH]]')) {
      result.isComplete = true;
      cleanText = cleanText.replace(/\{\}\s*PROFILE_COMPLETE:\s*\{\}/gi, '').replace(/PROFILE_COMPLETE:/gi, '').replace(/\[\[FINISH\]\]/gi, '').trim();
    }

    // 2. Extract Options (Look for anything between << >> or [ ])
    const optionsMatch = cleanText.match(/(?:<<OPTIONS>>|OPTIONS:?\s*\[)([\s\S]*?)(?:<<\/?OPTIONS>>|<\/OPTIONS>>|\]|$)/i);
    if (optionsMatch) {
      const content = optionsMatch[1].trim();
      if (content.includes('|')) {
        result.options = content.split('|').map(o => o.trim()).filter(Boolean);
      } else if (content.includes('\n')) {
        result.options = content.split('\n').map(o => o.trim()).filter(Boolean);
      } else {
        result.options = [content];
      }
      cleanText = cleanText.replace(optionsMatch[0], '').trim();
    }

    // 3. Fallback: If no options found, but we see A. B. C. D. patterns
    if (result.options.length === 0) {
      const alphaOptions = cleanText.match(/[A-D][.:)]\s+[^A-D\n]+/g);
      if (alphaOptions && alphaOptions.length >= 2) {
         result.options = alphaOptions.map(o => o.trim());
      }
    }

    // 4. Smart Fallback for bulleted lists (especially for career names)
    if (result.options.length === 0) {
      // Look for lines or inline bullets starting with * or -
      // This matches both start-of-line bullets and inline space-separated bullets
      const bulletMatches = [...cleanText.matchAll(/(?:\s|^)[*-]\s*([^:\n*]{2,40})(?::|\s*[*-]|$)/g)];
      if (bulletMatches.length >= 2 && bulletMatches.length <= 15) {
          result.options = bulletMatches.map(m => m[1].trim()).filter(opt => opt.length > 2);
      }
    }

    // 5. Clean up tags
    result.question = cleanText.replace(/\[\[(?:QUESTION)?\]\]/gi, '').replace(/\]\]/g, '').trim();

    return result;
  };


  const handleSend = async (text: string = input) => {
    const val = text.trim();
    if (!val || loading) return;

    setCurrentOptions([]); // Clear chips immediately
    const userMsg: Message = { role: 'user', content: val };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language,
          messages: [...messages, userMsg].map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.content
          }))
        })
      });

      if (!response.ok) throw new Error("Stream Failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      
      setMessages(prev => [...prev, { role: 'ai', content: '' }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        aiContent += chunk;
        
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: 'ai', content: aiContent };
          return newMsgs;
        });
      }

      // Final processing after stream ends
      const parsed = parseUniversalAIResponse(aiContent);
      
      setMessages(prev => {
        const newMsgs = [...prev];
        // Store the original content but we will render it cleanly
        newMsgs[newMsgs.length - 1] = { role: 'ai', content: aiContent };
        return newMsgs;
      });
      setCurrentOptions(parsed.options);

      // Strict completion detection (Honor signals or length-based manually)
      const completionSignals = ['[[FINISH]]', 'PROFILE_COMPLETE', 'farewell', 'good luck', 'final outcome'];
      const hasSignal = completionSignals.some(signal => 
        aiContent.toLowerCase().includes(signal.toLowerCase())
      );

      // Presentation Mode: Allow finishing if 15+ messages are reached
      if ((hasSignal && messages.length >= 10) || messages.length >= 40) {
        setSessionEnd(true);
        setCurrentOptions([]); // Stop the user from looping
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: "Connection interrupted. Please type again." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    }
  }, [messages, storageKey]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg = language === 'ml' 
        ? "സ്വാഗതം! ഞാൻ നിങ്ങളുടെ AI കരിയർ കൗൺസിലർ ആണ് 🎯\nനിങ്ങളുടെ കരിയർ കണ്ടെത്താൻ ഞാൻ 20-25 ഗഹനമായ ചോദ്യങ്ങൾ ചോദിക്കും. നമുക്ക് തുടങ്ങാം — നിങ്ങൾ ആരാണെന്ന് താഴെ പറയുന്നവയിൽ നിന്നും തിരഞ്ഞെടുക്കുക?\n\nA. സ്കൂൾ വിദ്യാർത്ഥി\nB. കോളേജ് വിദ്യാർത്ഥി\nC. പോസ്റ്റ് ഗ്രാജ്വേറ്റ്\nD. ജോലി ചെയ്യുന്ന വ്യക്തി\n\n<<OPTIONS>> A. സ്കൂൾ വിദ്യാർത്ഥി | B. കോളേജ് വിദ്യാർത്ഥി | C. പോസ്റ്റ് ഗ്രാജ്വേറ്റ് | D. ജോലി ചെയ്യുന്ന വ്യക്തി <</OPTIONS>>"
        : "Welcome! I am CareerBot, your AI Career Counselor 🎯\nI will ask you 20-25 deep questions to discover your perfect career. Let us start — which category best describes you right now?\n\nA. School Student\nB. College Student\nC. Post Graduate\nD. Working Professional\n\n<<OPTIONS>> A. School Student | B. College Student | C. Post Graduate | D. Working Professional <</OPTIONS>>";
      
      const parsed = parseUniversalAIResponse(welcomeMsg);
      setMessages([{ role: 'ai', content: welcomeMsg }]);
      setCurrentOptions(parsed.options);
    }
  }, [language]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleComplete = async () => {
    const navState = { history: messages };
    if (isAuthenticated) {
      setSaving(true);
      try {
          await axios.post(`${API_BASE}/api/profiles/save`, 
              { history: messages },
              { headers: { Authorization: `Bearer ${token}` }}
          );
          localStorage.removeItem(storageKey); // Clear on success
      } catch (error) {
          console.error("Save failure:", error);
      } finally {
          setSaving(false);
      }
    }
    navigate('/results', { state: navState });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-core font-sans">
      <div className="mesh-canvas" />

      <header className="p-8 border-b border-white/5 flex flex-col gap-6 bg-surface/50 backdrop-blur-3xl z-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-neon/5 blur-[100px] pointer-events-none"></div>
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-neon/10 flex items-center justify-center border border-primary-neon/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <Bot size={32} className="text-primary-neon" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-3xl font-black hero-title leading-tight tracking-tight">{t('assessment.title')}</h2>
              <div className="flex items-center gap-2.5 mt-1.5">
                <div className="w-2 h-2 rounded-full bg-secondary-neon animate-pulse shadow-[0_0_10px_#10b981]"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  {Math.min(100, Math.round((messages.length / 25) * 100))}% {t('assessment.percentComplete')} // {Math.max(0, 25 - Math.floor(messages.length))} {t('assessment.remaining')}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (window.confirm(t('assessment.startOverConfirm'))) {
                  window.location.reload();
                }
              }}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black tracking-widest hover:bg-white/10 transition-all uppercase"
            >
              {t('assessment.restart')}
            </button>
            <div className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-sm font-black tracking-widest flex items-center gap-3">
              <Languages size={18} className="text-primary-neon" /> 
              <span className="opacity-80">{language === 'en' ? 'ENGLISH' : 'മലയാളം'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 px-2">
          {[
            { id: 'background', label: 'Identity' },
            { id: 'discovery', label: 'Interests' },
            { id: 'values', label: 'Skills' },
            { id: 'skills', label: 'Finalizing' }
          ].map((item, idx) => {
            const milestoneCount = messages.length;
            const active = idx * 6 <= milestoneCount;
            return (
              <div key={item.id} className="space-y-2">
                <div className={`h-1.5 rounded-full transition-all duration-700 ${active ? 'bg-secondary-neon shadow-[0_0_15px_#10b981]' : 'bg-white/5'}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest block text-center ${active ? 'text-secondary-neon' : 'text-text-muted'}`}>
                  {language === 'ml' ? (item.id === 'background' ? 'വിഭാഗം' : item.id === 'discovery' ? 'താല്പര്യം' : item.id === 'values' ? 'കഴിവുകൾ' : 'പൂർത്തിയായി') : item.label}
                </span>
              </div>
            );
          })}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth relative z-0">
        <div className="max-w-4xl mx-auto space-y-12 pb-12">
          <AnimatePresence initial={false}>
            {messages.slice(-30).map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-6 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-14 h-14 rounded-2xl shadow-2xl flex flex-center shrink-0 border border-white/10 overflow-hidden relative group ${msg.role === 'ai' ? 'bg-core' : 'bg-primary-neon'}`}>
                   {msg.role === 'ai' ? (
                     <>
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-600/20"></div>
                      <Bot size={28} className="text-primary-neon relative z-10" />
                     </>
                   ) : (
                     <User size={28} color="white" />
                   )}
                </div>
                <div className={`p-0 ${msg.role === 'user' ? 'user-bubble text-white max-w-[80%] p-8' : 'max-w-[85%] text-text-dim'}`}>
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <div className="space-y-4">
                      {(() => {
                        const parsed = parseUniversalAIResponse(msg.content);
                        return (
                          <>
                            {/* Discovery Insight block removed for minimalist UI */}
                            {parsed.question && (
                              <div className="ai-bubble p-8 border-white/10 glass-card">
                                {parsed.question}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading bubble removed for presentation stability */}

          {sessionEnd && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="glass-card p-16 text-center space-y-10 bg-emerald-500/[0.03] border-emerald-500/30 shadow-[0_0_100px_rgba(16,185,129,0.1)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"></div>
              <div className="w-28 h-28 rounded-full bg-secondary-neon/10 flex items-center justify-center mx-auto border-2 border-secondary-neon/30 mb-4 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <ArrowRight size={56} className="text-secondary-neon animate-pulse" />
              </div>
              <div className="space-y-4">
                <h3 className="text-5xl font-black hero-title tracking-tight text-white">{t('assessment.complete')}</h3>
                <div className="h-1 w-24 bg-secondary-neon mx-auto rounded-full"></div>
                <p className="text-zinc-400 text-xl max-w-xl mx-auto leading-relaxed font-medium">
                  {language === 'ml' 
                    ? 'വിശകലനം വിജയകരമായി പൂർത്തിയായി. നിങ്ങളുടെ കരിയർ പാത തയ്യാറാണ്.' 
                    : 'Neural profiling is successful. Your comprehensive career roadmap has been synthesized.'}
                </p>
              </div>
              <button 
                onClick={handleComplete}
                disabled={saving}
                className="group relative overflow-hidden bg-emerald-600 hover:bg-emerald-500 transition-all w-full max-w-lg py-6 text-2xl font-black rounded-[2rem] flex items-center justify-center gap-4 mx-auto shadow-2xl shadow-emerald-500/20 active:scale-[0.98]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/10 to-emerald-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {saving ? (
                    <>
                        <Loader2 className="animate-spin" size={28} />
                        <span className="tracking-widest uppercase text-sm">{t('assessment.saving')}</span>
                    </>
                ) : (
                    <>
                      <span className="tracking-tight">{t('assessment.revealBtn')}</span>
                      <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
                    </>
                )}
              </button>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>
      </main>

      <footer className="w-full p-8 bg-gradient-to-t from-core via-core/95 to-transparent z-10 border-t border-white/5 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {!loading && !sessionEnd && currentOptions.length > 0 && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 scroll-smooth"
            >
              {currentOptions.length > 0 ? (
                currentOptions.map((opt) => {
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSend(opt)}
                      className="quick-chip select-none whitespace-normal text-left sm:whitespace-nowrap bg-white/5 border border-white/10 text-white rounded-2xl px-6 py-4 transition-all font-semibold hover:bg-emerald-500 hover:border-emerald-500 hover:scale-[1.02] active:scale-95 shrink-0 shadow-lg backdrop-blur-md max-w-[280px] sm:max-w-none break-words"
                      style={{
                        cursor: 'pointer',
                        fontSize: '15px',
                        lineHeight: '1.4',
                        fontFamily: "'Inter', sans-serif"
                      }}
                    >
                      {opt}
                    </button>
                  );
                })
              ) : (
                <div className="text-white/30 text-sm italic py-4 px-4 w-full text-center font-medium">
                  Type your custom answer below...
                </div>
              )}
            </motion.div>
          )}

          <div className="relative flex items-center group">
            <input
              type="text"
              className="w-full bg-white/[0.03] border border-white/10 rounded-3xl py-6 px-10 focus:outline-none focus:border-primary-neon focus:bg-white/[0.05] transition-all pr-24 text-white text-xl shadow-3xl backdrop-blur-3xl tracking-tight"
              placeholder={sessionEnd ? (language === 'ml' ? "അസസ്‌മെന്റ് പൂർത്തിയായി" : "Assessment Locked") : t('assessment.placeholder')}
              value={input}
              disabled={loading || sessionEnd}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend(input);
              }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || loading || sessionEnd}
              className="absolute right-4 p-4 bg-primary-neon hover:scale-105 disabled:opacity-50 disabled:grayscale rounded-2xl transition-all text-white shadow-2xl shadow-primary-neon/30 active:scale-95"
            >
              <Send size={28} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AssessmentChat;
