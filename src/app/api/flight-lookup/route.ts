import { NextRequest, NextResponse } from 'next/server';

interface FlightData {
  airline?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureTime?: string;
  arrivalTime?: string;
}

export async function GET(request: NextRequest) {
  const flightNumber = request.nextUrl.searchParams.get('flight');
  if (!flightNumber) {
    return NextResponse.json({ error: 'Missing flight parameter' }, { status: 400 });
  }

  const apiKey = process.env.AVIATIONSTACK_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Flight API not configured' }, { status: 501 });
  }

  const iata = flightNumber.replace(/\s+/g, '').toUpperCase();

  try {
    // AviationStack free tier uses HTTP only
    const url = `http://api.aviationstack.com/v1/flights?access_key=${encodeURIComponent(apiKey)}&flight_iata=${encodeURIComponent(iata)}&limit=1`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      return NextResponse.json({ error: 'API request failed' }, { status: 502 });
    }

    const json = await res.json();

    if (json.error) {
      return NextResponse.json({ error: json.error.info || 'API error' }, { status: 502 });
    }

    if (!json.data || json.data.length === 0) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }

    const flight = json.data[0];
    const data: FlightData = {
      airline: flight.airline?.name,
      departureAirport: flight.departure?.iata,
      arrivalAirport: flight.arrival?.iata,
      departureTime: flight.departure?.scheduled,
      arrivalTime: flight.arrival?.scheduled,
    };

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch flight data' }, { status: 500 });
  }
}
