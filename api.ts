import { io, Socket } from 'socket.io-client';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

export type RideType = 'moto' | 'car';
export type RideStatus = 'searching' | 'accepted' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';

export type Coordinate = { latitude: number; longitude: number };
export type Ride = {
  id: string;
  passengerId: string;
  driverId?: string;
  pickup: Coordinate;
  destination: Coordinate;
  type: RideType;
  fare: number;
  status: RideStatus;
  driver?: { name: string; phone: string; location?: Coordinate; vehicle: string };
};

export async function requestRide(payload: Omit<Ride, 'id' | 'status' | 'fare'>) {
  const res = await fetch(`${API_URL}/rides`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Could not request ride');
  return (await res.json()) as Ride;
}

export function connectRideSocket(rideId: string, onRide: (ride: Ride) => void): Socket {
  const socket = io(API_URL, { transports: ['websocket'] });
  socket.on('connect', () => socket.emit('ride:subscribe', rideId));
  socket.on('ride:update', onRide);
  return socket;
}
