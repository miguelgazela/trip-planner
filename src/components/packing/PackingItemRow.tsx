'use client';

import { PackingItem } from '@/types/packing';
import { PACKING_CATEGORY_MAP } from '@/lib/packing-categories';

interface PackingItemRowProps {
  item: PackingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PackingItemRow({ item, onToggle, onDelete }: PackingItemRowProps) {
  const cat = PACKING_CATEGORY_MAP[item.category] ?? PACKING_CATEGORY_MAP.other;

  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 bg-white border border-gray-200 rounded-lg transition-colors ${item.checked ? 'opacity-60' : ''}`}>
      <button
        onClick={() => onToggle(item.id)}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          item.checked
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-brand-400'
        }`}
      >
        {item.checked && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
        {item.name}
      </span>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${cat.color}`}>
        {cat.label}
      </span>
      <button
        onClick={() => onDelete(item.id)}
        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
