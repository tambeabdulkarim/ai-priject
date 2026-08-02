import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { RolesService } from './roles.service';

describe('RolesService', () => {
  const makeService = () => {
    const rolesRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      findManyByNames: jest.fn(),
      findRoleNamesForUser: jest.fn(),
      replaceUserRoles: jest.fn(),
    };
    const auditLogService = { record: jest.fn() };
    const permissionsService = { invalidateCacheForUser: jest.fn() };
    const service = new RolesService(
      rolesRepository as never,
      auditLogService as never,
      permissionsService as never,
    );
    return { service, rolesRepository, auditLogService, permissionsService };
  };

  it('returns role names (not IDs) for a user', async () => {
    const { service, rolesRepository } = makeService();
    rolesRepository.findRoleNamesForUser.mockResolvedValue([
      { userId: 'u1', roleId: 'r1', role: { id: 'r1', name: 'admin' } },
    ]);

    const names = await service.getRoleNamesForUser('u1');

    expect(names).toEqual(['admin']);
  });

  it('rejects assigning an unknown role id', async () => {
    const { service, rolesRepository } = makeService();
    rolesRepository.findRoleNamesForUser.mockResolvedValue([]);
    rolesRepository.findAll.mockResolvedValue([{ id: 'real-role-id', name: 'learner' }]);

    await expect(
      service.assignRolesToUser('u1', ['nonexistent-role-id'], 'actor-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(rolesRepository.replaceUserRoles).not.toHaveBeenCalled();
  });

  it('replaces roles, records an audit entry, and invalidates the permission cache', async () => {
    const { service, rolesRepository, auditLogService, permissionsService } = makeService();
    rolesRepository.findRoleNamesForUser.mockResolvedValue([]);
    rolesRepository.findAll.mockResolvedValue([{ id: 'role-1', name: 'instructor' }]);
    rolesRepository.replaceUserRoles.mockResolvedValue(undefined);

    const result = await service.assignRolesToUser('u1', ['role-1'], 'actor-1');

    expect(rolesRepository.replaceUserRoles).toHaveBeenCalledWith('u1', ['role-1'], 'actor-1');
    expect(permissionsService.invalidateCacheForUser).toHaveBeenCalledWith('u1');
    expect(auditLogService.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.roles.replaced', targetId: 'u1' }),
    );
    expect(result).toEqual([{ id: 'role-1', name: 'instructor' }]);
  });

  it('rejects granting an admin-capable role when the actor is not superadmin', async () => {
    const { service, rolesRepository } = makeService();
    rolesRepository.findRoleNamesForUser.mockResolvedValue([]);
    rolesRepository.findAll.mockResolvedValue([{ id: 'role-admin', name: 'admin' }]);

    await expect(
      service.assignRolesToUser('u1', ['role-admin'], 'actor-1', ['admin']),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(rolesRepository.replaceUserRoles).not.toHaveBeenCalled();
  });

  it('allows granting an admin-capable role when the actor is superadmin', async () => {
    const { service, rolesRepository } = makeService();
    rolesRepository.findRoleNamesForUser.mockResolvedValue([]);
    rolesRepository.findAll.mockResolvedValue([{ id: 'role-admin', name: 'admin' }]);
    rolesRepository.replaceUserRoles.mockResolvedValue(undefined);

    const result = await service.assignRolesToUser('u1', ['role-admin'], 'actor-1', ['superadmin']);

    expect(rolesRepository.replaceUserRoles).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'role-admin', name: 'admin' }]);
  });
});
