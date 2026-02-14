import { AccommodationBlock as AccBlockType } from '@/types/planner';

interface AccommodationBlockProps {
  block: AccBlockType;
  position: 'start' | 'end';
}

export default function AccommodationBlock({ block, position }: AccommodationBlockProps) {
  const labels = {
    'check-in': 'Check-in',
    'check-out': 'Check-out',
    'overnight': position === 'start' ? 'Staying at' : 'Returning to',
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm">
      <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
      <div className="flex-1 min-w-0">
        <span className="text-amber-700 font-medium">{labels[block.type]}</span>
        <span className="text-amber-600 ml-1 truncate">{block.accommodationName}</span>
        {block.time && <span className="text-amber-500 ml-1">at {block.time}</span>}
      </div>
    </div>
  );
}
