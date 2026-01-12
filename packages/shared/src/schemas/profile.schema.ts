import { z } from 'zod';

// Profile contains secrets and endpoint URLs
export const ProfileSecretsSchema = z.object({
  plex: z
    .object({
      url: z.string().url().optional(),
      token: z.string().optional(),
    })
    .optional(),

  tmdb: z
    .object({
      apikey: z.string().optional(),
    })
    .optional(),

  tautulli: z
    .object({
      url: z.string().url().optional(),
      apikey: z.string().optional(),
    })
    .optional(),

  mdblist: z
    .object({
      apikey: z.string().optional(),
    })
    .optional(),

  radarr: z
    .object({
      url: z.string().url().optional(),
      token: z.string().optional(),
    })
    .optional(),

  sonarr: z
    .object({
      url: z.string().url().optional(),
      token: z.string().optional(),
    })
    .optional(),

  trakt: z
    .object({
      client_secret: z.string().optional(),
      authorization: z
        .object({
          access_token: z.string().optional(),
          refresh_token: z.string().optional(),
        })
        .optional(),
    })
    .optional(),

  // Allow additional services
  extras: z.record(z.record(z.string())).optional(),
});

export const ProfileSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Profile name is required'),
  description: z.string().optional(),
  secrets: ProfileSecretsSchema,
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// For API responses - secrets are masked
export const MaskedProfileSchema = ProfileSchema.extend({
  secrets: z.object({
    plex: z
      .object({
        url: z.string().optional(),
        token: z.string().optional(), // Will be masked like "abcd****wxyz"
      })
      .optional(),
    tmdb: z
      .object({
        apikey: z.string().optional(), // Masked
      })
      .optional(),
    tautulli: z
      .object({
        url: z.string().optional(),
        apikey: z.string().optional(), // Masked
      })
      .optional(),
    mdblist: z
      .object({
        apikey: z.string().optional(), // Masked
      })
      .optional(),
    radarr: z
      .object({
        url: z.string().optional(),
        token: z.string().optional(), // Masked
      })
      .optional(),
    sonarr: z
      .object({
        url: z.string().optional(),
        token: z.string().optional(), // Masked
      })
      .optional(),
    trakt: z
      .object({
        client_secret: z.string().optional(), // Masked
        authorization: z
          .object({
            access_token: z.string().optional(), // Masked
            refresh_token: z.string().optional(), // Masked
          })
          .optional(),
      })
      .optional(),
    extras: z.record(z.record(z.string())).optional(),
  }),
});

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileSecrets = z.infer<typeof ProfileSecretsSchema>;
export type MaskedProfile = z.infer<typeof MaskedProfileSchema>;
