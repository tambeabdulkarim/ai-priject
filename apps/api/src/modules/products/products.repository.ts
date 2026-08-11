// Data-access layer for Products (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export interface ListProductsParams {
  cursor?: string;
  limit: number;
  categoryId?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  search?: string;
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    params: ListProductsParams,
  ): Promise<{ items: Product[]; nextCursor: string | null }> {
    const priceFilter =
      params.minPriceCents !== undefined || params.maxPriceCents !== undefined
        ? {
            priceCents: {
              ...(params.minPriceCents !== undefined ? { gte: params.minPriceCents } : {}),
              ...(params.maxPriceCents !== undefined ? { lte: params.maxPriceCents } : {}),
            },
          }
        : {};

    const where: Prisma.ProductWhereInput = {
      AND: [
        { status: 'published' },
        params.categoryId ? { categoryId: params.categoryId } : {},
        priceFilter,
        params.search
          ? {
              OR: [
                { title: { contains: params.search, mode: 'insensitive' } },
                { description: { contains: params.search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    const items = await this.prisma.product.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where,
      orderBy: { createdAt: 'desc' },
    });

    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }

  findPublishedBySlug(slug: string): Promise<Product | null> {
    return this.prisma.product.findFirst({ where: { slug, status: 'published' } });
  }

  findById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { id } });
  }

  findBySlug(slug: string): Promise<Product | null> {
    return this.prisma.product.findUnique({ where: { slug } });
  }

  create(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return this.prisma.product.update({ where: { id }, data });
  }
}
