import {
  Controller,
  Get,
  Inject,
  Injectable,
  Module,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ServerConfig } from '@dealith/config/server';
import type { Database } from './database.js';
import type { Redis } from 'ioredis';
import { inSpan } from '@dealith/observability/server';
export const DATABASE = Symbol('DATABASE');
export const REDIS = Symbol('REDIS');
export const CONFIG = Symbol('CONFIG');
@Module({})
export class ConfigModule {
  static register(config: ServerConfig) {
    return {
      module: ConfigModule,
      providers: [{ provide: CONFIG, useValue: config }],
      exports: [CONFIG],
    };
  }
}
@Module({})
export class DatabaseModule {
  static register(database: Database) {
    return {
      module: DatabaseModule,
      providers: [{ provide: DATABASE, useValue: database }],
      exports: [DATABASE],
    };
  }
}
@Module({})
export class RedisModule {
  static register(redis: Redis) {
    return {
      module: RedisModule,
      providers: [{ provide: REDIS, useValue: redis }],
      exports: [REDIS],
    };
  }
}
// Explicit composition seams only. Neither authenticates users nor grants any permission.
@Module({
  providers: [{ provide: 'AUTH_IMPLEMENTED', useValue: false }],
  exports: ['AUTH_IMPLEMENTED'],
})
export class AuthPlaceholderModule {}
// The platform audit persistence harness exists; business audit commands arrive in their owning phases.
@Module({ providers: [{ provide: 'BUSINESS_AUDIT_IMPLEMENTED', useValue: false }] })
export class AuditPlaceholderModule {}
@Module({ providers: [{ provide: 'TELEMETRY_BOOTSTRAP', useValue: 'composition-root' }] })
export class ObservabilityModule {}
@Injectable()
export class HealthService {
  constructor(
    @Inject(DATABASE) private readonly database: Database,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}
  async ready(): Promise<void> {
    return inSpan('health.ready', async () => {
      try {
        await Promise.all([
          inSpan('database.readiness', () =>
            this.database.outboxEvent.findFirst({ select: { id: true } }),
          ),
          inSpan('database.schema', () =>
            this.database.consumerReceipt.findFirst({ select: { eventId: true } }),
          ),
          inSpan('redis.ping', async () => {
            if ((await this.redis.ping()) !== 'PONG') throw new Error('Dependency unavailable');
          }),
        ]);
      } catch {
        throw new ServiceUnavailableException();
      }
    });
  }
}
@Controller()
export class HealthController {
  constructor(
    @Inject(HealthService) private readonly health: HealthService,
    @Inject(CONFIG) private readonly config: ServerConfig,
  ) {}
  @Get(['health', 'health/live']) live() {
    return { status: 'ok', service: 'api' };
  }
  @Get(['readiness', 'health/ready']) async ready() {
    await this.health.ready();
    return { status: 'ready', service: 'api', checks: { database: 'up', redis: 'up' } };
  }
  @Get('version') version() {
    return {
      service: 'api',
      version: this.config.APP_VERSION,
      commitSha: this.config.COMMIT_SHA ?? null,
      environment: this.config.APP_ENV,
    };
  }
}
@Module({})
export class HealthModule {
  static register(config: ServerConfig, database: Database, redis: Redis) {
    return {
      module: HealthModule,
      imports: [
        ConfigModule.register(config),
        DatabaseModule.register(database),
        RedisModule.register(redis),
      ],
      controllers: [HealthController],
      providers: [HealthService],
    };
  }
}
@Module({})
export class AppModule {
  static register(config: ServerConfig, database: Database, redis: Redis) {
    return {
      module: AppModule,
      imports: [
        HealthModule.register(config, database, redis),
        ObservabilityModule,
        AuthPlaceholderModule,
        AuditPlaceholderModule,
      ],
    };
  }
}
