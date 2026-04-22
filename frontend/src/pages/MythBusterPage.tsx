import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    XCircle, CheckCircle2, TrendingUp, 
    ArrowLeft, Sparkles, MapPin, Search
} from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const API_BASE = import.meta.env.VITE_API_URL || '';

const MythBusterPage: React.FC = () => {
    const navigate = useNavigate();
    const { language, t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [myths, setMyths] = useState<any[]>([]);

    useEffect(() => {
        async function fetchMyths() {
            try {
                const { data } = await axios.get(`${API_BASE}/api/myths`, {
                    params: { language: language }
                });
                setMyths(data.myths.myths || data.myths);
            } catch (err) {
                console.error("Myth fetch failed:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchMyths();
    }, [language]);

    if (loading) return (
        <div className="min-h-screen bg-core flex flex-col items-center justify-center space-y-8 px-6 text-center pt-32">
            <div className="mesh-canvas" />
            <div className="mesh-blob bg-accent-rose/10 top-0 left-[-10%] w-[800px] h-[800px]" />
            <div className="relative">
                <div className="w-24 h-24 border-4 border-accent-rose/20 border-t-accent-rose rounded-full animate-spin" />
                <Search className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-accent-rose" size={32} />
            </div>
            <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2 tracking-tight">{t('mythBuster.loading')}</h2>
                <p className="text-zinc-500 text-sm italic">{t('mythBuster.loadingDesc')}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-core text-white font-sans relative overflow-x-hidden pt-32 pb-20">
            <div className="mesh-canvas" />
            <div className="mesh-blob bg-accent-rose/5 top-0 left-0 w-[800px] h-[800px]" />
            
            <motion.main 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-6xl mx-auto relative z-10 px-6 text-center"
            >
                 <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-card border-white/5 mb-8">
                   <Sparkles size={16} className="text-accent-rose animate-pulse" />
                   <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{t('mythBuster.realityCheck')}</span>
                 </motion.div>
                
                 <h1 className="text-5xl md:text-7xl font-black hero-title mb-6">{t('results.mythBuster')}</h1>
                <p className="max-w-2xl mx-auto text-text-dim text-xl font-medium tracking-tight">
                    {t('mythBuster.subtitle')}
                </p>

                <div className="mt-20 space-y-12 max-w-4xl mx-auto">
                    {myths.map((myth, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="glass-card p-12 border-white/5 hover:border-white/10 transition-all text-left relative overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
                                <div className="space-y-6">
                                 <span className="text-[10px] font-black tracking-[0.2em] text-zinc-600 uppercase flex items-center gap-2">
                                      <XCircle size={16} className="text-red-500" /> {t('mythBuster.myth')}
                                 </span>
                                 <h3 className="text-2xl font-bold text-white leading-tight underline decoration-red-500/30 decoration-4 underline-offset-8 italic opacity-80">{myth.myth}</h3>
                                </div>

                                <div className="space-y-6">
                                 <span className="text-[10px] font-black tracking-[0.2em] text-zinc-600 uppercase flex items-center gap-2">
                                      <CheckCircle2 size={16} className="text-emerald-500" /> {t('mythBuster.reality')}
                                 </span>
                                 <h3 className="text-2xl font-black text-emerald-400 leading-tight underline decoration-emerald-500/30 decoration-4 underline-offset-8">{myth.reality || myth.fact}</h3>
                                </div>
                            </div>

                            <div className="mt-12 pt-8 border-t border-white/5 space-y-6 relative z-10">
                                 <span className="text-[10px] font-black tracking-[0.2em] text-zinc-600 uppercase flex items-center gap-2">
                                      <TrendingUp size={16} className="text-secondary-neon" /> {t('mythBuster.proof')}
                                 </span>
                                 <p className="text-zinc-300 leading-relaxed font-bold tracking-tight text-lg">
                                     {myth.data_proof}
                                 </p>
                            </div>

                             {/* CONTEXT CHIP */}
                             {myth.kerala_context && (
                             <div className="absolute top-12 right-12 hidden md:block group">
                              <div className="absolute inset-0 bg-secondary-neon/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="px-6 py-2 rounded-2xl bg-secondary-neon/5 border border-secondary-neon/10 backdrop-blur-md relative">
                                  <span className="text-[9px] items-center font-black tracking-[0.2em] text-zinc-600 uppercase flex gap-2 mb-3 relative z-10">
                                      <MapPin size={14} className="text-secondary-neon" /> {t('mythBuster.keralaContext')}
                                  </span>
                                  <p className="text-[10px] font-bold text-secondary-neon/80 max-w-[200px] leading-snug relative z-10">
                                      {myth.kerala_context}
                                  </p>
                              </div>
                             </div>
                             )}
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20">
                  <button onClick={() => navigate('/auth')} className="glow-btn px-12 py-5 text-xl">
                      {t('mythBuster.startJourney')}
                  </button>
                </div>

                <footer className="mt-20 flex items-center justify-center gap-8 text-zinc-600">
                    <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                        <ArrowLeft size={16} /> {t('mythBuster.primaryPort')}
                    </button>
                </footer>
            </motion.main>
        </div>
    );
};

export default MythBusterPage;
