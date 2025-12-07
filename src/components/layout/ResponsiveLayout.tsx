'use client';

import { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { MobileLayout } from './MobileLayout';
import { DesktopLayout } from './DesktopLayout';

interface ResponsiveLayoutProps {
  map: ReactNode;
  panelContent: ReactNode;
}

export function ResponsiveLayout({
  map,
  panelContent
}: ResponsiveLayoutProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileLayout
        map={map}
        sheetContent={panelContent}
      />
    );
  }

  return (
    <DesktopLayout
      map={map}
      panelContent={panelContent}
    />
  );
}
