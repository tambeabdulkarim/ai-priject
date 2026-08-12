// Data-access layer for News / News_Categories / Tags / News_Tag_Assignments
// (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { News, NewsCategory, Prisma, Tag } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { slugify } from '../../common/utils/slugify';

export interface ListNewsParams {
  cursor?: string;
  limit: number;
  categoryId?: string;
  tagName?: string;
  search?: string;
  includeAllStatuses: boolean;
}

@Injectable()
export class NewsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCategoryById(id: string): Promise<NewsCategory | null> {
    return this.prisma.newsCategory.findUnique({ where: { id } });
  }

  async findMany(
    params: ListNewsParams,
  ): Promise<{ items: (News & { category: NewsCategory })[]; nextCursor: string | null }> {
    const where: Prisma.NewsWhereInput = {
      AND: [
        params.includeAllStatuses ? {} : { status: 'published' },
        params.categoryId ? { categoryId: params.categoryId } : {},
        params.tagName ? { tagAssignments: { some: { tag: { name: params.tagName } } } } : {},
        params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: 'insensitive' } },
                { body: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    const items = await this.prisma.news.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where,
      orderBy: { createdAt: 'desc' },
      // Public category name/slug only — same public taxonomy data already
      // exposed on the detail endpoint (findBySlug) for the exact same
      // anonymous caller. No author/PII join added here, unlike the
      // deliberately-narrowed `author` scoping below.
      include: { category: true },
    });

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  findBySlug(slug: string) {
    return this.prisma.news.findUnique({
      where: { slug },
      include: {
        tagAssignments: { include: { tag: true } },
        // docs/16-API-CONTRACT.md: "author" — never the full internal
        // User record (which includes passwordHash, email, status, etc.).
        // Public/anonymous callers can reach this for published articles.
        author: { select: { id: true, displayName: true, avatarFileId: true } },
        category: true,
      },
    });
  }

  findById(id: string): Promise<News | null> {
    return this.prisma.news.findUnique({ where: { id } });
  }

  create(data: Prisma.NewsCreateInput): Promise<News> {
    return this.prisma.news.create({ data });
  }

  update(id: string, data: Prisma.NewsUpdateInput): Promise<News> {
    return this.prisma.news.update({ where: { id }, data });
  }

  /** Find-or-create by unique `name`, per news.repository.ts / create-news.dto.ts's documented-field rationale. */
  async resolveTagsByName(names: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];
    for (const name of names) {
      const tag = await this.prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name, slug: await this.generateUniqueTagSlug(name) },
      });
      tags.push(tag);
    }
    return tags;
  }

  private async generateUniqueTagSlug(name: string): Promise<string> {
    const base = slugify(name) || 'tag';
    let candidate = base;
    let suffix = 1;
    while (await this.prisma.tag.findUnique({ where: { slug: candidate } })) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }

  /** docs/13-DATABASE-BLUEPRINT.md News_Tag_Assignments — replace the full set atomically. */
  async replaceTagAssignments(newsId: string, tagIds: string[]): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.newsTagAssignment.deleteMany({ where: { newsId } }),
      this.prisma.newsTagAssignment.createMany({
        data: tagIds.map((tagId) => ({ newsId, tagId })),
      }),
    ]);
  }
}
