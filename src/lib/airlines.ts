/** IATA 2-letter airline codes → airline names */
const AIRLINES: Record<string, string> = {
  '2S': 'Star Peru',
  '3K': 'Jetstar Asia',
  '4O': 'Interjet',
  '5J': 'Cebu Pacific',
  '6E': '6E IndiGo',
  '7C': 'Jeju Air',
  '9W': 'Jet Airways',
  AA: 'American Airlines',
  AB: 'Air Berlin',
  AC: 'Air Canada',
  AF: 'Air France',
  AI: 'Air India',
  AK: 'AirAsia',
  AM: 'Aeroméxico',
  AR: 'Aerolíneas Argentinas',
  AS: 'Alaska Airlines',
  AT: 'Royal Air Maroc',
  AV: 'Avianca',
  AY: 'Finnair',
  AZ: 'ITA Airways',
  B6: 'JetBlue',
  BA: 'British Airways',
  BE: 'Flybe',
  BG: 'Biman Bangladesh',
  BI: 'Royal Brunei',
  BR: 'EVA Air',
  BT: 'airBaltic',
  BW: 'Caribbean Airlines',
  CA: 'Air China',
  CI: 'China Airlines',
  CM: 'Copa Airlines',
  CX: 'Cathay Pacific',
  CZ: 'China Southern',
  D8: 'Norwegian Air',
  DE: 'Condor',
  DI: 'Norwegian Air',
  DL: 'Delta Air Lines',
  DY: 'Norwegian Air Shuttle',
  EI: 'Aer Lingus',
  EK: 'Emirates',
  EN: 'Air Dolomiti',
  ET: 'Ethiopian Airlines',
  EW: 'Eurowings',
  EY: 'Etihad Airways',
  F9: 'Frontier Airlines',
  FI: 'Icelandair',
  FJ: 'Fiji Airways',
  FR: 'Ryanair',
  FZ: 'flydubai',
  G3: 'Gol Linhas Aéreas',
  GA: 'Garuda Indonesia',
  GF: 'Gulf Air',
  HA: 'Hawaiian Airlines',
  HU: 'Hainan Airlines',
  HV: 'Transavia',
  IB: 'Iberia',
  IG: 'Air Italy',
  J2: 'Azerbaijan Airlines',
  JJ: 'LATAM Brasil',
  JL: 'Japan Airlines',
  JQ: 'Jetstar',
  KA: 'Cathay Dragon',
  KC: 'Air Astana',
  KE: 'Korean Air',
  KL: 'KLM',
  KQ: 'Kenya Airways',
  KU: 'Kuwait Airways',
  LA: 'LATAM Airlines',
  LG: 'Luxair',
  LH: 'Lufthansa',
  LO: 'LOT Polish Airlines',
  LX: 'Swiss International',
  LY: 'El Al',
  ME: 'Middle East Airlines',
  MF: 'Xiamen Airlines',
  MH: 'Malaysia Airlines',
  MS: 'EgyptAir',
  MU: 'China Eastern',
  NH: 'ANA (All Nippon)',
  NK: 'Spirit Airlines',
  NZ: 'Air New Zealand',
  OK: 'Czech Airlines',
  OS: 'Austrian Airlines',
  OZ: 'Asiana Airlines',
  PC: 'Pegasus Airlines',
  PG: 'Bangkok Airways',
  PR: 'Philippine Airlines',
  PS: 'Ukraine Intl Airlines',
  QF: 'Qantas',
  QR: 'Qatar Airways',
  RJ: 'Royal Jordanian',
  RO: 'TAROM',
  SA: 'South African Airways',
  SK: 'SAS Scandinavian',
  SN: 'Brussels Airlines',
  SQ: 'Singapore Airlines',
  SU: 'Aeroflot',
  SV: 'Saudi Arabian Airlines',
  SW: 'Air Namibia',
  TG: 'Thai Airways',
  TK: 'Turkish Airlines',
  TN: 'Air Tahiti Nui',
  TP: 'TAP Air Portugal',
  TR: 'Scoot',
  TW: "T'way Air",
  U2: 'easyJet',
  UA: 'United Airlines',
  UK: 'Vistara',
  UL: 'SriLankan Airlines',
  UX: 'Air Europa',
  VA: 'Virgin Australia',
  VN: 'Vietnam Airlines',
  VS: 'Virgin Atlantic',
  VT: 'Air Tahiti',
  VY: 'Vueling',
  W6: 'Wizz Air',
  WN: 'Southwest Airlines',
  WS: 'WestJet',
  WY: 'Oman Air',
  XR: 'Corendon Airlines Europe',
  ZH: 'Shenzhen Airlines',
};

/**
 * Extract the IATA airline code from a flight number.
 * Handles formats: "BA283", "BA 283", "ba283"
 */
export function parseFlightNumber(flightNumber: string): { airlineCode: string; flightNum: string } | null {
  const cleaned = flightNumber.trim().toUpperCase().replace(/\s+/g, '');
  // Match 2 letters followed by 1-4 digits
  const match = cleaned.match(/^([A-Z\d]{2})(\d{1,4})$/);
  if (!match) return null;
  return { airlineCode: match[1], flightNum: match[2] };
}

/**
 * Get airline name from IATA code. Returns undefined if not found.
 */
export function getAirlineName(iataCode: string): string | undefined {
  return AIRLINES[iataCode.toUpperCase()];
}

/**
 * Parse a flight number and return the airline name if found.
 */
export function lookupAirline(flightNumber: string): string | undefined {
  const parsed = parseFlightNumber(flightNumber);
  if (!parsed) return undefined;
  return getAirlineName(parsed.airlineCode);
}
