import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, LogOut, ShieldCheck, Sparkles, User, Map, Zap, Languages, Brain, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import ParentSettingsModal from './ParentSettingsModal';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const { selectedCareer, logout } = useAuth();
  const [hovered, setHovered] = useState<string | null>(null);
  const [isParentModalOpen, setIsParentModalOpen] = useState(false);

  const isLandingPage = location.pathname === '/';
  const isAuthPage = location.pathname === '/auth';
  const isParentRoute = location.pathname.startsWith('/parent/');
  
  if (isLandingPage || isAuthPage) return null;

  let navItems = [
    { id: 'home',       label: t('nav.home'),       icon: Home,     path: '/dashboard',  color: '#6366f1' }, // Indigo
    { id: 'discovery',  label: t('nav.discovery'),  icon: Sparkles, path: '/results',    color: '#06b6d4' }, // Cyan
    { id: 'profile',    label: t('nav.profile'),    icon: User,     path: '/dashboard',  color: '#f43f5e' }, // Rose
    { id: 'career',     label: t('nav.careerNode'), icon: Target, path: '/career', color: '#10b981', locked: !selectedCareer },
    { id: 'roadmap',    label: t('nav.roadmap'),    icon: Map,      path: '/roadmap',    color: '#10b981' },
    { id: 'parent-access', label: t('nav.parentAccess'), icon: ShieldCheck, path: '#parent', color: '#06b6d4', isModal: true },
  ];

  if (isParentRoute) {
    navItems = [
      { id: 'assessment', label: t('nav.assessmentAnalysis'), icon: Brain, path: `${location.pathname}#assessment`, color: '#f59e0b' },
      { id: 'trajectory', label: t('nav.careerTrajectory'), icon: Target, path: `${location.pathname}#trajectory`, color: '#10b981' },
    ];
  }

  const simItem = { 
    id: 'simulation', 
    label: t('nav.simulation'), 
    icon: Zap, 
    path: isParentRoute ? `${location.pathname}#simulation` : (selectedCareer ? `/simulation/${encodeURIComponent(selectedCareer)}` : '/results'), 
    color: '#a78bfa', 
    locked: !selectedCareer && !isParentRoute 
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (isParentRoute) {
        return location.hash === path.split('#')[1] || (location.hash === '' && path.endsWith('#assessment'));
    }
    return location.pathname === path;
  };

  return (
    <motion.nav
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 h-full z-[100] flex flex-col"
      style={{
        width: '72px',
        background: 'rgba(8, 8, 20, 0.95)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
      }}
    >
      {/* Brand Logo */}
      <motion.div
        className="flex flex-col items-center justify-center pt-10 pb-4 cursor-pointer group"
        onClick={() => navigate('/dashboard')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
          }}
        >
          <ShieldCheck size={24} className="text-primary-neon" style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
        </div>
      </motion.div>

      {/* Nav Items - Removed flex-1 justify-center to bring items closer */}
      <div className="flex flex-col items-center gap-1 py-4">
        {navItems.map(({ id, label, icon: Icon, path, locked, color }) => {
          const active = isActive(path);
          const isParentAccess = id === 'parent-access';
          const isModalActive = isParentAccess && isParentModalOpen;
          
          return (
            <div key={id} className="relative group/item">
              <motion.button
                onClick={() => {
                   if (locked) return;
                   if (isParentAccess) {
                     setIsParentModalOpen(true);
                   } else {
                     navigate(path);
                   }
                }}
                onHoverStart={() => setHovered(id)}
                onHoverEnd={() => setHovered(null)}
                whileHover={locked ? {} : { scale: 1.1 }}
                whileTap={locked ? {} : { scale: 0.9 }}
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${locked ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
                style={{
                  background: active || isModalActive ? `${color}15` : 'transparent',
                  border: active || isModalActive ? `1px solid ${color}30` : '1px solid transparent',
                }}
              >
                <Icon
                  size={22}
                  className={`transition-all duration-300 ${
                    active || isModalActive ? '' : 'text-zinc-500 group-hover/item:text-zinc-200'
                  }`}
                  style={{ color: (active || isModalActive) ? color : undefined }}
                />
                {locked && <div className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-800 rounded-full border border-white/10 flex items-center justify-center z-10"><ShieldCheck size={8} className="text-zinc-500" /></div>}
              </motion.button>

              {/* Tooltip */}
              <AnimatePresence>
                {hovered === id && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute left-[70px] top-1/2 -translate-y-1/2 px-4 py-2 bg-core border border-white/10 rounded-xl whitespace-nowrap z-[110] shadow-2xl pointer-events-none"
                  >
                    <span className="text-xs font-black uppercase tracking-widest text-white">{label}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Bottom Actions: Language & Sign Out */}
      <div className="flex flex-col items-center pt-2 pb-1 border-t border-white/5 gap-1">
        {/* Career Simulation - Repositioned Downward */}
        <div className="relative group/sim">
          <motion.button
            onClick={() => {
              if (simItem.locked) return;
              navigate(simItem.path);
            }}
            onHoverStart={() => setHovered('simulation')}
            onHoverEnd={() => setHovered(null)}
            whileHover={simItem.locked ? {} : { scale: 1.1 }}
            whileTap={simItem.locked ? {} : { scale: 0.9 }}
            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${simItem.locked ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
            style={{
              background: isActive(simItem.path) ? `${simItem.color}15` : 'rgba(255, 255, 255, 0.02)',
              border: isActive(simItem.path) ? `1px solid ${simItem.color}30` : '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Zap 
              size={22} 
              className={`transition-all duration-300 ${isActive(simItem.path) ? '' : 'text-zinc-500 group-hover/sim:text-white'}`} 
              style={{ color: isActive(simItem.path) ? simItem.color : undefined }}
            />
          </motion.button>
          
          <AnimatePresence>
            {hovered === 'simulation' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-[70px] top-1/2 -translate-y-1/2 px-4 py-2 bg-core border border-white/10 rounded-xl whitespace-nowrap z-[110] shadow-2xl"
              >
                <span className="text-xs font-black uppercase tracking-widest text-white">{simItem.label}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sign Out - Moved Up */}
        <div className="relative group/out">
          <motion.button
             onClick={() => { logout(); navigate('/'); }}
             onHoverStart={() => setHovered('signout')}
             onHoverEnd={() => setHovered(null)}
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.9 }}
             className="relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white/[0.02] border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20"
          >
            <LogOut size={20} className="text-zinc-500 group-hover/out:text-rose-400 transition-colors" />
          </motion.button>
          
          <AnimatePresence>
            {hovered === 'signout' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-[70px] top-1/2 -translate-y-1/2 px-4 py-2 bg-core border border-rose-500/20 rounded-xl whitespace-nowrap z-[110] shadow-2xl"
              >
                <span className="text-xs font-black uppercase tracking-widest text-rose-400">
                  {t('nav.signout')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Language Toggle */}
        <div className="relative group/lang">
          <motion.button
            onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
            onHoverStart={() => setHovered('lang')}
            onHoverEnd={() => setHovered(null)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white/[0.02] border border-white/5 hover:border-primary-neon/30"
          >
            <Languages size={20} className="text-zinc-500 group-hover/lang:text-primary-neon transition-colors" />
            <span className="absolute bottom-1 right-1 text-[8px] font-black text-primary-neon/70 uppercase">
              {language === 'en' ? 'EN' : 'ML'}
            </span>
          </motion.button>

          <AnimatePresence>
            {hovered === 'lang' && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="absolute left-[70px] top-1/2 -translate-y-1/2 px-4 py-2 bg-core border border-primary-neon/20 rounded-xl whitespace-nowrap z-[110] shadow-2xl"
              >
                <span className="text-xs font-black uppercase tracking-widest text-primary-neon">
                  {t('nav.switchLanguage')}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Modals */}
      <ParentSettingsModal 
        isOpen={isParentModalOpen} 
        onClose={() => setIsParentModalOpen(false)} 
      />
    </motion.nav>
  );
};

export default Navbar;
