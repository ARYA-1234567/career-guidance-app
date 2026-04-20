import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, ShieldCheck, CheckCircle2, 
    ArrowRight, Loader2, Users, Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ParentSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ParentSettingsModal: React.FC<ParentSettingsModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);

    // Settings loading animation
    useEffect(() => {
        if (isOpen) {
            setFetching(true);
            setTimeout(() => setFetching(false), 800);
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - Subtle and clickable to close */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[150] bg-core/40 backdrop-blur-sm"
                    />
                    
                    {/* Side Panel Drawer */}
                    <motion.div 
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '-100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-[72px] bottom-0 w-[400px] z-[160] border-r border-white/5 overflow-hidden flex flex-col"
                        style={{
                            background: 'rgba(10, 10, 25, 0.98)',
                            backdropFilter: 'blur(50px)',
                            boxShadow: '20px 0 50px rgba(0,0,0,0.5)'
                        }}
                    >
                        {/* Decorative Gradient Overlay */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-neon/5 blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                        
                        {/* Header */}
                        <div className="p-10 pb-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-secondary-neon/10 border border-secondary-neon/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                    <ShieldCheck size={24} className="text-secondary-neon" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black hero-title text-white">Guardian Hub</h3>
                                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500">Access Management</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/20"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            {fetching ? (
                                <div className="h-full flex flex-col items-center justify-center gap-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary-neon/20 blur-xl rounded-full" />
                                        <Loader2 className="animate-spin text-primary-neon relative z-10" size={40} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 animate-pulse">Establishing Secure Tunnel...</p>
                                </div>
                            ) : (
                                <div className="space-y-10">
                                    {/* Detailed Guide */}
                                    <div className="p-6 rounded-3xl bg-secondary-neon/5 border border-secondary-neon/10 space-y-4">
                                       <div className="flex items-center gap-3 text-secondary-neon">
                                           <div className="w-6 h-6 rounded-full bg-secondary-neon/20 flex items-center justify-center">
                                               <Info size={12} />
                                           </div>
                                           <span className="text-[10px] font-black uppercase tracking-widest">Student-First Privacy</span>
                                       </div>
                                       <p className="text-[11px] text-zinc-400 leading-relaxed font-bold uppercase tracking-tight">
                                           Your roadmap data is currently PRIVATE. Share these static credentials with your guardian to grant them <span className="text-secondary-neon">READ-ONLY</span> access to your career progress.
                                       </p>
                                    </div>

                                    {/* Credentials Section */}
                                    <div className="space-y-8">
                                        {user ? (
                                            <div className="space-y-6">
                                                {/* Student ID Card */}
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Student User ID</label>
                                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-primary-neon/30 transition-all">
                                                        <code className="flex-1 font-black text-xl text-white tracking-widest uppercase">
                                                            {user.user_id}
                                                        </code>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(user.user_id || '');
                                                                setSuccess(true);
                                                                setTimeout(() => setSuccess(false), 2000);
                                                            }}
                                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-primary-neon text-zinc-400 hover:text-black transition-all"
                                                        >
                                                            <Users size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Parent Access ID Card */}
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between px-1">
                                                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary-neon">Parent Access ID</label>
                                                        <span className="text-[8px] font-bold text-secondary-neon/50 uppercase tracking-widest border border-secondary-neon/20 px-2 py-0.5 rounded-full">Guardian Only</span>
                                                    </div>
                                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-secondary-neon/5 border border-secondary-neon/20 group hover:border-secondary-neon/50 transition-all">
                                                        <code className="flex-1 font-black text-xl text-secondary-neon tracking-widest uppercase">
                                                            {user.parent_id || 'NOT_FOUND'}
                                                        </code>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(user.parent_id || '');
                                                                setSuccess(true);
                                                                setTimeout(() => setSuccess(false), 2000);
                                                            }}
                                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-secondary-neon text-zinc-400 hover:text-black transition-all"
                                                        >
                                                            <Users size={16} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Security PIN Card */}
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Security PIN</label>
                                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/5 group hover:border-primary-neon/30 transition-all">
                                                        <code className="flex-1 font-black text-xl text-white tracking-[0.4em]">
                                                            {user.parent_pin || '----'}
                                                        </code>
                                                        <button 
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(user.parent_pin || '');
                                                                setSuccess(true);
                                                                setTimeout(() => setSuccess(false), 2000);
                                                            }}
                                                            className="p-2.5 rounded-xl bg-white/5 hover:bg-primary-neon text-zinc-400 hover:text-black transition-all"
                                                        >
                                                            <ShieldCheck size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-8 rounded-[40px] border border-zinc-800/50 bg-zinc-900/20 flex flex-col items-center text-center gap-5">
                                                <div className="w-16 h-16 rounded-3xl bg-zinc-950 flex items-center justify-center border border-white/5 shadow-2xl">
                                                    <ShieldCheck size={24} className="text-zinc-700" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Access Not Generated</h4>
                                                    <p className="text-[10px] text-zinc-600 font-bold leading-relaxed px-2">
                                                        You did not choose to generate parent credentials during signup. Your account remains strictly private.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Feedback Alert */}
                                    <AnimatePresence>
                                        {success && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                                            >
                                                <CheckCircle2 size={16} className="animate-bounce" /> Verified & Copied
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Portal Link Tip */}
                                    <div className="p-8 rounded-[40px] border border-white/5 bg-white/[0.01] flex flex-col items-center text-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 font-black text-xl">?</div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed px-4">
                                            Parent Login is available at the Guardian Portal link on the main website.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="p-10 pt-6 border-t border-white/5">
                            <button 
                                onClick={onClose}
                                className="glow-btn w-full py-5 flex items-center justify-center gap-3 uppercase font-black tracking-[0.3em] text-[10px] transition-all bg-zinc-900 group"
                            >
                                Close HUB <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ParentSettingsModal;
