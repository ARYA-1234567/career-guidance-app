import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, CheckCircle2, ArrowLeft, Loader2, BookOpen, Award, DollarSign, ChevronRight, GraduationCap, Building2, ChevronDown, School, Target, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface Phase {
  name: string;
  timeline: string;
  tasks: string[];
  milestone: string;
  resources?: string[];
}

interface WeeklyPlan {
  week: number;
  topic: string;
  tasks: string[];
  resource?: string;
}

interface EntranceExam {
  exam_name: string;
  conducting_body: string;
  frequency: string;
  eligibility: string;
  application_window: string;
  fees: string;
}

interface College {
  name: string;
  type: string;
  program: string;
  location: string;
  ranking_note?: string;
}

interface RoadmapData {
  career: string;
  phases: Phase[];
  weekly_plan: WeeklyPlan[];
  local_institutions: string[];
  estimated_cost?: string;
  key_certifications?: string[];
  entrance_exams?: EntranceExam[];
  colleges?: College[];
}

interface CareerMatch {
  career: string;
  reason: string;
  feasibility: number;
  salary_range: string;
  local_demand: string;
  hubs: string[];
}

const RoadmapPage: React.FC = () => {
  const { state } = useLocation();
  const profile = state?.profile || {};
  const matches: CareerMatch[] = state?.matches || [];
  const navigate = useNavigate();
  const { selectedCareer: globalSelectedCareer } = useAuth();
  const { language, t } = useLanguage();

  const [selectedCareer, setSelectedCareer] = useState<string | null>(
    globalSelectedCareer || (matches.length > 0 ? matches[0].career : null)
  );
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  
  // State for affiliated colleges expansion
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [affiliatedColleges, setAffiliatedColleges] = useState<any[]>([]);
  const [expansionLoading, setExpansionLoading] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'long' | 'weekly'>('long');
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmap = async (career: string) => {
    setLoading(true);
    setError(null);
    setRoadmap(null);
    setExpandedIdx(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/roadmaps/generate`, {
        career,
        profile,
        language
      });
      const parsed = data.roadmap;
      setRoadmap(parsed);
    } catch (err: any) {
      console.error("Roadmap generation failed:", err);
      setError(language === 'ml' ? "റോഡ്മാപ്പ് നിർമ്മിക്കുന്നതിൽ പരാജയപ്പെട്ടു. ദയവായി വീണ്ടും ശ്രമിക്കുക." : "Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAffiliated = async (university: string, program: string, index: number) => {
    if (expandedIdx === index) {
      setExpandedIdx(null);
      return;
    }

    setExpandedIdx(index);
    setAffiliatedColleges([]);
    setExpansionLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/colleges/lookup`, {
        university,
        course: program,
      });
      const data = response.data.colleges;
      
      setAffiliatedColleges(data.colleges || data);
    } catch (err) {
      console.error("Failed to fetch affiliated colleges:", err);
    } finally {
      setExpansionLoading(false);
    }
  };


  useEffect(() => {
    if (!selectedCareer) {
      navigate('/results');
      return;
    }
    fetchRoadmap(selectedCareer);
  }, [selectedCareer]);

  return (
    <div className="min-h-screen bg-core text-white font-sans relative overflow-x-hidden pt-32 pb-20">
      <div className="mesh-canvas" />
      <div className="mesh-blob bg-emerald-500/10 top-0 left-0 w-[800px] h-[800px]" />
      <div className="mesh-blob bg-primary-neon/5 bottom-0 right-0 w-[600px] h-[600px]" style={{ animationDelay: '2s' }} />

      <div className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">{t('results.returnBtn')}</span>
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center mb-20 px-6 relative z-10"
        >
          <h1 className="text-6xl md:text-8xl font-black hero-title mb-8 tracking-tighter leading-tight">
            {t('roadmap.title')}
          </h1>
          <p className="text-xl md:text-2xl text-zinc-500 font-medium leading-relaxed max-w-3xl mx-auto mb-12">
            {t('roadmap.subtitle')}
          </p>
        </motion.div>

        {/* Career Selector */}
        {matches.length > 1 && (
          <div className="mb-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">{t('simulation.compare')}</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {matches.map((m) => (
                <button
                  key={m.career}
                  onClick={() => setSelectedCareer(m.career)}
                  className={`px-6 py-3 rounded-2xl text-sm font-bold border whitespace-nowrap transition-all shrink-0 ${
                    selectedCareer === m.career
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                      : 'bg-white/[0.02] border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {m.career}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-16 text-center"
          >
            <Loader2 size={48} className="animate-spin text-emerald-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black mb-2">{t('results.moduleLoading')}</h2>
            <p className="text-zinc-500">{language === 'ml' ? `${selectedCareer} നായുള്ള 24 മാസത്തെ പദ്ധതി തയ്യാറാക്കുന്നു...` : `Building a personalized 24-month plan for ${selectedCareer}...`}</p>
            <div className="mt-6 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-sm mx-auto">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '85%' }}
                transition={{ duration: 6, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}

        {error && (
          <div className="glass-card p-12 text-center">
            <h2 className="text-2xl font-black text-red-400 mb-4">{t('results.linkError')}</h2>
            <p className="text-zinc-400 mb-6">{error}</p>
            <button
              onClick={() => selectedCareer && fetchRoadmap(selectedCareer)}
              className="glow-btn py-3 px-8 rounded-2xl font-bold"
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {/* Roadmap Content */}
        {roadmap && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Career Title */}
            <div className="glass-card p-6 mb-8 border border-emerald-500/10 bg-emerald-500/[0.02]">
              <h2 className="text-2xl font-black text-emerald-400">{roadmap.career}</h2>
              {roadmap.estimated_cost && (
                <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                  <DollarSign size={14} /> {language === 'ml' ? 'കണക്കാക്കിയ ചിലവ്' : 'Estimated Investment'}: {roadmap.estimated_cost}
                </p>
              )}
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-3 mb-8">
              {[
                { id: 'long', label: t('roadmap.masterPlan'), icon: Calendar },
                { id: 'weekly', label: t('roadmap.weeklyLearning'), icon: Clock }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-3 px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all relative ${
                    activeTab === tab.id ? 'text-primary-neon' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 24-Month Plan */}
            {activeTab === 'long' ? (
              <div className="space-y-0">
                {(roadmap.phases || []).map((phase, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6 items-stretch"
                  >
                    {/* Timeline */}
                    <div className="flex flex-col items-center py-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 border-4 border-[#0a0a0c] ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20 z-10">
                        <span className="text-sm font-black text-white">{i + 1}</span>
                      </div>
                      {i !== roadmap.phases.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gradient-to-b from-emerald-500/40 to-zinc-800/40 min-h-[40px]" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="glass-card flex-1 mb-6 hover:border-emerald-500/20 transition-all">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-black text-lg text-emerald-400">
                          {phase.name}
                          <span className="text-zinc-500 font-normal text-sm ml-3">
                            {phase.timeline}
                          </span>
                        </h3>
                      </div>
                      <ul className="mb-5 space-y-2.5">
                        {phase.tasks?.map((t, j) => (
                          <li key={j} className="text-sm text-zinc-400 flex items-start gap-3">
                            <ChevronRight size={14} className="text-emerald-500/50 mt-0.5 shrink-0" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Resources */}
                      {phase.resources && phase.resources.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {phase.resources.map((r, k) => (
                            <span
                              key={k}
                              className="text-xs font-semibold px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-zinc-500"
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Milestone */}
                      <div className="p-4 bg-emerald-500/[0.05] rounded-xl border border-emerald-500/10 flex items-center gap-3">
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                        <div>
                          <span className="text-[10px] text-zinc-600 block uppercase tracking-widest font-bold">
                            {language === 'ml' ? 'ലക്ഷ്യം' : 'Milestone'}
                          </span>
                          <span className="text-sm text-white font-bold">{phase.milestone}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              /* Weekly Plan */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(roadmap.weekly_plan || []).map((w, k) => (
                  <motion.div
                    key={k}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: k * 0.04 }}
                    className="glass-card hover:border-emerald-500/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                        <Calendar size={14} className="text-emerald-500" /> {language === 'ml' ? 'ആഴ്ച' : 'Week'} {w.week}
                      </div>
                      {w.resource && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {w.resource}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-white mb-3">{w.topic}</h4>
                    <ul className="space-y-1.5">
                      {w.tasks?.map((wt, l) => (
                        <li key={l} className="text-xs text-zinc-400 flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-1.5 shrink-0" />
                          {wt}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Entrance Exams */}
            {roadmap.entrance_exams && roadmap.entrance_exams.length > 0 && (
              <div className="mt-10 glass-card bg-red-500/[0.02] border-red-500/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-secondary-neon/10 flex items-center justify-center border border-secondary-neon/20 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                      <Target size={32} className="text-secondary-neon" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tight">{t('roadmap.exams')}</h3>
                      <p className="text-zinc-500 font-medium">{t('roadmap.examsDesc')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  {roadmap.entrance_exams.map((exam, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-red-500/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-black text-white text-lg">{exam.exam_name}</h4>
                        <span className="text-xs font-bold px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 shrink-0 ml-4">
                          {exam.fees}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold block mb-1">{language === 'ml' ? 'നടത്തുന്ന ബോഡി' : 'Conducted By'}</span>
                          <span className="text-zinc-300 font-semibold">{exam.conducting_body}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold block mb-1">{language === 'ml' ? 'ആവർത്തനം' : 'Frequency'}</span>
                          <span className="text-zinc-300 font-semibold">{exam.frequency}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold block mb-1">{language === 'ml' ? 'അപേക്ഷിക്കേണ്ട സമയം' : 'Apply During'}</span>
                          <span className="text-zinc-300 font-semibold">{exam.application_window}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold block mb-1">{language === 'ml' ? 'യോഗ്യത' : 'Eligibility'}</span>
                          <span className="text-zinc-300 font-semibold">{exam.eligibility}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Colleges & Universities */}
            {roadmap.colleges && roadmap.colleges.length > 0 && (
              <div className="mt-6 glass-card bg-cyan-500/[0.02] border-cyan-500/10">
                <h3 className="text-cyan-400 flex items-center gap-3 mb-2 font-black text-xl">
                  <GraduationCap size={22} /> {t('roadmap.colleges')}
                </h3>
                <p className="text-zinc-500 text-sm mb-6">{t('roadmap.collegesDesc')}</p>
                <div className="space-y-3">
                  {roadmap.colleges.map((college, i) => {
                    const isGovt = college.type.toLowerCase().includes('government');
                    const isAided = college.type.toLowerCase().includes('aided');
                    const badgeColor = isGovt
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : isAided
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-4 rounded-xl border transition-all hover:bg-white/[0.02] ${
                          isGovt ? 'border-emerald-500/10 bg-emerald-500/[0.01]' : 'border-white/5'
                        }`}
                      >
                        <div className="flex items-start gap-4 p-4">
                          <Building2 size={20} className={isGovt ? 'text-emerald-500 mt-0.5 shrink-0' : 'text-zinc-600 mt-0.5 shrink-0'} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap mb-1">
                              <h4 className="font-bold text-white">{college.name}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                                {college.type}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-400">{college.program}</p>
                            <div className="flex items-center gap-4 mt-1.5 pb-2">
                              <span className="text-xs text-zinc-500 flex items-center gap-1">
                                <MapPin size={12} /> {college.location}
                              </span>
                              {college.ranking_note && (
                                <span className="text-xs text-zinc-600 italic">{college.ranking_note}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Expandable Footer */}
                        <div 
                          onClick={() => toggleAffiliated(college.name, college.program, i)}
                          className="px-4 py-2 bg-white/[0.02] border-t border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/[0.04] transition-all group/footer"
                        >
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover/footer:text-cyan-400 transition-colors">
                            {expandedIdx === i ? (language === 'ml' ? 'അഫിലിയേറ്റഡ് ലിസ്റ്റ് മറയ്ക്കുക' : 'Hide Affiliated List') : (language === 'ml' ? 'അഫിലിയേറ്റഡ് കോളേജുകൾ കാണുക' : 'View Affiliated Colleges')}
                          </span>
                          {expansionLoading && expandedIdx === i ? (
                            <Loader2 size={12} className="animate-spin text-zinc-500" />
                          ) : (
                            <ChevronDown size={14} className={`text-zinc-600 transition-transform ${expandedIdx === i ? 'rotate-180' : ''}`} />
                          )}
                        </div>

                        {/* Affiliated List Content */}
                        {expandedIdx === i && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            className="bg-black/40 border-t border-white/5"
                          >
                            {expansionLoading ? (
                              <div className="p-10 flex flex-col items-center justify-center gap-3">
                                <School size={20} className="text-zinc-700 animate-bounce" />
                                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{language === 'ml' ? 'അഫിലിയേറ്റഡ് നെറ്റ്‌വർക്ക് തിരയുന്നു...' : 'Searching affiliated network...'}</span>
                              </div>
                            ) : affiliatedColleges.length > 0 ? (
                              <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                {affiliatedColleges.map((aff, ai) => (
                                  <div key={ai} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/30 mt-1.5 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-zinc-200 leading-tight">{aff.name}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold bg-white/5 px-1.5 py-0.5 rounded text-zinc-500 border border-white/5">{aff.type}</span>
                                        <span className="text-[9px] text-zinc-600 truncate">{aff.location}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-6 text-center text-xs text-zinc-600 italic">
                                {language === 'ml' ? 'പ്രത്യേക അഫിലിയേറ്റഡ് ലിസ്റ്റ് കണ്ടെത്തിയില്ല. ദയവായി യൂണിവേഴ്സിറ്റി വെബ്സൈറ്റ് പരിശോധിക്കുക.' : 'No specific affiliated list found. Please check the university website.'}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Key Certifications */}
            {roadmap.key_certifications && roadmap.key_certifications.length > 0 && (
              <div className="mt-6 glass-card bg-amber-500/[0.02] border-amber-500/10">
                <h3 className="text-amber-400 flex items-center gap-3 mb-5 font-black">
                  <Award size={20} /> {t('roadmap.certs')}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {roadmap.key_certifications.map((cert, i) => (
                    <div
                      key={i}
                      className="px-5 py-3 rounded-xl bg-white/[0.03] border border-amber-500/10 hover:border-amber-500/30 transition-all text-sm font-semibold text-zinc-300"
                    >
                      {cert}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Local Institutions */}
            {roadmap.local_institutions && roadmap.local_institutions.length > 0 && (
              <div className="mt-6 glass-card bg-indigo-500/[0.02] border-indigo-500/10">
                <h3 className="text-indigo-400 flex items-center gap-3 mb-5 font-black">
                  <BookOpen size={20} /> {t('roadmap.institutions')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {roadmap.local_institutions.map((inst, m) => (
                    <div
                      key={m}
                      className="px-5 py-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all group flex items-center gap-3"
                    >
                      <MapPin size={16} className="text-zinc-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                      <span className="text-sm font-bold text-zinc-300">{inst}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* No career selected */}
        {!selectedCareer && !loading && (
          <div className="glass-card p-16 text-center">
            <h2 className="text-2xl font-black text-zinc-400 mb-4">{language === 'ml' ? 'കരിയർ തിരഞ്ഞെടുത്തിട്ടില്ല' : 'No Career Selected'}</h2>
            <p className="text-zinc-500 mb-6">{language === 'ml' ? 'ഫലങ്ങളിലേക്ക് തിരികെ പോയി ഒരു കരിയർ തിരഞ്ഞെടുക്കുക.' : 'Go back to results and generate a roadmap for a specific career.'}</p>
            <button
              onClick={() => navigate('/results')}
              className="glow-btn py-3 px-8 rounded-2xl font-bold"
            >
              {t('results.returnBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoadmapPage;
