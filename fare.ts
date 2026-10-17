export type RideType = "moto" | "car";
export const RATE_RWF_PER_KM: Record<RideType, number> = { moto: 500, car: 500 };
export function calculateFare(type: RideType, km: number) {
  return Math.max(0, Math.ceil(km * RATE_RWF_PER_KM[type]));
}
