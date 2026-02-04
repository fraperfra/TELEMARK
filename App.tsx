
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { OwnersList } from './pages/OwnersList';
import { OwnerDetail } from './pages/OwnerDetail';
import { CalendarPage } from './pages/CalendarPage';
import { UploadPage } from './pages/UploadPage';
import { SettingsPage } from './pages/SettingsPage';
import { DailyTasksPage } from './pages/DailyTasksPage';
import { SetupRequired } from './components/SetupRequired';
import { OwnerFormModal, CallModal, AppointmentModal, PropertyModal } from './components/Modals';
import { ViewState, Owner, ModalState, ModalType, SettingsTab } from './types';
import { MOCK_OWNERS } from './constants';
import { isConfigured, supabase } from './lib/supabase';
import { initDailyScheduler } from './lib/dailyScheduler';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile');

  // Inizializza scheduler per task giornalieri (8:00 genera, 20:00 chiude)
  useEffect(() => {
    if (isConfigured) {
      const cleanup = initDailyScheduler();
      return cleanup;
    }
  }, []);

  // Se l'app non è configurata, mostra la schermata di setup
  if (!isConfigured) {
    return <SetupRequired />;
  }

  // Supporta sia la navigazione tramite ID (dai mock della dashboard) sia tramite oggetto Owner completo (dalla lista DB)
  const navigateToOwner = async (item: string | Owner) => {
    if (typeof item === 'string') {
      // Se riceviamo un ID, prima proviamo dal database
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('owners')
            .select('*, properties(*), calls(*), appointments(*)')
            .eq('id', item)
            .single();
          if (!error && data) {
            setSelectedOwner(data as Owner);
            setCurrentView('OWNER_DETAIL');
            return;
          }
        } catch (e) {
          console.log('Owner not found in DB, trying mock');
        }
      }
      // Fallback ai mock (usato dalla Dashboard)
      const found = MOCK_OWNERS.find(o => o.id === item);
      if (found) {
        setSelectedOwner(found);
        setCurrentView('OWNER_DETAIL');
      }
    } else {
      // Se riceviamo un oggetto Owner completo (dalla OwnersList connessa al DB)
      setSelectedOwner(item);
      setCurrentView('OWNER_DETAIL');
    }
  };

  const openModal = (type: ModalType, owner?: Owner) => {
    setModal({ type, owner });
  };

  const closeModal = () => setModal({ type: null });
  const handleOpenSettings = () => {
    setCurrentView('SETTINGS');
    setSettingsTab('profile');
    setSelectedOwner(null);
    setModal({ type: null });
  };

  const handleLogout = () => {
    setCurrentView('DASHBOARD');
    setSelectedOwner(null);
    setModal({ type: null });
  };

  const refreshSelectedOwner = async (ownerId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('owners')
        .select('*, properties(*), calls(*), appointments(*)')
        .eq('id', ownerId)
        .single();
      if (error) throw error;
      setSelectedOwner(data as Owner);
    } catch (error) {
      console.error('Refresh owner error:', error);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard onNavigateToOwner={navigateToOwner} onOpenModal={openModal} />;
      case 'DAILY_TASKS':
        return (
          <DailyTasksPage
            onSelectOwner={(ownerId) => navigateToOwner(ownerId)}
            onOpenCallModal={(owner) => openModal('CALL_OWNER', owner)}
          />
        );
      case 'OWNERS_LIST':
        return <OwnersList onSelectOwner={navigateToOwner} onOpenModal={openModal} />;
      case 'OWNER_DETAIL':
        return selectedOwner ? (
          <OwnerDetail
            owner={selectedOwner}
            onBack={() => setCurrentView('OWNERS_LIST')}
            onOpenModal={openModal}
          />
        ) : <Dashboard onNavigateToOwner={navigateToOwner} onOpenModal={openModal} />;
      case 'CALENDAR':
        return <CalendarPage />;
      case 'UPLOAD':
        return <UploadPage onCompleteNavigation={(view) => setCurrentView(view)} />;
      case 'SETTINGS':
        return <SettingsPage activeTab={settingsTab} />;
      default:
        return <Dashboard onNavigateToOwner={navigateToOwner} onOpenModal={openModal} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        activeView={currentView}
        onViewChange={(v) => {
          setCurrentView(v);
          if (v !== 'OWNER_DETAIL') setSelectedOwner(null);
          if (v === 'SETTINGS') setSettingsTab('profile');
        }}
        activeSettingsTab={settingsTab}
        onSettingsTabChange={setSettingsTab}
        onQuickAction={() => openModal('ADD_OWNER')}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          username="Agente Pro"
          onOpenSettings={handleOpenSettings}
          onLogout={handleLogout}
          onSelectOwner={(ownerId) => navigateToOwner(ownerId)}
        />
        {/* Main content con padding per bottom nav su mobile */}
        <main className="flex-1 overflow-y-auto scroll-touch no-scrollbar p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          {renderContent()}
        </main>
      </div>

      {/* Modali Globali */}
      <OwnerFormModal 
        isOpen={modal.type === 'ADD_OWNER' || modal.type === 'EDIT_OWNER'} 
        onClose={closeModal} 
        owner={modal.owner} 
        onSaved={refreshSelectedOwner}
      />
      <CallModal 
        isOpen={modal.type === 'CALL_OWNER' || modal.type === 'BULK_CALL'} 
        onClose={closeModal} 
        owner={modal.owner} 
        onSaved={refreshSelectedOwner}
      />
      <AppointmentModal 
        isOpen={modal.type === 'ADD_APPOINTMENT'} 
        onClose={closeModal} 
        owner={modal.owner} 
        onSaved={refreshSelectedOwner}
      />
      <PropertyModal
        isOpen={modal.type === 'ADD_PROPERTY'}
        onClose={closeModal}
        owner={modal.owner}
        onSaved={refreshSelectedOwner}
      />
    </div>
  );
};

export default App;
