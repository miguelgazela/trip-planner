'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { useTripContext } from '@/providers/TripProvider';
import { formatDate, formatDayLabel, formatTripDates } from '@/lib/date-utils';
import { formatCurrency, totalCost } from '@/lib/currency';
import { getAccommodationForDay } from '@/lib/date-utils';
import { TimeOfDay } from '@/types/planner';
import { TRANSPORT_TYPES } from '@/lib/transport-types';

const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning',
  lunch: 'Lunch',
  afternoon: 'Afternoon',
  dinner: 'Dinner',
  night: 'Evening',
};

export default function PrintPage() {
  const params = useParams();
  const tripId = params.tripId as string;
  const {
    getTrip,
    getFlightsForTrip,
    getAccommodationsForTrip,
    getPlacesForTrip,
    getExpensesForTrip,
    getTransportsForTrip,
    getDayPlansForTrip,
  } = useTripContext();

  const trip = getTrip(tripId);

  useEffect(() => {
    const timer = setTimeout(() => window.print(), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!trip) return null;

  const flights = getFlightsForTrip(tripId);
  const accommodations = getAccommodationsForTrip(tripId);
  const places = getPlacesForTrip(tripId);
  const expenses = getExpensesForTrip(tripId);
  const transports = getTransportsForTrip(tripId);
  const dayPlans = getDayPlansForTrip(tripId);

  const flightsCost = totalCost(flights);
  const accommodationsCost = accommodations.reduce((sum, a) => sum + (a.cost ? a.cost / (a.splitCount ?? 1) : 0), 0);
  const placesCost = totalCost(places.filter((p) => p.scheduleStatus === 'scheduled'));
  const transportsCost = transports.reduce((sum, t) => sum + ((t.cost ?? 0) / (t.splitCount ?? 1)), 0);
  const expensesCommitted = expenses
    .filter((e) => e.status === 'paid' || e.status === 'planned')
    .reduce((s, e) => s + e.amount / (e.splitCount ?? 1), 0);
  const totalSpent = flightsCost + accommodationsCost + placesCost + transportsCost + expensesCommitted;

  const placesById = Object.fromEntries(places.map((p) => [p.id, p]));
  const transportsById = Object.fromEntries(transports.map((t) => [t.id, t]));

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 print:px-0 print:py-0 print:max-w-none">
      {/* Print button - hidden in print */}
      <button
        onClick={() => window.print()}
        className="print:hidden fixed bottom-6 right-6 z-50 bg-brand-600 text-white px-5 py-3 rounded-full shadow-lg hover:bg-brand-700 transition-colors flex items-center gap-2 font-medium"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        Print / Save PDF
      </button>

      {/* Header */}
      <div className="mb-8 border-b-2 border-gray-900 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">{trip.name}</h1>
        <p className="text-lg text-gray-600 mt-1">{trip.destination}</p>
        <p className="text-sm text-gray-500 mt-1">
          {formatTripDates(trip.startDate, trip.endDate, trip.dateMode)}
        </p>
        {trip.budget && (
          <p className="text-sm text-gray-500 mt-1">
            Budget: {formatCurrency(trip.budget, trip.currency)}
            {' · '}Spent: {formatCurrency(totalSpent, trip.currency)}
            {' · '}
            {totalSpent <= trip.budget
              ? `${formatCurrency(trip.budget - totalSpent, trip.currency)} remaining`
              : `${formatCurrency(totalSpent - trip.budget, trip.currency)} over budget`
            }
          </p>
        )}
      </div>

      {/* Flights */}
      {flights.length > 0 && (
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Flights
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 font-semibold text-gray-700">Flight</th>
                <th className="text-left py-2 font-semibold text-gray-700">Route</th>
                <th className="text-left py-2 font-semibold text-gray-700">Departure</th>
                <th className="text-left py-2 font-semibold text-gray-700">Arrival</th>
                {flightsCost > 0 && <th className="text-right py-2 font-semibold text-gray-700">Cost</th>}
              </tr>
            </thead>
            <tbody>
              {flights.map((f) => (
                <tr key={f.id} className="border-b border-gray-100">
                  <td className="py-2">
                    <span className="font-medium">{f.flightNumber}</span>
                    {f.airline && <span className="text-gray-500 ml-1">({f.airline})</span>}
                  </td>
                  <td className="py-2">{f.departureAirport} → {f.arrivalAirport}</td>
                  <td className="py-2">{format(parseISO(f.departureTime), 'MMM dd, HH:mm')}</td>
                  <td className="py-2">{format(parseISO(f.arrivalTime), 'MMM dd, HH:mm')}</td>
                  {flightsCost > 0 && (
                    <td className="py-2 text-right">{f.cost ? formatCurrency(f.cost, trip.currency) : '—'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {flightsCost > 0 && (
            <p className="text-right text-sm font-medium mt-1">
              Total: {formatCurrency(flightsCost, trip.currency)}
            </p>
          )}
        </section>
      )}

      {/* Accommodation */}
      {accommodations.length > 0 && (
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Accommodation
          </h2>
          <div className="space-y-3">
            {accommodations.map((acc) => (
              <div key={acc.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{acc.name}</p>
                    <p className="text-sm text-gray-500">{acc.address}</p>
                  </div>
                  {acc.cost != null && acc.cost > 0 && (
                    <span className="text-sm font-medium">
                      {formatCurrency(acc.cost / (acc.splitCount ?? 1), trip.currency)}
                      {acc.splitCount && acc.splitCount > 1 && (
                        <span className="text-xs text-gray-400 ml-1">(÷{acc.splitCount})</span>
                      )}
                    </span>
                  )}
                </div>
                <div className="flex gap-4 mt-2 text-xs text-gray-600">
                  <span>Check-in: {formatDate(acc.checkIn)}{acc.checkInTime ? ` at ${acc.checkInTime}` : ''}</span>
                  <span>Check-out: {formatDate(acc.checkOut)}{acc.checkOutTime ? ` at ${acc.checkOutTime}` : ''}</span>
                </div>
                {acc.confirmationCode && (
                  <p className="text-xs text-gray-500 mt-1">Confirmation: {acc.confirmationCode}</p>
                )}
              </div>
            ))}
          </div>
          {accommodationsCost > 0 && (
            <p className="text-right text-sm font-medium mt-2">
              Total: {formatCurrency(accommodationsCost, trip.currency)}
            </p>
          )}
        </section>
      )}

      {/* Day-by-Day Itinerary */}
      {dayPlans.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Daily Itinerary
          </h2>
          <div className="space-y-4">
            {dayPlans.map((day, dayIdx) => {
              const dayItems = day.items;
              const accBlocks: { type: string; name: string; time?: string }[] = [];
              accommodations.forEach((acc) => {
                const status = getAccommodationForDay(day.date, acc.checkIn, acc.checkOut);
                if (status === 'check-in') {
                  accBlocks.push({ type: 'Check-in', name: acc.name, time: acc.checkInTime });
                } else if (status === 'check-out') {
                  accBlocks.push({ type: 'Check-out', name: acc.name, time: acc.checkOutTime });
                }
              });

              const hasContent = dayItems.length > 0 || accBlocks.length > 0;

              return (
                <div key={day.id} className="break-inside-avoid border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      Day {dayIdx + 1} — {formatDayLabel(day.date)}
                    </h3>
                    {dayItems.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {dayItems.length} {dayItems.length === 1 ? 'activity' : 'activities'}
                      </span>
                    )}
                  </div>
                  <div className="px-4 py-2">
                    {!hasContent && (
                      <p className="text-sm text-gray-400 italic py-1">No activities planned</p>
                    )}

                    {accBlocks.map((block, i) => (
                      <div key={i} className="flex items-center gap-2 py-1 text-sm">
                        <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                          {block.type}
                        </span>
                        <span className="text-gray-700">{block.name}</span>
                        {block.time && <span className="text-gray-400 text-xs">at {block.time}</span>}
                      </div>
                    ))}

                    {(['morning', 'lunch', 'afternoon', 'dinner', 'night'] as TimeOfDay[]).map((tod) => {
                      const sectionItems = dayItems
                        .filter((item) => (item.timeOfDay ?? 'morning') === tod)
                        .sort((a, b) => a.order - b.order);
                      if (sectionItems.length === 0) return null;

                      return (
                        <div key={tod} className="mt-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            {TIME_LABELS[tod]}
                          </p>
                          {sectionItems.map((item, idx) => {
                            if (item.transportId) {
                              const transport = transportsById[item.transportId];
                              if (!transport) return null;
                              return (
                                <div key={item.id} className="flex items-start gap-2 py-0.5 text-sm">
                                  <span className="text-gray-400 text-xs mt-0.5 w-4 text-right">{idx + 1}.</span>
                                  <div className="flex-1">
                                    <span className="text-xs font-medium text-teal-700 bg-teal-50 px-1 py-0.5 rounded mr-1">
                                      {TRANSPORT_TYPES[transport.type].label}
                                    </span>
                                    <span className="font-medium text-gray-900">{transport.from} → {transport.to}</span>
                                    {transport.cost != null && transport.cost > 0 && (
                                      <span className="text-gray-500 text-xs ml-2">
                                        ({formatCurrency(transport.cost / (transport.splitCount ?? 1), trip.currency)})
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            }
                            const place = item.placeId ? placesById[item.placeId] : null;
                            if (!place) return null;
                            return (
                              <div key={item.id} className="flex items-start gap-2 py-0.5 text-sm">
                                <span className="text-gray-400 text-xs mt-0.5 w-4 text-right">{idx + 1}.</span>
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900">{place.name}</span>
                                  {place.address && (
                                    <span className="text-gray-400 text-xs ml-2">{place.address}</span>
                                  )}
                                  {place.cost != null && place.cost > 0 && (
                                    <span className="text-gray-500 text-xs ml-2">
                                      ({formatCurrency(place.cost, trip.currency)})
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Expenses Summary */}
      {expenses.length > 0 && (
        <section className="mb-8 break-inside-avoid">
          <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expenses
          </h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-300">
                <th className="text-left py-2 font-semibold text-gray-700">Description</th>
                <th className="text-left py-2 font-semibold text-gray-700">Status</th>
                <th className="text-right py-2 font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id} className="border-b border-gray-100">
                  <td className="py-1.5">
                    <span className="text-gray-900">{exp.description}</span>
                    {exp.date && (
                      <span className="text-gray-400 text-xs ml-2">{formatDate(exp.date)}</span>
                    )}
                  </td>
                  <td className="py-1.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      exp.status === 'paid' ? 'bg-green-100 text-green-700' :
                      exp.status === 'planned' ? 'bg-amber-100 text-amber-700' :
                      'bg-sky-100 text-sky-700'
                    }`}>
                      {exp.status}
                    </span>
                  </td>
                  <td className="py-1.5 text-right font-medium">
                    {formatCurrency(exp.amount / (exp.splitCount ?? 1), trip.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-right text-sm font-medium mt-2">
            Committed: {formatCurrency(expensesCommitted, trip.currency)}
          </p>
        </section>
      )}

      {/* Cost Summary */}
      {totalSpent > 0 && (
        <section className="break-inside-avoid border-t-2 border-gray-900 pt-4">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cost Summary</h2>
          <div className="space-y-1 text-sm">
            {flightsCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Flights</span>
                <span className="font-medium">{formatCurrency(flightsCost, trip.currency)}</span>
              </div>
            )}
            {accommodationsCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Accommodation</span>
                <span className="font-medium">{formatCurrency(accommodationsCost, trip.currency)}</span>
              </div>
            )}
            {placesCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Activities</span>
                <span className="font-medium">{formatCurrency(placesCost, trip.currency)}</span>
              </div>
            )}
            {transportsCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Transport</span>
                <span className="font-medium">{formatCurrency(transportsCost, trip.currency)}</span>
              </div>
            )}
            {expensesCommitted > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expenses</span>
                <span className="font-medium">{formatCurrency(expensesCommitted, trip.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-300 pt-2 mt-2">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-gray-900 text-lg">{formatCurrency(totalSpent, trip.currency)}</span>
            </div>
            {trip.budget && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Budget</span>
                <span className={totalSpent > trip.budget ? 'text-red-600 font-medium' : 'text-green-600'}>
                  {totalSpent <= trip.budget
                    ? `${formatCurrency(trip.budget - totalSpent, trip.currency)} remaining`
                    : `${formatCurrency(totalSpent - trip.budget, trip.currency)} over budget`
                  }
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        Generated by TripPlanner · {format(new Date(), 'MMM dd, yyyy')}
      </div>
    </div>
  );
}
