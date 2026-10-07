import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { PublicComplaintView } from './components/PublicComplaintView';
import { PublicDashboardView } from './components/PublicDashboardView';
import { LoginView } from './components/LoginView';
import { PetugasDashboard } from './components/PetugasDashboard';
import { SupervisorDashboard } from './components/SupervisorDashboard';
import { FooterGreetingCard } from './components/FooterGreetingCard';

const MainContent: React.FC = () => {
  const { activeTab, currentUser } = useApp();

  return (
    <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-8 lg:px-12 py-6">
      {activeTab === 'login' && <LoginView />}

      {activeTab === 'dasbor-publik' && <PublicDashboardView />}

      {activeTab === 'sim-qr' && <PublicComplaintView />}

      {activeTab === 'petugas' && (
        currentUser ? <PetugasDashboard /> : <LoginView />
      )}

      {activeTab === 'supervisor' && (
        currentUser ? <SupervisorDashboard /> : <LoginView />
      )}

      {/* Fallback default */}
      {activeTab !== 'login' &&
        activeTab !== 'dasbor-publik' &&
        activeTab !== 'sim-qr' &&
        activeTab !== 'petugas' &&
        activeTab !== 'supervisor' && (
          <PublicDashboardView />
        )}
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
        <Navbar />
        <MainContent />
        {/* Desain Kartu Ucapan Footer */}
        <FooterGreetingCard />
      </div>
    </AppProvider>
  );
}
