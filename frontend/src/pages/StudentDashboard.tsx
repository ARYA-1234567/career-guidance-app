import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Shield, Copy, Check, LogOut, GraduationCap, 
  ArrowRight, Brain, Clock, Target, Info, Loader2, Zap, Layout
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

import { motion } from 'framer-motion';
import ActivityTimeline from '../components/ActivityTimeline';

const API_BASE = import.meta.env.VITE_API_URL || '';

const StudentDashboard: React.FC = () => {
  const { user, token, logout } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const [profile, setProfile] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE}/api/profiles/latest`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const profileData = res.data.personality;
        setProfile(typeof profileData === 'string' ? JSON.parse(profileData) : profileData);
      } catch (err: any) {
        console.log("No existing profile found or fetch failed.");
      } finally {
        setLoadingProfile(false);
      }
    };
    
    const fetchActivity = async () => {
        if (!token) return;
        try {
            const res = await axios.get(`${API_BASE}/api/user/activity`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setActivities(res.data);
        } catch (err) {
            console.error("Failed to fetch activity journey");
        } finally {
            setLoadingActivity(false);
        }
    };

    fetchProfile();
    fetchActivity();
  }, [token]);

  const calculateProgress = () => {
      let progress = 0;
      if (profile) progress += 25; // Assessment Complete
      if (user?.selected_career) progress += 25; // Career Selected
      if (user?.simulation_state) progress += 25; // Simulation Explored
      // Roadmap progress (mocked for now, or based on activities)
      const taskCompletions = activities.filter(a => a.type === 'task_completed').length;
      progress += Math.min(25, taskCompletions * 5);
      return progress;
  };

  const neuralProgress = calculateProgress();

  const copyParentId = () => {
    if (user?.parent_id) {
      navigator.clipboard.writeText(user.parent_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-core relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background Elements */}
      <div className="mesh-canvas" />
      <div className="mesh-blob bg-primary-neon/10 top-0 left-0 w-[800px] h-[800px]" />
      <div className="mesh-blob bg-secondary-neon/5 bottom-0 right-0 w-[600px] h-[600px]" style={{ animationDelay: '2s' }} />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header Bar */}
        <header className="flex items-center justify-between mb-16 glass-card p-6 border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-neon/20 flex items-center justify-center text-primary-neon shadow-2xl border border-primary-neon/20">
              <GraduationCap size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{t('dashboard.accountType')}</p>
              <h1 className="text-xl font-black text-white">{user?.user_id}</h1>
            </div>
          </div>
          <div className="hidden md:flex flex-col items-end gap-2 pr-10">
             <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{t('dashboard.neuralSync')}</span>
                <span className="text-xs font-black text-primary-neon">{neuralProgress}%</span>
             </div>
             <div className="w-48 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${neuralProgress}%` }}
                    className="h-full bg-gradient-to-r from-primary-neon to-secondary-neon shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                />
             </div>
          </div>
          <button 
            onClick={() => { logout(); navigate('/'); }}
            className="p-3 rounded-2xl bg-white/5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all border border-white/5"
          >
            <LogOut size={20} />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Welcome & Initiate / Profile Section */}
          <div className="lg:col-span-8 space-y-8">
            <div className="glass-card p-12 border-white/5 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-neon/5 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-700" />
              
              <div className="relative z-10">
                {loadingProfile ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-4">
                     <Loader2 size={40} className="text-primary-neon animate-spin" />
                     <p className="text-sm font-black uppercase tracking-[3px] text-zinc-500 animate-pulse">{t('dashboard.syncing')}</p>
                  </div>
                ) : profile ? (
                  <div className="space-y-8 text-left">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary-neon/10 flex items-center justify-center border border-primary-neon/20">
                           <Layout size={24} className="text-primary-neon" />
                        </div>
                        <div>
                           <h2 className="text-3xl font-black text-white leading-tight uppercase tracking-tight">{t('dashboard.profileTitle')} <span className="neon-text">{t('dashboard.profileSpan')}</span></h2>
                           <p className="text-[10px] font-black uppercase tracking-[3px] text-zinc-500">{t('dashboard.recordLabel')}</p>
                        </div>
                     </div>

                     <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-secondary-neon" />
                        <p className="text-sm font-medium text-zinc-300 leading-relaxed italic relative z-10 pl-4 border-l border-white/5">
                            "{profile.analysis || "Profile extraction successful. Your core traits indicate high aptitude for structured problem-solving."}"
                        </p>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[3px] text-primary-neon mb-4 flex items-center gap-2"><Zap size={14} /> {t('dashboard.coreTraits')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {(profile.traits || []).slice(0, 5).map((t: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 rounded-lg bg-primary-neon/10 text-primary-neon border border-primary-neon/20 text-[9px] font-black uppercase tracking-widest">{t}</span>
                                ))}
                            </div>
                         </div>
                         <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[3px] text-emerald-400 mb-4 flex items-center gap-2"><Target size={14} /> {t('dashboard.keySkills')}</h4>
                            <div className="flex flex-wrap gap-2">
                                {(profile.skills || []).slice(0, 5).map((s: string, i: number) => (
                                    <span key={i} className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest">{s}</span>
                                ))}
                            </div>
                         </div>
                     </div>

                    <button 
                      onClick={() => navigate('/results')}
                      className="glow-btn px-10 py-5 text-lg flex items-center gap-4 mt-8"
                    >
                      <Brain size={20} />
                      {user?.selected_career 
                        ? (language === 'ml' ? `${user.selected_career} തുടരുക` : `Resume ${user.selected_career} Trajectory`)
                        : (language === 'ml' ? 'കരിയർ കണ്ടെത്തുക' : 'View Career Trajectories')}
                      <ArrowRight size={18} />
                    </button>

                  </div>
                ) : (
                  <>
                    <div className="inline-flex p-4 rounded-2xl bg-primary-neon/20 text-primary-neon mb-8 border border-primary-neon/30 shadow-2xl">
                    <Sparkles size={32} />
                    </div>
                    <h2 className="text-4xl font-black text-white mb-6 leading-tight"> {t('dashboard.readyHeader')}</h2>
                    <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-xl mb-12">
                    {t('landing.desc')}
                    </p>
                    
                    <button 
                    onClick={() => navigate('/assessment')}
                    className="glow-btn px-10 py-5 text-xl flex items-center gap-4"
                    >
                    <Brain size={24} />
                    {t('dashboard.initiateBtn')}
                    <ArrowRight size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {!profile && !loadingProfile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-8 border-white/5 flex items-start gap-5">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0 border border-orange-500/20">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-white uppercase tracking-tight text-sm mb-1">{t('dashboard.timeEst')}</h4>
                            <p className="text-xs text-zinc-500 font-medium">10-15 minutes processing</p>
                        </div>
                    </div>
                    <div className="glass-card p-8 border-white/5 flex items-start gap-5">
                        <div className="w-12 h-12 rounded-xl bg-secondary-neon/10 flex items-center justify-center text-secondary-neon shrink-0 border border-secondary-neon/20">
                            <Target size={24} />
                        </div>
                        <div>
                            <h4 className="font-black text-white uppercase tracking-tight text-sm mb-1">{t('dashboard.precision')}</h4>
                            <p className="text-xs text-zinc-500 font-medium">8-Agent sequential pipeline</p>
                        </div>
                    </div>
                </div>
            )}
          </div>

          <div className="lg:col-span-4 space-y-8">
            <div className="glass-card p-8 border-white/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-secondary-neon shadow-[0_0_10px_#10b981]" />
                <div className="flex items-center gap-3 mb-8">
                    <Shield size={20} className="text-secondary-neon" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{t('landing.parentTitle')}</h3>
                </div>

                <p className="text-xs text-zinc-500 font-medium mb-8 leading-relaxed">
                  {t('landing.parentDesc')}
                </p>

                <div className="p-6 rounded-2xl bg-secondary-neon/5 border border-secondary-neon/10 mb-6 flex flex-col items-center gap-4 group">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-neon/60">{t('dashboard.parentIdLabel')}</span>
                    <span className="text-3xl font-black text-secondary-neon tracking-[0.2em]">{user?.parent_id || '---'}</span>
                </div>

                <button 
                    onClick={copyParentId}
                    className="w-full py-4 rounded-xl border border-white/5 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all hover:bg-white/5 bg-white/[0.02] text-zinc-400 hover:text-white"
                >
                    {copied ? (
                        <>
                            <Check size={16} className="text-secondary-neon" />
                            {t('dashboard.copied')}
                        </>
                    ) : (
                        <>
                            <Copy size={16} className="" />
                            {t('dashboard.copyId')}
                        </>
                    )}
                </button>
            </div>

            <div className="bg-primary-neon/5 p-6 rounded-2xl border border-primary-neon/10 flex gap-4">
              <Info size={20} className="text-primary-neon shrink-0" />
              <p className="text-[10px] text-zinc-400 font-bold leading-relaxed italic uppercase tracking-wider">
                {t('dashboard.note')}
              </p>
            </div>

            <div className="glass-card p-8 border-white/5">
                <div className="flex items-center gap-3 mb-8">
                    <Clock size={20} className="text-zinc-500" />
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">{t('dashboard.journeyTitle')}</h3>
                </div>
                {loadingActivity ? (
                    <div className="space-y-4 animate-pulse">
                        {[1,2,3].map(i => <div key={i} className="h-12 bg-white/5 rounded-xl w-full" />)}
                    </div>
                ) : (
                    <ActivityTimeline activities={activities} />
                )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
