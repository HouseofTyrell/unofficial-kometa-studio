import type { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodError } from 'zod';

/**
 * Formats Zod validation errors into a user-friendly structure
 */
function formatZodErrors(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_root';
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }

  return formatted;
}

/**
 * Validates request body against a Zod schema
 * Returns the validated and transformed data (with defaults applied), or sends a 400 error response
 *
 * @template TOutput - The output type after validation (with defaults applied)
 * @template TInput - The input type before validation (optional defaults)
 */
export async function validateBody<TOutput, TInput = TOutput>(
  request: FastifyRequest,
  reply: FastifyReply,
  schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>
): Promise<TOutput | null> {
  const result = schema.safeParse(request.body);

  if (!result.success) {
    reply.status(400);
    reply.send({
      error: 'Validation failed',
      details: formatZodErrors(result.error),
    });
    return null;
  }

  return result.data;
}

/**
 * Validates request params against a Zod schema
 * Returns the validated and transformed data, or sends a 400 error response
 */
export async function validateParams<TOutput, TInput = TOutput>(
  request: FastifyRequest,
  reply: FastifyReply,
  schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>
): Promise<TOutput | null> {
  const result = schema.safeParse(request.params);

  if (!result.success) {
    reply.status(400);
    reply.send({
      error: 'Invalid parameters',
      details: formatZodErrors(result.error),
    });
    return null;
  }

  return result.data;
}

/**
 * Validates request query against a Zod schema
 * Returns the validated and transformed data, or sends a 400 error response
 */
export async function validateQuery<TOutput, TInput = TOutput>(
  request: FastifyRequest,
  reply: FastifyReply,
  schema: z.ZodType<TOutput, z.ZodTypeDef, TInput>
): Promise<TOutput | null> {
  const result = schema.safeParse(request.query);

  if (!result.success) {
    reply.status(400);
    reply.send({
      error: 'Invalid query parameters',
      details: formatZodErrors(result.error),
    });
    return null;
  }

  return result.data;
}

/**
 * Validates a UUID parameter from the route params
 * Returns the validated ID or sends a 400 error
 */
export async function validateIdParam(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<string | null> {
  const id = request.params.id;

  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    reply.status(400);
    reply.send({
      error: 'Invalid ID format',
      details: { id: ['Must be a valid UUID'] },
    });
    return null;
  }

  return id;
}
