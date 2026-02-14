'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useTripContext } from '@/providers/TripProvider';
import ExpenseCard from '@/components/expenses/ExpenseCard';
import ExpenseForm from '@/components/expenses/ExpenseForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Expense, ExpenseStatus } from '@/types/trip';
import { formatCurrency } from '@/lib/currency';
import { EXPENSE_CATEGORIES, EXPENSE_CATEGORY_MAP } from '@/lib/expense-categories';

const STATUS_OPTIONS: { value: ExpenseStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'paid', label: 'Paid' },
  { value: 'planned', label: 'Planned' },
  { value: 'wishlist', label: 'Wishlist' },
];

export default function ExpensesPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { getTrip, getExpensesForTrip, addExpense, updateExpense, deleteExpense } = useTripContext();
  const trip = getTrip(tripId);
  const expenses = getExpensesForTrip(tripId);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | 'all'>('all');

  if (!trip) return null;

  const filtered = statusFilter === 'all'
    ? expenses
    : expenses.filter((e) => e.status === statusFilter);

  const handleSubmit = (data: Omit<Expense, 'id' | 'tripId' | 'createdAt'>) => {
    if (editingExpense) {
      updateExpense(editingExpense.id, data);
    } else {
      addExpense(tripId, data);
    }
    setIsFormOpen(false);
    setEditingExpense(null);
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setIsFormOpen(true);
  };

  const perPerson = (e: Expense) => e.amount / (e.splitCount ?? 1);
  const paidTotal = expenses.filter((e) => e.status === 'paid').reduce((sum, e) => sum + perPerson(e), 0);
  const plannedTotal = expenses.filter((e) => e.status === 'planned').reduce((sum, e) => sum + perPerson(e), 0);
  const wishlistTotal = expenses.filter((e) => e.status === 'wishlist').reduce((sum, e) => sum + perPerson(e), 0);
  const committedTotal = paidTotal + plannedTotal;

  // Group filtered expenses by category
  const grouped = EXPENSE_CATEGORIES
    .map((cat) => ({
      ...cat,
      expenses: filtered.filter((e) => e.category === cat.value),
      total: filtered.filter((e) => e.category === cat.value).reduce((sum, e) => sum + perPerson(e), 0),
    }))
    .filter((g) => g.expenses.length > 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          {expenses.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {expenses.length} {expenses.length === 1 ? 'expense' : 'expenses'}
            </p>
          )}
        </div>
        <Button onClick={() => { setEditingExpense(null); setIsFormOpen(true); }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Expense
        </Button>
      </div>

      {expenses.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Paid</p>
            <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(paidTotal, trip.currency)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Planned</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(plannedTotal, trip.currency)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Committed</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(committedTotal, trip.currency)}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Wishlist</p>
            <p className="text-xl font-bold text-sky-600 mt-1">{formatCurrency(wishlistTotal, trip.currency)}</p>
            {wishlistTotal > 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                If all: {formatCurrency(committedTotal + wishlistTotal, trip.currency)}
              </p>
            )}
          </div>
        </div>
      )}

      {expenses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {expenses.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="No expenses yet"
          description="Track your trip expenses, from paid bookings to planned activities and wishlist items."
          action={<Button onClick={() => setIsFormOpen(true)}>Add Your First Expense</Button>}
        />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">No expenses match the current filter.</p>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => {
            const catInfo = EXPENSE_CATEGORY_MAP[group.value];
            return (
              <div key={group.value}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${catInfo.color} flex items-center justify-center`}>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={catInfo.icon} />
                      </svg>
                    </div>
                    <h2 className="text-sm font-semibold text-gray-900">{group.label}</h2>
                    <span className="text-xs text-gray-400">{group.expenses.length}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-700">
                    {formatCurrency(group.total, trip.currency)}
                  </span>
                </div>
                <div className="space-y-2">
                  {group.expenses.map((expense) => (
                    <ExpenseCard
                      key={expense.id}
                      expense={expense}
                      currency={trip.currency}
                      onEdit={handleEdit}
                      onDelete={setDeleteId}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingExpense(null); }}
        title={editingExpense ? 'Edit Expense' : 'Add Expense'}
        className="max-w-xl"
      >
        <ExpenseForm
          onSubmit={handleSubmit}
          onCancel={() => { setIsFormOpen(false); setEditingExpense(null); }}
          initialData={editingExpense ?? undefined}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteExpense(deleteId)}
        title="Delete Expense"
        message="Are you sure you want to delete this expense?"
      />
    </div>
  );
}
