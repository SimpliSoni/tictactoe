import * as Device from 'expo-device';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const DEVICE_ID_KEY = 'tictactoe_device_id';

let cachedDeviceId: string | null = null;

/**
 * Get a unique device identifier
 * This will be consistent across app launches on the same device
 */
export const getDeviceId = async (): Promise<string> => {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    const storedId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    if (storedId) {
      cachedDeviceId = storedId;
      return storedId;
    }
  } catch (error) {
    console.warn('Unable to read stored device ID:', error);
  }

  const generatedId =
    Constants.sessionId ||
    Device.osInternalBuildId ||
    Device.osBuildId ||
    `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  try {
    await SecureStore.setItemAsync(DEVICE_ID_KEY, generatedId);
  } catch (error) {
    console.warn('Unable to persist device ID:', error);
  }

  cachedDeviceId = generatedId;
  return generatedId;
};

/**
 * Get device information
 */
export const getDeviceInfo = async () => {
  return {
    deviceId: await getDeviceId(),
    deviceName: Device.deviceName || 'Unknown Device',
    osName: Device.osName || 'Unknown OS',
    osVersion: Device.osVersion || 'Unknown Version',
    modelName: Device.modelName || 'Unknown Model',
  };
};
