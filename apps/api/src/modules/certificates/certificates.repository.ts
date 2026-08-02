// Data-access layer for Certificates (docs/13-DATABASE-BLUEPRINT.md).

import { Injectable } from '@nestjs/common';
import { Certificate, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CertificatesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEnrollmentId(enrollmentId: string): Promise<Certificate | null> {
    return this.prisma.certificate.findUnique({ where: { enrollmentId } });
  }

  create(data: Prisma.CertificateCreateInput): Promise<Certificate> {
    return this.prisma.certificate.create({ data });
  }

  findById(id: string): Promise<Certificate | null> {
    return this.prisma.certificate.findUnique({ where: { id } });
  }

  findByCertificateNumber(certificateNumber: string) {
    return this.prisma.certificate.findUnique({
      where: { certificateNumber },
      include: { user: true, course: true },
    });
  }

  async findManyForUser(params: {
    userId: string;
    cursor?: string;
    limit: number;
  }): Promise<{ items: Certificate[]; nextCursor: string | null }> {
    const items = await this.prisma.certificate.findMany({
      take: params.limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      where: { userId: params.userId },
      orderBy: { issuedAt: 'desc' },
    });
    const hasMore = items.length > params.limit;
    const page = hasMore ? items.slice(0, params.limit) : items;
    return { items: page, nextCursor: hasMore ? page[page.length - 1].id : null };
  }
}
