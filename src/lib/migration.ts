import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Trip, Flight, Accommodation, Place, Expense, Transport } from '@/types/trip';
import { DayPlan } from '@/types/planner';
import {
  tripToRow,
  flightToRow,
  accommodationToRow,
  placeToRow,
  expenseToRow,
  transportToRow,
  dayPlanToRow,
} from '@/lib/supabase/mappers';
import { getAllImages } from '@/lib/image-cache';

const BACKUP_KEYS = [
  'trip-planner:trips',
  'trip-planner:flights',
  'trip-planner:accommodations',
  'trip-planner:places',
  'trip-planner:expenses',
  'trip-planner:transports',
  'trip-planner:dayplans',
] as const;

const MIGRATED_KEY = 'trip-planner:migrated';

export function hasLocalData(): boolean {
  if (typeof window === 'undefined') return false;
  return BACKUP_KEYS.some((key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) && arr.length > 0;
    } catch {
      return false;
    }
  });
}

export function hasMigrated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MIGRATED_KEY) === 'true';
}

export function markMigrated(): void {
  localStorage.setItem(MIGRATED_KEY, 'true');
}

function readLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export interface MigrationProgress {
  step: string;
  current: number;
  total: number;
}

export async function migrateToSupabase(
  userId: string,
  onProgress?: (p: MigrationProgress) => void
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const trips = readLocal<Trip>('trip-planner:trips');
    const flights = readLocal<Flight>('trip-planner:flights');
    const accommodations = readLocal<Accommodation>('trip-planner:accommodations');
    const places = readLocal<Place>('trip-planner:places');
    const expenses = readLocal<Expense>('trip-planner:expenses');
    const transports = readLocal<Transport>('trip-planner:transports');
    const dayPlans = readLocal<DayPlan>('trip-planner:dayplans');

    const total = trips.length + flights.length + accommodations.length +
      places.length + expenses.length + transports.length +
      dayPlans.length;
    let current = 0;

    const report = (step: string) => {
      current++;
      onProgress?.({ step, current, total });
    };

    // Upsert trips
    if (trips.length > 0) {
      const rows = trips.map((t) => tripToRow(t, userId));
      const { error } = await supabase.from('trips').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`trips: ${error.message}`);
      trips.forEach(() => report('Trips'));
    }

    // Upsert flights
    if (flights.length > 0) {
      const rows = flights.map((f) => flightToRow(f, userId));
      const { error } = await supabase.from('flights').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`flights: ${error.message}`);
      flights.forEach(() => report('Flights'));
    }

    // Upsert accommodations
    if (accommodations.length > 0) {
      const rows = accommodations.map((a) => accommodationToRow(a, userId));
      const { error } = await supabase.from('accommodations').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`accommodations: ${error.message}`);
      accommodations.forEach(() => report('Accommodations'));
    }

    // Upsert places — handle idb: images
    if (places.length > 0) {
      // Migrate scheduledDayIds if needed
      const fixedPlaces = places.map((p) => {
        const fixed = { ...p };
        if (!Array.isArray(fixed.scheduledDayIds)) {
          const oldId = (fixed as unknown as { scheduledDayId?: string }).scheduledDayId;
          fixed.scheduledDayIds = oldId ? [oldId] : [];
        }
        // Fix food -> restaurant category
        fixed.categories = (fixed.categories as string[]).map((c) =>
          c === 'food' ? 'restaurant' : c
        ) as Place['categories'];
        return fixed;
      });

      const rows = fixedPlaces.map((p) => placeToRow(p, userId));
      const { error } = await supabase.from('places').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`places: ${error.message}`);
      places.forEach(() => report('Places'));
    }

    // Upsert expenses
    if (expenses.length > 0) {
      const rows = expenses.map((e) => expenseToRow(e, userId));
      const { error } = await supabase.from('expenses').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`expenses: ${error.message}`);
      expenses.forEach(() => report('Expenses'));
    }

    // Upsert transports
    if (transports.length > 0) {
      const fixedTransports = transports.map((t) => {
        const fixed = { ...t };
        if (!Array.isArray(fixed.scheduledDayIds)) {
          fixed.scheduledDayIds = [];
        }
        return fixed;
      });
      const rows = fixedTransports.map((t) => transportToRow(t, userId));
      const { error } = await supabase.from('transports').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`transports: ${error.message}`);
      transports.forEach(() => report('Transports'));
    }

    // Upsert day plans
    if (dayPlans.length > 0) {
      const rows = dayPlans.map((d) => dayPlanToRow(d, userId));
      const { error } = await supabase.from('day_plans').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`day_plans: ${error.message}`);
      dayPlans.forEach(() => report('Day Plans'));
    }

    // Upload images from IndexedDB to Supabase Storage
    try {
      const images = await getAllImages();
      const imageEntries = Object.entries(images);
      if (imageEntries.length > 0) {
        onProgress?.({ step: 'Images', current: 0, total: imageEntries.length });
        for (let i = 0; i < imageEntries.length; i++) {
          const [id, dataUrl] = imageEntries[i];
          onProgress?.({ step: `Uploading image ${i + 1}/${imageEntries.length}`, current: i, total: imageEntries.length });
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const ext = blob.type.split('/')[1] ?? 'jpg';
            const path = `${userId}/places/${id}.${ext}`;

            await supabase.storage.from('images').upload(path, blob, { upsert: true });
            const { data } = supabase.storage.from('images').getPublicUrl(path);

            // Update place with new image URL
            if (data?.publicUrl) {
              await supabase.from('places').update({ image_url: data.publicUrl }).eq('id', id);
              // Also check accommodations
              await supabase.from('accommodations').update({ image_url: data.publicUrl }).eq('id', id);
            }
          } catch {
            // Non-fatal: image upload failed
          }
        }
      }
    } catch {
      // IndexedDB may not be available
    }

    markMigrated();
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Import a previously-exported backup JSON file directly into Supabase.
 */
