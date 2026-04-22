import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, ReferenceLine
} from 'recharts';
import { motion } from 'framer-motion';
import { 
    ArrowLeft, Loader2, TrendingUp,
    Zap, 
    Crown, Search, ShieldCheck, List, Activity
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

const SimulationPage: React.FC = () => {
    const { careerId } = useParams<{ careerId: string }>();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    
    // Core State
    const [careerB, setCareerB] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [readOnly, setReadOnly] = useState(false);
    const [activeTab, setActiveTab] = useState<'Comparing' | 'Analysis' | 'Strategy'>('Comparing');
    
    // Sliders & Controls
    const [scenario, setScenario] = useState(t('simulation.scenarios.standard'));
    const [yearsBeforeSwitch, setYearsBeforeSwitch] = useState(3);
    const [location, setLocation] = useState("Kerala");
    const [education] = useState("None");
    const [workType, setWorkType] = useState("Job");
    const [customScenario, setCustomScenario] = useState("");

    // Effects
    useEffect(() => {
        if (!careerId) {
            navigate('/results');
            return;
        }

        const queryParams = new URLSearchParams(window.location.search);
        const isGuardianMode = queryParams.get('mode') === 'guardian';
        const storedSimData = localStorage.getItem('guardian_sim_data');

        // Parent/Read-Only Detection
        if ((state?.isReadOnly && state?.simulation_data) || (isGuardianMode && storedSimData)) {
            setReadOnly(true);
            const sim = (state?.simulation_data) || JSON.parse(storedSimData || "{}");
            if (sim.inputs) {
                setCareerB(sim.inputs.career_b || "");
                setScenario(sim.inputs.scenario || "");
                setLocation(sim.inputs.location || "Kerala");
                setYearsBeforeSwitch(sim.inputs.years_before_switch || 3);
                setWorkType(sim.inputs.work_type || "Job");
            }
            setData(sim.result);
            return;
        }

        runSimulation();
    }, [careerId, careerB, scenario, location, education, workType, yearsBeforeSwitch]);

    const runSimulation = async () => {
        if (!careerId || readOnly) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_BASE}/api/simulation/compare`, {
                career_a: careerId,
                career_b: careerB || "Alternative Path",
                user_profile: state?.profile || {},
                scenario: scenario === "Custom — type your own scenario" ? customScenario : scenario,
                location,
                years_before_switch: yearsBeforeSwitch,
                additional_education: education,
                work_type: workType
            }, {
                 headers: { Authorization: `Bearer ${token}` },
                 params: { language: language }
             });
            setData(res.data);
        } catch (err) {
            console.error("Simulation failed", err);
        } finally {
            setLoading(false);
        }
    };

    const chartData = useMemo(() => {
        if (!data || !data.career_a_data?.yearly_data) return [];
        return data.career_a_data.yearly_data.map((point: any, i: number) => ({
            year: `Year ${point.year}`,
            careerA: point.salary,
            careerB: data.career_b_data?.yearly_data?.[i]?.salary || 0,
            roleA: point.role,
            roleB: data.career_b_data?.yearly_data?.[i]?.role || "",
            milestoneA: point.milestone,
            milestoneB: data.career_b_data?.yearly_data?.[i]?.milestone || ""
        }));
    }, [data]);

    if (!careerId) return <div>{t('common.noCareerSelected')}</div>;

    return (
        <div className="min-h-screen bg-core text-white font-sans relative overflow-x-hidden selection:bg-blue-500/30 pt-20 pb-20">
            <div className="mesh-canvas" />
            <div className="mesh-blob bg-blue-500/10 top-0 left-0 w-[800px] h-[800px]" />
            <div className="mesh-blob bg-secondary-neon/5 bottom-0 right-0 w-[600px] h-[600px]" style={{ animationDelay: '2s' }} />

            {/* Nav Header */}
            <nav className="sticky top-0 z-50 bg-[#0a0a0a]/60 backdrop-blur-3xl border-b border-white/5 py-3 px-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('simulation.neuralSim')}</span>
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                                {careerId} <TrendingUp size={14} className="text-blue-500" /> {t('simulation.whatIf')}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex bg-white/5 p-1 rounded-xl border border-white/10">
                            {[
                                { id: 'Comparing', label: t('simulation.comparing') },
                                { id: 'Analysis', label: t('simulation.analysis') }
                            ].map(tab => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => {
                                        setActiveTab(tab.id as any);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-zinc-500 hover:text-zinc-300'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        {readOnly && (
                            <div className="px-4 py-2 border border-secondary-neon/30 bg-secondary-neon/10 rounded-xl flex items-center gap-2">
                                <ShieldCheck size={14} className="text-secondary-neon" />
                                <span className="text-[10px] font-black uppercase text-secondary-neon tracking-widest">{t('simulation.guardianMode')}</span>
                            </div>
                        )}

                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: CONTROLS */}
                <div className="lg:col-span-4 space-y-8">
                    <section className="space-y-6 bg-white/[0.03] border border-white/10 p-8 rounded-[2rem] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity animate-pulse" />
                        <div className="flex items-center gap-6">
                            <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 flex items-center gap-2">
                                <Activity size={12} className="animate-pulse" />
                                {t('simulation.liveSync')}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                    <Zap size={18} className="text-blue-500" />
                                </div>
                                <h2 className="font-black uppercase tracking-widest text-[10px] text-zinc-400">{t('simulation.whatIfMachine')}</h2>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl transition-all hover:border-blue-500/20">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-4 flex items-center gap-2">
                                     <Search size={12} className="text-blue-500" /> {t('simulation.compare')}
                                </label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder={t('simulation.compare') + "..."}
                                        className={`w-full bg-white/[0.03] border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-blue-500/50 focus:bg-white/[0.05] outline-none transition-all font-medium text-white placeholder:text-zinc-600 ${readOnly ? 'opacity-50 pointer-events-none' : ''}`}
                                        value={careerB}
                                        onChange={(e) => setCareerB(e.target.value)}
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>

                            <div className="p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl transition-all hover:border-blue-500/20">
                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-4">{t('simulation.scenario')}</label>
                                <select 
                                    className={`w-full bg-white/[0.03] border border-white/10 p-3 rounded-xl text-xs font-bold focus:outline-none text-white cursor-pointer hover:bg-white/[0.05] transition-colors ${readOnly ? 'opacity-50 pointer-events-none appearance-none' : ''}`}
                                    value={scenario}
                                    onChange={(e) => setScenario(e.target.value)}
                                    disabled={readOnly}
                                >
                                    <option className="bg-[#0a0a0a]" value={t('simulation.scenarios.standard')}>{t('simulation.scenarios.standard')}</option>
                                    <option className="bg-[#0a0a0a]" value={t('simulation.scenarios.aggressive')}>{t('simulation.scenarios.aggressive')}</option>
                                    <option className="bg-[#0a0a0a]" value={t('simulation.scenarios.global')}>{t('simulation.scenarios.global')}</option>
                                    <option className="bg-[#0a0a0a]" value={t('simulation.scenarios.entrepreneurial')}>{t('simulation.scenarios.entrepreneurial')}</option>
                                    <option className="bg-[#0a0a0a]" value={t('simulation.scenarios.pivot')}>{t('simulation.scenarios.pivot')}</option>
                                    <option className="bg-[#0a0a0a]" value={t('simulation.scenarios.custom')}>{t('simulation.scenarios.custom')}</option>
                                </select>
                            </div>

                            {(scenario === (language === 'ml' ? "നിങ്ങൾ ടൈപ്പ് ചെയ്ത സാഹചര്യം" : "Custom — type your own scenario")) && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                                    <textarea 
                                        placeholder={t('assessment.placeholder')}
                                        className={`w-full bg-[#0a0a0a] border border-blue-500/30 rounded-2xl p-4 text-sm focus:border-blue-500 focus:bg-blue-500/5 outline-none transition-all min-h-[100px] font-medium text-white shadow-inner ${readOnly ? 'opacity-50 pointer-events-none' : ''}`}
                                        value={customScenario}
                                        onChange={(e) => setCustomScenario(e.target.value)}
                                        disabled={readOnly}
                                    />
                                </motion.div>
                            )}

                            <div className="space-y-6 pt-2">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{t('simulation.timing')}</label>
                                        <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/20">{t('dashboard.timeEst') || 'Year'} {yearsBeforeSwitch}</span>
                                    </div>
                                    <input 
                                        type="range" min="1" max="10" step="1" 
                                        className={`w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-blue-500 ${readOnly ? 'opacity-50 pointer-events-none' : ''}`}
                                        value={yearsBeforeSwitch}
                                        onChange={(e) => setYearsBeforeSwitch(parseInt(e.target.value))}
                                        disabled={readOnly}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{language === 'ml' ? 'സ്ഥലം' : 'Location Focus'}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'Kerala', label: t('simulation.locations.kerala') },
                                            { id: 'Metro City', label: t('simulation.locations.metro') },
                                            { id: 'Gulf', label: t('simulation.locations.gulf') },
                                            { id: 'USA/EU', label: t('simulation.locations.overseas') }
                                        ].map(loc => (
                                            <button 
                                                key={loc.id} 
                                                onClick={() => !readOnly && setLocation(loc.id)}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${location === loc.id ? 'bg-blue-500 border-blue-400 text-black shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]'} ${readOnly && location !== loc.id ? 'opacity-30' : ''}`}
                                                disabled={readOnly}
                                            >
                                                {loc.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">{language === 'ml' ? 'ജോലി രീതി' : 'Work Modality'}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'Job', label: t('simulation.workTypes.career') },
                                            { id: 'Freelance', label: t('simulation.workTypes.free') },
                                            { id: 'Startup', label: t('simulation.workTypes.startup') },
                                            { id: 'Founder', label: t('simulation.workTypes.founder') }
                                        ].map(wt => (
                                            <button 
                                                key={wt.id} 
                                                onClick={() => !readOnly && setWorkType(wt.id)}
                                                className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${workType === wt.id ? 'bg-indigo-500 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-white/[0.03] border-white/10 text-zinc-400 hover:text-white hover:bg-white/[0.06]'} ${readOnly && workType !== wt.id ? 'opacity-30' : ''}`}
                                                disabled={readOnly}
                                            >
                                                {wt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section style={{ background: '#1a2740', border: '2px solid #3b82f6', boxShadow: '0 0 30px rgba(59,130,246,0.2)' }} className="p-8 rounded-[2rem]">
                         <div className="flex items-center gap-3 mb-4">
                            <div style={{ background: '#3b82f6' }} className="w-9 h-9 rounded-xl flex items-center justify-center">
                              <Zap size={18} style={{ color: 'white' }} />
                            </div>
                            <h3 style={{ color: '#93c5fd', letterSpacing: '0.15em' }} className="text-sm font-black uppercase">{t('simulation.verdict')}</h3>
                         </div>
                         <p style={{ color: 'white', lineHeight: '1.7' }} className="text-base font-semibold">
                            {data?.scenario_impact || t('simulation.defaultVerdict')}
                         </p>
                    </section>
                </div>

                
                {/* RIGHT COLUMN: VISUALIZATION */}
                <div className="lg:col-span-8 space-y-8">
                    {/* CHART AREA / ANALYSIS AREA / STRATEGY AREA */}
                    {activeTab === 'Comparing' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#111827", border: "1px solid #1f2937" }} className="p-8 rounded-[3rem] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                <TrendingUp size={200} />
                            </div>
                            
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black tracking-tight">{t('simulation.parallelGrowth')}</h2>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">{t('simulation.salaryComparison')}</p>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex items-center gap-2 text-emerald-500">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" /> {careerId}
                                    </div>
                                    <div className="flex items-center gap-2 text-blue-500">
                                        <div className="w-3 h-3 rounded-full bg-blue-500" /> {careerB || (language === 'ml' ? 'മറ്റൊന്ന്' : "Alternative")}
                                    </div>
                                </div>
                            </div>

                            <div className="h-[400px] w-full relative">
                                {loading && (
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                                        <Loader2 className="animate-spin text-blue-500 mb-4" size={40} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">{t('simulation.calculating')}</span>
                                    </div>
                                )}
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                        <XAxis dataKey="year" stroke="#444" fontSize={10} fontVariant="bold" axisLine={false} tickLine={false} />
                                        <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', padding: '16px' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                            labelStyle={{ color: '#666', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}
                                        />
                                        {data?.crossover_year && (
                                            <ReferenceLine x={`Year ${data.crossover_year}`} stroke="#333" strokeDasharray="5 5" label={{ position: 'top', value: 'Shift Point', fill: '#666', fontSize: 10, fontWeight: 'bold' }} />
                                        )}
                                        <Line 
                                            type="monotone" 
                                            dataKey="careerA" 
                                            stroke="#10b981" 
                                            strokeWidth={4} 
                                            dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} 
                                            activeDot={{ r: 8, stroke: '#10b981', strokeWidth: 4, fill: '#0a0a0a' }}
                                            animationDuration={2000}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="careerB" 
                                            stroke="#3b82f6" 
                                            strokeWidth={4} 
                                            dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} 
                                            activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 4, fill: '#0a0a0a' }}
                                            animationDuration={2000}
                                            animationBegin={500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Analysis' && (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                            <div style={{ background: "#111827", border: "1px solid #1f2937" }} className="p-8 rounded-[3rem] relative overflow-hidden">
                                <h3 className="text-xl font-black uppercase tracking-widest text-white mb-8 flex items-center gap-4">
                                    <List className="text-blue-500" /> {language === 'ml' ? 'വർഷം തിരിച്ചുള്ള വിശകലനം' : 'Year-by-Year Roadmap'}
                                </h3>
                                <div className="space-y-4">
                                    {data?.career_a_data?.yearly_data?.map((point: any, idx: number) => (
                                        <div key={idx} className="group flex items-center gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-zinc-500 group-hover:bg-blue-500 group-hover:text-black transition-all">
                                                YR{point.year}
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{careerId}</p>
                                                    <p className="text-xs font-bold text-white">{point.role}</p>
                                                    <p className="text-[10px] font-black text-emerald-500 mt-1">₹{point.salary} LPA</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">{careerB || 'Alternative'}</p>
                                                    <p className="text-xs font-bold text-white">{data.career_b_data?.yearly_data?.[idx]?.role || 'N/A'}</p>
                                                    <p className="text-[10px] font-black text-blue-500 mt-1">₹{data.career_b_data?.yearly_data?.[idx]?.salary || 0} LPA</p>
                                                </div>
                                            </div>
                                            {point.milestone && (
                                                <div className="hidden md:block px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase max-w-[150px] leading-tight">
                                                    {point.milestone}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}


                    {/* COMPARISON CARDS (Always visible for context) */}
                    {(activeTab === 'Comparing' || activeTab === 'Analysis') && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                style={{ background: '#0f2820', border: '2px solid #10b981', boxShadow: '0 0 30px rgba(16,185,129,0.15)' }}
                                className="p-8 rounded-[2.5rem] flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">PATH A</div>
                                            <h3 className="text-xl font-bold text-white leading-tight">{careerId}</h3>
                                        </div>
                                        {data?.winner_at_year_10 === careerId && <div className="p-2 rounded-lg bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"><Crown size={14} /></div>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '12px', padding: '12px' }}>
                                            <div style={{ color: '#6ee7b7' }} className="text-[9px] font-black uppercase mb-1">{language === 'ml' ? 'തുടക്കം (വർഷം 1)' : 'Entry (Yr 1)'}</div>
                                            <div className="text-lg font-black text-white">₹{data?.career_a_data?.yearly_data?.[0]?.salary || 'TBD'} LPA</div>
                                        </div>
                                        <div style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '12px', padding: '12px' }}>
                                            <div style={{ color: '#6ee7b7' }} className="text-[9px] font-black uppercase mb-1">{language === 'ml' ? 'ഉയർച്ച (വർഷം 10)' : 'Peak (Yr 10)'}</div>
                                            <div className="text-lg font-black text-white">₹{data?.career_a_data?.yearly_data?.[data?.career_a_data?.yearly_data?.length - 1]?.salary || 'TBD'} LPA</div>
                                        </div>
                                    </div>
                                    <div className="pt-2 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                            <span>{t('simulation.automationRisk')}</span>
                                            <span className="text-emerald-400">{data?.career_a_data?.risk_level || t('simulation.lowRisk')}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[20%]" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                                style={{ background: '#0f1a2e', border: '2px solid #3b82f6', boxShadow: '0 0 30px rgba(59,130,246,0.15)' }}
                                className="p-8 rounded-[2.5rem] flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">PATH B</div>
                                            <h3 className="text-xl font-bold text-white leading-tight">{careerB || (language === 'ml' ? 'കരിയർ ബി തിരഞ്ഞെടുക്കുക' : "Select Career B")}</h3>
                                        </div>
                                        {data?.winner_at_year_10 === careerB && <div className="p-2 rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-500/20"><Crown size={14} /></div>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '12px', padding: '12px' }}>
                                            <div style={{ color: '#93c5fd' }} className="text-[9px] font-black uppercase mb-1">{language === 'ml' ? 'തുടക്കം (വർഷം 1)' : 'Entry (Yr 1)'}</div>
                                            <div className="text-lg font-black text-white">₹{data?.career_b_data?.yearly_data?.[0]?.salary || 0} LPA</div>
                                        </div>
                                        <div style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '12px', padding: '12px' }}>
                                            <div style={{ color: '#93c5fd' }} className="text-[9px] font-black uppercase mb-1">{language === 'ml' ? 'ഉയർച്ח (വർഷം 10)' : 'Peak (Yr 10)'}</div>
                                            <div className="text-lg font-black text-white">₹{data?.career_b_data?.yearly_data?.[data?.career_b_data?.yearly_data?.length - 1]?.salary || 0} LPA</div>
                                        </div>
                                    </div>
                                    <div className="pt-2 space-y-2">
                                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                            <span>{t('simulation.marketVolatility')}</span>
                                            <span className="text-blue-400">{data?.career_b_data?.risk_level || "TBD"}</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[45%]" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default SimulationPage;
