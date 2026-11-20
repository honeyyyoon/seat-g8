import * as Location from 'expo-location';
import { useState } from 'react';

export type Coords = { lat: number; lng: number };

export type LocationState =
  | { status: 'idle' }
  | { status: 'asking' }
  | { status: 'denied' }
  | { status: 'error' }
  | { status: 'ready'; coords: Coords };

export function useCurrentLocation() {
  const [state, setState] = useState<LocationState>({ status: 'idle' });

  async function request() {
    setState({ status: 'asking' });
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setState({ status: 'denied' });
        return;
      }
      const position =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      setState({ status: 'ready', coords: { lat: position.coords.latitude, lng: position.coords.longitude } });
    } catch {
      setState({ status: 'error' });
    }
  }

  return { state, request };
}

export function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export async function hasLocationPermission() {
  const { granted } = await Location.getForegroundPermissionsAsync();
  return granted;
}
