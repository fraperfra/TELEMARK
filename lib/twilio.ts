import { Device, Call } from '@twilio/voice-sdk';

let twilioDevice: Device | null = null;

/**
 * Inizializza il dispositivo Twilio Voice SDK
 * Richiede un token di accesso generato dal backend
 */
export const initTwilioDevice = async (accessToken: string): Promise<Device> => {
  if (twilioDevice) {
    twilioDevice.destroy();
  }

  twilioDevice = new Device(accessToken, {
    codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
  });

  await twilioDevice.register();
  return twilioDevice;
};

export const getTwilioDevice = () => twilioDevice;

export const destroyTwilioDevice = () => {
  if (twilioDevice) {
    twilioDevice.destroy();
    twilioDevice = null;
  }
};

/**
 * Effettua una chiamata con Twilio
 */
export const makeCall = async (to: string, params?: Record<string, string>) => {
  if (!twilioDevice) {
    throw new Error('Twilio device non inizializzato. Chiama initTwilioDevice prima.');
  }

  const call = await twilioDevice.connect({
    params: {
      To: to,
      ...params,
    },
  });

  return call;
};
