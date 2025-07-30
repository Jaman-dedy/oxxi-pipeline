'use client';
import React, { useState, JSX } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  User,
  Settings,
  LogOut,
  Activity,
  Zap,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Play,
  Users,
  Key,
  Bell,
  ChevronRight,
  ChevronDown,
  Rocket,
  Globe,
  Shield,
  HelpCircle
} from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Logo } from './ui/Logo';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps): JSX.Element {
  const pathname = usePathname();
  const { connected, deployments } = useWebSocket();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  // Calculate stats
  const runningDeployments = deployments.filter(d => d.status === 'running');
  const todayDeployments = deployments.filter(d => {
    const today = new Date();
    const deployDate = new Date(d.startTime);
    return deployDate.toDateString() === today.toDateString();
  });
  const successRate = deployments.length > 0 ? 
    Math.round((deployments.filter(d => d.status === 'success').length / deployments.length) * 100) : 100;

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const menuSections = [
    {
      id: 'overview',
      title: 'Overview',
      items: [
        { icon: Activity, label: 'Projects', href: '/projects', badge: null },
        { icon: BarChart3, label: 'Analytics', href: '/analytics', badge: 'Soon' },
        { icon: Clock, label: 'Activity', href: '/activity', badge: todayDeployments.length }
      ]
    },
    {
      id: 'deployment',
      title: 'Deployment',
      items: [
        { icon: Rocket, label: 'Deploy All Staging', href: '#', action: 'deployAllStaging' },
        { icon: Globe, label: 'System Status', href: '/status', badge: connected ? 'Online' : 'Offline' },
        { icon: Bell, label: 'Notifications', href: '/notifications', badge: runningDeployments.length || null }
      ]
    },
    {
      id: 'management',
      title: 'Management',
      items: [
        { icon: Users, label: 'Teams', href: '/teams', badge: 'Soon' },
        { icon: Key, label: 'API Keys', href: '/api-keys', badge: null },
        { icon: Shield, label: 'Security', href: '/security', badge: 'Soon' }
      ]
    }
  ];

  const isActive = (href: string): boolean => {
    if (href === '/projects') return pathname.startsWith('/projects');
    return pathname === href;
  };

  // Mock user data - replace with real auth later
  const user = {
    name: 'John Doe',
    email: 'john@ossix.com',
    avatar: null,
    role: 'Admin'
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 320 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-screen relative z-10"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Logo size="md" />
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={onToggle}
            className="p-2 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-ossix-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-white" />
          </div>
          
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </div>
                <div className="text-xs text-ossix-600 dark:text-ossix-400 font-medium">
                  {user.role}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats Dashboard */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="p-4 border-b border-slate-200 dark:border-slate-700"
          >
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Quick Stats
            </h3>
            
            <div className="space-y-3">
              {/* Running Deployments */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Running</span>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {runningDeployments.length}
                </span>
              </div>

              {/* Today's Deployments */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Today</span>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {todayDeployments.length}
                </span>
              </div>

              {/* Success Rate */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Success</span>
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  {successRate}%
                </span>
              </div>

              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Status</span>
                </div>
                <span className={`text-sm font-medium ${connected ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {connected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {menuSections.map((section) => (
            <div key={section.id}>
              {/* Section Header */}
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                  >
                    <span>{section.title}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${expandedSections.has(section.id) ? '' : '-rotate-90'}`} />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Section Items */}
              <AnimatePresence>
                {(isCollapsed || expandedSections.has(section.id)) && (
                  <motion.div
                    initial={!isCollapsed ? { opacity: 0, height: 0 } : false}
                    animate={!isCollapsed ? { opacity: 1, height: 'auto' } : false}
                    exit={!isCollapsed ? { opacity: 0, height: 0 } : false}
                    transition={{ duration: 0.2 }}
                    className="space-y-1"
                  >
                    {section.items.map((item) => {
                      const isItemActive = isActive(item.href);
                      
                      return (
                        <Link
                          key={item.label}
                          href={item.href === '#' ? '#' : item.href}
                          onClick={(e) => {
                            if (item.action === 'deployAllStaging') {
                              e.preventDefault();
                              // Implement deploy all staging logic here
                              console.log('Deploy all staging');
                            }
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${
                            isItemActive
                              ? 'bg-ossix-100 dark:bg-ossix-900/50 text-ossix-700 dark:text-ossix-300'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <item.icon className={`h-4 w-4 flex-shrink-0 ${
                              isItemActive ? 'text-ossix-600 dark:text-ossix-400' : ''
                            }`} />
                            
                            <AnimatePresence mode="wait">
                              {!isCollapsed && (
                                <motion.span
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -10 }}
                                  transition={{ duration: 0.15 }}
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>

                          {/* Badges */}
                          <AnimatePresence mode="wait">
                            {!isCollapsed && item.badge && (
                              <motion.span
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  item.badge === 'Soon'
                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                    : item.badge === 'Online'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : item.badge === 'Offline'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {item.badge}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="space-y-1">
          <Link
            href="/settings"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <Link
            href="/help"
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  Help & Support
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            onClick={() => {
              // Implement logout logic here
              console.log('Logout');
            }}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}