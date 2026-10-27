import * as SecureStore from 'expo-secure-store';

const key = 'verify-system-session';
export async function readSession() { return SecureStore.getItemAsync(key); }
export async function saveSession(value) {
  if (value) await SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  else await SecureStore.deleteItemAsync(key);
}
