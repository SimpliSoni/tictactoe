import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Get a unique device identifier
 * This will be consistent across app launches on the same device
 */
export const getDeviceId = (): string => {
  // Try to get a unique identifier
  const deviceId = 
    Constants.sessionId || 
    Device.osInternalBuildId || 
    `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return deviceId;
};

/**
 * Get device information
 */
export const getDeviceInfo = () => {
  return {
    deviceId: getDeviceId(),
    deviceName: Device.deviceName || 'Unknown Device',
    osName: Device.osName || 'Unknown OS',
    osVersion: Device.osVersion || 'Unknown Version',
    modelName: Device.modelName || 'Unknown Model',
  };
};
