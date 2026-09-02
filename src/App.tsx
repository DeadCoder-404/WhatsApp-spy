import { useState, useEffect } from 'react';
import { WhatsAppStatus } from './types';
import { Header } from './components/Header';
import { TerminalView } from './components/TerminalView';
import { PairingModal } from './components/PairingModal';
import { ProfileManager } from './components/ProfileManager';
import { AutoReplyManager } from './components/AutoReplyManager';
import { MessageListener } from './components/MessageListener';
import { PythonCliGuide } from './components/PythonCliGuide';
import { SessionVaultModal } from './components/SessionVaultModal';
import { DesktopProgramModal } from './components/DesktopProgramModal';
import { LocalhostGuideModal } from './components/LocalhostGuideModal';

export default function App() {
  const [status, setStatus] = useState<WhatsAppStatus>({
    connected: false,
    state: 'disconnected',
    pairingCode: null,
    phoneNumber: null,
    userJid: null,
    userName: null,
    userStatus: null,
    profilePicUrl: null,
    lastConnectedAt: null,
    uptimeSeconds: 0,
  });

  const [activeTab, setActiveTab] = useState('terminal');
  const [pairingModalOpen, setPairingModalOpen] = useState(false);
  const [sessionVaultOpen, setSessionVaultOpen] = useState(false);
  const [desktopModalOpen, setDesktopModalOpen] = useState(false);
  const [localhostModalOpen, setLocalhostModalOpen] = useState(false);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      if (data) {
        setStatus(data);
      }
    } catch {
      // ignore
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/whatsapp/logout', { method: 'POST' });
      fetchStatus();
    } catch {
      // ignore
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 flex flex-col font-mono selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Navigation Header */}
      <Header
        status={status}
        onOpenPairing={() => setPairingModalOpen(true)}
        onOpenSessionVault={() => setSessionVaultOpen(true)}
        onOpenDesktop={() => setDesktopModalOpen(true)}
        onOpenLocalhost={() => setLocalhostModalOpen(true)}
        onLogout={handleLogout}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {activeTab === 'terminal' && (
          <TerminalView onOpenPairing={() => setPairingModalOpen(true)} />
        )}

        {activeTab === 'profile' && (
          <ProfileManager status={status} onRefreshStatus={fetchStatus} />
        )}

        {activeTab === 'autoreply' && (
          <AutoReplyManager />
        )}

        {activeTab === 'listener' && (
          <MessageListener />
        )}

        {activeTab === 'python' && (
          <PythonCliGuide />
        )}
      </main>

      {/* Pairing Code Modal (Link with Phone Number) */}
      <PairingModal
        isOpen={pairingModalOpen}
        onClose={() => setPairingModalOpen(false)}
        status={status}
      />

      {/* Persistent Session Vault Modal (Zero-Login / Token Export & Import) */}
      <SessionVaultModal
        isOpen={sessionVaultOpen}
        onClose={() => setSessionVaultOpen(false)}
        status={status}
        onRefreshStatus={fetchStatus}
      />

      {/* Desktop Program Download & Launch Modal */}
      <DesktopProgramModal
        isOpen={desktopModalOpen}
        onClose={() => setDesktopModalOpen(false)}
      />

      {/* Localhost :4044 Automated Launcher Modal */}
      <LocalhostGuideModal
        isOpen={localhostModalOpen}
        onClose={() => setLocalhostModalOpen(false)}
      />
    </div>
  );
}
