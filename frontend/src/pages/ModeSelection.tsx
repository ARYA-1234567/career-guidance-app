import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const ModeSelection: React.FC = () => {
    const { language } = useLanguage();
    const navigate = useNavigate();
    const { selectedCareer } = useAuth();

    const handleInitiate = () => {
        navigate('/assessment');
    };

    return (
        <div className="min-h-screen bg-core flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans text-white">
            {/* Background elements */}
            <div className="mesh-canvas" />
            <div className="mesh-blob bg-primary-neon/10 top-[-10%] left-[-10%] w-[800px] h-[800px]" />
            <div className="mesh-blob bg-secondary-neon/10 bottom-[-10%] right-[-10%] w-[600px] h-[600px]" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl w-full relative z-10 text-center"
            >
                <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="inline-flex p-4 rounded-3xl bg-white/[0.03] border border-white/5 mb-8"
                >
                    <Sparkles size={40} className="text-secondary-neon" />
                </motion.div>
                
                <h1 className="text-5xl md:text-7xl font-black mb-6 hero-title tracking-tight leading-tight">
                    {t('discovery.initiate')}
                </h1>
                
                <p className="max-w-2xl mx-auto text-zinc-500 text-lg md:text-xl font-bold mb-16 tracking-tight">
                    {t('discovery.subtitle')}
                </p>

                <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                    <motion.button
                        whileHover={{ scale: 1.05, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleInitiate}
                        className="group relative inline-flex items-center justify-center"
                    >
                        <div className="absolute inset-0 bg-secondary-neon blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative px-12 py-8 rounded-[2rem] bg-secondary-neon text-white font-black text-xl uppercase tracking-[0.2em] shadow-2xl flex items-center gap-6 hover:bg-emerald-600 transition-all border border-white/20">
                            {t('discovery.beginBtn')}
                            <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
                        </div>
                    </motion.button>

                    {selectedCareer && (
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.05, y: -5 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/results', { state: { focusMode: true } })}
                            className="group relative inline-flex items-center justify-center w-full md:w-auto"
                        >
                            <div className="absolute inset-0 bg-primary-neon blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
                            <div className="relative px-12 py-8 rounded-[2rem] bg-indigo-500/10 text-primary-neon font-black text-xl uppercase tracking-[0.2em] shadow-2xl flex flex-col items-center gap-2 hover:bg-indigo-500/20 transition-all border border-primary-neon/30 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    {t('discovery.goToCareer')}
                                    <ShieldCheck size={28} className="group-hover:rotate-12 transition-transform color-primary-neon" />
                                </div>
                                <span className="text-[10px] text-zinc-500 font-bold opacity-60 tracking-[0.3em]">{selectedCareer}</span>
                            </div>
                        </motion.button>
                    )}
                </div>
                
                <div className="mt-20 flex items-center justify-center gap-8 border-t border-white/5 pt-12">
                   {[
                     { icon: ShieldCheck, label: t('discovery.privateSecure') },
                     { icon: Sparkles, label: t('discovery.aiPowered') },
                     { icon: ArrowRight, label: t('discovery.zeroFriction') }
                   ].map((item, i) => (
                     <div key={i} className="flex items-center gap-2 opacity-50">
                       <item.icon size={14} className="text-secondary-neon" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-white">{item.label}</span>
                     </div>
                   ))}
                </div>
            </motion.div>
        </div>
    );
};

export default ModeSelection;
