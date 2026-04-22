import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, Users, ArrowRight, Compass, Target, 
  Map, Sparkles, Languages
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import AuthModal from '../components/AuthModal';
import ParentAccessModal from '../components/ParentAccessModal';

const LandingPage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [parentModalOpen, setParentModalOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden px-6 pt-28 pb-20 bg-core">
      {/* Background Elements */}
      <div className="mesh-canvas" />
      <div className="mesh-blob bg-primary-neon/10 top-0 left-0 w-[800px] h-[800px]" />
      <div className="mesh-blob bg-secondary-neon/5 bottom-0 right-0 w-[600px] h-[600px]" style={{ animationDelay: '2s' }} />

      {/* Language Switcher Overlay */}
      <div className="fixed top-8 right-8 z-[100] flex items-center gap-4">
        <button 
          onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
          className="px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-primary-neon/50 transition-all backdrop-blur-3xl group flex items-center gap-3 active:scale-95"
        >
          <Languages size={18} className="text-primary-neon group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-black tracking-widest uppercase text-white/60 group-hover:text-white transition-colors">
            {language === 'en' ? 'മലയാളം' : 'ENGLISH'}
          </span>
        </button>
      </div>

      <div className="max-w-7xl mx-auto relative z-10 text-center">
        {/* Futuristic Badge */}
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 px-6 py-2 rounded-full glass-card border-white/5 mb-12 shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.02)' }}
        >
            <div className="w-2 h-2 rounded-full bg-primary-neon animate-pulse shadow-[0_0_10px_#6366f1]"></div>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400">{t('landing.badge')}</span>
        </motion.div>

        {/* Hero Title Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mb-20"
        >
          <h1 className="hero-title mb-8" style={{ fontSize: 'clamp(3.5rem, 10vw, 7.5rem)' }}>
            {t('landing.title1')} <br />
            <span className="neon-text">{t('landing.title2')}</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl md:text-2xl text-text-dim leading-relaxed font-bold tracking-tight">
            {t('landing.subtitle')}
          </p>
        </motion.div>

        {/* Main Entry Modes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-24 relative z-10">
          {/* Student Mode Button */}
          <motion.button
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAuthModalOpen(true)}
            className="flex flex-col items-center justify-center p-12 glass-card border-white/5 hover:border-primary-neon/30 transition-all group relative overflow-hidden text-center"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-neon/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />
            
            <div className="w-20 h-20 rounded-3xl bg-primary-neon/20 flex items-center justify-center mb-8 border border-primary-neon/30 relative z-10 shadow-2xl">
              <GraduationCap size={40} className="text-primary-neon" />
            </div>
            
            <h2 className="text-3xl font-black text-white mb-4">{t('landing.studentMode')}</h2>
            <p className="text-zinc-500 font-medium mb-8">{t('landing.studentDesc')}</p>
            
            <div className="flex items-center gap-3 text-primary-neon font-black uppercase tracking-widest text-[11px] group-hover:translate-x-1 transition-transform">
              {t('landing.studentBtn')} <ArrowRight size={16} />
            </div>
          </motion.button>

          {/* Parent Mode Button */}
          <motion.button
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setParentModalOpen(true)}
            className="flex flex-col items-center justify-center p-12 glass-card border-white/5 hover:border-secondary-neon/30 transition-all group relative overflow-hidden text-center"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-neon/10 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />

            <div className="w-20 h-20 rounded-3xl bg-secondary-neon/20 flex items-center justify-center mb-8 border border-secondary-neon/30 relative z-10 shadow-2xl">
              <Users size={40} className="text-secondary-neon" />
            </div>

            <h2 className="text-3xl font-black text-white mb-4">{t('landing.parentMode')}</h2>
            <p className="text-zinc-500 font-medium mb-8">{t('landing.parentDesc')}</p>

            <div className="flex items-center gap-3 text-secondary-neon font-black uppercase tracking-widest text-[11px] group-hover:translate-x-1 transition-transform">
              {t('landing.parentBtn')} <ArrowRight size={16} />
            </div>
          </motion.button>
        </div>

        {/* Minimalist Intelligence Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-12 border-t border-white/5">
           {[
             { icon: Compass, label: t('landing.featureDiscovery'), color: "text-primary-neon" },
             { icon: Target, label: t('landing.featurePrecision'), color: "text-secondary-neon" },
             { icon: Map, label: t('landing.featureRoadmaps'), color: "text-accent-rose" },
             { icon: Sparkles, label: t('landing.featureAIExperts'), color: "text-purple-400" }
           ].map((feat, i) => (
             <div key={i} className="flex flex-col items-center gap-3">
               <feat.icon size={20} className={`${feat.color} opacity-60`} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{feat.label}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Modals */}
      <AuthModal 
        isOpen={authModalOpen} 
        onClose={() => setAuthModalOpen(false)} 
      />
      <ParentAccessModal 
        isOpen={parentModalOpen} 
        onClose={() => setParentModalOpen(false)} 
      />
    </div>
  );
};

export default LandingPage;
