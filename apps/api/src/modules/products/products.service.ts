// docs/16-API-CONTRACT.md §10 (Marketplace: Products, Categories).

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '@prisma/client';
import { PaginatedResult } from '../../common/dto/pagination-query.dto';
import { AuditLogService } from '../../common/services/audit-log.service';
import { assertOwnerOrRole } from '../../common/utils/authorization';
import { slugify } from '../../common/utils/slugify';
import { CategoriesService } from '../categories/categories.service';
import { FilesRepository } from '../files/files.repository';
import { CreateProductDto } from './dto/create-product.dto';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsRepository } from './products.repository';

/** docs/13-DATABASE-BLUEPRINT.md Products: "admin at launch; future vendor owner_id". */
const PRODUCT_ADMIN_ROLES = ['admin', 'superadmin'];

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly categoriesService: CategoriesService,
    private readonly filesRepository: FilesRepository,
    private readonly auditLogService: AuditLogService,
  ) {}

  /** docs/16-API-CONTRACT.md GET /marketplace/products */
  list(query: ListProductsQueryDto): Promise<PaginatedResult<Product>> {
    return this.productsRepository.findMany({
      cursor: query.cursor,
      limit: query.limit,
      categoryId: query.category,
      minPriceCents: query.minPriceCents,
      maxPriceCents: query.maxPriceCents,
      search: query.q,
    });
  }

  /** docs/16-API-CONTRACT.md GET /marketplace/products/:slug */
  async getBySlug(slug: string): Promise<Product> {
    const product = await this.productsRepository.findPublishedBySlug(slug);
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    return product;
  }

  /** docs/16-API-CONTRACT.md POST /marketplace/products — `product:create` (admin). */
  async create(actorId: string, dto: CreateProductDto): Promise<Product> {
    await this.categoriesService.findById(dto.categoryId);

    if (dto.fileId) {
      const file = await this.filesRepository.findFileById(dto.fileId);
      if (!file) {
        throw new BadRequestException('Referenced file does not exist.');
      }
      if (file.scanStatus !== 'clean') {
        throw new BadRequestException('Referenced file must have scan_status = clean.');
      }
    }

    const slug = await this.generateUniqueSlug(dto.title);
    const product = await this.productsRepository.create({
      category: { connect: { id: dto.categoryId } },
      owner: { connect: { id: actorId } },
      title: dto.title,
      slug,
      description: dto.description,
      priceCents: dto.priceCents ?? 0,
      status: 'draft',
      ...(dto.fileId ? { file: { connect: { id: dto.fileId } } } : {}),
    });

    await this.auditLogService.record({
      actorUserId: actorId,
      action: 'product.created',
      targetType: 'Product',
      targetId: product.id,
    });

    return product;
  }

  /**
   * docs/16-API-CONTRACT.md PATCH /marketplace/products/:id — `product:edit`
   * (admin/owner). "price changes do not retroactively affect existing
   * Order_Items snapshots" is already true by construction: OrderItem
   * stores its own unitPriceCents at creation time, never re-read from
   * Product afterward — no extra handling needed here.
   */
  async update(
    id: string,
    dto: UpdateProductDto,
    actorId: string,
    actorRoles: string[],
  ): Promise<Product> {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Product not found.');
    }
    assertOwnerOrRole(product.ownerId, actorId, actorRoles, PRODUCT_ADMIN_ROLES);

    if (dto.fileId) {
      const file = await this.filesRepository.findFileById(dto.fileId);
      if (!file) {
        throw new BadRequestException('Referenced file does not exist.');
      }
      if (file.scanStatus !== 'clean') {
        throw new BadRequestException('Referenced file must have scan_status = clean.');
      }
    }
    if (dto.categoryId) {
      await this.categoriesService.findById(dto.categoryId);
    }

    const isStatusOrPriceChange = dto.status !== undefined || dto.priceCents !== undefined;
    const before = { status: product.status, priceCents: product.priceCents };

    const updated = await this.productsRepository.update(id, {
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.categoryId ? { category: { connect: { id: dto.categoryId } } } : {}),
      ...(dto.priceCents !== undefined ? { priceCents: dto.priceCents } : {}),
      ...(dto.fileId ? { file: { connect: { id: dto.fileId } } } : {}),
      ...(dto.status ? { status: dto.status } : {}),
    });

    // docs/16-API-CONTRACT.md: "Audit Logging: Yes for status/price changes"
    if (isStatusOrPriceChange) {
      await this.auditLogService.record({
        actorUserId: actorId,
        action: 'product.updated',
        targetType: 'Product',
        targetId: id,
        beforeState: before,
        afterState: { status: updated.status, priceCents: updated.priceCents },
      });
    }

    return updated;
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const base = slugify(title);
    if (!base) {
      throw new BadRequestException('Title must contain at least one letter or number.');
    }
    let candidate = base;
    let suffix = 1;
    while (await this.productsRepository.findBySlug(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }
}
