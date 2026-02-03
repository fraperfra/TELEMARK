
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { OwnersList } from './pages/OwnersList';
import { OwnerDetail } from './pages/OwnerDetail';
import { CalendarPage } from './pages/CalendarPage';
import { UploadPage } from './pages/UploadPage';
import { SettingsPage } from './pages/SettingsPage';
import { SetupRequired } from './components/SetupRequired';
import { OwnerFormModal, CallModal, AppointmentModal } from './components/Modals';
import { ViewState, Owner, ModalState, ModalType } from './types';
import { MOCK_OWNERS } from './constants';
import { isConfigured } from './lib/supabase';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: null });

  // Se l'app non è configurata, mostra la schermata di setup
  if (!isConfigured) {
    return <SetupRequired />;
  }

  // Supporta sia la navigazione tramite ID (dai mock della dashboard) sia tramite oggetto Owner completo (dalla lista DB)
  const navigateToOwner = (item: string | Owner) => {
    if (typeof item === 'string') {
      // Se riceviamo un ID, cerchiamo nei mock (usato dalla Dashboard)
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

  const renderContent = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard onNavigateToOwner={navigateToOwner} onOpenModal={openModal} />;
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
        return <SettingsPage />;
      default:
        return <Dashboard onNavigateToOwner={navigateToOwner} onOpenModal={openModal} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeView={currentView} onViewChange={(v) => {
        setCurrentView(v);
        if (v !== 'OWNER_DETAIL') setSelectedOwner(null);
      }} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header username="Agente Pro" />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>

      {/* Modali Globali */}
      <OwnerFormModal 
        isOpen={modal.type === 'ADD_OWNER' || modal.type === 'EDIT_OWNER'} 
        onClose={closeModal} 
        owner={modal.owner} 
      />
      <CallModal 
        isOpen={modal.type === 'CALL_OWNER' || modal.type === 'BULK_CALL'} 
        onClose={closeModal} 
        owner={modal.owner} 
      />
      <AppointmentModal 
        isOpen={modal.type === 'ADD_APPOINTMENT'} 
        onClose={closeModal} 
        owner={modal.owner} 
      />
    </div>
  );
};

export default App;
