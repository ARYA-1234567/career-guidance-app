import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Star, Target, LogOut, Info, Briefcase, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const ParentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const res = await axios.get(`${API_BASE}/api/parent/lookup/${user.parent_id}?pin=${user.parent_pin || ''}`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load student data", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-core flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-secondary-neon border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-core text-white font-sans p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6 bg-white/[0.02] p-8 rounded-[40px] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-neon/5 blur-[80px] -mr-32 -mt-32" />
          
          <div className="flex items-center gap-6">
            <div className="p-5 rounded-3xl bg-secondary-neon/10 border border-secondary-neon/20 shadow-2xl">
              <ShieldCheck className="text-secondary-neon" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight tracking-tight">{t('parentDashboard.guardianPortal')}</h1>
              <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em]">{t('parentDashboard.readOnlyAccess')}</p>
            </div>
          </div>

          <button 
            onClick={() => { logout(); navigate('/parent-login'); }}
            className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest flex items-center gap-3"
          >
            <LogOut size={16} /> {t('parentDashboard.exitMode')}
          </button>
        </header>

        {data?.status === 'ready' ? (
          <div className="space-y-12">
            
            {/* Student Top Bar */}
            <motion.div 
               initial={{ opacity: 0, y: -20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex items-center justify-between p-8 rounded-[35px] bg-white/[0.03] border border-white/5"
            >
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-secondary-neon/20 flex items-center justify-center border border-secondary-neon/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                     <User size={30} className="text-secondary-neon" />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black text-white">{data.student_summary.name}</h2>
                     <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.3em]">{data.student_summary.education_level}</p>
                  </div>
               </div>
               
               {data.selected_career ? (
                 <div className="text-right hidden md:block">
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-zinc-600 mb-1">{t('parentDashboard.chosenTrajectory')}</p>
                    <p className="text-lg font-black text-secondary-neon">{data.selected_career}</p>
                 </div>
               ) : (
                 <div className="px-6 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                    {t('parentDashboard.selectionPending')}
                 </div>
               )}
            </motion.div>

            {/* TRIPLE PORTAL GRID */}
            {data.selected_career ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { 
                    id: 'details', 
                    label: language === 'ml' ? 'കരിയർ വിശദാംശങ്ങൾ' : 'Career Details', 
                    icon: Briefcase, 
                    color: 'text-emerald-400', 
                    bg: 'bg-emerald-500/10', 
                    border: 'border-emerald-500/20',
                    desc: t('parentDashboard.detailsDesc'),
                    path: '/results' 
                  },
                  { 
                    id: 'simulation', 
                    label: language === 'ml' ? 'കരിയർ സിമുലേഷൻ' : 'Career Simulation', 
                    icon: Zap, 
                    color: 'text-violet-400', 
                    bg: 'bg-violet-500/10', 
                    border: 'border-violet-500/20',
                    desc: t('parentDashboard.simulationDesc'),
                    path: `/simulation/${encodeURIComponent(data.selected_career)}` 
                  },
                  { 
                    id: 'roadmap', 
                    label: language === 'ml' ? 'സ്ട്രാറ്റജിക് റോഡ്‌മാപ്പ്' : 'Strategic Roadmap', 
                    icon: Target, 
                    color: 'text-rose-400', 
                    bg: 'bg-rose-500/10', 
                    border: 'border-rose-500/20',
                    desc: t('parentDashboard.roadmapDesc'),
                    path: '/results' 
                  }
                ].map((portal, idx) => (
                  <motion.button
                    key={portal.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    whileHover={{ scale: 1.02, y: -10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (portal.id === 'details') {
                         navigate(portal.path, { state: { parentView: true, parentId: user?.parent_id, pin: user?.parent_pin, career: data.selected_career } });
                      } else {
                         navigate(portal.path);
                      }
                    }}
                    className="group relative flex flex-col items-center text-center p-10 rounded-[45px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all overflow-hidden"
                  >
                    <div className={`absolute inset-0 ${portal.bg} opacity-0 group-hover:opacity-20 blur-3xl transition-opacity`} />
                    
                    <div className={`w-20 h-20 rounded-3xl ${portal.bg} flex items-center justify-center mb-8 border ${portal.border} shadow-2xl transition-transform group-hover:rotate-6`}>
                      <portal.icon size={36} className={portal.color} />
                    </div>

                    <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">{portal.label}</h3>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed max-w-[200px] mb-8">{portal.desc}</p>
                    
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-neon group-hover:gap-5 transition-all">
                       {t('parentDashboard.enterPortal')} <ArrowRight size={14} />
                    </div>
                  </motion.button>
                ))}
              </div>
            ) : (
               <div className="p-20 rounded-[50px] bg-amber-500/5 border border-dashed border-amber-500/20 text-center">
                  <Info size={48} className="text-amber-500 mx-auto mb-6 opacity-50" />
                  <h3 className="text-2xl font-black text-white mb-2">{t('parentDashboard.selectionInProgress')}</h3>
                  <p className="text-zinc-500 max-w-md mx-auto font-medium">{t('parentDashboard.unlockOnceChosen')}</p>
               </div>
            )}

            {/* AI Insights Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="p-10 rounded-[45px] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Target size={120} />
                  </div>
                  <h4 className="text-[10px] font-black uppercase tracking-[4px] text-zinc-600 mb-8 border-l-2 border-secondary-neon pl-4">{t('parentDashboard.neuralProfile')}</h4>
                  <div className="space-y-6 relative z-10">
                     <p className="text-lg text-zinc-300 font-medium leading-relaxed">"{data.logic_explanation}"</p>
                  </div>
               </div>

               <div className="p-10 rounded-[45px] bg-secondary-neon/5 border border-secondary-neon/10 flex flex-col justify-center">
                  <h4 className="text-[10px] font-black uppercase tracking-[4px] text-zinc-600 mb-8 flex items-center gap-3">
                     <Star size={16} className="text-secondary-neon" /> {t('parentDashboard.guardianActionPlan')}
                  </h4>
                  <p className="text-xl text-white font-black leading-tight mb-6 italic">
                     "{t('parentDashboard.focusOn')}{data.student_summary.skills[0] || t('dashboard.keySkills')}{t('parentDashboard.whileSupporting')}{data.student_summary.interests[0] || t('dashboard.coreTraits')}."
                  </p>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">— {t('parentDashboard.aiGuardianAsst')}</p>
               </div>
            </div>

          </div>
        ) : (
          <div className="text-center p-20 glass-card bg-rose-500/5 border border-rose-500/10 rounded-[50px]">
             <h2 className="text-2xl font-black text-rose-500 mb-4 uppercase tracking-widest">{t('parentDashboard.diagnosticIncomplete')}</h2>
             <p className="text-zinc-500 font-bold">{t('parentDashboard.profileIncompleteDesc')}</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default ParentDashboard;
