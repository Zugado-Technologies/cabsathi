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
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * API address. On the web it's localhost; on a phone running Expo Go it's
 * the laptop's IP that Expo is served from. EXPO_PUBLIC_API_URL overrides both.
 */
function apiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL;
  if (Platform.OS === 'web') return 'http://localhost:4000';
  const host = Constants.expoConfig?.hostUri?.split(':')[0] ?? 'localhost';
  return `http://${host}:4000`;
}

export const API_URL = apiBaseUrl();

let authToken: string | null = null;
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        ...(body !== undefined && { 'content-type': 'application/json' }),
        ...(authToken && { authorization: `Bearer ${authToken}` }),
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
  cancelRide: (id: string) => call<Ride>('POST', `/rides/${id}/cancel`),
  matches: (rideId: string) => call<MatchCard[]>('GET', `/rides/${rideId}/matches`),
  sendRequest: (rideId: string, toRideId: string) =>
    call<{ id: string; status: string }>('POST', `/rides/${rideId}/requests`, { toRideId }),
  receivedRequests: () => call<ReceivedRequest[]>('GET', '/requests/received'),
  acceptRequest: (id: string) => call('POST', `/requests/${id}/accept`),
  rejectRequest: (id: string) => call('POST', `/requests/${id}/reject`),
};
