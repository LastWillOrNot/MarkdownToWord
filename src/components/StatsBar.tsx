import React from 'react';
import { BookOpen, Hash, Clock, Heading, Table as TableIcon } from 'lucide-react';
import { DocumentStats } from '../types';

interface StatsBarProps {
  stats: DocumentStats;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  return (
    <div
      className="bg-white border-y border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600"
      aria-label="Statistiques du document"
    >
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-1.5" title="Nombre total de mots">
          <BookOpen className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
          <span className="font-semibold text-slate-900">{stats.words.toLocaleString('fr-FR')}</span>
          <span>mots</span>
        </div>

        <div className="flex items-center gap-1.5" title="Nombre total de caractères">
          <Hash className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <span className="font-semibold text-slate-900">{stats.characters.toLocaleString('fr-FR')}</span>
          <span>caractères</span>
        </div>

        <div className="flex items-center gap-1.5" title="Temps de lecture estimé à 200 mots/min">
          <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <span>Lecture ~</span>
          <span className="font-semibold text-slate-900">{stats.readingTimeMinutes} min</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5" title="Nombre de sections et sous-titres">
          <Heading className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <span className="font-semibold text-slate-900">{stats.headingsCount}</span>
          <span>titres</span>
        </div>

        {stats.tablesCount > 0 && (
          <div className="hidden md:flex items-center gap-1.5" title="Nombre de tableaux">
            <TableIcon className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
            <span className="font-semibold text-slate-900">{stats.tablesCount}</span>
            <span>tableaux</span>
          </div>
        )}
      </div>

      <div className="text-slate-500 text-[11px]">
        Conforme Microsoft Word OpenXML (.docx)
      </div>
    </div>
  );
};
