export interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
}

/** Approximate coordinates for common hub-area pincodes (Tamil Nadu / nearby cities). */
export const PINCODE_COORDS: Record<string, GeoPoint> = {
  '600001': { lat: 13.0827, lng: 80.2707, label: 'Chennai GPO' },
  '600002': { lat: 13.0698, lng: 80.2707, label: 'Anna Salai' },
  '600004': { lat: 13.0418, lng: 80.2676, label: 'Mylapore' },
  '600006': { lat: 13.0604, lng: 80.2496, label: 'Greams Road' },
  '600017': { lat: 13.0410, lng: 80.2330, label: 'T. Nagar' },
  '600020': { lat: 13.0067, lng: 80.2206, label: 'Adyar' },
  '600028': { lat: 13.0102, lng: 80.2157, label: 'Raja Annamalai Puram' },
  '600032': { lat: 13.0067, lng: 80.2209, label: 'Guindy' },
  '600040': { lat: 13.0850, lng: 80.2101, label: 'Anna Nagar' },
  '600042': { lat: 12.9759, lng: 80.2210, label: 'Velachery' },
  '600083': { lat: 12.9470, lng: 80.1400, label: 'Tambaram' },
  '600088': { lat: 12.9229, lng: 80.1275, label: 'Pallavaram' },
  '600096': { lat: 12.9507, lng: 80.2496, label: 'Perungudi' },
  '600100': { lat: 12.8996, lng: 80.2209, label: 'Sholinganallur' },
  '603103': { lat: 12.8230, lng: 80.0444, label: 'Chengalpattu' },
  '631501': { lat: 12.8342, lng: 79.7036, label: 'Kanchipuram' },
  '632001': { lat: 12.9165, lng: 79.1325, label: 'Vellore' },
  '636001': { lat: 11.6643, lng: 78.1460, label: 'Salem' },
  '638001': { lat: 11.3410, lng: 77.7172, label: 'Erode' },
  '641001': { lat: 11.0168, lng: 76.9558, label: 'Coimbatore' },
  '641009': { lat: 11.0183, lng: 76.9725, label: 'Coimbatore Cross Cut' },
  '641012': { lat: 11.0169, lng: 76.9685, label: 'Gandhipuram' },
  '620001': { lat: 10.7905, lng: 78.7047, label: 'Trichy' },
  '625001': { lat: 9.9252, lng: 78.1198, label: 'Madurai' },
  '627002': { lat: 8.7139, lng: 77.7567, label: 'Tirunelveli' },
  '560001': { lat: 12.9716, lng: 77.5946, label: 'Bengaluru' }
};

export function extractPincode(text: string): string | null {
  const match = (text || '').match(/\b(\d{6})\b/);
  return match ? match[1] : null;
}
