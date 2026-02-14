'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { parseISO, isWithinInterval, differenceInCalendarDays } from 'date-fns';
import { useTripContext } from '@/providers/TripProvider';
import { useCountdown } from '@/hooks/useCountdown';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import NextFlightBanner from '@/components/flights/NextFlightBanner';
import TripForm from '@/components/trips/TripForm';
import { formatTripDates, getDaysBetween } from '@/lib/date-utils';
import { formatCurrency, totalCost } from '@/lib/currency';


export default function TripOverviewPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const { getTrip, updateTrip, getFlightsForTrip, getAccommodationsForTrip, getPlacesForTrip, getExpensesForTrip, getTransportsForTrip } = useTripContext();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const trip = getTrip(tripId);

  // Always call hooks unconditionally
  const countdown = useCountdown(trip?.startDate ?? new Date().toISOString());

  if (!trip) return null;

  const now = new Date();
  const startDate = parseISO(trip.startDate);
  const endDate = parseISO(trip.endDate + 'T23:59:59');
  const isBefore = now < startDate;
  const isDuring = isWithinInterval(now, { start: startDate, end: endDate });
  const isAfter = now > endDate;

  const flights = getFlightsForTrip(tripId);
  const accommodations = getAccommodationsForTrip(tripId);
  const places = getPlacesForTrip(tripId);
  const expenses = getExpensesForTrip(tripId);
  const transports = getTransportsForTrip(tripId);

  const days = getDaysBetween(trip.startDate, trip.endDate);
  const flightsCost = totalCost(flights);
  const accommodationsCost = accommodations.reduce((sum, a) => sum + (a.cost ? a.cost / (a.splitCount ?? 1) : 0), 0);
  const placesCost = totalCost(places.filter((p) => p.scheduleStatus === 'scheduled'));
  const transportsCost = transports.reduce((sum, t) => sum + ((t.cost ?? 0) / (t.splitCount ?? 1)), 0);
  const expensesPaid = expenses.filter((e) => e.status === 'paid').reduce((s, e) => s + e.amount / (e.splitCount ?? 1), 0);
  const expensesPlanned = expenses.filter((e) => e.status === 'planned').reduce((s, e) => s + e.amount / (e.splitCount ?? 1), 0);
  const expensesWishlist = expenses.filter((e) => e.status === 'wishlist').reduce((s, e) => s + e.amount / (e.splitCount ?? 1), 0);
  const expensesCommitted = expensesPaid + expensesPlanned;
  const totalBookingCost = flightsCost + accommodationsCost + placesCost + transportsCost;
  const totalFoodBudget = (trip.dailyFoodBudget ?? 0) * days;

  // Budget bar
  const totalSpent = totalBookingCost + expensesCommitted + totalFoodBudget;
  const budgetPercent = trip.budget ? Math.min((totalSpent / trip.budget) * 100, 100) : 0;
  const overBudget = trip.budget ? totalSpent > trip.budget : false;
  const budgetColor = !trip.budget ? '' :
    overBudget ? 'bg-red-500' :
    budgetPercent > 75 ? 'bg-amber-500' :
    'bg-green-500';
  const wishlistPercent = trip.budget ? Math.min(((totalSpent + expensesWishlist) / trip.budget) * 100, 100) : 0;
  const wishlistExtraPercent = Math.max(wishlistPercent - budgetPercent, 0);

  const scheduledCount = places.filter((p) => p.scheduleStatus === 'scheduled').length;

  const stats = [
    {
      label: 'Duration',
      value: `${days} ${days === 1 ? 'day' : 'days'}`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: `/trips/${tripId}/planner`,
      color: 'text-brand-600 bg-brand-50',
    },
    {
      label: 'Flights',
      value: `${flights.length}`,
      sub: flightsCost > 0 ? formatCurrency(flightsCost, trip.currency) : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
      href: `/trips/${tripId}/flights`,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Accommodation',
      value: `${accommodations.length}`,
      sub: accommodationsCost > 0 ? formatCurrency(accommodationsCost, trip.currency) : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      href: `/trips/${tripId}/accommodation`,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Places',
      value: `${places.length}`,
      sub: `${scheduledCount} scheduled`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: `/trips/${tripId}/places`,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Expenses',
      value: expenses.length > 0 ? formatCurrency(expensesCommitted, trip.currency) : '0',
      sub: expenses.length > 0 ? `${expenses.length} items` : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: `/trips/${tripId}/expenses`,
      color: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{trip.name}</h1>
          <p className="text-gray-500 mt-1">{trip.destination}</p>
          <p className="text-sm text-gray-400 mt-1">
            {formatTripDates(trip.startDate, trip.endDate, trip.dateMode)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => window.open(`/trips/${tripId}/print`, '_blank')}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print
          </Button>
          <Button variant="secondary" onClick={() => setIsEditOpen(true)}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Trip
          </Button>
        </div>
      </div>

      {/* Trip Countdown */}
      <div className={`mb-6 rounded-xl px-5 py-4 flex items-center gap-3 ${
        isDuring ? 'bg-green-50 border border-green-200' :
        isAfter ? 'bg-gray-50 border border-gray-200' :
        'bg-brand-50 border border-brand-200'
      }`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isDuring ? 'bg-green-100 text-green-600' :
          isAfter ? 'bg-gray-200 text-gray-500' :
          'bg-brand-100 text-brand-600'
        }`}>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          {isBefore && (
            <p className="text-sm font-medium text-brand-700">
              <span className="font-mono font-bold text-lg">{countdown.days}</span> days
              {countdown.days < 7 && (
                <>
                  {' '}<span className="font-mono font-bold text-lg">{countdown.hours}</span>h{' '}
                  <span className="font-mono font-bold text-lg">{countdown.minutes}</span>m
                </>
              )}
              {' '}until your trip
            </p>
          )}
          {isDuring && (
            <p className="text-sm font-medium text-green-700">
              Day <span className="font-mono font-bold text-lg">{differenceInCalendarDays(now, startDate) + 1}</span> of{' '}
              <span className="font-mono font-bold text-lg">{days}</span>
            </p>
          )}
          {isAfter && (
            <p className="text-sm font-medium text-gray-600">
              Trip ended <span className="font-bold">{differenceInCalendarDays(now, parseISO(trip.endDate))}</span> days ago
            </p>
          )}
        </div>
      </div>

      <NextFlightBanner flights={flights} />

      {/* Budget Progress Bar */}
      {trip.budget && trip.budget > 0 && (
        <Card className="p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-500">Budget</h2>
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(totalSpent, trip.currency)}{expensesWishlist > 0 && (
                <span className="text-gray-400 font-normal"> ({formatCurrency(totalSpent + expensesWishlist, trip.currency)})</span>
              )} / {formatCurrency(trip.budget, trip.currency)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
            {expensesWishlist > 0 && wishlistExtraPercent > 0 && (
              <div
                className="absolute h-3 bg-purple-300/50 rounded-full transition-all"
                style={{ width: `${Math.min(wishlistPercent, 100)}%` }}
              />
            )}
            <div
              className={`relative h-3 rounded-full transition-all ${budgetColor}`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className={overBudget ? 'text-red-600 font-medium' : 'text-gray-500'}>
              {budgetPercent.toFixed(0)}% used
            </span>
            <span className={overBudget ? 'text-red-600 font-medium' : 'text-green-600'}>
              {overBudget
                ? `${formatCurrency(totalSpent - trip.budget, trip.currency)} over budget`
                : `${formatCurrency(trip.budget - totalSpent, trip.currency)} remaining`
              }
              {expensesWishlist > 0 && (
                <span className="text-gray-400 font-normal">
                  {' '}({totalSpent + expensesWishlist > trip.budget
                    ? `${formatCurrency(totalSpent + expensesWishlist - trip.budget, trip.currency)} over`
                    : `${formatCurrency(trip.budget - totalSpent - expensesWishlist, trip.currency)} left`
                  } w/ wishlist)
                </span>
              )}
            </span>
          </div>
        </Card>
      )}

      {trip.dailyFoodBudget && trip.dailyFoodBudget > 0 && (
        <Card className="p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-medium text-gray-500">Food Budget</h2>
              <p className="text-sm text-gray-900">
                <span className="font-bold text-lg">{formatCurrency(trip.dailyFoodBudget, trip.currency)}</span>
                <span className="text-gray-400"> / day</span>
                <span className="mx-2 text-gray-300">·</span>
                <span className="font-bold text-lg">{formatCurrency(totalFoodBudget, trip.currency)}</span>
                <span className="text-gray-400"> total ({days} days)</span>
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card hover className="p-4 h-full flex flex-col">
              <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                {stat.icon}
              </div>
              <div className="mt-auto">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
                {stat.sub ? <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p> : <p className="text-xs mt-0.5">&nbsp;</p>}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {(totalBookingCost > 0 || totalFoodBudget > 0 || expensesCommitted > 0 || expensesWishlist > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(totalBookingCost > 0 || totalFoodBudget > 0) && (
            <Card className="p-5">
              <h2 className="text-sm font-medium text-gray-500 mb-3">Booking Costs</h2>
              <div className="space-y-2">
                {flightsCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Flights</span>
                    <span className="font-medium">{formatCurrency(flightsCost, trip.currency)}</span>
                  </div>
                )}
                {accommodationsCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Accommodation</span>
                    <span className="font-medium">{formatCurrency(accommodationsCost, trip.currency)}</span>
                  </div>
                )}
                {placesCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Activities</span>
                    <span className="font-medium">{formatCurrency(placesCost, trip.currency)}</span>
                  </div>
                )}
                {transportsCost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transport</span>
                    <span className="font-medium">{formatCurrency(transportsCost, trip.currency)}</span>
                  </div>
                )}
                {totalFoodBudget > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Food ({formatCurrency(trip.dailyFoodBudget!, trip.currency)}/day)</span>
                    <span className="font-medium">{formatCurrency(totalFoodBudget, trip.currency)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="font-medium text-gray-900">Total</span>
                  <span className="font-bold text-brand-600 text-lg">
                    {formatCurrency(totalBookingCost + totalFoodBudget, trip.currency)}
                  </span>
                </div>
              </div>
            </Card>
          )}
          {(expensesCommitted > 0 || expensesWishlist > 0) && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-gray-500">Expenses</h2>
                <Link href={`/trips/${tripId}/expenses`} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  View all
                </Link>
              </div>
              <div className="space-y-2">
                {expensesPaid > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid</span>
                    <span className="font-medium text-green-600">{formatCurrency(expensesPaid, trip.currency)}</span>
                  </div>
                )}
                {expensesPlanned > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Planned</span>
                    <span className="font-medium text-amber-600">{formatCurrency(expensesPlanned, trip.currency)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2 flex justify-between">
                  <span className="font-medium text-gray-900">Committed</span>
                  <span className="font-bold text-purple-600 text-lg">
                    {formatCurrency(expensesCommitted, trip.currency)}
                  </span>
                </div>
                {expensesWishlist > 0 && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-600">Wishlist</span>
                    <span className="font-medium text-sky-600">{formatCurrency(expensesWishlist, trip.currency)}</span>
                  </div>
                )}
                {expensesWishlist > 0 && (
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>If all</span>
                    <span>{formatCurrency(expensesCommitted + expensesWishlist, trip.currency)}</span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Trip"
        className="max-w-xl"
      >
        <TripForm
          initialData={trip}
          onSubmit={(data) => {
            updateTrip(tripId, data);
            setIsEditOpen(false);
          }}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>
    </div>
  );
}