export async function importBackupToSupabase(
  userId: string,
  fileContent: string,
  onProgress?: (p: MigrationProgress) => void
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const data = JSON.parse(fileContent);

    const trips = (data['trip-planner:trips'] ?? []) as Trip[];
    const flights = (data['trip-planner:flights'] ?? []) as Flight[];
    const accommodations = (data['trip-planner:accommodations'] ?? []) as Accommodation[];
    const places = (data['trip-planner:places'] ?? []) as Place[];
    const expenses = (data['trip-planner:expenses'] ?? []) as Expense[];
    const transports = (data['trip-planner:transports'] ?? []) as Transport[];
    const dayPlans = (data['trip-planner:dayplans'] ?? []) as DayPlan[];
    const images = (data['trip-planner:images'] ?? {}) as Record<string, string>;

    const total = trips.length + flights.length + accommodations.length +
      places.length + expenses.length + transports.length +
      dayPlans.length + Object.keys(images).length;
    let current = 0;

    const report = (step: string) => {
      current++;
      onProgress?.({ step, current, total });
    };

    if (trips.length > 0) {
      const rows = trips.map((t) => tripToRow(t, userId));
      const { error } = await supabase.from('trips').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`trips: ${error.message}`);
      trips.forEach(() => report('Trips'));
    }

    if (flights.length > 0) {
      const rows = flights.map((f) => flightToRow(f, userId));
      const { error } = await supabase.from('flights').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`flights: ${error.message}`);
      flights.forEach(() => report('Flights'));
    }

    if (accommodations.length > 0) {
      const rows = accommodations.map((a) => accommodationToRow(a, userId));
      const { error } = await supabase.from('accommodations').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`accommodations: ${error.message}`);
      accommodations.forEach(() => report('Accommodations'));
    }

    if (places.length > 0) {
      const fixedPlaces = places.map((p) => {
        const fixed = { ...p };
        if (!Array.isArray(fixed.scheduledDayIds)) {
          const oldId = (fixed as unknown as { scheduledDayId?: string }).scheduledDayId;
          fixed.scheduledDayIds = oldId ? [oldId] : [];
        }
        fixed.categories = (fixed.categories as string[]).map((c) =>
          c === 'food' ? 'restaurant' : c
        ) as Place['categories'];
        return fixed;
      });
      const rows = fixedPlaces.map((p) => placeToRow(p, userId));
      const { error } = await supabase.from('places').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`places: ${error.message}`);
      places.forEach(() => report('Places'));
    }

    if (expenses.length > 0) {
      const rows = expenses.map((e) => expenseToRow(e, userId));
      const { error } = await supabase.from('expenses').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`expenses: ${error.message}`);
      expenses.forEach(() => report('Expenses'));
    }

    if (transports.length > 0) {
      const fixedTransports = transports.map((t) => {
        const fixed = { ...t };
        if (!Array.isArray(fixed.scheduledDayIds)) {
          fixed.scheduledDayIds = [];
        }
        return fixed;
      });
      const rows = fixedTransports.map((t) => transportToRow(t, userId));
      const { error } = await supabase.from('transports').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`transports: ${error.message}`);
      transports.forEach(() => report('Transports'));
    }

    if (dayPlans.length > 0) {
      const rows = dayPlans.map((d) => dayPlanToRow(d, userId));
      const { error } = await supabase.from('day_plans').upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`day_plans: ${error.message}`);
      dayPlans.forEach(() => report('Day Plans'));
    }

    // Upload embedded images to Supabase Storage
    const imageEntries = Object.entries(images);
    for (let i = 0; i < imageEntries.length; i++) {
      const [id, dataUrl] = imageEntries[i];
      report(`Uploading image ${i + 1}/${imageEntries.length}`);
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const ext = blob.type.split('/')[1] ?? 'jpg';
        const path = `${userId}/places/${id}.${ext}`;

        await supabase.storage.from('images').upload(path, blob, { upsert: true });
        const { data: urlData } = supabase.storage.from('images').getPublicUrl(path);

        if (urlData?.publicUrl) {
          await supabase.from('places').update({ image_url: urlData.publicUrl }).eq('id', id);
          await supabase.from('accommodations').update({ image_url: urlData.publicUrl }).eq('id', id);
        }
      } catch {
        // Non-fatal
      }
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
