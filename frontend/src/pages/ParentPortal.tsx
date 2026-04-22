import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users, Target, ShieldCheck, XCircle, Brain, GraduationCap, Zap, ArrowRight,
    MapPin, Award, FlaskConical, Building2, CheckCircle2, Calendar,
    ChevronRight, TrendingUp, Globe, Sparkles,
    Activity, Scale, Calculator, Heart, Hospital, Network, Gavel, 
    Palette, Image, Cpu, Sliders, 
    FlaskConical as Flask
} from 'lucide-react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, ReferenceLine
} from 'recharts';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import CareerChatbot from '../components/CareerChatbot';

const API_BASE = import.meta.env.VITE_API_URL || '';

const ParentPortal: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useLanguage();
    
    // States
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [pin, setPin] = useState('');
    const [isPinRequired, setIsPinRequired] = useState(false);
    const [activeTab, setActiveTab] = useState<'roadmap' | 'schools' | 'exams' | 'grants' | 'myths' | 'market'>('roadmap');
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Sandbox State
    const [isSandboxMode, setIsSandboxMode] = useState(false);
    const [sandboxCareerB, setSandboxCareerB] = useState("");
    const [sandboxScenario, setSandboxScenario] = useState("Standard Path");
    const [sandboxLocation, setSandboxLocation] = useState("Kerala");
    const [sandboxWorkType] = useState("Job");
    const [sandboxYears] = useState(3);
    const [localSimResult, setLocalSimResult] = useState<any>(null);
    const [isSimulating, setIsSimulating] = useState(false);

    const isTrajectoryView = location.hash === '#trajectory';
    const isSimulationView = location.hash === '#simulation';

    // Initial Fetch
    const fetchParentData = async (enteredPin?: string) => {
        setLoading(true);
        setError(null);
        try {
            const url = `${API_BASE}/api/parent/lookup/${encodeURIComponent(id || '')}${enteredPin ? `?pin=${enteredPin}` : ''}`;
            const res = await axios.get(url);
            
            if (res.data.status === 'ready') {
                setData(res.data);
                setIsPinRequired(false);
            } else if (res.data.status === 'pin_required') {
                setIsPinRequired(true);
                if (enteredPin) setError("Incorrect Password. Please check the WhatsApp message.");
            }
        } catch (err: any) {
            console.error("Parent portal fetch failed:", err);
            setError(err.response?.data?.detail || "Invalid Parent ID or access restricted.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchParentData();
    }, [id]);

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin.length >= 4) {
            fetchParentData(pin);
        }
    };

    if (loading && !isPinRequired) {
        return (
            <div className="min-h-screen bg-core flex flex-col items-center justify-center space-y-8 px-6 text-center">
                <div className="mesh-canvas" />
                <div className="w-16 h-16 border-4 border-white/5 border-t-primary-neon rounded-full animate-spin" />
                <h2 className="text-xl font-black hero-title animate-pulse">Establishing Secure Access...</h2>
            </div>
        );
    }

    if (isPinRequired && !data) {
        return (
            <div className="min-h-screen bg-core flex flex-col items-center justify-center p-6 text-center">
                <div className="mesh-canvas" />
                <header className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]">
                    <div className="px-6 py-2 rounded-full bg-primary-neon/10 border border-primary-neon/30 backdrop-blur-3xl flex items-center gap-3">
                        <ShieldCheck size={14} className="text-primary-neon" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-neon">Security Verification</span>
                    </div>
                </header>

                <div className="glass-card p-12 lg:p-20 border-white/10 max-w-md w-full relative z-10">
                    <div className="w-20 h-20 rounded-3xl bg-primary-neon/10 flex items-center justify-center mx-auto mb-8 text-primary-neon border border-primary-neon/20 shadow-2xl shadow-primary-neon/20">
                        <ShieldCheck size={40} />
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tight">Enter Password</h2>
                    <p className="text-zinc-500 mb-10 font-bold leading-relaxed">Please enter the 4-digit security password shared with you via WhatsApp.</p>
                    
                    <form onSubmit={handlePinSubmit} className="space-y-6">
                        <input 
                            type="text" 
                            maxLength={4}
                            placeholder="••••"
                            value={pin}
                            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 text-center text-4xl font-black tracking-[1em] text-primary-neon focus:outline-none focus:border-primary-neon focus:bg-white/[0.08] transition-all"
                        />
                        
                        {error && (
                            <div className="text-accent-rose text-xs font-bold animate-shake">{error}</div>
                        )}

                        <button 
                            type="submit"
                            disabled={pin.length < 4 || loading}
                            className="glow-btn w-full py-5 uppercase text-xs tracking-widest font-black flex items-center justify-center gap-3"
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : (
                                <>Verify & Access <ArrowRight size={16} /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-core flex flex-col items-center justify-center p-6 text-center">
                <div className="mesh-canvas" />
                <div className="glass-card p-12 lg:p-20 border-accent-rose/20 max-w-xl w-full">
                    <XCircle size={64} className="text-accent-rose mx-auto mb-10 shadow-2xl" />
                    <h2 className="text-3xl font-black text-white mb-6 uppercase tracking-tight">Access Denied</h2>
                    <p className="text-zinc-500 mb-12 font-bold leading-relaxed">{error || "No active profile matches this ID."}</p>
                    <button 
                      onClick={() => navigate('/')} 
                      className="glow-btn w-full py-5 uppercase text-xs tracking-widest font-black"
                    >
                      Return to Gateway
                    </button>
                </div>
            </div>
        );
    }

    const { 
        student_summary,
        selected_career,
        roadmap,
        myths,
        market,
        personality,
        simulation_data,
        logic_explanation,
        recommendations,
        scholarships
    } = data || {};

    const getCareerThemedIcons = (name: string) => {
        const c = (name || "").toLowerCase();
        if (c.includes('tax') || c.includes('account') || c.includes('audit') || c.includes('financ')) 
            return { global: TrendingUp, psc: Scale, hubs: Calculator };
        if (c.includes('doctor') || c.includes('medicin') || c.includes('health') || c.includes('nurs')) 
            return { global: Activity, psc: Heart, hubs: Hospital };
        if (c.includes('engineer') || c.includes('tech') || c.includes('ai') || c.includes('code') || c.includes('soft')) 
            return { global: Cpu, psc: ShieldCheck, hubs: Network };
        if (c.includes('law') || c.includes('legal') || c.includes('advoc')) 
            return { global: Gavel, psc: Scale, hubs: Building2 };
        if (c.includes('design') || c.includes('art') || c.includes('music') || c.includes('creat')) 
            return { global: Palette, psc: Award, hubs: Image };
        return { global: Globe, psc: ShieldCheck, hubs: MapPin };
    };

    const themedIcons = getCareerThemedIcons(selected_career || "");
    const GlobalIcon = themedIcons.global;
    const PSCIcon = themedIcons.psc;
    const HubsIcon = themedIcons.hubs;

    const activeSimResult = localSimResult || simulation_data?.result;
    const activeSimInputs = localSimResult ? {
        career_a: selected_career,
        career_b: sandboxCareerB,
        scenario: sandboxScenario,
        location: sandboxLocation,
        work_type: sandboxWorkType
    } : simulation_data?.inputs;

    const runSandboxSimulation = async () => {
        if (!sandboxCareerB) {
            alert(language === 'ml' ? 'ഒരു ബദൽ കരിയർ നൽകുക.' : 'Please enter an alternative career to compare.');
            return;
        }

        setIsSimulating(true);
        try {
            const response = await axios.post(`${API_BASE}/api/parent/simulation/compare`, {
                career_a: selected_career,
                career_b: sandboxCareerB,
                scenario: sandboxScenario,
                location: sandboxLocation,
                years_before_switch: sandboxYears,
                work_type: sandboxWorkType,
                language: language,
                persist: false, // CRITICAL: Do not save parent sandbox
                user_profile: personality // Use student's profile for matching
            });

            setLocalSimResult(response.data);
        } catch (err) {
            console.error("Sandbox failure:", err);
            alert("Simulation system offline. Please try again.");
        } finally {
            setIsSimulating(false);
        }
    };

    const resetSandbox = () => {
        setLocalSimResult(null);
        setIsSandboxMode(false);
    };

    const simChartData = activeSimResult?.career_a_data?.yearly_data ? activeSimResult.career_a_data.yearly_data.map((point: any, i: number) => ({
        year: `Year ${point.year}`,
        careerA: point.salary,
        careerB: activeSimResult.career_b_data?.yearly_data?.[i]?.salary || 0,
        roleA: point.role,
        roleB: activeSimResult.career_b_data?.yearly_data?.[i]?.role || "",
        milestoneA: point.milestone,
        milestoneB: activeSimResult.career_b_data?.yearly_data?.[i]?.milestone || ""
    })) : [];

    return (
        <>
        <div className="min-h-screen bg-core text-white font-sans relative overflow-x-hidden pt-32 pb-20 px-6">
            {/* Background Elements */}
            <div className="mesh-canvas" />
            <div className="mesh-blob bg-primary-neon/10 top-0 left-0 w-[800px] h-[800px]" />
            <div className="mesh-blob bg-secondary-neon/5 bottom-0 right-0 w-[600px] h-[600px]" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Global Labels */}
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex gap-4">
                    <div className="px-6 py-2 rounded-full bg-secondary-neon/10 border border-secondary-neon/30 backdrop-blur-3xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-secondary-neon animate-pulse shadow-[0_0_8px_#10b981]"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary-neon">Parent Access (Read-only)</span>
                    </div>
                    <div className="px-6 py-2 rounded-full bg-primary-neon/10 border border-primary-neon/30 backdrop-blur-3xl flex items-center gap-3 shadow-2xl shadow-primary-neon/10">
                        <Activity size={14} className="text-primary-neon animate-bounce" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-neon">Live Neural Sync (2025)</span>
                    </div>
                </div>

                <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary-neon/10 border border-primary-neon/20">
                            <ShieldCheck size={14} className="text-primary-neon" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary-neon">Student Strategy Review</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black hero-title leading-none tracking-tighter">
                            {student_summary.name}<span className="text-white/10">'s</span> <br />
                            <span className="neon-text">Trajectory</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Link Identity</p>
                            <p className="text-xl font-black text-white">{id}</p>
                        </div>
                        <div className="w-16 h-16 rounded-3xl bg-primary-neon/10 border border-primary-neon/20 flex items-center justify-center text-primary-neon shadow-2xl shadow-primary-neon/20">
                            <Users size={32} />
                        </div>
                    </div>
                </header>

                {isSimulationView ? (
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                        <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-lg ${isSandboxMode ? 'bg-primary-neon/20' : 'bg-white/5'}`}>
                                    <Flask size={18} className={isSandboxMode ? 'text-primary-neon' : 'text-zinc-500'} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Parent Discovery Sandbox</h4>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Test alternative paths without affecting student data</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => isSandboxMode ? resetSandbox() : setIsSandboxMode(true)}
                                className={`px-6 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                    isSandboxMode 
                                    ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20' 
                                    : 'bg-primary-neon/10 border-primary-neon/30 text-primary-neon hover:bg-primary-neon/20'
                                }`}
                            >
                                {isSandboxMode ? 'Close Sandbox' : 'Enter Sandbox'}
                            </button>
                        </div>

                        {(simulation_data || isSandboxMode) ? (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* Left Column: Inputs & Verdict */}
                                <div className="lg:col-span-4 space-y-8">
                                    {isSandboxMode && (
                                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-10 border-primary-neon/20 bg-primary-neon/[0.02] space-y-8">
                                            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-primary-neon mb-6 border-b border-primary-neon/10 pb-6">
                                                <Sliders size={16} /> Sandbox Controls
                                            </h3>
                                            
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Base Path (Locked)</label>
                                                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-400">
                                                        {selected_career}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Alternative Path (Compare)</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. Data Scientist, UX Designer..."
                                                        value={sandboxCareerB}
                                                        onChange={(e) => setSandboxCareerB(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold text-white focus:outline-none focus:border-primary-neon/50 placeholder:text-zinc-700"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Growth Scenario</label>
                                                        <select 
                                                            value={sandboxScenario}
                                                            onChange={(e) => setSandboxScenario(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] font-bold text-white focus:outline-none"
                                                        >
                                                            <option value="Standard Path">Standard</option>
                                                            <option value="Aggressive Upskilling">Aggressive</option>
                                                            <option value="Startup Risk">Startup</option>
                                                            <option value="Government Stability">Stability</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-black text-zinc-600 uppercase mb-2 block tracking-widest">Target Hub</label>
                                                        <select 
                                                            value={sandboxLocation}
                                                            onChange={(e) => setSandboxLocation(e.target.value)}
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] font-bold text-white focus:outline-none"
                                                        >
                                                            <option value="Kerala">Kerala</option>
                                                            <option value="Bangalore">Bangalore</option>
                                                            <option value="Gulf / Middle East">Gulf / ME</option>
                                                            <option value="Europe / US">Europe / US</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <button 
                                                    onClick={runSandboxSimulation}
                                                    disabled={isSimulating}
                                                    className="w-full py-4 rounded-xl bg-primary-neon text-white font-black uppercase tracking-widest text-[10px] hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all disabled:opacity-50"
                                                >
                                                    {isSimulating ? 'Neural Processing...' : 'Run Simulation'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}

                                    {!isSandboxMode && (
                                        <div className="glass-card p-10 border-white/5 relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-neon to-transparent opacity-30" />
                                            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 border-b border-white/5 pb-6">
                                                <Activity size={16} className="text-primary-neon" /> 01. Student's Configured Context
                                            </h3>
                                            
                                            <div className="space-y-6">
                                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                    <p className="text-[8px] uppercase font-black text-zinc-600 mb-1 tracking-widest">Selected Scenario</p>
                                                    <p className="text-sm font-bold text-white">{activeSimInputs?.scenario || "Standard Path"}</p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                        <p className="text-[8px] uppercase font-black text-zinc-600 mb-1 tracking-widest">Location</p>
                                                        <p className="text-xs font-bold text-white">{activeSimInputs?.location || "Kerala"}</p>
                                                    </div>
                                                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                                        <p className="text-[8px] uppercase font-black text-zinc-600 mb-1 tracking-widest">Modality</p>
                                                        <p className="text-xs font-bold text-white">{activeSimInputs?.work_type || "Job"}</p>
                                                    </div>
                                                </div>
                                                <div className="p-4 rounded-xl bg-primary-neon/5 border border-primary-neon/10">
                                                    <p className="text-[8px] uppercase font-black text-primary-neon/70 mb-2 tracking-widest">Strategy Verdict</p>
                                                    <p className="text-xs font-bold text-zinc-300 leading-relaxed italic">
                                                        "{activeSimResult?.scenario_impact || "Analysis of the selected 10-year growth trajectory confirms high market alignment."}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Comparison Verdict */}
                                    <div className="bg-gradient-to-br from-indigo-500 to-primary-neon p-[1px] rounded-[2rem] shadow-2xl">
                                        <div className="bg-core rounded-[1.95rem] p-10 space-y-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Sparkles className="text-primary-neon animate-pulse" size={24} />
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-neon">Strategic Conclusion</p>
                                            </div>
                                            <p className="text-base text-zinc-200 font-bold leading-relaxed italic">
                                                "{activeSimResult?.recommendation || "Based on the 10-year projection, this path maximizes long-term professional stability and growth."}"
                                            </p>
                                            <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                                                <div className="flex-1">
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">Neural Confidence</p>
                                                    <div className="h-1 bg-white/5 rounded-full">
                                                        <div className="h-full bg-primary-neon" style={{ width: `${activeSimResult?.confidence || 87}%` }} />
                                                    </div>
                                                </div>
                                                <span className="text-xs font-black text-white">{activeSimResult?.confidence || 87}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Chart & Projection */}
                                <div className="lg:col-span-8 space-y-8">
                                    <div className="glass-card p-12 border-white/5 relative overflow-hidden bg-white/[0.01]">
                                        {isSandboxMode && (
                                            <div className="absolute top-4 right-4 bg-primary-neon/10 border border-primary-neon/20 px-3 py-1 rounded-full flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-primary-neon rounded-full animate-pulse" />
                                                <span className="text-[8px] font-black uppercase text-primary-neon tracking-widest">Live Sandbox Mode</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                            <div>
                                                <h3 className="text-2xl font-black tracking-tight text-white mb-2">Parallel Reality Projection</h3>
                                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest leading-none">Salary Growth Simulation (LPA)</p>
                                            </div>
                                            <div className="flex items-center gap-6 bg-white/[0.03] p-4 rounded-2xl border border-white/5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                                                    <span className="text-[9px] font-black uppercase text-zinc-400">{activeSimInputs?.career_a || selected_career}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                                                    <span className="text-[9px] font-black uppercase text-zinc-400">{activeSimInputs?.career_b || "Alternative"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="h-[400px] w-full relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={simChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                                    <XAxis dataKey="year" stroke="#444" fontSize={10} fontVariant="bold" axisLine={false} tickLine={false} />
                                                    <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                                                    <Tooltip 
                                                        contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '16px', padding: '16px' }}
                                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                                        labelStyle={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}
                                                    />
                                                    <Line type="monotone" dataKey="careerA" stroke="#10b981" strokeWidth={4} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 8 }} />
                                                    <Line type="monotone" dataKey="careerB" stroke="#3b82f6" strokeWidth={4} dot={{ fill: '#3b82f6', r: 4 }} activeDot={{ r: 8 }} />
                                                    {activeSimResult?.crossover_year && (
                                                        <ReferenceLine x={`Year ${activeSimResult.crossover_year}`} stroke="#333" strokeDasharray="5 5" label={{ position: 'top', value: 'Shift Point', fill: '#666', fontSize: 10 }} />
                                                    )}
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                         {/* Market Opportunities Badges */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/5">
                                            <div className="space-y-2">
                                                <p className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-600 tracking-tighter">
                                                    <GlobalIcon size={12} className="text-secondary-neon" /> Global Match
                                                </p>
                                                <p className="text-xs font-bold text-white line-clamp-1">{activeSimResult?.gulf_opportunities?.salary || "TBD Projection"}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-600 tracking-tighter">
                                                    <PSCIcon size={12} className="text-amber-500" /> PSC Eligibility
                                                </p>
                                                <p className="text-xs font-bold text-white line-clamp-1">{activeSimResult?.psc_opportunities?.post_name || "Calculated Entry"}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="flex items-center gap-2 text-[9px] font-black uppercase text-zinc-600 tracking-tighter">
                                                    <HubsIcon size={12} className="text-primary-neon" /> Local Hubs
                                                </p>
                                                <p className="text-xs font-bold text-white line-clamp-1">{(activeSimResult?.kerala_opportunities?.hubs || ["Kochi", "TVM"]).join(", ")}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 glass-card border border-white/5 space-y-6">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/10 opacity-30">
                                    <Zap size={32} className="text-zinc-500" />
                                </div>
                                <div className="text-center">
                                    <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Process Interrupted</h2>
                                    <p className="text-sm font-bold text-zinc-600 max-w-sm mx-auto leading-relaxed">
                                        The student has not initiated the Career Simulation protocol yet. Data visualization will synchronize once the session is completed.
                                    </p>
                                </div>
                            </div>
                        )}
                     </motion.div>
                ) : !isTrajectoryView ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* LEFT COLUMN: Student Summary & Logic */}
                    <div className="lg:col-span-8 space-y-8">
                        {/* Section 1: Student Summary */}
                        <div className="glass-card p-12 border-white/5 h-fit relative group overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-neon to-transparent opacity-50 transition-all duration-500 group-hover:h-2" />
                            <div className="absolute inset-0 bg-gradient-to-b from-primary-neon/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            
                            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 border-b border-white/5 pb-6 relative z-10">
                                <GraduationCap size={16} className="text-primary-neon" /> 01. Cognitive Profile
                            </h3>
                            
                            <div className="space-y-8 relative z-10">
                                {/* Top Row Grid: Education & Stream */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-primary-neon/20 transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-secondary-neon/5 blur-[20px]" />
                                        <p className="text-[8px] uppercase font-black text-zinc-500 tracking-widest mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-secondary-neon rounded-full" /> Level</p>
                                        <p className="text-lg font-black text-white leading-none">{student_summary.education_level}</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-primary-neon/20 transition-all relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 blur-[20px]" />
                                        <p className="text-[8px] uppercase font-black text-zinc-500 tracking-widest mb-2 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Stream</p>
                                        <p className="text-lg font-black text-white leading-none">{student_summary.stream}</p>
                                    </div>
                                </div>
                                
                                {/* Inner Badges */}
                                {personality && (personality.mbti_type || personality.holland_code) && (
                                    <div className="flex gap-4">
                                        {personality.mbti_type && (
                                           <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 flex flex-col justify-center items-center">
                                                <span className="text-[8px] font-black uppercase text-indigo-400/70 tracking-widest mb-1">MBTI Profile</span>
                                                <span className="text-xl font-black text-indigo-400">{personality.mbti_type}</span>
                                           </div>
                                        )}
                                        {personality.holland_code && (
                                           <div className="flex-1 p-4 rounded-xl bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/20 flex flex-col justify-center items-center">
                                                <span className="text-[8px] font-black uppercase text-teal-400/70 tracking-widest mb-1">Holland Code</span>
                                                <span className="text-xl font-black text-teal-400">{personality.holland_code}</span>
                                           </div>
                                        )}
                                    </div>
                                )}

                                <div>
                                    <p className="text-[9px] uppercase font-black text-zinc-600 tracking-widest mb-3 flex items-center gap-2"><Target size={12} className="text-zinc-500" /> Core Interests</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.isArray(student_summary?.interests) && student_summary.interests.map((int: any, i: number) => (
                                            <span key={i} className="px-3 py-1.5 rounded-lg bg-zinc-900 shadow-inner shadow-white/5 text-[9px] uppercase font-black tracking-wider text-zinc-400 border border-white/5 hover:border-primary-neon/30 hover:text-white transition-colors cursor-default">{int}</span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <p className="text-[9px] uppercase font-black text-zinc-600 tracking-widest mb-4 flex items-center gap-2"><ShieldCheck size={12} className="text-zinc-500" /> Assessed Strengths</p>
                                    <div className="flex flex-col gap-2">
                                        {Array.isArray(student_summary?.skills) && student_summary.skills.map((str: any, i: number) => (
                                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-white/[0.03] to-transparent border border-white/5 hover:border-primary-neon/20 transition-all">
                                                <div className="w-6 h-6 rounded-lg bg-primary-neon/10 border border-primary-neon/20 flex items-center justify-center shrink-0 mt-0.5">
                                                    <span className="text-[10px] font-black text-primary-neon">{i + 1}</span>
                                                </div>
                                                <span className="text-xs font-bold text-zinc-300 leading-snug">{str}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                
                                {/* Inner Badges for Traits & Values */}
                                {personality && (Array.isArray(personality.traits) || Array.isArray(personality.values)) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5 mt-4">
                                        {Array.isArray(personality.traits) && personality.traits.length > 0 && (
                                            <div>
                                                <p className="text-[9px] uppercase font-black text-zinc-600 tracking-widest mb-3 flex items-center gap-2">Key Traits</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {personality.traits.slice(0,4).map((trt: string, idx: number) => (
                                                        <span key={idx} className="px-3 py-1 rounded-md bg-indigo-500/10 text-indigo-300 text-[8px] font-black uppercase border border-indigo-500/20">{trt}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {Array.isArray(personality.values) && personality.values.length > 0 && (
                                            <div>
                                                <p className="text-[9px] uppercase font-black text-zinc-600 tracking-widest mb-3 flex items-center gap-2">Core Values</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {personality.values.slice(0,4).map((val: string, idx: number) => (
                                                        <span key={idx} className="px-3 py-1 rounded-md bg-teal-500/10 text-teal-300 text-[8px] font-black uppercase border border-teal-500/20">{val}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: Logic Section */}
                        <div className="glass-card p-12 border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] group-hover:bg-amber-500/20 transition-all duration-700" />
                            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-8 border-b border-white/5 pb-6 relative z-10">
                                <Brain size={16} className="text-amber-400" /> 03. Deductive Decision Logic
                            </h3>
                            <div className="relative z-10">
                                <div className="absolute -top-4 -left-2 text-6xl text-amber-500/20 font-serif leading-none">"</div>
                                <p className="text-sm md:text-base font-bold leading-relaxed text-zinc-300 italic pl-6 pr-4">
                                    {logic_explanation}
                                </p>
                                <div className="mt-8 flex items-center gap-3 pl-6">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">AI Logic Engine</p>
                                        <p className="text-[8px] font-bold text-zinc-500 uppercase">Analysis Complete</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Recommendations */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Section 2: Career Recommendations */}
                        <div className="glass-card p-12 border-secondary-neon/20 relative overflow-hidden group shadow-[0_0_50px_rgba(6,182,212,0.03)] bg-gradient-to-br from-secondary-neon/[0.02] to-transparent">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-neon/10 blur-[120px] rounded-full mix-blend-screen opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                            
                            <h3 className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-12 border-b border-secondary-neon/10 pb-8 relative z-10">
                                <Target size={20} className="text-secondary-neon" /> 02. Precision Recommendations
                            </h3>

                            <div className="space-y-8 relative z-10">
                                {recommendations && recommendations.length > 0 ? (
                                    recommendations.map((rec: any, i: number) => (
                                        <motion.div 
                                            key={i}
                                            whileHover={{ x: 10 }}
                                            className="p-10 rounded-[2.5rem] bg-black/40 backdrop-blur-md border border-white/5 hover:border-secondary-neon/50 shadow-2xl transition-all group/item overflow-hidden relative"
                                        >
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary-neon/0 group-hover/item:bg-secondary-neon transition-colors duration-500" />
                                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
                                                <div className="space-y-6 flex-1">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary-neon to-cyan-600 text-white flex items-center justify-center text-sm font-black shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-white/10">{i+1}</div>
                                                        <h4 className="text-3xl font-black text-white leading-tight drop-shadow-md">{rec.career}</h4>
                                                    </div>
                                                    
                                                    <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/5 shadow-inner">
                                                      <p className="text-[10px] font-black uppercase text-secondary-neon/70 block mb-3 tracking-widest flex items-center gap-2"><Target size={12} /> Strategic Alignment Logic</p>
                                                      <p className="text-base text-zinc-300 font-bold leading-relaxed">{rec.why_suits}</p>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 px-4">
                                                        <div className="space-y-5">
                                                            <p className="text-[9px] uppercase font-black text-zinc-500 tracking-widest px-1">Required Competencies</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {rec.skills_required.map((skill: string, idx: number) => (
                                                                    <span key={idx} className="px-4 py-1.5 rounded-xl bg-secondary-neon/10 text-secondary-neon text-[10px] font-black uppercase border border-secondary-neon/20 shadow-sm">{skill}</span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            <p className="text-[9px] uppercase font-black text-zinc-500 tracking-widest px-1">Future Outlook (2030)</p>
                                                            <p className="text-xs font-bold text-zinc-400 leading-relaxed bg-white/[0.02] border border-white/5 p-5 rounded-2xl border-l-2 border-l-secondary-neon shadow-inner">{rec.future_scope}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-12 rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 flex flex-col items-center justify-center text-center space-y-6 shadow-2xl border-t-cyan-500/30">
                                        <div className="w-20 h-20 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex flex-col items-center justify-center text-cyan-400 mb-4 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                                            <Target size={30} />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black text-white mb-2">Focused Trajectory Locked</h4>
                                            <p className="text-sm font-bold text-zinc-500 max-w-sm mx-auto leading-relaxed">
                                                Recommendations have been bypassed in favor of a directly selected strategic pathway for <span className="text-cyan-400 font-black">{selected_career || 'the student'}</span>. 
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                window.location.hash = 'trajectory'; 
                                                const event = new HashChangeEvent("hashchange");
                                                window.dispatchEvent(event);
                                            }}
                                            className="mt-4 px-8 py-4 rounded-xl bg-zinc-100 text-zinc-900 border border-white font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)]"
                                        >
                                            View Trajectory
                                        </button>
                                    </div>
                                )}
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
                                    <MapPin size={20} className="text-primary-neon" /> 04. Selected Strategy: <span className="text-white ml-2">{selected_career}</span>
                                </h3>

                                {/* Strategy Tabs */}
                                <div className="flex flex-wrap gap-4 mb-12 pb-6 border-b border-white/5">
                                    {[
                                        { id: 'roadmap', label: 'Roadmap', icon: Calendar },
                                        { id: 'schools', label: 'Schools', icon: GraduationCap },
                                        { id: 'exams', label: 'Exams', icon: Target },
                                        { id: 'grants', label: 'Scholarships', icon: Award },
                                        { id: 'myths', label: 'Fact Check', icon: FlaskConical },
                                        { id: 'market', label: 'Market', icon: TrendingUp }
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
                                                <div className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">Strategy loading or unavailable...</div>
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
                                                <div className="col-span-full py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">No specific schools mapped yet.</div>
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
                                                            <p className="font-black text-zinc-600 uppercase tracking-tighter border-b border-white/5 pb-1">Conducted By</p>
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
                                                <div className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">No exams currently prioritized.</div>
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
                                                    Searching for eligible grants...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {activeTab === 'market' && (
                                        <div className="space-y-6">
                                            {market ? (
                                                <div className="p-8 rounded-[2rem] bg-zinc-900 border border-white/5 space-y-6">
                                                   <h5 className="font-black text-white text-lg tracking-tight border-b border-white/5 pb-4">Market Outlook</h5>
                                                   <p className="text-sm font-bold text-zinc-400 italic mb-6">{market.market_summary || market.future_outlook || "Analyzing current job market trends..."}</p>
                                                   
                                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-primary-neon/20">
                                                          <h6 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-4">Top Employers (2025)</h6>
                                                          <ul className="space-y-3">
                                                              {((market.top_employers || []).slice(0, 4)).map((emp: any, i: number) => (
                                                                  <li key={i} className="flex flex-col gap-1 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                                      <span className="text-sm font-black text-white">{emp.name || emp.employer || emp}</span>
                                                                      {emp.type && <span className="text-[10px] text-zinc-500 font-bold uppercase">{emp.type}</span>}
                                                                  </li>
                                                              ))}
                                                              {(!market.top_employers || market.top_employers.length === 0) && (
                                                                  <span className="text-xs text-zinc-500 italic">No exact employer data available</span>
                                                              )}
                                                          </ul>
                                                      </div>
                                                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-primary-neon/20">
                                                          <h6 className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-4">Salary Estimates</h6>
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
                                                <div className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">Loading market intelligence...</div>
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
                                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">The Myth</span>
                                                            <p className="text-base text-zinc-400 font-bold italic">"{m.myth}"</p>
                                                        </div>
                                                    </div>
                                                    <div className="p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                                            <CheckCircle2 size={18} />
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">The Reality</span>
                                                            <p className="text-base text-emerald-400 font-black">{m.reality || m.fact}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">Loading fact-check data...</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </motion.div>
                )}

                {/* Final Message Card */}
                <div className="p-16 rounded-[3rem] bg-gradient-to-br from-primary-neon/20 via-primary-neon/5 to-transparent border border-primary-neon/20 shadow-2xl relative overflow-hidden group mb-8">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.1),transparent)] group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 text-center space-y-10">
                        <p className="text-2xl md:text-3xl text-white font-black leading-tight tracking-tight">
                            “This report reflects the student’s interests and abilities. <br className="hidden lg:block"/> 
                            Recommendations are generated based on their responses. <br className="hidden lg:block" />
                            Your role is to <span className="neon-text">support and guide</span> them.”
                        </p>
                        <div className="flex justify-center pt-4">
                            <button 
                                onClick={() => navigate('/')}
                                className="px-12 py-5 rounded-[2rem] bg-white/5 border border-white/10 text-zinc-400 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white/10 hover:text-white transition-all shadow-xl hover:shadow-primary-neon/10"
                            >
                                Exit Parent Mode
                            </button>
                        </div>
                    </div>
                </div>

            </div>

        </div>
        
        {/* AI Career Advisor Chatbot - Moved to top level with robust defaults */}
        {console.log("Chatbot Debug:", { selected_career, activeTab, isChatOpen, id })}
        <CareerChatbot 
            careerTitle={selected_career || "Career Advisor"}
            activeSection={activeTab}
            userProfile={personality || {}}
            matchScore={data?.student_match_score || 85}
            isOpen={isChatOpen}
            onOpen={() => setIsChatOpen(true)}
            onClose={() => setIsChatOpen(false)}
            accessId={id}
        />
    </>
);
}

export default ParentPortal;

