import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { StripeModule } from './payments/stripe.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { RefreshTokensModule } from './modules/refresh-tokens/refresh-tokens.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { FilesModule } from './modules/files/files.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { ProgressModule } from './modules/progress/progress.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { ProductsModule } from './modules/products/products.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { LibraryModule } from './modules/library/library.module';
import { AiModule } from './modules/ai/ai.module';
import { NewsModule } from './modules/news/news.module';
import { MediaModule } from './modules/media/media.module';
import { SettingsModule } from './modules/settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    // docs/10-SECURITY-BIBLE.md §12: platform-wide default rate limit,
    // applied at the gateway layer before business logic. Endpoint-
    // specific tighter limits (auth, AI) are applied per-route with
    // @Throttle() once those flows are implemented.
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    DatabaseModule,
    RedisModule,
    StorageModule,
    StripeModule,
    CommonModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    SessionsModule,
    RefreshTokensModule,
    NotificationsModule,
    AdminModule,
    FilesModule,
    CategoriesModule,
    CoursesModule,
    LessonsModule,
    EnrollmentsModule,
    ProgressModule,
    CertificatesModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    LibraryModule,
    AiModule,
    NewsModule,
    MediaModule,
    SettingsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
