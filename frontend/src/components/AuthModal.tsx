import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, User, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GenderSelectionModal from './GenderSelectionModal';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'login' }) => {
  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [enableParentAccess, setEnableParentAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [authData, setAuthData] = useState<any>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const payload = {
        user_id: userId.trim(),
        password: password,
        enable_parent_access: tab === 'signup' ? enableParentAccess : false
      };

      const res = await axios.post(`${API_BASE}${endpoint}`, payload);
      login(res.data.access_token, res.data.user);
      
      setAuthData(res.data);
      
      // If gender is already set, skip the modal
      if (res.data.user.gender) {
        onClose();
        navigate('/mode-selection');
      } else {
        setShowGenderModal(true);
      }
    } catch (err: any) {
      if (!err.response) {
        setError("Network error: The guidance engine is currently restarting or offline. Please wait 10 seconds and try again.");
      } else {
        setError(err.response?.data?.detail || err.response?.data?.error || err.response?.data?.message || "Authentication failed. Please check your credentials.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenderSelect = async (gender: string) => {
    try {
      if (!authData) return;
      
      // Save gender to profile
      await axios.post(`${API_BASE}/api/user/profile`, { gender }, {
        headers: { Authorization: `Bearer ${authData.access_token}` }
      });
      
      setShowGenderModal(false);
      onClose();
      navigate('/mode-selection');
    } catch (err) {
      console.error("Failed to save gender:", err);
      // Even if it fails, let them proceed (non-blocking)
      setShowGenderModal(false);
      onClose();
      navigate('/mode-selection');
    }
  };

  return (
    <>
      <AnimatePresence>
        {(isOpen && !showGenderModal) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-zinc-950/90 backdrop-blur-3xl rounded-[2rem] w-full max-w-sm shadow-2xl relative z-10 overflow-hidden border border-white/10"
            >
              {/* Header / Tabs */}
              <div className="flex border-b border-white/5">
                <button 
                  onClick={() => setTab('login')}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'login' ? 'text-primary-neon bg-white/[0.02]' : 'text-zinc-500 bg-transparent'}`}
                >
                  Login
                </button>
                <button 
                  onClick={() => setTab('signup')}
                  className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'signup' ? 'text-primary-neon bg-white/[0.02]' : 'text-zinc-500 bg-transparent'}`}
                >
                  Signup
                </button>
                <button 
                  onClick={onClose}
                  className="px-4 text-zinc-500 hover:text-white border-l border-white/5"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-8">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary-neon/10 flex items-center justify-center mx-auto mb-4 text-primary-neon border border-primary-neon/20 shadow-2xl shadow-primary-neon/20">
                    <User size={24} />
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">
                    {tab === 'login' ? 'Welcome Back' : 'Join Discovery'}
                  </h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1">User ID</label>
                    <div className="relative group">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-primary-neon transition-colors" />
                      <input 
                        type="text" 
                        placeholder="Enter ID"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary-neon focus:bg-white/[0.08] transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-600 ml-1">Password</label>
                    <div className="relative group">
                      <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-primary-neon transition-colors" />
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary-neon focus:bg-white/[0.08] transition-all font-bold"
                      />
                    </div>
                  </div>

                  {tab === 'signup' && (
                    <button 
                      type="button"
                      onClick={() => setEnableParentAccess(!enableParentAccess)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${enableParentAccess ? 'bg-primary-neon/5 border-primary-neon/30 hover:bg-primary-neon/10' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'}`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${enableParentAccess ? 'bg-primary-neon border-primary-neon shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'border-white/20'}`}>
                        {enableParentAccess && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-black rounded-full" 
                          />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[9px] font-black uppercase tracking-wider transition-colors ${enableParentAccess ? 'text-white' : 'text-zinc-500'}`}>
                          Generate Parent Access
                        </span>
                        <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-tighter">Creates Unique ID & PIN for Guardians</span>
                      </div>
                    </button>
                  )}

                  {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-xl text-[10px] font-bold text-center">
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="glow-btn w-full py-4 flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : (
                      <>
                        {tab === 'login' ? 'Login' : 'Signup'}
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <GenderSelectionModal 
        isOpen={showGenderModal}
        onSelect={handleGenderSelect}
      />
    </>
  );
};

export default AuthModal;
