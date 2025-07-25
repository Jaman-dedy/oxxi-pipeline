'use client';
import React, {JSX} from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps): JSX.Element {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };

  return (
    <div className="flex items-center space-x-3">
      <motion.div
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className={`${sizeClasses[size]} bg-gradient-to-br from-ossix-500 via-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden`}
      >
        <motion.div
          animate={{ 
            background: [
              'linear-gradient(45deg, #3b82f6, #8b5cf6)',
              'linear-gradient(45deg, #8b5cf6, #3b82f6)',
              'linear-gradient(45deg, #3b82f6, #8b5cf6)'
            ]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
        <span className="text-white font-bold text-sm relative z-10">O</span>
      </motion.div>
      
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizeClasses[size]} font-bold text-slate-900 dark:text-white leading-none`}>
            Ossix Pipeline
          </h1>
          <span className="text-xs text-ossix-600 dark:text-ossix-400 leading-none font-medium">
            by Ossix Technologies
          </span>
        </div>
      )}
    </div>
  );
}