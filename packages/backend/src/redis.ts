import { Redis } from 'ioredis';
import { createLogger } from '@dealith/observability/server';
export function createRedis(url: string, queue = false, service: 'api' | 'worker' = 'api'): Redis {
  const client = new Redis(
    url,
    queue
      ? { maxRetriesPerRequest: null, connectTimeout: 2000 }
      : {
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          connectTimeout: 2000,
          commandTimeout: 2000,
        },
  );
  // One safe event per outage avoids leaking URLs and flooding logs during reconnects.
  const log = createLogger(service);
  let outageLogged = false;
  client.on('error', () => {
    if (!outageLogged) log('redis.unavailable');
    outageLogged = true;
  });
  client.on('ready', () => {
    outageLogged = false;
  });
  return client;
}
