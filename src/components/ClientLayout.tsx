'use client';
import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { CommandRunner } from '@/components/CommandRunner';
import { JSX } from 'react';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps): JSX.Element {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {children}
        </div>
      </main>
      
      {/* Universal Command Runner - Available everywhere! */}
      <CommandRunner />
    </div>
  );
}