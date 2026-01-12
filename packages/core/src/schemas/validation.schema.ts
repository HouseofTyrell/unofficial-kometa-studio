import { z } from 'zod';

export const ValidationIssueSchema = z.object({
  type: z.enum(['error', 'warning']),
  path: z.array(z.string()),
  message: z.string(),
  code: z.string().optional(),
});

export const ValidationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(ValidationIssueSchema),
  warnings: z.array(ValidationIssueSchema),
});

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
