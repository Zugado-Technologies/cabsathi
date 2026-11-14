import type {
  CreateRideInput,
  MatchCard,
  Place,
  ReceivedRequest,
  Ride,
  RideEstimate,
  UpdateProfileInput,
  UserPublic,
} from '@cabsathi/shared';
import { API_URL } from './site';

const TOKEN_KEY = 'cabsathi.token';

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        ...(body !== undefined && { 'content-type': 'application/json' }),
        ...(token && { authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? 'Something went wrong');
  return data as T;
}

export type Me = UserPublic & { phone: string };

export const api = {
  sendOtp: (phone: string) => call<{ sent: boolean; devMode: boolean }>('POST', '/auth/send-otp', { phone }),
  verifyOtp: (phone: string, code: string) =>
    call<{ token: string; user: Me }>('POST', '/auth/verify-otp', { phone, code }),
  me: () => call<Me>('GET', '/me'),
  updateMe: (input: UpdateProfileInput) => call<Me>('PATCH', '/me', input),
  places: (q: string) => call<Place[]>('GET', `/places?q=${encodeURIComponent(q)}`),
  estimate: (from: Place, to: Place) => call<RideEstimate>('POST', '/rides/estimate', { from, to }),
  createRide: (input: CreateRideInput) => call<Ride>('POST', '/rides', input),
  myRides: () => call<Ride[]>('GET', '/rides/mine'),
  ride: (id: string) => call<Ride>('GET', `/rides/${id}`),
  matches: (rideId: string) => call<MatchCard[]>('GET', `/rides/${rideId}/matches`),
  sendRequest: (rideId: string, toRideId: string) =>
    call<{ id: string; status: string }>('POST', `/rides/${rideId}/requests`, { toRideId }),
  receivedRequests: () => call<ReceivedRequest[]>('GET', '/requests/received'),
  acceptRequest: (id: string) => call('POST', `/requests/${id}/accept`),
  rejectRequest: (id: string) => call('POST', `/requests/${id}/reject`),
};
