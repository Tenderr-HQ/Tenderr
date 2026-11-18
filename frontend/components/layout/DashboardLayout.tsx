
import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0d0914]">
      <Sidebar />

      <div className="min-h-screen lg:pl-64">
        <Header />

        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-7 sm:px-7 lg:px-9 lg:pb-10">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
