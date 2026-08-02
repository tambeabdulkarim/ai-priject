// docs/16-API-CONTRACT.md §16 (News). docs/10-SECURITY-BIBLE.md §10 (XSS Protection).

import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { News } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { sanitizeRichText } from '../../common/utils/sanitize-html';
import { slugify } from '../../common/utils/slugify';
import { CreateNewsDto } from './dto/create-news.dto';
import { ListNewsQueryDto } from './dto/list-news-query.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsRepository } from './news.repository';

/** docs/16-API-CONTRACT.md: "editorial roles" for News (content_editor/admin — the roles doc16 names throughout this section). */
const NEWS_EDITORIAL_ROLES = ['content_editor', 'admin', 'superadmin'];

@Injectable()
export class NewsService {
  constructor(
    private readonly newsRepository: NewsRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  private isEditorial(roles: string[]): boolean {
    return roles.some((r) => NEWS_EDITORIAL_ROLES.includes(r));
  }

  /** docs/16-API-CONTRACT.md GET /news */
  list(query: ListNewsQueryDto, viewerRoles: string[] = []): Promise<PaginatedResult<News>> {
    return this.newsRepository.findMany({
      cursor: query.cursor,
      limit: query.limit,
      categoryId: query.category,
      tagName: query.tag,
      search: query.q,
      includeAllStatuses: this.isEditorial(viewerRoles),
    });
  }

  /** docs/16-API-CONTRACT.md GET /news/:slug — "None (published); editorial for drafts." */
  async getBySlug(slug: string, viewerRoles: string[] = []) {
    const article = await this.newsRepository.findBySlug(slug);
    if (!article) {
      throw new NotFoundException('Article not found.');
    }
    if (article.status !== 'published' && !this.isEditorial(viewerRoles)) {
      throw new NotFoundException('Article not found.');
    }
    return article;
  }

  /** docs/16-API-CONTRACT.md POST /news — `news:create` (content_editor/admin). */
  async create(actorId: string, dto: CreateNewsDto): Promise<News> {
    const category = await this.newsRepository.findCategoryById(dto.categoryId);
    if (!category) {
      throw new BadRequestException('Category not found.');
    }

    const slug = await this.generateUniqueSlug(dto.title);
    const article = await this.newsRepository.create({
      author: { connect: { id: actorId } },
      category: { connect: { id: dto.categoryId } },
      title: dto.title,
      slug,
      body: sanitizeRichText(dto.body),
      status: 'draft',
    });

    if (dto.tags && dto.tags.length > 0) {
      const tags = await this.newsRepository.resolveTagsByName(dto.tags);
      await this.newsRepository.replaceTagAssignments(article.id, tags.map((t) => t.id));
    }

    return article;
  }

  /** docs/16-API-CONTRACT.md PATCH /news/:id — `news:edit` (author/content_editor/admin). */
  async update(id: string, dto: UpdateNewsDto, actorId: string, actorRoles: string[]): Promise<News> {
    const article = await this.newsRepository.findById(id);
    if (!article) {
      throw new NotFoundException('Article not found.');
    }
    const isAuthor = article.authorId === actorId;
    if (!isAuthor && !this.isEditorial(actorRoles)) {
      throw new ForbiddenException('Not authorized to edit this article.');
    }

    if (dto.categoryId) {
      const category = await this.newsRepository.findCategoryById(dto.categoryId);
      if (!category) {
        throw new BadRequestException('Category not found.');
      }
    }

    const updated = await this.newsRepository.update(id, {
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.body !== undefined ? { body: sanitizeRichText(dto.body) } : {}),
      ...(dto.categoryId ? { category: { connect: { id: dto.categoryId } } } : {}),
    });

    if (dto.tags) {
      const tags = await this.newsRepository.resolveTagsByName(dto.tags);
      await this.newsRepository.replaceTagAssignments(id, tags.map((t) => t.id));
    }

    return updated;
  }

  /** docs/16-API-CONTRACT.md POST /news/:id/publish — `news:publish` (content_editor/admin). "Audit Logging: Yes, mandatory." */
  async publish(id: string, actorId: string): Promise<News> {
    const article = await this.newsRepository.findById(id);
    if (!article) {
      throw new NotFoundException('Article not found.');
    }
    if (article.status === 'published') {
      throw new ConflictException('Article is already published.');
    }

    const updated = await this.newsRepository.update(id, { status: 'published', publishedAt: new Date() });

    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'news.published',
      targetType: 'News',
      targetId: id,
    });

    return updated;
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    if (!base) {
      throw new BadRequestException('Title must contain at least one letter or number.');
    }
    let candidate = base;
    let suffix = 1;
    while (await this.newsRepository.findBySlug(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }
}
