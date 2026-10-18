/**
 * Progressive Web App - Enregistrement du Service Worker
 * Assure la compatibilité en environnement conteneurisé et iframe.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    try {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          // Enregistrement réussi
          if (registration) {
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // Nouvelle version disponible
                  }
                };
              }
            };
          }
        })
        .catch(() => {
          // Ignorer silencieusement si bloqué par les restrictions de l'iframe ou du domaine
        });
    } catch {
      // Échec sécurisé sans lever d'exception non interceptée
    }
  });
}
