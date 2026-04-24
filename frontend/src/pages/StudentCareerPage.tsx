import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Target, XCircle, GraduationCap, Zap, 
    MapPin, Award, FlaskConical, Building2, CheckCircle2, Calendar,
    ChevronRight, LineChart, ShieldCheck
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import CareerChatbot from '../components/CareerChatbot';

const API_BASE = import.meta.env.VITE_API_URL || '';

const StudentCareerPage: React.FC = () => {
    const { language, t } = useLanguage();
    const { token } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // States
    const [loading, setLoading] = useState(true);
    const [statusText, setStatusText] = useState(t('results.moduleLoading'));
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'roadmap' | 'schools' | 'exams' | 'grants' | 'myths' | 'market'>('roadmap');
    const [isChatOpen, setIsChatOpen] = useState(false);

    const isTrajectoryView = location.hash === '#trajectory';
    const isSimulationView = location.hash === '#simulation';

    // Status Rotation Logic
    useEffect(() => {
        if (!loading) return;
        
        const statuses = [
            language === 'ml' ? 'ന്യൂറൽ നെറ്റ്‌വർക്കുമായി ബന്ധിപ്പിക്കുന്നു...' : "Establishing Secure Access...",
            language === 'ml' ? 'നിങ്ങളുടെ കരിയർ റോഡ്മാപ്പ് തയ്യാറാക്കുന്നു...' : "Synthesizing Deep Career Roadmap...",
            language === 'ml' ? 'സ്കോളർഷിപ്പുകൾ വിശകലനം ചെയ്യുന്നു...' : "Compiling Strategic Scholarship Database...",
            language === 'ml' ? 'മാർക്കറ്റ് വിവരങ്ങൾ ശേഖരിക്കുന്നു...' : "Syncing with Global Market Intelligence...",
            language === 'ml' ? 'വിവരങ്ങൾ ക്രമീകരിക്കുന്നു...' : "Finalizing Trajectory Alignment..."
        ];
        
        let i = 0;
        const interval = setInterval(() => {
            i = (i + 1) % statuses.length;
            setStatusText(statuses[i]);
        }, 3000);
        
        return () => clearInterval(interval);
    }, [loading, language]);

    // Initial Fetch
    const fetchCareerData = async () => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE}/api/student/career_details?lang=${language}`;
            const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
            
            if (res.data.status === 'ready') {
                setData(res.data);
            }
        } catch (err: any) {
            console.error("Student career fetch failed:", err);
            setError(err.response?.data?.detail || t('studentCareer.establishLink'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchCareerData();
    }, [token]);



    if (loading) {
        return (
            <div className="min-h-screen bg-core flex flex-col items-center justify-center space-y-8 px-6 text-center">
                <div className="mesh-canvas" />
                <div className="w-16 h-16 border-4 border-white/5 border-t-primary-neon rounded-full animate-spin" />
                <h2 className="text-xl font-black hero-title animate-pulse">{statusText}</h2>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-core flex flex-col items-center justify-center p-6 text-center">
                <div className="mesh-canvas" />
                <div className="glass-card p-12 lg:p-20 border-accent-rose/20 max-w-xl w-full">
                    <XCircle size={64} className="text-accent-rose mx-auto mb-10 shadow-2xl" />
                    <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">{t('studentCareer.accessDenied')}</h2>
                    <p className="text-zinc-500 mb-12 font-bold leading-relaxed">{error || t('studentCareer.noProfileMatch')}</p>
                    <button 
                      onClick={() => navigate('/')} 
                      className="glow-btn w-full py-5 uppercase text-xs tracking-widest font-black"
                    >
                      {t('studentCareer.returnHome')}
                    </button>
                </div>
            </div>
        );
    }

    const { 
        selected_career,
        roadmap,
        scholarships,
        myths,
        market,
        personality
    } = data || {};

    return (
        <div className="min-h-screen bg-core text-white font-sans relative overflow-x-hidden pt-32 pb-20 px-6">
            {/* Background Elements */}
            <div className="mesh-canvas" />
            <div className="mesh-blob bg-primary-neon/10 top-0 left-0 w-[800px] h-[800px]" />
            <div className="mesh-blob bg-secondary-neon/5 bottom-0 right-0 w-[600px] h-[600px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                {isSimulationView ? (
                     <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center p-20 glass-card border border-primary-neon/20 mt-10 space-y-8 rounded-[3rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-neon/10 blur-[150px] rounded-full mix-blend-screen opacity-50 pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-secondary-neon/10 blur-[120px] rounded-full mix-blend-screen opacity-50 pointer-events-none" />
                        
                        <div className="w-24 h-24 rounded-full bg-primary-neon/10 flex items-center justify-center border border-primary-neon/30 relative z-10 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                           <Zap size={40} className="text-primary-neon animate-pulse" />
                        </div>
                        <div className="text-center relative z-10">
                            <h2 className="text-4xl font-black text-white mb-4 drop-shadow-lg">{t('studentCareer.projectionBtn')}</h2>
                            <p className="text-zinc-400 font-bold max-w-lg mx-auto leading-relaxed">
                                You are about to initiate the heavy-duty immersive 3D Career Simulation protocol for <span className="text-primary-neon uppercase font-black tracking-widest">{selected_career || "the strategic pathway"}</span>. Because this module requires exclusive rendering priority, it will open in a secured theater tab.
                            </p>
                        </div>
                        <button 
                            onClick={() => window.open(`/simulation/${selected_career || 'General'}`, '_blank')} 
                            className="relative z-10 mt-8 px-12 py-5 rounded-2xl bg-gradient-to-r from-primary-neon to-indigo-500 text-white font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-[0_0_40px_rgba(99,102,241,0.6)] border border-white/20"
                        >
                            {t('studentCareer.projectionBtn')}
                        </button>
                     </motion.div>
                ) : !isTrajectoryView ? (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -20 }} 
                    transition={{ duration: 0.5, ease: 'easeOut' }} 
                    className="flex flex-col items-center justify-center min-h-[60vh] max-w-5xl mx-auto"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full items-center">
                        {/* LEFT: Success Status */}
                        <div className="lg:col-span-7">
                            <div className="glass-card p-12 border-primary-neon/10 bg-primary-neon/[0.02] relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-neon to-transparent opacity-30" />
                                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-neon/5 blur-[80px] rounded-full group-hover:scale-125 transition-transform duration-1000" />
                                
                                <div className="flex items-center gap-8 relative z-10">
                                    <div className="w-20 h-20 rounded-[2rem] bg-primary-neon/10 flex items-center justify-center border border-primary-neon/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                                        <Target size={40} className="text-primary-neon" />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black text-white mb-2 leading-none tracking-tight">Trajectory Complete</h3>
                                        <div className="flex items-center gap-3">
                                            <div className="flex gap-1">
                                                {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-primary-neon animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
                                            </div>
                                            <p className="text-zinc-500 font-bold uppercase text-xs tracking-[0.3em]">{t('dashboard.neuralSync')} 100%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Recommendations Focal Point */}
                        <div className="lg:col-span-5">
                            <div className="glass-card p-10 border-white/5 relative overflow-hidden text-center flex flex-col items-center">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-neon/10 blur-[50px]" />
                                
                                <div className="w-16 h-16 rounded-full bg-secondary-neon/10 border border-secondary-neon/20 flex items-center justify-center text-secondary-neon mb-8 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                                    <ShieldCheck size={28} />
                                </div>
                                
                                <h4 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter leading-tight">Strategic Path<br/><span className="text-secondary-neon">Locked</span></h4>
                                <p className="text-xs font-bold text-zinc-500 mb-10 leading-relaxed max-w-[200px]">
                                    {t('parent.trajectoryLockedDesc')}
                                </p>
                                
                                <button 
                                    onClick={() => {
                                        window.location.hash = 'trajectory'; 
                                        const event = new HashChangeEvent("hashchange");
                                        window.dispatchEvent(event);
                                    }}
                                    className="w-full py-5 rounded-2xl bg-zinc-100 text-zinc-900 border border-white font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                                >
                                    {t('parent.viewTrajectory')}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="lg:col-span-12 w-full space-y-8">
                        {/* NEW SECTION: Selected Career Strategy */}
                        {selected_career && (
                            <div className="glass-card p-12 border-primary-neon/20 relative overflow-hidden bg-primary-neon/[0.02]">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-neon/5 blur-[100px] -mr-32 -mt-32" />
                                
                                <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-12 border-b border-white/5 pb-8">
                                    <MapPin size={20} className="text-primary-neon" /> {t('studentCareer.selectedPath')}: <span className="text-white ml-2">{selected_career}</span>
                                </h3>

                                {/* Strategy Tabs */}
                                <div className="flex flex-wrap gap-4 mb-12 pb-6 border-b border-white/5">
                                    {[
                                        { id: 'roadmap', label: t('roadmap.title'), icon: Calendar },
                                        { id: 'schools', label: t('roadmap.colleges'), icon: GraduationCap },
                                        { id: 'exams', label: t('roadmap.exams'), icon: Target },
                                        { id: 'grants', label: t('studentCareer.grants'), icon: Award },
                                        { id: 'myths', label: t('studentCareer.myths'), icon: FlaskConical },
                                        { id: 'market', label: t('studentCareer.market'), icon: LineChart }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex items-center gap-4 px-8 py-5 rounded-2xl text-xs md:text-sm font-black uppercase tracking-widest transition-all border shadow-lg ${
                                                activeTab === tab.id 
                                                ? 'bg-zinc-100 text-zinc-900 border-white shadow-[0_0_30px_rgba(255,255,255,0.3)] scale-105' 
                                                : 'bg-white/10 text-zinc-300 border-white/20 hover:bg-white/20 hover:text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:border-white/40'
                                            }`}
                                        >
                                            <div className={`${activeTab === tab.id ? 'animate-bounce' : ''}`}>
                                                <tab.icon size={22} className={activeTab === tab.id ? 'text-zinc-900 opacity-90' : 'text-primary-neon opacity-80'} />
                                            </div>
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content Rendering */}
                                <div className="min-h-[400px]">
                                    {activeTab === 'roadmap' && (
                                        <div className="space-y-8">
                                            {(roadmap.phases || []).map((phase: any, i: number) => (
                                                <div key={i} className="flex gap-6">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-8 h-8 rounded-full bg-primary-neon/20 border border-primary-neon/30 flex items-center justify-center text-[10px] font-black text-primary-neon shrink-0">
                                                            {i + 1}
                                                        </div>
                                                        {i < roadmap.phases.length - 1 && <div className="w-px flex-1 bg-white/5 my-2" />}
                                                    </div>
                                                    <div className="flex-1 pb-8">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h5 className="font-black text-white text-lg tracking-tight">{phase.name}</h5>
                                                            <span className="text-[10px] font-bold text-zinc-500 uppercase">{phase.timeline}</span>
                                                        </div>
                                                        <ul className="space-y-2">
                                                            {phase.tasks.map((t: string, ti: number) => (
                                                                <li key={ti} className="text-xs text-zinc-400 flex items-start gap-2 italic">
                                                                    <ChevronRight size={12} className="text-primary-neon mt-0.5 shrink-0" /> {t}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!roadmap.phases || roadmap.phases.length === 0) && (
                                                <div className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">{t('parent.strategyLoading')}</div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'schools' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(roadmap.colleges || []).map((col: any, i: number) => (
                                                <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary-neon/20 transition-all group/card">
                                                    <Building2 size={24} className="text-zinc-700 mb-4 group-hover/card:text-primary-neon transition-colors" />
                                                    <h5 className="font-black text-white text-base mb-1">{col.name}</h5>
                                                    <p className="text-[10px] font-bold text-zinc-500 mb-4 uppercase">{col.program}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded-lg bg-primary-neon/10 text-primary-neon text-[8px] font-black uppercase border border-primary-neon/20">{col.type}</span>
                                                        <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter italic whitespace-nowrap overflow-hidden text-ellipsis">{col.location}</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!roadmap.colleges || roadmap.colleges.length === 0) && (
                                                <div className="col-span-full py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">{t('parent.noSchools')}</div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'exams' && (
                                        <div className="space-y-4">
                                            {(roadmap.entrance_exams || []).map((exam: any, i: number) => (
                                                <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary-neon/30 transition-all">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <h5 className="font-black text-white text-lg tracking-tight">{exam.exam_name}</h5>
                                                        <span className="px-3 py-1 rounded-lg bg-zinc-800 text-[10px] font-black uppercase text-zinc-400">{exam.fees}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 text-[10px] items-center">
                                                        <div className="space-y-1">
                                                            <p className="font-black text-zinc-600 uppercase tracking-tighter border-b border-white/5 pb-1">{t('roadmap.conductedBy')}</p>
                                                            <p className="text-zinc-400 font-bold uppercase">{exam.conducting_body}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="font-black text-zinc-600 uppercase tracking-tighter border-b border-white/5 pb-1">Window</p>
                                                            <p className="text-zinc-400 font-bold uppercase">{exam.application_window}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!roadmap.entrance_exams || roadmap.entrance_exams.length === 0) && (
                                                <div className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">{t('parent.noExams')}</div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'grants' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {scholarships.length > 0 ? scholarships.map((sch: any, i: number) => (
                                                <div key={i} className="p-6 rounded-2xl bg-primary-neon/5 border border-primary-neon/10 hover:border-primary-neon/30 transition-all group/sch">
                                                    <Award size={24} className="text-primary-neon mb-4 group-hover/sch:scale-110 transition-transform" />
                                                    <h5 className="font-black text-white text-base mb-2 tracking-tight leading-tight">{sch.name}</h5>
                                                    <p className="text-[10px] font-bold text-zinc-500 mb-4 uppercase border-b border-white/5 pb-2 line-clamp-2">{sch.description}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-0.5 rounded-lg bg-primary-neon text-black text-[9px] font-black uppercase">{sch.provider}</span>
                                                        <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter">Deadline: {sch.deadline || 'Varies'}</span>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="col-span-full py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
                                                    {t('parent.searchingGrants')}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {activeTab === 'market' && (
                                        <div className="space-y-6">
                                            {market ? (
                                                <div className="p-8 rounded-[2rem] bg-zinc-900 border border-white/5 space-y-6">
                                                   <h5 className="font-black text-white text-lg tracking-tight border-b border-white/5 pb-4">{t('parent.marketOutlook')}</h5>
                                                   <p className="text-sm font-bold text-zinc-400 italic mb-6">{market.market_summary || market.future_outlook || "Analyzing current job market trends..."}</p>
                                                   
                                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-primary-neon/20">
                                                          <h6 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-4">{t('parent.topEmployers')}</h6>
                                                          <ul className="space-y-3">
                                                              {((market.top_employers || []).slice(0, 4)).map((emp: any, i: number) => (
                                                                  <li key={i} className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                                      <span className="text-sm font-black text-white">{emp.name || emp.employer || emp}</span>
                                                                      {emp.type && <span className="text-[10px] text-zinc-500 font-bold uppercase">{emp.type}</span>}
                                                                  </li>
                                                              ))}
                                                              {(!market.top_employers || market.top_employers.length === 0) && (
                                                                  <span className="text-xs text-zinc-500 italic">{t('parent.noEmployers')}</span>
                                                              )}
                                                          </ul>
                                                      </div>
                                                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-primary-neon/20">
                                                          <h6 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-4">{t('parent.salaryEstimates')}</h6>
                                                          <div className="space-y-4">
                                                              {market.salaries ? Object.keys(market.salaries).map((key, i) => (
                                                                  <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                                      <span className="text-[9px] uppercase font-black text-zinc-400">{key.replace('_', ' ')}</span>
                                                                      <span className="text-[10px] font-black text-primary-neon tracking-wider">{market.salaries[key]}</span>
                                                                  </div>
                                                              )) : (
                                                                 <div className="text-zinc-500 uppercase font-black text-[10px]">Data loading...</div>
                                                              )}
                                                          </div>
                                                      </div>
                                                   </div>
                                                </div>
                                            ) : (
                                                <div className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">{t('parent.loadingMarket')}</div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'myths' && (
                                        <div className="space-y-6">
                                            {myths.length > 0 ? myths.map((m: any, i: number) => (
                                                <div key={i} className="p-8 rounded-[2rem] bg-zinc-900 border border-white/5 space-y-4">
                                                    <div className="flex gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                                                            <XCircle size={18} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{t('mythBuster.myth')}</span>
                                                            <p className="text-base text-zinc-400 font-bold italic">"{m.myth}"</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                                            <CheckCircle2 size={18} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">{t('mythBuster.reality')}</span>
                                                            <p className="text-base text-emerald-400 font-black">{m.reality || m.fact}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">{t('parent.loadingMyths')}</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </motion.div>
                )}

                {/* Student Strategy Footer */}
                <div className="mt-32 pt-20 border-t border-white/5 text-center relative z-10">
                    <div className="max-w-4xl mx-auto space-y-12">
                        <div className="w-20 h-20 rounded-3xl bg-primary-neon/10 border border-primary-neon/20 flex items-center justify-center mx-auto text-primary-neon shadow-2xl shadow-primary-neon/20 mb-8">
                            <Target size={40} />
                        </div>
                        <p className="text-2xl md:text-3xl text-white font-black leading-tight tracking-tight">
                            “This strategy is your blueprint for the next decade. <br className="hidden lg:block"/> 
                            Every module is designed to give you an <span className="neon-text">unfair advantage</span> <br className="hidden lg:block" />
                            in the global talent market.”
                        </p>
                        <div className="flex justify-center pt-4">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="px-12 py-5 rounded-[2rem] bg-white/5 border border-white/10 text-zinc-400 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white/10 hover:text-white transition-all shadow-xl hover:shadow-primary-neon/10"
                            >
                                {t('common.dashboard')}
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* AI Career Advisor Chatbot */}
            {selected_career && (
                <CareerChatbot 
                    careerTitle={selected_career}
                    activeSection={activeTab}
                    userProfile={personality}
                    matchScore={85} // Baseline score
                    isOpen={isChatOpen}
                    onOpen={() => setIsChatOpen(true)}
                    onClose={() => setIsChatOpen(false)}
                />
            )}
        </div>
    );
};

export default StudentCareerPage;


