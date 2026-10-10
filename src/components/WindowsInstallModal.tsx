import React from 'react';
import { Monitor, Download, CheckCircle2, X, ExternalLink, ShieldCheck, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface WindowsInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WindowsInstallModal: React.FC<WindowsInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, install, browserName } = usePWAInstall();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-windows-title"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-800 animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <Laptop className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id="modal-windows-title" className="text-xl font-bold text-slate-900">
                Installation sur poste Windows
              </h2>
              <p className="text-xs text-slate-500">
                Compatible Windows 10 & 11 (Microsoft Edge, Google Chrome)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Fermer la fenêtre d'installation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-slate-600">
          <div className="rounded-xl bg-blue-50/70 p-4 border border-blue-100/80">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Application PWA certifiée & locale</p>
                <p className="text-xs text-blue-800/90 mt-0.5">
                  Aucun droit administrateur n'est requis. L'application s'exécute directement sur votre poste, fonctionne 100% hors-ligne et garantit la confidentialité totale de vos documents.
                </p>
              </div>
            </div>
          </div>

          {isInstalled ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold">L'application est déjà installée sur ce poste Windows</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Vous pouvez la retrouver dans votre menu Démarrer de Windows ou l'épingler à votre barre des tâches.
                </p>
              </div>
            </div>
          ) : isInstallable ? (
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <p className="font-medium text-slate-900 mb-2">Installation directe en un clic :</p>
              <button
                type="button"
                onClick={async () => {
                  const ok = await install();
                  if (ok) onClose();
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 hover:bg-blue-800 px-4 py-3 font-semibold text-white shadow-sm transition active:scale-[0.99] focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <Download className="h-5 w-5" />
                Installer maintenant sur Windows
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-slate-800">
                Comment installer manuellement depuis votre navigateur :
              </p>

              <div className="grid gap-3">
                <div className="rounded-xl border border-slate-200 p-3.5 bg-white">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">1</span>
                    Via Microsoft Edge (Recommandé sur Windows) :
                  </div>
                  <p className="text-xs text-slate-600 pl-7">
                    Dans la barre d'adresse en haut à droite, cliquez sur l'icône <strong className="text-slate-800 font-semibold">« Application disponible »</strong> ou ouvrez le menu <strong>« ... »</strong> &gt; <strong>« Applications »</strong> &gt; <strong>« Installer Convertisseur Markdown vers Word »</strong>.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-3.5 bg-white">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">2</span>
                    Via Google Chrome :
                  </div>
                  <p className="text-xs text-slate-600 pl-7">
                    Cliquez sur le symbole d'ordinateur avec une flèche vers le bas dans la barre d'adresse, ou ouvrez le menu <strong>« ... »</strong> &gt; <strong>« Enregistrer et partager »</strong> &gt; <strong>« Installer la page en tant qu'application »</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <h3 className="font-semibold text-slate-800 mb-1 text-xs uppercase tracking-wide">
              Avantages sur votre poste Windows :
            </h3>
            <ul className="text-xs space-y-1 text-slate-600 list-disc list-inside">
              <li>Raccourci dédié dans le menu Démarrer et la barre des tâches</li>
              <li>Fenêtre autonome épurée sans barre d'adresse de navigateur</li>
              <li>Opérationnel sans connexion internet (mode hors-ligne permanent)</li>
              <li>Export rapide de vos documents Markdown en fichiers Word natifs</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 transition focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
