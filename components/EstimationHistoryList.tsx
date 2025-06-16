
import React from 'react';
import { EstimationHistoryEntry } from '../types';
import { EstimationHistoryItem } from './EstimationHistoryItem';

interface EstimationHistoryListProps {
  history: EstimationHistoryEntry[];
  onLoadEntry: (id: string) => void;
  onDeleteEntry: (id: string) => void;
}

export const EstimationHistoryList: React.FC<EstimationHistoryListProps> = ({ history, onLoadEntry, onDeleteEntry }) => {
  if (history.length === 0) {
    return <p className="text-center text-slate-400 py-4">履歴はありません。</p>;
  }

  return (
    <ul className="space-y-4">
      {history.map(entry => (
        <EstimationHistoryItem
          key={entry.id}
          entry={entry}
          onLoadEntry={onLoadEntry}
          onDeleteEntry={onDeleteEntry}
        />
      ))}
    </ul>
  );
};
