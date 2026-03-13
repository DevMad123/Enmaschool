// ===== src/shared/components/layout/DashboardLayout.tsx =====

import { useState } from 'react';
import { Outlet } from 'react-router-dom';

import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Header } from '@/shared/components/layout/Header';
import { Sheet, SheetContent } from '@/shared/components/ui/sheet';

export function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* ── Mobile sidebar (Sheet drawer) ── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
        <Header onMobileMenuToggle={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
