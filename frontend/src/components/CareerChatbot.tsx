import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CareerChatbotProps {
  careerTitle: string;
  activeSection: string;
  userProfile: any;
  matchScore: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  accessId?: string;
}

const WELCOME_MESSAGES: Record<string, Record<string, string>> = {
  'en' : {
    'roadmap': "Hi! 🗺️ I can help you with the roadmap for {career}. Ask me about learning steps, timeline, resources, or anything else!",
    'universities': "Hi! 🎓 Looking for colleges for {career}? Ask me about universities, entrance exams, fees, or Kerala colleges!",
    'schools': "Hi! 🎓 Looking for colleges for {career}? Ask me about universities, entrance exams, fees, or Kerala colleges!",
    'requirements': "Hi! 📋 Want to know what it takes to become a {career}? Ask about skills, degrees, or certifications!",
    'myths': "Hi! 💡 Let's bust some myths about {career}! Ask me anything you've heard that doesn't seem right.",
    'market': "Hi! 📊 Curious about the job market for {career}? Ask about salaries, demand, or Gulf opportunities!",
    'default': "Hi! 🎯 I'm your career advisor for {career}. Ask me anything!"
  },
  'ml': {
    'roadmap': "ഹലോ! 🗺️ {career} കരിയറിനായുള്ള റോഡ്മാപ്പിനെക്കുറിച്ച് ഞാൻ നിങ്ങളെ സഹായിക്കാം. പഠന ഘട്ടങ്ങൾ, സമയക്രമം, വിഭവങ്ങൾ അല്ലെങ്കിൽ മറ്റെന്തിനെക്കുറിച്ചും ചോദിക്കൂ!",
    'universities': "ഹലോ! 🎓 {career} പഠിക്കാൻ നല്ല കോളേജുകൾ തിരയുകയാണോ? സർവ്വകലാശാലകൾ, പ്രവേശന പരീക്ഷകൾ, ഫീസ് അല്ലെങ്കിൽ കേരളത്തിലെ കോളേജുകളെക്കുറിച്ച് ചോദിക്കൂ!",
    'schools': "ഹലോ! 🎓 {career} പഠിക്കാൻ നല്ല കോളേജുകൾ തിരയുകയാണോ? സർവ്വകലാശാലകൾ, പ്രവേശന പരീക്ഷകൾ, ഫീസ് അല്ലെങ്കിൽ കേരളത്തിലെ കോളേജുകളെക്കുറിച്ച് ചോദിക്കൂ!",
    'requirements': "ഹലോ! 📋 ഒരു {career} ആകാൻ എന്തൊക്കെ വേണമെന്ന് അറിയണോ? കഴിവുകൾ, ബിരുദങ്ങൾ അല്ലെങ്കിൽ സർട്ടിഫിക്കേഷനുകളെക്കുറിച്ച് ചോദിക്കൂ!",
    'myths': "ഹലോ! 💡 {career} സംബന്ധിച്ച അബദ്ധധാരണകൾ നമുക്ക് തിരുത്താം! നിങ്ങൾ കേട്ടിട്ടുള്ള എന്തും സംശയിക്കാതെ ചോദിക്കൂ.",
    'market': "ഹലോ! 📊 {career} ജോബ് മാർക്കറ്റിനെക്കുറിച്ച് അറിയാൻ ആഗ്രഹമുണ്ടോ? ശമ്പളം, ഡിമാൻഡ് അല്ലെങ്കിൽ ഗൾഫ് അവസരങ്ങളെക്കുറിച്ച് ചോദിക്കൂ!",
    'default': "ഹലോ! 🎯 ഞാൻ {career} കരിയർ ഉപദേഷ്ടാവാണ്. എന്തും എന്നോട് ചോദിക്കൂ!"
  }
};

const SECTION_LABELS: Record<string, Record<string, string>> = {
  'en': {
    'roadmap': "💬 Ask about Roadmap",
    'universities': "💬 Ask about Schools",
    'schools': "💬 Ask about Schools",
    'requirements': "💬 Ask about Requirements",
    'myths': "💬 Ask about Myths",
    'market': "💬 Ask about Job Market",
    'default': "💬 Ask CareerBot"
  },
  'ml': {
    'roadmap': "💬 റോഡ്മാപ്പിനെക്കുറിച്ച് ചോദിക്കൂ",
    'universities': "💬 സ്കൂളുകളെക്കുറിച്ച് ചോദിക്കൂ",
    'schools': "💬 സ്കൂളുകളെക്കുറിച്ച് ചോദിക്കൂ",
    'requirements': "💬 ആവശ്യകതകളെക്കുറിച്ച് ചോദിക്കൂ",
    'myths': "💬 അബദ്ധങ്ങളെക്കുറിച്ച് ചോദിക്കൂ",
    'market': "💬 ജോബ് മാർക്കറ്റിനെക്കുറിച്ച് ചോദിക്കൂ",
    'default': "💬 കരിയർ ബോട്ടിനോട് ചോദിക്കൂ"
  }
};

