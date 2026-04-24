import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

const AuthPage: React.FC = () => {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [enableParentAccess, setEnableParentAccess] = useState(false);
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);

    try {
      if (isLogin) {
        // Login Logic (JSON format to match UserLoginSchema)
        const res = await axios.post(`${API_BASE}/api/auth/login`, {
          user_id: userId.trim(),
          password: password
        });
        login(res.data.access_token, res.data.user);
        navigate('/dashboard');
      } else {
        const res = await axios.post(`${API_BASE}/api/auth/signup`, {
          user_id: userId.trim(),
          password: password,
          enable_parent_access: enableParentAccess
        });
        login(res.data.access_token, res.data.user);
        
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Auth Error Details:", err);
      if (err.response) {
        // Backend returned an error response (400, 401, 409, etc)
        const detail = err.response.data?.detail;
        if (typeof detail === 'string') {
          setError(detail);
        } else if (Array.isArray(detail)) {
          setError(detail[0]?.msg || "Validation error occurred.");
        } else {
          setError(t('auth.authFailed'));
        }
      } else if (err.request) {
        // Request was made but no response received (Networking issue)
        setError(t('auth.networkError'));
      } else {
        setError(err.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-core flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-white">
      
      {/* Premium Dynamic Background System */}
      <div className="mesh-canvas" />
      <div className="mesh-blob bg-primary-neon/20 top-[-10%] left-[-10%] w-[800px] h-[800px]" />
      <div className="mesh-blob bg-secondary-neon/15 bottom-[-10%] right-[-10%] w-[600px] h-[600px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full relative z-10"
      >
        {/* Branding */}
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex p-4 rounded-3xl bg-white/[0.03] border border-white/5 mb-6 shadow-2xl"
          >
            <ShieldCheck size={40} className="text-primary-neon animate-pulse" />
          </motion.div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 hero-title">
            {isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}
          </h1>
          <p className="text-zinc-500 font-bold tracking-tight">
            {isLogin ? t('auth.loginDesc') : t('auth.signupDesc')}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-10 border border-white/5 relative overflow-hidden">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-neon/5 blur-[60px] -mr-16 -mt-16" />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name removed for simplicity */}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">{t('auth.userIdLabel')}</label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-primary-neon transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('auth.userIdPlaceholder')}
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary-neon transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">{t('auth.passwordLabel')}</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-primary-neon transition-colors" />
                <input 
                  type="password" 
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-primary-neon transition-all font-bold"
                />
              </div>
            </div>

            {!isLogin && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary-neon/5 border border-secondary-neon/10 cursor-pointer hover:bg-secondary-neon/10 transition-all"
                     onClick={() => setEnableParentAccess(!enableParentAccess)}>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${enableParentAccess ? 'bg-secondary-neon border-secondary-neon' : 'border-white/10'}`}>
                    {enableParentAccess && <div className="w-2 h-2 bg-black rounded-full" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-secondary-neon block">{t('auth.generateParent')}</span>
                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">{t('auth.parentAccessDesc')}</span>
                  </div>
                </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="p-4 rounded-2xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs font-black flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full bg-accent-rose flex items-center justify-center text-white text-[10px]">!</div>
                {error}
              </motion.div>
            )}

            <button 
              type="submit" 
              disabled={authLoading}
              className="glow-btn w-full py-4 text-lg flex items-center justify-center gap-3 group"
            >
              {authLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? t('auth.authorizeBtn') : t('auth.createBtn')}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
            >
              {isLogin ? t('auth.switchSignup') : t('auth.switchLogin')}
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-8 flex items-center justify-center gap-8 text-[9px] uppercase tracking-[0.3em] font-black text-zinc-600">
           {t('auth.securityFooter')}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
