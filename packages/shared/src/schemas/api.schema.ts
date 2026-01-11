import { z } from 'zod';
import { KometaConfigSchema } from './config.schema.js';
import { ProfileSchema } from './profile.schema.js';

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
  profileId: z.string().optional(),
  mode: z.enum(['template', 'masked', 'full']).default('masked'),
  includeComment: z.boolean().default(true),
});

export const RenderYamlResponseSchema = z.object({
  yaml: z.string(),
});

// Profile API
export const CreateProfileSchema = ProfileSchema.omit({ id: true, createdAt: true, updatedAt: true });

export const UpdateProfileSchema = CreateProfileSchema.partial();

export const ExportProfileRequestSchema = z.object({
  includeSecrets: z.boolean().default(false),
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

export type CreateConfig = z.infer<typeof CreateConfigSchema>;
export type UpdateConfig = z.infer<typeof UpdateConfigSchema>;
export type ImportYamlRequest = z.infer<typeof ImportYamlRequestSchema>;
export type RenderYamlRequest = z.infer<typeof RenderYamlRequestSchema>;
export type RenderYamlResponse = z.infer<typeof RenderYamlResponseSchema>;
export type CreateProfile = z.infer<typeof CreateProfileSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
export type ExportProfileRequest = z.infer<typeof ExportProfileRequestSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
