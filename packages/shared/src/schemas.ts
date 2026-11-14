import { z } from 'zod';

/** Request/response shapes shared by the app and the API. */

export const phoneSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number');

export const sendOtpSchema = z.object({ phone: phoneSchema });
export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const genderSchema = z.enum(['male', 'female', 'other']);
export const genderPrefSchema = z.enum(['any', 'same']);

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  gender: genderSchema.optional(),
  birthYear: z.number().int().min(1940).max(new Date().getFullYear() - 16).optional(),
});

export const placeSchema = z.object({
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const estimateRideSchema = z.object({ from: placeSchema, to: placeSchema });

export const createRideSchema = z.object({
  from: placeSchema,
  to: placeSchema,
  departAt: z.string().datetime({ offset: true }),
  /** Co-riders you are happy to share with (1-3). */
  seats: z.number().int().min(1).max(3),
  genderPref: genderPrefSchema,
});

export type Gender = z.infer<typeof genderSchema>;
export type GenderPref = z.infer<typeof genderPrefSchema>;
export type Place = z.infer<typeof placeSchema>;
export type CreateRideInput = z.infer<typeof createRideSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type RideStatus = 'published' | 'matched' | 'cancelled' | 'completed';
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface UserPublic {
  id: string;
  name: string | null;
  age: number | null;
  gender: Gender | null;
  rating: number;
  ridesCount: number;
  verified: boolean;
}

export interface Ride {
  id: string;
  userId: string;
  from: Place;
  to: Place;
  departAt: string;
  seats: number;
  genderPref: GenderPref;
  distanceKm: number;
  durationMin: number;
  soloFare: number;
  status: RideStatus;
}

export interface RideEstimate {
  distanceKm: number;
  durationMin: number;
  soloFare: number;
}

export interface MatchCard {
  ride: Ride;
  user: UserPublic;
  level: 'exact' | 'nearby' | 'flexible';
  score: number;
  pickupGapKm: number;
  minsToMeet: number;
  sharedKm: number;
  overlapPct: number;
  myDetourKm: number;
  timeGapMin: number;
  myShare: number;
  shareRange: { min: number; max: number };
  /** Request already sent from my ride to this one, if any. */
  requestStatus: RequestStatus | null;
}

export interface ReceivedRequest {
  id: string;
  status: RequestStatus;
  createdAt: string;
  fromRide: Ride;
  fromUser: UserPublic;
  toRide: Ride;
  match: Omit<MatchCard, 'ride' | 'user' | 'requestStatus'> | null;
}
