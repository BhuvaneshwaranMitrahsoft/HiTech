import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PINCODE_COORDS, extractPincode, GeoPoint } from '../data/pincode-coords';

const HUB_CONFIG_KEY = 'hitech_hub_custom_config';

export interface HubConfig {
  name: string;
  address: string;
  lat: number;
  lng: number;
  pickupRadiusKm: number;
}

export interface DistanceResult {
  distanceKm: number | null;
  pickupEligible: boolean;
  source: 'geolocation' | 'pincode' | 'unknown';
  label?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DistanceService {
  getHubConfig(): HubConfig {
    try {
      const saved = localStorage.getItem(HUB_CONFIG_KEY);
      if (saved) {
        return { ...environment.hub, ...JSON.parse(saved) };
      }
    } catch {}
    return { ...environment.hub };
  }

  saveHubConfig(config: Partial<HubConfig>): void {
    const merged = { ...this.getHubConfig(), ...config };
    localStorage.setItem(HUB_CONFIG_KEY, JSON.stringify(merged));
  }

  haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  lookupPincode(pincode: string): GeoPoint | null {
    return PINCODE_COORDS[pincode] || null;
  }

  measureFromPincode(pincode: string): DistanceResult {
    const hub = this.getHubConfig();
    const point = this.lookupPincode(pincode);
    if (!point) {
      return { distanceKm: null, pickupEligible: false, source: 'unknown' };
    }
    const distanceKm = this.haversineKm(hub.lat, hub.lng, point.lat, point.lng);
    return {
      distanceKm,
      pickupEligible: distanceKm <= hub.pickupRadiusKm,
      source: 'pincode',
      label: point.label
    };
  }

  measureFromCoords(lat: number, lng: number): DistanceResult {
    const hub = this.getHubConfig();
    const distanceKm = this.haversineKm(hub.lat, hub.lng, lat, lng);
    return {
      distanceKm,
      pickupEligible: distanceKm <= hub.pickupRadiusKm,
      source: 'geolocation'
    };
  }

  measureFromAddress(address: string, pincode?: string): DistanceResult {
    const pin = (pincode || extractPincode(address) || '').trim();
    if (pin.length === 6) {
      return this.measureFromPincode(pin);
    }
    return { distanceKm: null, pickupEligible: false, source: 'unknown' };
  }

  requestBrowserLocation(): Promise<DistanceResult> {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        resolve({ distanceKm: null, pickupEligible: false, source: 'unknown' });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve(this.measureFromCoords(pos.coords.latitude, pos.coords.longitude)),
        () => resolve({ distanceKm: null, pickupEligible: false, source: 'unknown' }),
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  }
}
