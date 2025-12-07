'use client';

import { ReactNode, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface MobileLayoutProps {
  map: ReactNode;
  sheetContent: ReactNode;
}

export function MobileLayout({ map, sheetContent }: MobileLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Full Screen Map */}
      <div className="flex-1 w-full">
        {map}
      </div>

      {/* Floating Search Button */}
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        className="absolute top-4 left-4 z-[1000] rounded-full shadow-lg"
        aria-label="Open route search"
      >
        <Search className="h-5 w-5" />
      </Button>

      {/* Simple Sheet - Hidden by default */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" className="h-[90vh] overflow-auto">
          <SheetHeader>
            <SheetTitle>Route Search</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {sheetContent}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
