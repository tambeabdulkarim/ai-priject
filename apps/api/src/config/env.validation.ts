// Validates process.env at bootstrap so the application fails fast with a
// clear error instead of starting in a half-configured state.
// docs/18-PROJECT-GOVERNANCE.md §1: explicit over implicit.

import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsOptional, IsString, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL!: string;

  @IsOptional()
  @IsString()
  JWT_PRIVATE_KEY?: string;

  @IsOptional()
  @IsString()
  JWT_PUBLIC_KEY?: string;

  @IsOptional()
  @IsString()
  PASSWORD_PEPPER?: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }

  return validatedConfig;
}
