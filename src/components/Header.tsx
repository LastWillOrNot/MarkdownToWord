import React, { useState } from 'react';
import { FileText, Download, Laptop, Wifi, WifiOff, HelpCircle, CheckCircle } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { WindowsInstallModal } from './WindowsInstallModal';

export const Header: React.FC = () => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showModal, setShowModal] = useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <header role="banner" className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo et Nom de l'app */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white shadow-xs">
            <FileText className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Convertisseur Markdown vers Word
              </h1>
              <span className="hidden md:inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
                .docx natif
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Transformation haute fidélité pour postes de travail Windows
            </p>
          </div>
        </div>

        {/* Actions & Statut */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Indicateur de connectivité */}
          <div
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
            style={{
              backgroundColor: isOnline ? '#F0FDF4' : '#FEF3C7',
              borderColor: isOnline ? '#BBF7D0' : '#FDE68A',
              color: isOnline ? '#166534' : '#92400E',
            }}
            title={isOnline ? 'Connecté - Mode hors-ligne prêt' : 'Mode hors-ligne actif'}
            aria-live="polite"
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span className="hidden lg:inline">En ligne</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                <span>Hors-ligne</span>
              </>
            )}
          </div>

          {/* Bouton d'installation sur Windows */}
          {isInstalled ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              <CheckCircle className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span className="hidden sm:inline">Installé sur Windows</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              className="flex items-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 active:scale-[0.98] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition focus:ring-2 focus:ring-blue-600 focus:outline-none"
              aria-label="Installer l'application sur Windows"
            >
              <Laptop className="h-4 w-4" aria-hidden="true" />
              <span>Installer sur Windows</span>
            </button>
          )}

          {/* Aide installation */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Aide pour l'installation sur Windows"
            aria-label="Instructions d'installation Windows"
          >
            <HelpCircle className="h-5 w-5" />
          </button>
        </div>
      </div>

      <WindowsInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </header>
  );
};
