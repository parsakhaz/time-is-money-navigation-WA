'use client';

import { ReactNode } from 'react';

interface SidePanelProps {
  children: ReactNode;
}

export function SidePanel({ children }: SidePanelProps) {
  return (
    <div className="absolute top-4 left-4 z-[1000] w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]
                    overflow-auto bg-white rounded-xl shadow-2xl scrollbar-minimal">
      <div className="p-4 min-w-0">
        {children}
      </div>
    </div>
  );
}
