// docs/16-API-CONTRACT.md §8 (Certificates).

import { Controller, Get, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { CertificatesService } from './certificates.service';

@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Get('me')
  listMine(@CurrentUser() user: JwtPayload, @Query() query: PaginationQueryDto) {
    return this.certificatesService.listMine(user.sub, query.cursor, query.limit);
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.certificatesService.getById(id, user.sub);
  }

  // docs/16-API-CONTRACT.md: "20 requests / 15 min per IP (enumeration-scraping protection)"
  @Public()
  @Throttle({ default: { limit: 20, ttl: 900_000 } })
  @Get('verify/:certificateNumber')
  verifyPublic(@Param('certificateNumber') certificateNumber: string) {
    return this.certificatesService.verifyPublic(certificateNumber);
  }
}
