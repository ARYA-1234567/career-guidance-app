import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ShieldCheck, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface ParentAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ParentAccessModal: React.FC<ParentAccessModalProps> = ({ isOpen, onClose }) => {
  const [parentId, setParentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentId.trim()) {
      setError("Please enter your Parent ID.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await axios.get(`${API_BASE}/api/parent/lookup/${parentId.trim().toUpperCase()}`);
      if (res.data.status === 'ready') {
        onClose();
        navigate(`/parent/${parentId.trim()}`);
      } else if (res.data.status === 'pin_required') {
        setError("Invalid PIN. Please check your notification.");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid Parent ID. Please check the student's dashboard.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-zinc-950/90 backdrop-blur-3xl rounded-[2.5rem] w-full max-w-md shadow-2xl relative z-10 overflow-hidden border border-white/10"
          >
             <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors z-20"
              >
                <X size={20} />
              </button>

            <div className="p-10">
              <div className="text-center mb-10 pt-10">
                <div className="w-16 h-16 rounded-2xl bg-secondary-neon/10 flex items-center justify-center mx-auto mb-6 text-secondary-neon border border-secondary-neon/20 shadow-2xl shadow-secondary-neon/20">
                  <ShieldCheck size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Parent Access</h3>
                <p className="text-zinc-500 text-sm mt-2">Enter your Unique Access ID</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Parent ID</label>
                  <div className="relative group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-secondary-neon transition-colors" />
                    <input 
                      type="text" 
                      placeholder="PARENT_XXXX"
                      value={parentId}
                      onChange={(e) => setParentId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:border-secondary-neon focus:bg-white/[0.08] transition-all font-bold uppercase tracking-widest"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl text-[11px] font-bold leading-relaxed">
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-5 rounded-2xl bg-secondary-neon text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-lg hover:shadow-secondary-neon/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : (
                    <>
                      Verify Access
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ParentAccessModal;
