'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

interface StatusIndicatorProps {
  connected: boolean;
}

export function StatusIndicator({ connected }: StatusIndicatorProps): React.JSX.Element {
  return (
    <div className="flex items-center space-x-2">
      <motion.div
        animate={{
          scale: connected ? [1, 1.1, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: connected ? Infinity : 0,
          ease: "easeInOut"
        }}
        className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
          connected
            ? 'bg-green-100 text-green-700 border border-green-200'
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}
      >
        {connected ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        <span>{connected ? 'Connected' : 'Disconnected'}</span>
      </motion.div>
    </div>
  );
}