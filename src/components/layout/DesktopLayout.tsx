'use client';

import { ReactNode } from 'react';
import { SidePanel } from '../panels/SidePanel';

interface DesktopLayoutProps {
  map: ReactNode;
  panelContent: ReactNode;
}

export function DesktopLayout({ map, panelContent }: DesktopLayoutProps) {
  return (
    <div className="fixed inset-0">
      {/* Full Screen Map */}
      <div className="absolute inset-0">
        {map}
      </div>

      {/* Floating Side Panel */}
      <SidePanel>
        {panelContent}
      </SidePanel>
    </div>
  );
}
