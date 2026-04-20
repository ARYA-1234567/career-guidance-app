import React from 'react';
import { motion } from 'framer-motion';
import { 
    Clock, LogIn, Target, Zap, 
    CheckCircle2, UserPlus, ShieldCheck 
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';

interface Activity {
    id: string;
    type: string;
    description: string;
    metadata: any;
    timestamp: string;
}

interface ActivityTimelineProps {
    activities: Activity[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
    const { t } = useLanguage();

    const getIcon = (type: string) => {
        switch (type) {
            case 'login': return <LogIn size={16} className="text-primary-neon" />;
            case 'account_created': return <UserPlus size={16} className="text-emerald-500" />;
            case 'career_selected': return <Target size={16} className="text-emerald-500" />;
            case 'simulation_executed': return <Zap size={16} className="text-secondary-neon" />;
            case 'task_completed': return <CheckCircle2 size={16} className="text-blue-500" />;
            default: return <Clock size={16} className="text-zinc-500" />;
        }
    };

    if (!activities || activities.length === 0) {
        return (
            <div className="p-8 text-center glass-card border-white/5 rounded-3xl">
                <ShieldCheck size={40} className="mx-auto text-zinc-700 mb-4 opacity-20" />
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{t('activity.clean')}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
            {activities.map((activity, index) => (
                <motion.div 
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative pl-12 group"
                >
                    {/* Icon Node */}
                    <div className="absolute left-0 top-0 w-10 h-10 rounded-xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center z-10 shadow-lg group-hover:border-primary-neon/30 transition-colors">
                        {getIcon(activity.type)}
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[8px] font-bold text-zinc-600 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                                {t(`activity.${activity.type}`)}
                            </span>
                        </div>
                        <p className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors">
                            {activity.description}
                        </p>
                        {activity.metadata && activity.metadata.career && (
                            <div className="text-[10px] text-primary-neon font-black uppercase tracking-tighter mt-1">
                                Strategy: {activity.metadata.career}
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default ActivityTimeline;
