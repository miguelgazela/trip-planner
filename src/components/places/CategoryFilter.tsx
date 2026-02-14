'use client';

import Badge from '@/components/ui/Badge';
import { CategoryTag } from '@/types/trip';
import { ALL_CATEGORIES } from '@/lib/categories';

interface CategoryFilterProps {
  selected: CategoryTag[];
  onChange: (categories: CategoryTag[]) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  const toggle = (cat: CategoryTag) => {
    if (selected.includes(cat)) {
      onChange(selected.filter((c) => c !== cat));
    } else {
      onChange([...selected, cat]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange([])}
        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
          selected.length === 0
            ? 'bg-brand-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {ALL_CATEGORIES.map((cat) => (
        <Badge
          key={cat}
          category={cat}
          size="md"
          active={selected.length === 0 || selected.includes(cat)}
          onClick={() => toggle(cat)}
        />
      ))}
    </div>
  );
}
