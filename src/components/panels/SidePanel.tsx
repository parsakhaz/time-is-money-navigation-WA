'use client';

import { ReactNode } from 'react';

interface SidePanelProps {
  children: ReactNode;
}

export function SidePanel({ children }: SidePanelProps) {
  return (
    <div className="absolute top-4 left-4 z-[1000] w-96 max-h-[calc(100vh-2rem)]
                    overflow-auto bg-white rounded-xl shadow-2xl">
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
