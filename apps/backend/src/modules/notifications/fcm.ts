import { messaging } from '../../core/firebase';
import log from '../../core/logger';
import { FcmPayload, NotificationResult } from './types';

function buildMessage(
  target: { token: string } | { tokens: string[] } | { topic: string },
  payload: FcmPayload
): Parameters<typeof messaging.send>[0] | Parameters<typeof messaging.sendEachForMulticast>[0] {
  const notification = {
    title: payload.title,
    body: payload.body,
    ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
  };
  return {
    ...target,
    notification,
    data: payload.data ?? {},
  };
}

export async function sendToDevice(
  token: string,
  payload: FcmPayload
): Promise<NotificationResult> {
  try {
    const message = buildMessage({ token }, payload) as Parameters<typeof messaging.send>[0];
    const messageId = await messaging.send(message);
    return { success: true, messageId };
  } catch (error) {
    log.error('FCM sendToDevice failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendToMultiple(
  tokens: string[],
  payload: FcmPayload
): Promise<NotificationResult[]> {
  if (tokens.length === 0) return [];

  try {
    const multicastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
      },
      data: payload.data ?? {},
    };

    const response = await messaging.sendEachForMulticast(multicastMessage);
    return response.responses.map((r) => ({
      success: r.success,
      messageId: r.messageId,
      error: r.error?.message,
    }));
  } catch (error) {
    log.error('FCM sendToMultiple failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return tokens.map(() => ({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }));
  }
}

export async function sendToTopic(
  topic: string,
  payload: FcmPayload
): Promise<NotificationResult> {
  try {
    const message = buildMessage({ topic }, payload) as Parameters<typeof messaging.send>[0];
    const messageId = await messaging.send(message);
    return { success: true, messageId };
  } catch (error) {
    log.error('FCM sendToTopic failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
