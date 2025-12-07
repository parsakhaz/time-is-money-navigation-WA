'use client';

import { Drawer } from 'vaul';
import { ReactNode, useState } from 'react';

interface BottomSheetProps {
  children: ReactNode;
  defaultSnap?: number | string;
}

const SNAP_POINTS = ['148px', '50%', 1] as const;

export function BottomSheet({ children, defaultSnap = '50%' }: BottomSheetProps) {
  const [snap, setSnap] = useState<number | string | null>(defaultSnap);

  return (
    <Drawer.Root
      open={true}
      modal={false}
      snapPoints={[...SNAP_POINTS]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      dismissible={false}
    >
      <Drawer.Portal>
        <Drawer.Content
          className="fixed bottom-0 left-0 right-0 z-[1100] flex flex-col rounded-t-2xl bg-white shadow-2xl"
          style={{ maxHeight: '90vh' }}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>

          {/* Content */}
          <div
            className="flex-1 overflow-auto px-4 pb-4"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
