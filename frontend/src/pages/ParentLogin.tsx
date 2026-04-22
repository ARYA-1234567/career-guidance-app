import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, Loader2, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const ParentLogin: React.FC = () => {
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const res = await axios.post(`${API_BASE}/api/auth/parent/login`, {
        parent_id: parentId.trim()
      });
      // Store token and user (which will have role: 'parent')
      login(res.data.access_token, res.data.user);
      navigate('/parent-dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || t('parentLogin.invalidCreds'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-core flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-white">
      <div className="mesh-canvas" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full relative z-10"
      >
        <div className="text-center mb-10">
          <div className="inline-flex p-4 rounded-3xl bg-white/[0.03] border border-white/5 mb-6 shadow-2xl">
            <ShieldCheck size={40} className="text-secondary-neon" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">{t('parentLogin.guardianPortal')}</h1>
          <p className="text-zinc-500 font-bold tracking-tight">{t('parentLogin.secureAccess')}</p>
        </div>

        <div className="glass-card p-10 border border-white/5">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">{t('parentLogin.studentId')}</label>
              <div className="relative group">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-secondary-neon transition-colors" />
                <input 
                  type="text" 
                  placeholder={t('parentLogin.placeholder')}
                  value={parentId}
                  onChange={e => setParentId(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-secondary-neon transition-all font-bold"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-accent-rose/10 border border-accent-rose/20 text-accent-rose text-xs font-black">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="glow-btn-secondary w-full py-4 text-lg flex items-center justify-center gap-3 group"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  {t('parentLogin.enterBtn')}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <button 
              onClick={() => navigate('/auth')}
              className="text-zinc-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
            >
              {t('parentLogin.backBtn')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ParentLogin;
