'use client';

import { ReactNode } from 'react';
import { BottomSheet } from '../sheets/BottomSheet';

interface MobileLayoutProps {
  map: ReactNode;
  sheetContent: ReactNode;
}

export function MobileLayout({ map, sheetContent }: MobileLayoutProps) {
  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Full Screen Map */}
      <div className="flex-1 w-full">
        {map}
      </div>

      {/* Bottom Sheet */}
      <BottomSheet>
        {sheetContent}
      </BottomSheet>
    </div>
  );
}
