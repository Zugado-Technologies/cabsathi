import type { Place } from './schemas';

/**
 * Approximate Delhi NCR places for local development, used until the
 * Google Places search is connected. Coordinates are approximate.
 */
export const NCR_PLACES: Place[] = [
  { name: 'Sector 62, Noida', lat: 28.627, lng: 77.365 },
  { name: 'Sector 63, Noida', lat: 28.628, lng: 77.383 },
  { name: 'Sector 18, Noida', lat: 28.57, lng: 77.326 },
  { name: 'Sector 125, Noida', lat: 28.544, lng: 77.333 },
  { name: 'Noida City Centre', lat: 28.5747, lng: 77.356 },
  { name: 'Botanical Garden, Noida', lat: 28.564, lng: 77.334 },
  { name: 'Pari Chowk, Greater Noida', lat: 28.467, lng: 77.513 },
  { name: 'Indirapuram, Ghaziabad', lat: 28.6415, lng: 77.371 },
  { name: 'Vaishali, Ghaziabad', lat: 28.645, lng: 77.339 },
  { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538 },
  { name: 'Cyber Hub, Gurgaon', lat: 28.495, lng: 77.089 },
  { name: 'DLF Cyber City, Gurgaon', lat: 28.4935, lng: 77.0935 },
  { name: 'DLF Phase 3, Gurgaon', lat: 28.492, lng: 77.095 },
  { name: 'Udyog Vihar, Gurgaon', lat: 28.502, lng: 77.083 },
  { name: 'IFFCO Chowk, Gurgaon', lat: 28.472, lng: 77.072 },
  { name: 'MG Road, Gurgaon', lat: 28.48, lng: 77.08 },
  { name: 'Sector 54, Gurgaon', lat: 28.438, lng: 77.106 },
  { name: 'Sohna Road, Gurgaon', lat: 28.42, lng: 77.04 },
  { name: 'Connaught Place, Delhi', lat: 28.6315, lng: 77.2167 },
  { name: 'Saket, Delhi', lat: 28.5245, lng: 77.2066 },
  { name: 'Nehru Place, Delhi', lat: 28.5494, lng: 77.2519 },
  { name: 'Hauz Khas, Delhi', lat: 28.5494, lng: 77.2001 },
  { name: 'Lajpat Nagar, Delhi', lat: 28.5677, lng: 77.2433 },
  { name: 'Okhla Phase 3, Delhi', lat: 28.545, lng: 77.273 },
  { name: 'Mayur Vihar Phase 1, Delhi', lat: 28.6046, lng: 77.294 },
  { name: 'Laxmi Nagar, Delhi', lat: 28.6304, lng: 77.2773 },
  { name: 'Akshardham, Delhi', lat: 28.6127, lng: 77.2773 },
  { name: 'Karol Bagh, Delhi', lat: 28.6519, lng: 77.1909 },
  { name: 'Rajouri Garden, Delhi', lat: 28.6415, lng: 77.1209 },
  { name: 'Kashmere Gate, Delhi', lat: 28.6675, lng: 77.228 },
  { name: 'New Delhi Railway Station', lat: 28.643, lng: 77.219 },
  { name: 'Dwarka Sector 10, Delhi', lat: 28.581, lng: 77.057 },
  { name: 'Dwarka Sector 21, Delhi', lat: 28.5523, lng: 77.0586 },
  { name: 'IGI Airport T3, Delhi', lat: 28.5562, lng: 77.1 },
  { name: 'Faridabad Sector 15', lat: 28.395, lng: 77.315 },
];

export function searchPlaces(query: string, limit = 8): Place[] {
  const q = query.trim().toLowerCase();
  if (!q) return NCR_PLACES.slice(0, limit);
  return NCR_PLACES.filter((p) => p.name.toLowerCase().includes(q)).slice(0, limit);
}
