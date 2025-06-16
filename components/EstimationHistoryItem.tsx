
import React from 'react';
import { EstimationHistoryEntry } from '../types';

interface EstimationHistoryItemProps {
  entry: EstimationHistoryEntry;
  onLoadEntry: (id: string) => void;
  onDeleteEntry: (id: string) => void;
}

export const EstimationHistoryItem: React.FC<EstimationHistoryItemProps> = ({ entry, onLoadEntry, onDeleteEntry }) => {
  const formattedDate = new Date(entry.timestamp).toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const firstImagePreview = entry.images.length > 0 ? entry.images[0].preview : null;

  return (
    <li className="bg-slate-700 p-4 rounded-lg shadow-md hover:bg-slate-600/70 transition-colors duration-200 ease-in-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex-grow mb-3 sm:mb-0">
          <div className="flex items-center mb-2">
            {firstImagePreview && (
              <img 
                src={firstImagePreview} 
                alt="Thumbnail of first image" 
                className="w-12 h-12 object-cover rounded-md mr-3 shadow-sm" 
              />
            )}
            <div>
                <p className="text-sm font-semibold text-sky-400" aria-label={`Estimation from ${formattedDate}`}>
                    {formattedDate}
                </p>
                <p className="text-xs text-slate-300">
                    画像 {entry.images.length}枚
                </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 truncate" title={entry.result.text.substring(0, 100) + '...'}>
            結果の概要: {entry.result.text.substring(0, 70) + (entry.result.text.length > 70 ? '...' : '')}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <button
            onClick={() => onLoadEntry(entry.id)}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-md shadow-sm transition-colors duration-200 ease-in-out"
            aria-label={`Load estimation from ${formattedDate}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15m0-3-3-3m0 0-3 3m3-3V15" />
            </svg>
            読込
          </button>
          <button
            onClick={() => onDeleteEntry(entry.id)}
            className="w-full sm:w-auto px-4 py-2 text-sm bg-red-700 hover:bg-red-800 text-white font-medium rounded-md shadow-sm transition-colors duration-200 ease-in-out"
            aria-label={`Delete estimation from ${formattedDate}`}
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 inline">
              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
            削除
          </button>
        </div>
      </div>
    </li>
  );
};
