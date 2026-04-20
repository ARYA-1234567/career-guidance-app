import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface GenderSelectionModalProps {
  isOpen: boolean;
  onSelect: (gender: string) => void;
}

const GenderSelectionModal: React.FC<GenderSelectionModalProps> = ({ isOpen, onSelect }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-black border border-white/10 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative z-10 overflow-hidden"
          >
            <div className="p-12 text-center">
              <div className="flex justify-center mb-6">
                <div className="relative">
                   <Sparkles size={48} className="text-white opacity-80" />
                   <div className="absolute inset-0 blur-xl bg-white/20 animate-pulse" />
                </div>
              </div>

              <h3 className="text-4xl font-bold text-white mb-6 tracking-tight">Portrait Sync</h3>
              
              <p className="text-zinc-400 text-lg leading-relaxed mb-10 px-4">
                Synthesizing your future digital representation. <br />
                <span className="text-zinc-500 text-base mt-2 block italic">Choose your base identity.</span>
              </p>

              <div className="space-y-4 max-w-sm mx-auto">
                {/* Male Option */}
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect('male')}
                  className="w-full py-5 rounded-full border border-white/10 text-white font-black text-xl tracking-tight transition-all hover:border-white/30"
                >
                  Male
                </motion.button>

                {/* Female Option */}
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect('female')}
                  className="w-full py-5 rounded-full border border-white/10 text-white font-black text-xl tracking-tight transition-all hover:border-white/30"
                >
                  Female
                </motion.button>

                {/* Others Option */}
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect('others')}
                  className="w-full py-5 rounded-full border border-white/10 text-white font-black text-xl tracking-tight transition-all hover:border-white/30"
                >
                  Others
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GenderSelectionModal;
