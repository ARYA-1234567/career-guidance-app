import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Globe, Target, Award, GraduationCap, 
  MapPin, ChevronRight, ChevronDown, CheckCircle2, 
  AlertTriangle, Loader2, Calendar, FlaskConical,
  CreditCard, Building2, Sparkles, Zap, ShieldCheck, Bot, X
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import CareerChatbot from '../components/CareerChatbot';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface CareerMatch {
  career: string;
  reason: string;
  feasibility: number;
  confidence?: number;
  salary_range: string;
  local_demand: string;
  hubs: string[];
  growth_outlook?: string;
  category?: string;
}

interface ProfileData {
  traits: string[];
  interests: string[];
  skills: string[];
  values: string[];
  confidence: number;
  analysis: string;
}

const ResultsPage: React.FC = () => {
  const { state } = useLocation();
  const history = state?.history || [];
  const navigate = useNavigate();
  const { token, isAuthenticated, selectedCareer, setSelectedCareer } = useAuth();
  const { language, t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState(t('assessment.analyzing'));
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [matches, setMatches] = useState<CareerMatch[]>([]);
  type AnalysisType = 'roadmap' | 'schools' | 'exams' | 'myths' | 'market' | 'grants' | 'simulation' | 'skills' | 'feasibility';
  
  const [analyzingMatch, setAnalyzingMatch] = useState<{ index: number, type: AnalysisType } | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [expandedUni, setExpandedUni] = useState<string | null>(null);
  const [affiliatedColleges, setAffiliatedColleges] = useState<any[]>([]);
  const [affiliatedLoading, setAffiliatedLoading] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [chosenPath, setChosenPath] = useState<string | null>(selectedCareer);
  const { focusMode = false } = state || {}; // Directly use state focusMode to avoid unused setter

  const intelligenceModules = [
    { id: 'roadmap',   name: 'Roadmap',    subtitle: 'Step-by-step path', icon: MapPin,      color: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
    { id: 'schools',   name: 'Schools',    subtitle: 'Top Institutions',    icon: GraduationCap, color: 'bg-cyan-500/10',   border: 'border-cyan-500/20',   text: 'text-cyan-400' },
    { id: 'exams',     name: 'Exams',      subtitle: 'Required testing',   icon: Target,        color: 'bg-rose-500/10',   border: 'border-rose-500/20',   text: 'text-rose-400' },
    { id: 'market',    name: 'Market',     subtitle: 'Jobs & Demand',    icon: TrendingUp,   color: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    { id: 'myths',     name: 'Myths',      subtitle: 'Reality VS Fiction', icon: FlaskConical,  color: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400' },
    { id: 'grants',    name: 'Grants',     subtitle: 'Financial Aid',      icon: Award,        color: 'bg-purple-500/10',  border: 'border-purple-500/20',  text: 'text-purple-400' }
  ];

  useEffect(() => {
    if (state?.parentView) {
      fetchParentChildProfile();
      return;
    }

    if (history.length === 0) {
      if (isAuthenticated) {
        if (selectedCareer) {
            setChosenPath(selectedCareer);
            fetchSavedProfile();
        } else {
            fetchSavedProfile();
        }
      } else {
        setLoading(false);
      }
      return;
    }
    runPipeline();
  }, [isAuthenticated, state?.parentView]);

  const fetchParentChildProfile = async () => {
    setLoading(true);
    setStatusText(t('results.statusDownloading'));
    try {
      const { parentId, pin, career } = state;
      const res = await axios.get(`${API_BASE}/api/parent/lookup/${parentId}?pin=${pin}`);
      
      const pData = res.data.personality;
      setProfile(pData);
      
      // If a specific career was passed, we focus on it
      if (career) setChosenPath(career);
      
      const careerMatches: CareerMatch[] = res.data.recommendations || [];
      setMatches(careerMatches);
      
      if (career) {
        setChosenPath(career);
      }
    } catch (err: any) {
      console.error("Parent profile lookup failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedProfile = async () => {
    setLoading(true);
    setStatusText(t('results.statusRetrieving'));
    try {
      const res = await axios.get(`${API_BASE}/api/profiles/latest`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = res.data.personality;
      const parsedProfile = typeof profileData === 'string' ? JSON.parse(profileData) : profileData;
      setProfile(parsedProfile);
      await matchCareersForProfile(parsedProfile);
    } catch (err: any) {
      console.error("Failed to fetch saved profile", err);
      setLoading(false);
    }
  };

  const runPipeline = async () => {
    try {
      setStatusText(t('results.statusExtracting'));
      const chatMessages = history.map((m: any) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content,
      }));

      const personalityRes = await axios.post(`${API_BASE}/api/analyze/personality`, {
        history: chatMessages,
        language: language
      }, { timeout: 30000 });

      const profileData = personalityRes.data.personality;
      const parsedProfile = typeof profileData === 'string' ? JSON.parse(profileData) : profileData;
      setProfile(parsedProfile);
      await matchCareersForProfile(parsedProfile);
    } catch (err: any) {
      console.error('Pipeline error:', err);
      setLoading(false);
    }
  };

  const matchCareersForProfile = async (profileData: ProfileData) => {
    try {
      setLoading(true);
      setStatusText(t('results.statusCrossReferencing'));
      const matchRes = await axios.post(`${API_BASE}/api/careers/match`, {
        profile: profileData,
        language: language
      }, { timeout: 60000 });

      const careerMatches: CareerMatch[] = matchRes.data.matches || [];
      setMatches(careerMatches);
    } catch (err: any) {
      console.error('Matching error:', err);
      // Don't set loading false yet, let the user retry if matches is empty
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedAnalysis = async (match: CareerMatch, index: number, type: AnalysisType) => {
    if (analyzingMatch?.index === index && analyzingMatch?.type === type) {
      setAnalyzingMatch(null);
      return;
    }

    setAnalyzingMatch({ index, type });
    setAnalysisError(null);
    setAnalysisLoading(true);
    setAnalysisData(null);
    setExpandedUni(null);
    
    try {
      const career = match.career;
      let endpoint = "";
      let method = "GET";
      let payload = {};

      switch(type) {
        case 'roadmap': endpoint = `/api/roadmaps/generate`; method = "POST"; payload = { career, profile, language }; break;
        case 'schools': endpoint = `/api/universities/${encodeURIComponent(career)}?language=${language}`; break;
        case 'exams': endpoint = `/api/exams-skills`; method = "POST"; payload = { career, profile, language }; break;
        case 'myths': endpoint = `/api/myths/${encodeURIComponent(career)}?language=${language}`; break;
        case 'market': endpoint = `/api/market-intelligence/${encodeURIComponent(career)}?language=${language}`; break;
        case 'grants': endpoint = `/api/scholarships/${encodeURIComponent(career)}?language=${language}`; break;
        case 'simulation': endpoint = `/api/simulate/trajectory`; method = "POST"; payload = { career, profile, language }; break;
        case 'skills': endpoint = `/api/skill-gap`; method = "POST"; payload = { career, profile, language }; break;
        case 'feasibility': endpoint = `/api/reality-score`; method = "POST"; payload = { career, profile, language }; break;
      }

      const res = method === "POST" 
        ? await axios.post(`${API_BASE}${endpoint}`, payload)
        : await axios.get(`${API_BASE}${endpoint}`);
      
      setAnalysisData(res.data);
    } catch (err: any) {
      console.error(`Detailed analysis fetch failed for ${type}:`, err);
      setAnalysisError(err.response?.data?.detail || err.message || "Unknown Network Error");
    } finally {
      setAnalysisLoading(false);
    }
  };

  const fetchAffiliated = async (university: string, program: string) => {
    if (expandedUni === university) { setExpandedUni(null); return; }
    setExpandedUni(university);
    setAffiliatedLoading(true);
    setAffiliatedColleges([]);
    try {
        const res = await axios.post(`${API_BASE}/api/colleges/lookup`, { university, course: program });
        setAffiliatedColleges(res.data.colleges?.colleges || res.data.colleges || []);
    } catch (err: any) {
        console.error("Affiliated lookup failed:", err);
    } finally {
        setAffiliatedLoading(false);
    }
  };

  const handleChoosePath = async (career: string) => {
    try {
      setSelectedCareer(career);
      // Persist to backend
      if (token) {
        await axios.post(`${API_BASE}/api/user/select-career`, 
          { career }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setChosenPath(career);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Failed to persist career selection", err);
      // Still set local state so UI works
      setChosenPath(career);
    }
  };

  const handleRetry = () => {
    if (profile) {
      matchCareersForProfile(profile);
    } else {
      runPipeline();
    }
  };

  const getDemandColor = (demand: string) => {
    const d = (demand || "").toLowerCase();
    if (d.includes('very high')) return 'text-emerald-400';
    if (d.includes('high')) return 'text-green-400';
    return 'text-zinc-500';
  };

  // --- High-Fidelity Module Renderers ---


  const renderAnalysisContent = () => {
    if (analysisLoading) return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="relative">
          <Loader2 size={48} className="text-primary-neon animate-spin" />
          <div className="absolute inset-0 blur-xl bg-primary-neon/20 animate-pulse"></div>
        </div>
        <p className="text-sm font-black uppercase tracking-[4px] text-zinc-500 animate-pulse">{t('results.moduleLoading')}</p>
      </div>
    );

    if (analysisError) return (
      <div className="p-10 rounded-3xl bg-rose-500/5 border border-rose-500/20 text-center">
        <AlertTriangle size={36} className="text-rose-500 mx-auto mb-4" />
        <p className="text-rose-400 font-bold mb-2">{t('results.linkError')}</p>
        <p className="text-xs text-rose-300/60 uppercase tracking-widest">{analysisError}</p>
      </div>
    );

    if (!analysisData) return null;

    const type = analyzingMatch?.type;

    switch(type) {
      case 'roadmap':
        return (
          <div className="space-y-10 py-6 text-left">
            {(analysisData.roadmap?.phases || analysisData.roadmap || analysisData.phases || analysisData.steps || []).map((step: any, idx: number) => (
              <motion.div 
                key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
                className="relative pl-12 group/step"
              >
                <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10 group-last/step:h-0">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-core border-2 border-primary-neon shadow-[0_0_15px_rgba(99,102,241,0.5)] z-10 transition-transform group-hover/item:scale-125"></div>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 hover:bg-white/[0.05] transition-all hover:border-primary-neon/20">
                  <span className="text-[10px] font-black uppercase tracking-[3px] text-primary-neon mb-3 block">Phase 0{idx + 1} // {step.duration || 'Execution'}</span>
                  <h4 className="text-2xl font-black text-white mb-4 leading-tight">{step.name || step.title || step.task || "Milestone"}</h4>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-6 font-medium italic">"{step.milestone || step.description || step.details || '...'}"</p>
                  
                  {step.prerequisites && (
                    <div className="mb-6">
                      <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-2">{t('details.prerequisites')}</p>
                      <p className="text-xs font-bold text-zinc-400">{Array.isArray(step.prerequisites) ? step.prerequisites.join(', ') : step.prerequisites}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-6">
                    { (step.tasks || step.skills || []).map((s: string) => (
                      <span key={s} className="px-3 py-1 rounded-lg bg-secondary-neon/10 text-secondary-neon text-[9px] font-black uppercase tracking-widest border border-secondary-neon/20">{s}</span>
                    ))}
                  </div>

                  {step.top_learning_platforms && (
                     <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 self-center mr-2">{t('details.platforms')}:</span>
                        {(Array.isArray(step.top_learning_platforms) ? step.top_learning_platforms : [step.top_learning_platforms]).map((pl: string) => (
                           <span key={pl} className="px-2 py-1 rounded-md bg-white/5 text-[8px] font-black uppercase text-primary-neon border border-primary-neon/20">{pl}</span>
                        ))}
                     </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        );

      case 'market':
        return (
          <div className="space-y-12 py-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Demand Index', val: analysisData.local_demand || 'Exponential', icon: Zap, color: 'text-amber-400' },
                { label: 'Remote/Hybrid', val: analysisData.remote_work_viability || 'TBD', icon: Globe, color: 'text-cyan-400' },
                { label: 'Growth Score', val: `${analysisData.market_growth_score || '8'}/10`, icon: TrendingUp, color: 'text-emerald-400' },
                { label: 'PSC Status', val: 'Active', icon: ShieldCheck, color: 'text-primary-neon' }
              ].map(stat => (
                <div key={stat.label} className="bg-white/[0.03] border border-white/5 rounded-3xl p-6 text-center">
                  <stat.icon size={20} className={`${stat.color} mx-auto mb-4`} />
                  <p className="text-[9px] font-black uppercase tracking-[2px] text-zinc-600 mb-1">{stat.label}</p>
                  <p className="text-xl font-black text-white">{stat.val}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8">
                <h4 className="text-xs font-black uppercase tracking-[3px] text-primary-neon mb-8 flex items-center gap-3">
                  <ShieldCheck size={16} /> Kerala PSC & Govt Intake
                </h4>
                <div className="space-y-4">
                  {(analysisData.kerala_psc_opportunities || []).length > 0 ? (
                    analysisData.kerala_psc_opportunities.map((psc: any, idx: number) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-primary-neon/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <h6 className="text-sm font-black text-white">{psc.post_name}</h6>
                          <span className="text-[8px] font-black uppercase text-primary-neon px-2 py-0.5 rounded bg-primary-neon/10 border border-primary-neon/20">Govt</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 mb-2">{psc.department}</p>
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-600">
                          <span>Scale: {psc.salary_scale}</span>
                          <span>{psc.frequency}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Analyzing PSC notifications...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8">
                <h4 className="text-xs font-black uppercase tracking-[3px] text-emerald-400 mb-8 flex items-center gap-3">
                  <TrendingUp size={16} /> Current Openings & Vacancies
                </h4>
                <div className="space-y-4">
                  {(analysisData.recent_vacancies || []).length > 0 ? (
                    analysisData.recent_vacancies.map((job: any, idx: number) => (
                      <div key={idx} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-emerald-500/30 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <h6 className="text-sm font-black text-white">{job.title}</h6>
                          <span className="text-[8px] font-black uppercase text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">Active</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-500 mb-1">{job.company}</p>
                        <p className="text-[10px] text-zinc-600 mb-3 flex items-center gap-1">
                          <MapPin size={10} /> {job.location}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-zinc-500 truncate max-w-[150px]">{job.description}</span>
                          {job.link && (
                            <a href={job.link.startsWith('http') ? job.link : '#'} target="_blank" rel="noopener noreferrer" className="text-[9px] font-black uppercase text-emerald-400 hover:underline">
                              Details →
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center bg-white/[0.02] rounded-2xl border border-dashed border-white/10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 italic">Scanning Technopark & Indian hubs...</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8">
                <h4 className="text-xs font-black uppercase tracking-[3px] text-amber-400 mb-8 flex items-center gap-3">
                  <Globe size={16} /> Salary Benchmarks (Regional)
                </h4>
                <div className="space-y-6">
                   <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">India (LPA)</span>
                        <span className="text-lg font-black text-white">₹{analysisData.salaries?.entry_india || 'TBD'}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '60%' }} className="h-full bg-primary-neon shadow-[0_0_10px_#6366f1]" />
                      </div>
                   </div>
                   <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Gulf (Monthly Avg)</span>
                        <span className="text-lg font-black text-white">{analysisData.salaries?.entry_gulf || 'TBD'}</span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} className="h-full bg-emerald-400 shadow-[0_0_10px_#10b981]" />
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="bg-primary-neon/5 border border-primary-neon/10 rounded-3xl p-8">
              <h5 className="text-sm font-black uppercase tracking-widest text-primary-neon mb-4">Market Trend Summary</h5>
              <p className="text-zinc-400 text-sm leading-relaxed font-medium italic">"{analysisData.market_summary || "The intersection of your technical aptitude and creative traits positions you as a high-value asset in the shifting 2025 landscape."}"</p>
            </div>
          </div>
        );

      case 'schools':
        return (
          <div className="space-y-6 py-6 text-left">
            {(analysisData.universities || analysisData.institutions || []).map((uni: any, idx: number) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white/[0.03] border border-white/5 rounded-3xl overflow-hidden group/uni hover:border-cyan-500/20 transition-all">
                <div className="p-8 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <GraduationCap size={32} className="text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2 justify-center md:justify-start">
                       <h4 className="text-2xl font-black text-white">{uni.name || uni.university}</h4>
                       <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[8px] font-black uppercase tracking-widest border border-cyan-500/10">Top 1%</span>
                    </div>
                    <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 justify-center md:justify-start">
                      <MapPin size={12} className="text-cyan-400/50" /> {uni.location || "Global Reach"}
                      {uni.location?.toLowerCase().includes('kerala') && (
                        <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] border border-emerald-500/20">Kerala Native</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-3 mb-6 justify-center md:justify-start">
                      { (uni.programs || uni.popular_courses || []).map((p: string) => (
                        <span key={p} className="px-4 py-2 rounded-xl bg-white/5 text-zinc-400 text-[10px] font-black uppercase tracking-widest border border-white/5">{p}</span>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                       <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left">
                          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">{t('details.fees')}</p>
                          <p className="text-xs font-bold text-white">{uni.fee_structure || 'Govt Regulation'}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-left">
                          <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">{t('details.intake')}</p>
                          <p className="text-xs font-bold text-white">{uni.intake_period || 'Regular'}</p>
                       </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      <button 
                         onClick={() => fetchAffiliated(uni.name || uni.university, (uni.programs || ["Any"])[0])}
                         className="flex-1 px-8 py-4 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all text-[10px] font-black uppercase tracking-[2px] flex items-center justify-center gap-3"
                      >
                        {expandedUni === (uni.name || uni.university) ? 'Close Map' : 'Explore Regional Feeders'}
                        {expandedUni === (uni.name || uni.university) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      
                      {uni.official_website && (
                         <a 
                           href={uni.official_website.startsWith('http') ? uni.official_website : `https://${uni.official_website}`} 
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="flex items-center justify-center px-8 py-4 rounded-2xl bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest gap-2"
                         >
                           <Globe size={14} />
                           {t('details.website')}
                         </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {expandedUni === (uni.name || uni.university) && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-white/5 bg-black/40 overflow-hidden">
                      <div className="p-10">
                        <div className="flex items-center gap-3 mb-8">
                          <Building2 size={16} className="text-cyan-400" />
                          <h5 className="text-xs font-black uppercase tracking-[3px] text-zinc-500">Affiliated Professional Institutes</h5>
                        </div>
                        {affiliatedLoading ? (
                          <div className="flex items-center gap-4 py-6">
                            <Loader2 size={16} className="text-cyan-400 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Cross-referencing university board...</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {affiliatedColleges.map((col, cidx) => (
                              <div key={cidx} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all group/col">
                                <h6 className="text-sm font-black text-white group-hover/col:text-cyan-400 transition-colors mb-2">{col.name}</h6>
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{col.type || 'Affiliated'}</p>
                              </div>
                            ))}
                            {affiliatedColleges.length === 0 && <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest italic py-4">No regional feeders indexed for this specific program.</p>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        );

      case 'exams':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-6 text-left">
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8">
              <h4 className="text-xs font-black uppercase tracking-[3px] text-primary-neon mb-8 flex items-center gap-3">
                <Target size={16} /> Technical & Academic Prerequisites
              </h4>
              <div className="space-y-6">
                {(analysisData.essential_requirements || []).length > 0 ? (
                  analysisData.essential_requirements.map((req: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{req.area}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${req.importance === 'Critical' ? 'bg-rose-500/10 text-rose-400' : 'bg-blue-500/10 text-blue-400'}`}>
                          {req.importance}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white">{req.requirement}</p>
                    </div>
                  ))
                ) : (
                  (analysisData.skills || []).map((s: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-zinc-400">{s.name || s}</span>
                        <span className="text-primary-neon">{s.importance || s.level || 'Crucial'}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '80%' }} className="h-full bg-primary-neon shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8">
                <h4 className="text-xs font-black uppercase tracking-[3px] text-secondary-neon mb-8 flex items-center gap-3">
                  <Award size={16} /> Professional Certifications
                </h4>
                <div className="flex flex-wrap gap-3">
                  {(analysisData.certifications || []).map((cert: any, idx: number) => (
                    <span key={idx} className="px-4 py-2 rounded-xl bg-secondary-neon/10 text-secondary-neon text-[10px] font-black uppercase tracking-widest border border-secondary-neon/20">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8">
                <h4 className="text-xs font-black uppercase tracking-[3px] text-amber-400 mb-8 flex items-center gap-3">
                  <Calendar size={16} /> Key Entrances
                </h4>
                <div className="space-y-3">
                   {(analysisData.exams || []).map((ex: any, idx: number) => (
                     <div key={idx} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between group/ex hover:bg-white/5 transition-all">
                       <div>
                         <span className="text-sm font-black text-white group-hover/ex:text-amber-400 transition-colors">{ex.exam_name || ex.name || ex}</span>
                         {ex.application_window && <p className="text-[8px] font-black text-zinc-600 uppercase mt-1">Window: {ex.application_window}</p>}
                       </div>
                       <ChevronRight size={14} className="text-zinc-600" />
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'myths':
        return (
          <div className="space-y-6 py-6 text-left">
            {(analysisData.myths || []).map((item: any, idx: number) => (
              <div key={idx} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
                  <div className="p-8 bg-surface">
                     <span className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-[8px] font-black uppercase tracking-widest border border-rose-500/10 mb-4 inline-block">Global Myth</span>
                     <p className="text-zinc-400 text-lg font-bold leading-tight italic">"{item.myth}"</p>
                  </div>
                  <div className="p-8 bg-surface/50 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] -mr-10 -mt-10"></div>
                     <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-500/10 mb-4 inline-block relative z-10">Industry Reality</span>
                     <p className="text-white text-lg font-black leading-tight relative z-10">"{item.fact || item.truth || item.reality}"</p>
                  </div>
                </div>
                {item.kerala_context && (
                  <div className="px-8 py-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-[10px] font-bold text-emerald-400/80 tracking-wide">
                      <span className="uppercase text-[8px] font-black mr-2 opacity-50">Kerala Context:</span> {item.kerala_context}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'grants':
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 text-left">
              {(analysisData.scholarships || []).map((sch: any, idx: number) => (
                <div key={idx} className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/10 group hover:bg-amber-500/10 transition-all">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                         <CreditCard size={20} className="text-amber-400" />
                      </div>
                      <h4 className="text-lg font-black text-white">{sch.name}</h4>
                   </div>
                   <p className="text-zinc-500 text-xs mb-4 leading-relaxed italic">"{sch.eligibility?.split('.')[0]}."</p>
                   
                   <div className="flex items-center gap-2 mb-6">
                      <Calendar size={12} className="text-amber-400" />
                      <span className="text-[10px] font-black uppercase text-amber-500/80">{t('details.intake')}: {sch.deadline || 'Ongoing'}</span>
                   </div>

                   {sch.required_documents && sch.required_documents.length > 0 && (
                      <div className="mb-6 space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Required Credentials</p>
                        <div className="flex flex-wrap gap-2">
                           {sch.required_documents.map((doc: string, di: number) => (
                              <span key={di} className="px-2 py-1 rounded bg-white/5 text-zinc-500 text-[8px] border border-white/5">{doc}</span>
                           ))}
                        </div>
                      </div>
                   )}

                   {sch.link && (
                     <a href={sch.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500 hover:text-amber-400 transition-colors">
                        View Official Grant <ChevronRight size={14} />
                     </a>
                   )}
                </div>
              ))}
              {(analysisData.scholarships?.length === 0) && <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest italic py-4 col-span-2 text-center">Identifying high-value grants for your profile...</p>}
            </div>
          );


      case 'simulation':
        return (
          <div className="bg-violet-500/5 border border-violet-500/10 rounded-3xl p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto border border-violet-500/20">
              <Zap size={40} className="text-violet-400" />
            </div>
            <h4 className="text-2xl font-black text-white">{t('parent.sandboxTitle')}</h4>
            <p className="text-zinc-500 text-sm max-w-md mx-auto italic">
              {t('parent.sandboxDesc')}
            </p>
            {selectedCareer === (matches[analyzingMatch!.index].career || (matches[analyzingMatch!.index] as any).title) ? (
              <button 
                onClick={() => navigate(`/simulation/${encodeURIComponent(selectedCareer || '')}`)}
                className="px-8 py-4 rounded-2xl bg-violet-500 text-white font-black uppercase tracking-widest text-[10px] hover:bg-violet-400 transition-all shadow-[0_10px_30px_rgba(139,92,246,0.2)]"
              >
                {t('parent.runSim')}
              </button>
            ) : (
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest bg-white/5 py-3 rounded-xl border border-white/5">
                    {t('parent.trajectoryLockedDesc')}
                </p>
            )}
          </div>
        );


      default:
        return (
          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-10 text-center italic text-zinc-500 font-medium">
            <Sparkles size={24} className="mx-auto mb-4 opacity-20" />
            <p>Intelligence module output is currently restricted to raw text format.</p>
            <div className="mt-8 text-left text-zinc-400 text-sm leading-relaxed p-6 bg-black/20 rounded-2xl border border-white/5 overflow-auto">
              {typeof analysisData === 'string' ? analysisData : JSON.stringify(analysisData, null, 2)}
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="App min-h-screen bg-core flex flex-col items-center justify-center p-6 text-center">
        <div className="mesh-canvas" />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative z-10 space-y-10 max-w-lg">
          <div className="relative mx-auto w-32 h-32 mb-10">
            <Loader2 size={128} className="text-primary-neon animate-spin absolute inset-0 opacity-10" />
            <div className="absolute inset-4 rounded-3xl border-4 border-t-primary-neon border-white/5 animate-[spin_3s_linear_infinite]" />
            <div className="absolute inset-8 rounded-2xl bg-primary-neon flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.5)]">
               <Bot size={40} className="text-white" />
            </div>
          </div>
          <div className="space-y-4">
             <h2 className="text-3xl font-black hero-title animate-pulse uppercase tracking-wider">{statusText}</h2>
             <p className="text-zinc-500 font-bold uppercase tracking-[6px] text-xs">{t('results.processing')}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-core py-16 px-6 font-sans relative overflow-x-hidden">
      <div className="mesh-canvas" />
      
      <div className="max-w-4xl mx-auto text-center mb-16 relative z-10 pt-10">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
          <Sparkles size={14} className="text-primary-neon animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[4px] text-zinc-400">{t('results.advancedSystem')}</span>
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black hero-title mb-6 tracking-tighter">
          {t('results.title')}
        </h1>
        <p className="text-xl text-text-dim max-w-2xl mx-auto font-medium leading-relaxed mb-12 opacity-80">
          {t('results.subtitle')}
        </p>

        {matches.length === 0 && !loading && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6 p-10 bg-rose-500/5 border border-rose-500/20 rounded-3xl max-w-xl mx-auto">
              <AlertTriangle className="text-rose-500" size={40} />
              <p className="text-rose-400 font-bold uppercase tracking-widest text-xs">Neural Sync Interrupted // Rate Limit Hit</p>
              <button 
                onClick={handleRetry}
                className="px-8 py-4 bg-primary-neon text-white font-black rounded-2xl hover:scale-105 transition-all shadow-xl uppercase tracking-widest text-[10px]"
              >
                Retry Neural Mapping
              </button>
           </motion.div>
        )}
      </div>

      <motion.div className="max-w-6xl mx-auto grid grid-cols-1 gap-12 relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {Array.isArray(matches) && matches
          .filter(m => {
            if (!m) return false;
            if (focusMode && chosenPath) {
              const careerName = m.career || (m as any).title || "";
              return careerName === chosenPath;
            }
            return true;
          })
          .map((match, i) => (
          <motion.div key={i} className={`glass-card p-10 md:p-14 relative overflow-hidden group border-white/5 ${focusMode ? 'border-primary-neon/20 shadow-[0_0_50px_rgba(99,102,241,0.1)]' : ''}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            {/* Direct Access Layout Modification */}
            <div className={`flex flex-col ${focusMode ? 'lg:flex-row' : 'lg:flex-row'} gap-12 relative z-10`}>
              
              {/* LEFT COMMAND ZONE: Twin & Simulation (Visible in focusMode) */}
              {focusMode && (
                <div className="lg:w-[20%] flex flex-col gap-4 shrink-0">
                   <h3 className="text-[9px] font-black uppercase tracking-[3px] text-primary-neon mb-4">Neural Command</h3>
                   <button 
                     onClick={() => navigate(`/simulation/${encodeURIComponent(match.career || (match as any).title)}`)}
                     className="p-6 rounded-3xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 transition-all flex flex-col items-center gap-3 group/sim"
                   >
                     <Zap size={24} className="text-violet-400 group-hover/sim:scale-110 transition-transform" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-violet-400">Simulation</span>
                   </button>
                </div>
              )}

              <div className={`${focusMode ? 'lg:w-[45%]' : 'lg:w-1/2'} flex flex-col justify-center text-left`}>
                <div className="w-14 h-14 rounded-full border-2 border-white/10 flex items-center justify-center mb-8 shrink-0 group-hover:border-primary-neon/30 transition-colors">
                  <span className="text-xl font-black text-white/80 group-hover:text-primary-neon transition-colors">0{i + 1}</span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6 group-hover:text-primary-neon transition-all leading-[1] tracking-tight">
                    {match.career || (match as any).title || "Specialist Path"}
                </h2>
                <div className="flex flex-wrap gap-3 mb-10">
                  <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp size={14} /> ₹{match.salary_range || t('results.salary')}
                  </span>
                  <span className={`px-5 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-black uppercase tracking-wider ${getDemandColor(match.local_demand || (match as any).demand || "High")}`}>
                    {match.local_demand || (match as any).demand || t('results.demand')}
                  </span>
                </div>
                {(match.reason || (match as any).why_matches) && (
                  <div className="pl-6 border-l-2 border-white/10 italic my-6">
                    <p className="text-zinc-500 leading-relaxed text-sm font-medium pr-10 italic">
                      "{match.reason || (match as any).why_matches}"
                    </p>
                  </div>
                )}
                
                {/* Selection Action */}
                <div className="mt-8 flex justify-start">
                  <button
                    onClick={() => {
                        handleChoosePath(match.career || (match as any).title);
                        setShowSuccessToast(true);
                        setTimeout(() => setShowSuccessToast(false), 3000);
                    }}
                    className={`px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center gap-3 active:scale-95 ${
                      selectedCareer === (match.career || (match as any).title)
                        ? 'bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.5)] scale-105'
                        : 'bg-white/5 border border-white/10 text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30'
                    }`}
                  >
                    {selectedCareer === (match.career || (match as any).title) ? (
                      <>
                        <CheckCircle2 size={16} className="animate-pulse" />
                        {t('results.activePath') || "Path Activated"}
                      </>
                    ) : (
                      <>
                        <Target size={16} />
                        {t('results.choosePath') || "Choose this career path"}
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-[10px] font-black uppercase tracking-[3px] text-zinc-600 mb-8 flex items-center gap-3 justify-center md:justify-start">
                   <div className="h-px w-8 bg-white/5"></div> {focusMode ? t('results.trajectoryAnalytics') : t('results.moduleTitle')} <div className="h-px flex-1 bg-white/5"></div>
                </h3>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {intelligenceModules.map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => fetchDetailedAnalysis(match, i, btn.id as AnalysisType)}
                      className={`flex flex-col items-center justify-center w-28 h-[110px] rounded-3xl border transition-all duration-300 gap-1.5 group/btn relative overflow-hidden ${
                        analyzingMatch?.index === i && analyzingMatch?.type === btn.id
                          ? 'bg-primary-neon/10 border-primary-neon/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <div className={`transition-transform duration-300 group-hover/btn:-translate-y-1 ${
                         analyzingMatch?.index === i && analyzingMatch?.type === btn.id ? btn.color : 'text-zinc-400'
                      }`}>
                        <btn.icon size={22} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest transition-transform duration-300 group-hover/btn:-translate-y-1 ${
                        analyzingMatch?.index === i && analyzingMatch?.type === btn.id ? btn.text : 'text-zinc-500'
                      }`}>
                        {btn.name}
                      </span>
                      <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600 opacity-0 group-hover/btn:opacity-100 absolute bottom-3 transition-opacity duration-300">
                        {btn.subtitle}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Analysis Expansion Area */}
            <AnimatePresence>
              {analyzingMatch?.index === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-12 pt-12 border-t border-white/5 overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-neon/10 flex items-center justify-center">
                           <Sparkles size={20} className="text-primary-neon" />
                        </div>
                        <div>
                           <h3 className="text-lg font-black text-white uppercase tracking-tight">
                              {t('results.moduleTitle')}: {analyzingMatch.type.charAt(0).toUpperCase() + analyzingMatch.type.slice(1)}
                           </h3>
                           <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{t('results.realtimeSynthesis')}</p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setAnalyzingMatch(null)}
                        className="p-3 rounded-xl bg-white/5 border border-white/5 text-zinc-500 hover:text-white transition-all"
                     >
                        <X size={18} />
                     </button>
                  </div>
                  {renderAnalysisContent()}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </motion.div>

      <div className="max-w-6xl mx-auto mt-20 flex items-center justify-center relative z-10">
        <button onClick={() => navigate('/assessment')} className="text-zinc-600 hover:text-white flex items-center gap-3 font-black uppercase tracking-[5px] text-[10px] transition-colors">
          <X size={16} /> {t('results.returnBtn')}
        </button>
      </div>

      {matches.length > 0 && (
        <CareerChatbot 
          careerTitle={(analyzingMatch && matches[analyzingMatch.index]) ? (matches[analyzingMatch.index].career || (matches[analyzingMatch.index] as any).title) : (matches[0]?.career || "Career Path")}
          activeSection={analyzingMatch ? analyzingMatch.type : 'default'}
          userProfile={typeof profile === 'string' ? JSON.parse(profile) : profile}
          matchScore={95}
          isOpen={chatbotOpen}
          onOpen={() => setChatbotOpen(true)}
          onClose={() => setChatbotOpen(false)}
        />
      )}

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-12 right-12 z-[200] px-8 py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_20px_50px_rgba(16,185,129,0.4)] flex items-center gap-4 border border-emerald-400/20"
          >
            <div className="w-6 h-6 rounded-full bg-black/10 flex items-center justify-center">
              <CheckCircle2 size={14} />
            </div>
            {t('results.pathActivated')}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResultsPage;
