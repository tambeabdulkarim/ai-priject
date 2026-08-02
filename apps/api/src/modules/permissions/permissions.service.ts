import { Injectable } from '@nestjs/common';
import { Permission } from '@prisma/client';
import { RedisService } from '../../redis/redis.service';
import { PermissionsRepository } from './permissions.repository';

const CACHE_TTL_SECONDS = 300;
const cacheKey = (userId: string): string => `permissions:user:${userId}`;

@Injectable()
export class PermissionsService {
  constructor(
    private readonly permissionsRepository: PermissionsRepository,
    private readonly redisService: RedisService,
  ) {}

  findAll(): Promise<Permission[]> {
    return this.permissionsRepository.findAll();
  }

  findByKey(key: string): Promise<Permission | null> {
    return this.permissionsRepository.findByKey(key);
  }

  /**
   * Used by PermissionsGuard to authorize a request on every permission-
   * checked route. Phase 3 mission item "Permission caching": resolving a
   * user's permission set requires a 3-table join (User_Roles ->
   * Role_Permissions -> Permissions) on every request, so the resolved set
   * is cached in Redis (docs/11-DATABASE-BIBLE.md §1: Redis is a derived,
   * rebuildable cache — never the source of truth) with a short TTL, and
   * explicitly invalidated by RolesService whenever a user's role
   * assignments change.
   */
  async getPermissionKeysForUser(userId: string): Promise<string[]> {
    const cached = await this.redisService.get(cacheKey(userId));
    if (cached !== null) {
      return JSON.parse(cached) as string[];
    }

    const keys = await this.permissionsRepository.findPermissionKeysForUser(userId);
    await this.redisService.set(cacheKey(userId), JSON.stringify(keys), CACHE_TTL_SECONDS);
    return keys;
  }

  async invalidateCacheForUser(userId: string): Promise<void> {
    await this.redisService.del(cacheKey(userId));
  }
}
