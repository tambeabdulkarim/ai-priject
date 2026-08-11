import { NotFoundException } from '@nestjs/common';
import { ModerationService } from './moderation.service';

describe('ModerationService', () => {
  const makeService = () => {
    const moderationRepository = {
      findCoursesInReview: jest.fn(),
      findFlaggedComments: jest.fn(),
      findCommentById: jest.fn(),
      updateCommentStatus: jest.fn(),
    };
    const auditLogService = { record: jest.fn() };
    const service = new ModerationService(moderationRepository as never, auditLogService as never);
    return { service, moderationRepository, auditLogService };
  };

  describe('listQueue', () => {
    it('returns only courses when content_type=course', async () => {
      const { service, moderationRepository } = makeService();
      moderationRepository.findCoursesInReview.mockResolvedValue({
        items: [{ id: 'c1' }],
        nextCursor: null,
      });

      const result = await service.listQueue({ content_type: 'course', limit: 20 } as never);

      expect(result.courses).toBeDefined();
      expect(result.comments).toBeUndefined();
      expect(moderationRepository.findFlaggedComments).not.toHaveBeenCalled();
    });

    it('returns only comments when content_type=comment', async () => {
      const { service, moderationRepository } = makeService();
      moderationRepository.findFlaggedComments.mockResolvedValue({ items: [], nextCursor: null });

      const result = await service.listQueue({ content_type: 'comment', limit: 20 } as never);

      expect(result.comments).toBeDefined();
      expect(result.courses).toBeUndefined();
      expect(moderationRepository.findCoursesInReview).not.toHaveBeenCalled();
    });

    it('returns both when no content_type filter is given', async () => {
      const { service, moderationRepository } = makeService();
      moderationRepository.findCoursesInReview.mockResolvedValue({ items: [], nextCursor: null });
      moderationRepository.findFlaggedComments.mockResolvedValue({ items: [], nextCursor: null });

      const result = await service.listQueue({ limit: 20 } as never);

      expect(result.courses).toBeDefined();
      expect(result.comments).toBeDefined();
    });
  });

  describe('decideComment', () => {
    it('throws 404 for a nonexistent comment', async () => {
      const { service, moderationRepository } = makeService();
      moderationRepository.findCommentById.mockResolvedValue(null);

      await expect(
        service.decideComment('c1', { decision: 'approve', reason: 'looks fine' }, 'mod1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('sets status to visible on approve and records the mandatory audit log', async () => {
      const { service, moderationRepository, auditLogService } = makeService();
      moderationRepository.findCommentById.mockResolvedValue({ id: 'c1', status: 'flagged' });
      moderationRepository.updateCommentStatus.mockResolvedValue({ id: 'c1', status: 'visible' });

      const result = await service.decideComment(
        'c1',
        { decision: 'approve', reason: 'looks fine' },
        'mod1',
      );

      expect(moderationRepository.updateCommentStatus).toHaveBeenCalledWith('c1', 'visible');
      expect(result.status).toBe('visible');
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'comment.moderation_decision', targetId: 'c1' }),
      );
    });

    it('sets status to hidden on hide', async () => {
      const { service, moderationRepository } = makeService();
      moderationRepository.findCommentById.mockResolvedValue({ id: 'c1', status: 'flagged' });
      moderationRepository.updateCommentStatus.mockResolvedValue({ id: 'c1', status: 'hidden' });

      await service.decideComment('c1', { decision: 'hide', reason: 'spam' }, 'mod1');

      expect(moderationRepository.updateCommentStatus).toHaveBeenCalledWith('c1', 'hidden');
    });
  });
});
