'use client';

import Card from '@/components/ui/Card';
import { Expense, Currency } from '@/types/trip';
import { formatCurrency } from '@/lib/currency';
import { EXPENSE_CATEGORY_MAP } from '@/lib/expense-categories';
import { format } from 'date-fns';

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  paid: { label: 'Paid', color: 'bg-green-100 text-green-700' },
  planned: { label: 'Planned', color: 'bg-amber-100 text-amber-700' },
  wishlist: { label: 'Wishlist', color: 'bg-sky-100 text-sky-700' },
};

interface ExpenseCardProps {
  expense: Expense;
  currency: Currency;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseCard({ expense, currency, onEdit, onDelete }: ExpenseCardProps) {
  const cat = EXPENSE_CATEGORY_MAP[expense.category] ?? EXPENSE_CATEGORY_MAP.other;
  const status = STATUS_STYLES[expense.status] ?? STATUS_STYLES.planned;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg ${cat.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{expense.description}</h3>
            </div>
            <div className="flex items-center gap-2.5 mt-1.5">
              {expense.splitCount && expense.splitCount > 1 ? (
                <span className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-gray-900">
                    {formatCurrency(expense.amount / expense.splitCount, currency)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    of {formatCurrency(expense.amount, currency)} ÷ {expense.splitCount}
                  </span>
                </span>
              ) : (
                <span className="text-base font-bold text-gray-900">{formatCurrency(expense.amount, currency)}</span>
              )}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${status.color}`}>
                {status.label}
              </span>
              {expense.date && (
                <span className="text-xs text-gray-400">
                  {format(new Date(expense.date + 'T00:00:00'), 'MMM d, yyyy')}
                </span>
              )}
            </div>
            {expense.notes && (
              <p className="text-xs text-gray-500 mt-1">{expense.notes}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1 ml-2 flex-shrink-0">
          <button
            onClick={() => onEdit(expense)}
            className="p-1 rounded text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(expense.id)}
            className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </Card>
  );
}