const SUGGESTED_ACTIONS: Record<string, Record<string, string[]>> = {
  'en': {
    'schools': ["Show Kerala Colleges", "Entrance Exams", "Fee Structures", "Kerala PSC"],
    'universities': ["Show Kerala Colleges", "Entrance Exams", "Fee Structures", "Kerala PSC"],
    'roadmap': ["Skill Timeline", "Learning Resources", "Job Milestones", "Kerala Opportunities"],
    'default': ["Career Outlook", "Top Employers", "Salary Range", "More Colleges in Kerala"]
  },
  'ml': {
    'schools': ["കേരളത്തിലെ കോളേജുകൾ", "പ്രവേശന പരീക്ഷകൾ", "ഫീസ് വിവരങ്ങൾ", "കേരള PSC"],
    'universities': ["കേരളത്തിലെ കോളേജുകൾ", "പ്രവേശന പരീക്ഷകൾ", "ഫീസ് വിവരങ്ങൾ", "കേരള PSC"],
    'roadmap': ["പഠന ഘട്ടങ്ങൾ", "വിഭവങ്ങൾ", "തൊഴിൽ അവസരങ്ങൾ", "കേരളത്തിലെ അവസരങ്ങൾ"],
    'default': ["കരിയർ സാധ്യതകൾ", "പ്രധാന തൊഴിൽദാതാക്കൾ", "ശമ്പളം", "കേരളത്തിലെ കൂടുതൽ കോളേജുകൾ"]
  }
};

const CareerChatbot: React.FC<CareerChatbotProps> = ({
  careerTitle,
  activeSection,
  userProfile,
  matchScore,
  isOpen,
  onOpen,
  onClose,
  accessId
}) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCareer = useRef(careerTitle);
  const sectionsVisited = useRef<Set<string>>(new Set());

  // Reset history if career changes
  useEffect(() => {
    if (careerTitle !== prevCareer.current) {
      setMessages([]);
      sectionsVisited.current = new Set();
      prevCareer.current = careerTitle;
    }
  }, [careerTitle]);

  // Handle Context Switch & Welcome Messages
  useEffect(() => {
    if (!activeSection) return;
    
    if (!sectionsVisited.current.has(activeSection)) {
      const template = WELCOME_MESSAGES[language]?.[activeSection] || WELCOME_MESSAGES[language]?.['default'];
      const welcome = template.replace(/{career}/g, careerTitle);
      
      setMessages(prev => [...prev, { role: 'assistant', content: welcome }]);
      sectionsVisited.current.add(activeSection);
      
      if (!isOpen) {
        setUnreadCount(prev => prev + 1);
      }
    }
  }, [activeSection, careerTitle, isOpen, language]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMsg]);
    if (!customInput) setInput("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/career-chatbot`, {
        messages: [...messages, userMsg],
        career_title: careerTitle,
        active_section: activeSection || "General",
        user_profile: userProfile || {},
        match_score: matchScore,
        user_category: accessId ? "Parent" : "Student",
        language: language,
        access_id: accessId || ""
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      const errorMsg = language === 'ml' 
        ? "ക്ഷമിക്കണം, എനിക്ക് കണക്ഷൻ ലഭിക്കുന്നില്ല. ദയവായി അല്പം കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കൂ." 
        : "I'm having trouble connecting to my neural core. Please try again in a moment.";
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    sectionsVisited.current = new Set();
    const template = WELCOME_MESSAGES[language]?.[activeSection] || WELCOME_MESSAGES[language]?.['default'];
    const welcome = template.replace(/{career}/g, careerTitle);
    setMessages([{ role: 'assistant', content: welcome }]);
    sectionsVisited.current.add(activeSection);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
        {!isOpen && unreadCount > 0 && (
          <div className="absolute -top-2 -right-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 animate-bounce">
            {unreadCount}
          </div>
        )}
        
        <button
          onClick={() => {
            onOpen();
            setUnreadCount(0);
          }}
          className={`flex items-center gap-3 px-6 py-4 rounded-full bg-[#1a1a1a] border border-green-500/30 text-white shadow-[0_0_20px_rgba(34,197,94,0.15)] hover:shadow-[0_0_30px_rgba(34,197,94,0.25)] transition-all group scale-100 hover:scale-105 active:scale-95 ${isOpen ? 'hidden' : ''}`}
        >
          <div className="relative">
            <MessageSquare size={20} className="text-green-500 group-hover:animate-pulse" />
            <div className="absolute inset-0 bg-green-500 blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
          </div>
          <span className="text-sm font-bold tracking-tight whitespace-nowrap">
            {SECTION_LABELS[language]?.[activeSection] || SECTION_LABELS[language]?.['default']}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-[90px] right-6 w-[380px] h-[520px] bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl z-[100] flex flex-col overflow-hidden backdrop-blur-xl"
          >
            <div className="p-6 bg-white/[0.03] border-b border-white/5 flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-green-500 uppercase tracking-widest">CareerBot AI</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-white truncate max-w-[200px]">
                  {careerTitle} • <span className="text-zinc-500 capitalize">{activeSection || 'General'}</span>
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={clearChat}
                  className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-red-400 transition-colors"
                  title={t('common.retry')}
                >
                  <Trash2 size={16} />
                </button>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth custom-scrollbar"
            >
              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                      ? 'bg-green-600 text-white rounded-tr-none shadow-lg shadow-green-900/20'
                      : 'bg-[#1a1a1a] border border-white/5 text-zinc-300 rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {/* Suggested Actions */}
              {!loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                <div className="flex flex-wrap gap-2 px-2 pb-2">
                  {(SUGGESTED_ACTIONS[language]?.[activeSection] || SUGGESTED_ACTIONS[language]?.['default']).map((action, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(action)}
                      className="px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold hover:bg-green-500/20 transition-all"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#1a1a1a] border border-white/5 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-white/[0.03] border-t border-white/5">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={t('assessment.placeholder')}
                  className="w-full bg-[#111] border border-white/10 rounded-xl px-5 py-3 pr-14 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all placeholder:text-zinc-600"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className={`absolute right-2 p-2 rounded-lg transition-all ${
                    input.trim() && !loading 
                    ? 'text-green-500 hover:bg-green-500/10' 
                    : 'text-zinc-700'
                  }`}
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
              <p className="mt-3 text-[10px] text-zinc-600 text-center uppercase tracking-widest font-black">
                {t('assessment.poweredBy')}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CareerChatbot;
