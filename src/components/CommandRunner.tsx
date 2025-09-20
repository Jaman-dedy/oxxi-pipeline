'use client';
import React, { JSX, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Play, Clock, AlertCircle } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';

interface CommandData {
  name: string;
  command: string;
  workingDirectory: string;
  timeout?: number;
}

export function CommandRunner(): JSX.Element {
  const { connected, startCommand } = useWebSocket(); // You'll need to add this
  const [isOpen, setIsOpen] = useState(false);
  const [commandData, setCommandData] = useState<CommandData>({
    name: '',
    command: '',
    workingDirectory: '/Users/jeandedieuamani/all-in-one-jaman'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandData.name || !commandData.command) return;

    startCommand(commandData);
    setIsOpen(false);
    
    // Reset form
    setCommandData({
      name: '',
      command: '',
      workingDirectory: '/Users/jeandedieuamani/all-in-one-jaman'
    });
  };

  // Quick command templates
  const quickCommands = [
    {
      name: "List Files",
      command: "ls -la",
      workingDirectory: '/Users/jeandedieuamani/all-in-one-jaman'
    },
    {
      name: "Git Status",
      command: "git status",
      workingDirectory: '/Users/jeandedieuamani/all-in-one-jaman'
    },
    {
      name: "Check Disk Space",
      command: "df -h",
      workingDirectory: '/Users/jeandedieuamani/all-in-one-jaman'
    }
  ];

  if (!isOpen) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg z-50"
      >
        <Terminal className="h-6 w-6" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
          🚀 Universal Command Runner
        </h2>

        {/* Quick Commands */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
            Quick Commands:
          </h3>
          <div className="flex gap-2 flex-wrap">
            {quickCommands.map((cmd) => (
              <button
                key={cmd.name}
                onClick={() => setCommandData(cmd)}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                {cmd.name}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Command Name
            </label>
            <input
              type="text"
              value={commandData.name}
              onChange={(e) => setCommandData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Deploy Web App"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Command
            </label>
            <input
              type="text"
              value={commandData.command}
              onChange={(e) => setCommandData(prev => ({ ...prev, command: e.target.value }))}
              placeholder="e.g., kubectl apply -f deployment.yaml"
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Working Directory
            </label>
            <input
              type="text"
              value={commandData.workingDirectory}
              onChange={(e) => setCommandData(prev => ({ ...prev, workingDirectory: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!connected || !commandData.name || !commandData.command}
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-4 w-4 mr-2" />
              Run Command
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}