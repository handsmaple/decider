import { Platform } from 'react-native';

// Development defaults:
//   iOS simulator  → localhost resolves to the host machine
//   Android emu    → 10.0.2.2 resolves to the host machine
//   Physical device → set EXPO_PUBLIC_API_URL to your LAN IP, e.g. http://192.168.1.x:3000
const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_URL =
  process.env['EXPO_PUBLIC_API_URL'] ?? `http://${DEV_HOST}:3000`;
