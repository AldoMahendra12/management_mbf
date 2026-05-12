import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "Belum ada data",
  description = "Silakan tambahkan data baru untuk melihatnya di sini.",
  className
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-20 px-4 text-center",
        className
      )}
    >
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-50 rounded-full blur-2xl opacity-50 scale-150" />
        <div className="relative w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-300">
          <Icon size={36} strokeWidth={1.5} className="text-slate-300" />
        </div>
      </div>
      <h3 className="text-base font-bold text-slate-900 mb-1.5">
        {title}
      </h3>
      <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[320px]">
        {description}
      </p>
    </motion.div>
  );
}
