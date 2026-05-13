import AsyncStorage from '@react-native-async-storage/async-storage';

type QueuedAction = {
  id: string;
  type: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
};

const QUEUE_KEY = '@offiaxis_offline_queue';
const MAX_RETRIES = 3;

export async function enqueueAction(action: Omit<QueuedAction, 'id' | 'retries' | 'timestamp'>): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...action,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    retries: 0,
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<QueuedAction[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as QueuedAction[];
}

export async function flushQueue(
  executor: (action: QueuedAction) => Promise<void>
): Promise<void> {
  const queue = await getQueue();
  const remaining: QueuedAction[] = [];
  for (const action of queue) {
    try {
      await executor(action);
    } catch {
      if (action.retries < MAX_RETRIES) {
        remaining.push({ ...action, retries: action.retries + 1 });
      }
      // Drop actions that exceeded max retries
    }
  }
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
