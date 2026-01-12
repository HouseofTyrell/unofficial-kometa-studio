import { z } from 'zod';
import { KometaConfigSchema } from './config.schema.js';
import { ProfileSchema, ProfileSecretsSchema } from './profile.schema.js';

// Common parameter schemas
export const IdParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

// Config API
export const CreateConfigSchema = z.object({
  name: z.string().min(1, 'Config name is required'),
  description: z.string().optional(),
  config: KometaConfigSchema,
});

export const UpdateConfigSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  config: KometaConfigSchema.optional(),
});

export const ImportYamlRequestSchema = z.object({
  yaml: z.string().min(1, 'YAML content is required'),
  preserveExtras: z.boolean().default(true),
});

export const RenderYamlRequestSchema = z.object({
  profileId: z.string().uuid('Invalid profile ID format').optional(),
  mode: z.enum(['template', 'masked', 'full']).default('masked'),
  includeComment: z.boolean().default(true),
});

export const RenderYamlResponseSchema = z.object({
  yaml: z.string(),
});

export const ValidateConfigRequestSchema = z.object({
  profileId: z.string().uuid('Invalid profile ID format').optional(),
});

// Profile API
export const CreateProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required'),
  description: z.string().optional(),
  secrets: ProfileSecretsSchema.optional().default({}),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required').optional(),
  description: z.string().optional(),
  secrets: ProfileSecretsSchema.optional(),
});

export const ExportProfileRequestSchema = z.object({
  includeSecrets: z.boolean().default(false),
});

export const ImportProfileRequestSchema = z.object({
  name: z.string().min(1, 'Profile name is required'),
  description: z.string().optional(),
  secrets: ProfileSecretsSchema,
});

// General API responses
export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

// Input types (what we receive in request body - before defaults applied)
export type IdParam = z.input<typeof IdParamSchema>;
export type CreateConfigInput = z.input<typeof CreateConfigSchema>;
export type UpdateConfigInput = z.input<typeof UpdateConfigSchema>;
export type ImportYamlRequestInput = z.input<typeof ImportYamlRequestSchema>;
export type RenderYamlRequestInput = z.input<typeof RenderYamlRequestSchema>;
export type ValidateConfigRequestInput = z.input<typeof ValidateConfigRequestSchema>;
export type CreateProfileInput = z.input<typeof CreateProfileSchema>;
export type UpdateProfileInput = z.input<typeof UpdateProfileSchema>;
export type ExportProfileRequestInput = z.input<typeof ExportProfileRequestSchema>;
export type ImportProfileRequestInput = z.input<typeof ImportProfileRequestSchema>;

// Output types (after validation and defaults applied)
export type CreateConfig = z.output<typeof CreateConfigSchema>;
export type UpdateConfig = z.output<typeof UpdateConfigSchema>;
export type ImportYamlRequest = z.output<typeof ImportYamlRequestSchema>;
export type RenderYamlRequest = z.output<typeof RenderYamlRequestSchema>;
export type RenderYamlResponse = z.output<typeof RenderYamlResponseSchema>;
export type ValidateConfigRequest = z.output<typeof ValidateConfigRequestSchema>;
export type CreateProfile = z.output<typeof CreateProfileSchema>;
export type UpdateProfile = z.output<typeof UpdateProfileSchema>;
export type ExportProfileRequest = z.output<typeof ExportProfileRequestSchema>;
export type ImportProfileRequest = z.output<typeof ImportProfileRequestSchema>;
export type ErrorResponse = z.output<typeof ErrorResponseSchema>;
export type SuccessResponse = z.output<typeof SuccessResponseSchema>;
