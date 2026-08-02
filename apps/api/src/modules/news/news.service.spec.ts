import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { NewsService } from './news.service';

describe('NewsService', () => {
  const makeService = () => {
    const newsRepository = {
      findCategoryById: jest.fn(),
      findMany: jest.fn(),
      findBySlug: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      resolveTagsByName: jest.fn(),
      replaceTagAssignments: jest.fn(),
    };
    const auditLogService = { record: jest.fn() };

    const service = new NewsService(newsRepository as never, auditLogService as never);
    return { service, newsRepository, auditLogService };
  };

  describe('list / getBySlug visibility', () => {
    it('only requests published articles for an anonymous viewer', async () => {
      const { service, newsRepository } = makeService();
      newsRepository.findMany.mockResolvedValue({ items: [], nextCursor: null });

      await service.list({ limit: 20 });

      expect(newsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ includeAllStatuses: false }),
      );
    });

    it('includes all statuses for an editorial viewer', async () => {
      const { service, newsRepository } = makeService();
      newsRepository.findMany.mockResolvedValue({ items: [], nextCursor: null });

      await service.list({ limit: 20 }, ['content_editor']);

      expect(newsRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ includeAllStatuses: true }),
      );
    });

    it('hides a draft article from a non-editorial viewer as 404', async () => {
      const { service, newsRepository } = makeService();
      newsRepository.findBySlug.mockResolvedValue({ id: 'n1', status: 'draft' });

      await expect(service.getBySlug('draft-article', ['learner'])).rejects.toBeInstanceOf(NotFoundException);
    });

    it('shows a draft article to an editorial viewer', async () => {
      const { service, newsRepository } = makeService();
      newsRepository.findBySlug.mockResolvedValue({ id: 'n1', status: 'draft' });

      const result = await service.getBySlug('draft-article', ['admin']);

      expect(result.id).toBe('n1');
    });
  });

  describe('create', () => {
    it('rejects an unknown category', async () => {
      const { service, newsRepository } = makeService();
      newsRepository.findCategoryById.mockResolvedValue(null);

      await expect(
        service.create('editor1', { title: 'Title', body: '<p>body</p>', categoryId: 'bad-cat' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sanitizes the body and creates the article as draft', async () => {
      const { service, newsRepository } = makeService();
      newsRepository.findCategoryById.mockResolvedValue({ id: 'cat1' });
      newsRepository.findBySlug.mockResolvedValue(null);
      newsRepository.create.mockResolvedValue({ id: 'n1', status: 'draft' });

      const result = await service.create('editor1', {
        title: 'Breaking News',
        body: '<p>Hello</p><script>alert(1)</script>',
        categoryId: 'cat1',
      });

      expect(result.status).toBe('draft');
      const createCall = newsRepository.create.mock.calls[0][0];
      expect(createCall.body).not.toContain('<script>');
      expect(createCall.body).toContain('<p>Hello</p>');
    });

    it('resolves freeform tags and assigns them', async () => {
      const { service, newsRepository } = makeService();
      newsRepository.findCategoryById.mockResolvedValue({ id: 'cat1' });
      newsRepository.findBySlug.mockResolvedValue(null);
      newsRepository.create.mockResolvedValue({ id: 'n1', status: 'draft' });
      newsRepository.resolveTagsByName.mockResolvedValue([{ id: 't1' }, { id: 't2' }]);

      await service.create('editor1', {
        title: 'Tagged Article',
        body: '<p>x</p>',
        categoryId: 'cat1',
        tags: ['breaking', 'local'],
      });

      expect(newsRepository.resolveTagsByName).toHaveBeenCalledWith(['breaking', 'local']);
      expect(newsRepository.replaceTagAssignments).toHaveBeenCalledWith('n1', ['t1', 't2']);
    });
  });

  describe('update', () => {
    it('allows the author to edit their own article', async () => {
      const { service, newsRepository } = makeService();
      newsRepository.findById.mockResolvedValue({ id: 'n1', authorId: 'author1' });
      newsRepository.update.mockResolvedValue({ id: 'n1', title: 'Updated' });

      const result = await service.update('n1', { title: 'Updated' }, 'author1', ['content_editor']);

      expect(result.title).toBe('Updated');
    });

    it('rejects a non-author, non-editorial user', async () => {
      const { service, newsRepository } = makeService();
      newsRepository.findById.mockResolvedValue({ id: 'n1', authorId: 'author1' });

      await expect(
        service.update('n1', { title: 'Hacked' }, 'someone-else', ['learner']),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('publish', () => {
    it('rejects publishing an already-published article', async () => {
      const { service, newsRepository } = makeService();
      newsRepository.findById.mockResolvedValue({ id: 'n1', status: 'published' });

      await expect(service.publish('n1', 'editor1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('publishes a draft and records the mandatory audit log', async () => {
      const { service, newsRepository, auditLogService } = makeService();
      newsRepository.findById.mockResolvedValue({ id: 'n1', status: 'draft' });
      newsRepository.update.mockResolvedValue({ id: 'n1', status: 'published' });

      const result = await service.publish('n1', 'editor1');

      expect(result.status).toBe('published');
      expect(auditLogService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'news.published', targetId: 'n1' }),
      );
    });
  });
});
