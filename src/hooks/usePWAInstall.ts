import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [browserName, setBrowserName] = useState<'edge' | 'chrome' | 'other'>('other');

  useEffect(() => {
    // Détection du mode autonome (PWA déjà installée et ouverte)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Détection du système Windows
    const ua = window.navigator.userAgent.toLowerCase();
    const isWin = /windows|win32|win64/.test(ua);
    setIsWindows(isWin);

    // Détection du navigateur (Edge ou Chrome recommandés sous Windows pour PWA)
    if (/edg\//.test(ua)) {
      setBrowserName('edge');
    } else if (/chrome\//.test(ua)) {
      setBrowserName('chrome');
    } else {
      setBrowserName('other');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Empêcher l'apparition automatique du mini-infobar natif
      e.preventDefault();
      // Conserver l'événement pour le déclencher au clic utilisateur
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Erreur lors de l'installation PWA :", err);
      return false;
    }
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isWindows,
    browserName,
    install,
  };
}
