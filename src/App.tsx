import type { Session } from '@supabase/supabase-js';
import { Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CommandPalette } from './components/CommandPalette';
import { DialogsProvider } from './components/Dialogs';
import { Sidebar } from './components/Sidebar';
import { TaskPanel } from './components/TaskPanel';
import { ConfirmProvider } from './components/ui/Confirm';
import { ToastProvider, useToast } from './components/ui/Toasts';
import { useTaskNav } from './components/useTaskNav';
import { createLocalRepo } from './data/localRepo';
import type { Repo } from './data/repo';
import { AppStore } from './data/store';
import { StoreContext, useStoreStatus } from './data/StoreContext';
import { supabase } from './data/supabase';
import { createSupabaseRepo } from './data/supabaseRepo';
import { CalendarPage } from './pages/Calendar';
import { ClientDetailPage } from './pages/ClientDetail';
import { ClientsPage } from './pages/Clients';
import { LoginPage } from './pages/Login';
import { ReportsPage } from './pages/Reports';
import { SettingsPage } from './pages/Settings';
import { TasksPage } from './pages/Tasks';
import { TodayPage } from './pages/Today';

export default function App() {
  return <ToastProvider>{supabase ? <AuthGate /> : <Shell repo={createLocalRepo()} />}</ToastProvider>;
}

function AuthGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  useEffect(() => {
    supabase!.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase!.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined) return <Splash />;
  if (!session) return <LoginPage />;
  return <Shell key={session.user.id} repo={createSupabaseRepo(supabase!, session.user.id)} email={session.user.email} />;
}

function Shell({ repo, email }: { repo: Repo; email?: string }) {
  const toast = useToast();
  const [store] = useState(() => new AppStore(repo, msg => toast(msg, { tone: 'error' })));
  useEffect(() => {
    store.init();
    return () => store.dispose();
  }, [store]);
  return (
    <StoreContext.Provider value={store}>
      <ConfirmProvider>
        <HashRouter>
          <DialogsProvider>
            <Gate email={email} />
          </DialogsProvider>
        </HashRouter>
      </ConfirmProvider>
    </StoreContext.Provider>
  );
}

function Gate({ email }: { email?: string }) {
  const { status, error } = useStoreStatus();
  if (status === 'loading') return <Splash />;
  if (status === 'error') {
    return (
      <div className="splash">
        <div className="splash-card">
          <h1>Impossible de charger les données</h1>
          <p className="muted">{error}</p>
          <button className="btn primary" onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }
  return <Layout email={email} />;
}

function Layout({ email }: { email?: string }) {
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);
  const nav = useTaskNav();
  const location = useLocation();
  useEffect(() => setMenu(false), [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette(p => !p); return; }
      const typing = (e.target as HTMLElement).closest('input, textarea, select, [contenteditable]');
      if (typing || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('dialog[open], [cmdk-dialog]')) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); nav.openNew(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav]);

  return (
    <div className="app">
      <header className="mobile-bar">
        <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Menu"><Menu size={19} /></button>
        <span className="brand"><span className="brand-mark" aria-hidden="true" />Nini</span>
        <button className="btn primary sm" onClick={() => nav.openNew()}>Nouvelle tâche</button>
      </header>
      {menu && <div className="scrim mobile-only" onClick={() => setMenu(false)} />}
      <Sidebar onSearch={() => setPalette(true)} open={menu} onNavigate={() => setMenu(false)} />
      <main className="main">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/taches" element={<TasksPage />} />
          <Route path="/dossiers" element={<ClientsPage />} />
          <Route path="/dossiers/:id" element={<ClientDetailPage />} />
          <Route path="/calendrier" element={<CalendarPage />} />
          <Route path="/rapports" element={<ReportsPage />} />
          <Route path="/reglages" element={<SettingsPage email={email} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <TaskPanel />
      <CommandPalette open={palette} onOpenChange={setPalette} />
    </div>
  );
}

function Splash() {
  return <div className="splash"><span className="brand-mark pulse" aria-label="Chargement" /></div>;
}
