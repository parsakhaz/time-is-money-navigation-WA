'use client';

import { ReactNode, useState } from 'react';
import { BottomSheet } from '../sheets/BottomSheet';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

interface MobileLayoutProps {
  map: ReactNode;
  sheetContent: ReactNode;
}

export function MobileLayout({ map, sheetContent }: MobileLayoutProps) {
  const [snapPoint, setSnapPoint] = useState<number | string | null>('350px');

  const expandSheet = () => {
    setSnapPoint(1); // Full screen
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Full Screen Map */}
      <div className="flex-1 w-full">
        {map}
      </div>

      {/* Floating Search Button */}
      <Button
        onClick={expandSheet}
        size="icon"
        className="absolute top-4 left-4 z-[1200] rounded-full shadow-lg"
        aria-label="Expand route search"
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Bottom Sheet */}
      <BottomSheet activeSnap={snapPoint} onSnapChange={setSnapPoint}>
        {sheetContent}
      </BottomSheet>
    </div>
  );
}
