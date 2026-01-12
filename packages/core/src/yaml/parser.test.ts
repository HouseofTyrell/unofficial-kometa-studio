import { describe, it, expect } from 'vitest';
import { parseKometaYaml, extractSecretsFromYaml } from './parser.js';

describe('YAML Parser', () => {
  it('should parse basic Kometa YAML', () => {
    const yaml = `
settings:
  cache: true
  cache_expiration: 60

plex:
  url: http://localhost:32400
  token: secret

libraries:
  Movies:
    collection_files:
      - default: imdb
`;

    const config = parseKometaYaml(yaml);

    expect(config.settings?.cache).toBe(true);
    expect(config.settings?.cache_expiration).toBe(60);
    expect(config.libraries?.Movies?.collection_files).toHaveLength(1);
  });

  it('should preserve unknown keys in extras', () => {
    const yaml = `
settings:
  cache: true
  custom_unknown_key: some_value

libraries:
  Movies:
    collection_files:
      - default: imdb
    unknown_library_key: test
`;

    const config = parseKometaYaml(yaml, true);

    expect(config.settings?.extras).toBeDefined();
    expect(config.settings?.extras?.custom_unknown_key).toBe('some_value');
    expect(config.libraries?.Movies?.extras?.unknown_library_key).toBe('test');
  });

  it('should handle repeated defaults', () => {
    const yaml = `
libraries:
  Movies:
    overlay_files:
      - default: studio
        template_variables:
          builder_level: movie
      - default: studio
        template_variables:
          builder_level: collection
`;

    const config = parseKometaYaml(yaml);

    expect(config.libraries?.Movies?.overlay_files).toHaveLength(2);
    expect(config.libraries?.Movies?.overlay_files?.[0]).toMatchObject({
      default: 'studio',
      template_variables: { builder_level: 'movie' },
    });
    expect(config.libraries?.Movies?.overlay_files?.[1]).toMatchObject({
      default: 'studio',
      template_variables: { builder_level: 'collection' },
    });
  });

  it('should handle empty libraries', () => {
    const yaml = `
libraries:
  Movies:
`;

    const config = parseKometaYaml(yaml);

    // Empty library definitions (null values) are skipped by the parser
    // This is expected behavior - empty definitions have no meaningful content
    expect(config.libraries?.Movies).toBeUndefined();
  });

  it('should throw on invalid YAML', () => {
    const invalidYaml = 'not: valid: yaml: [';

    expect(() => parseKometaYaml(invalidYaml)).toThrow();
  });
});

describe('extractSecretsFromYaml', () => {
  it('should extract Plex secrets', () => {
    const yaml = `
plex:
  url: http://localhost:32400
  token: my-secret-token
  timeout: 60
`;

    const secrets = extractSecretsFromYaml(yaml);

    expect(secrets.plex?.url).toBe('http://localhost:32400');
    expect(secrets.plex?.token).toBe('my-secret-token');
  });

  it('should extract TMDB secrets', () => {
    const yaml = `
tmdb:
  apikey: my-tmdb-key
  language: en
`;

    const secrets = extractSecretsFromYaml(yaml);

    expect(secrets.tmdb?.apikey).toBe('my-tmdb-key');
  });

  it('should extract multiple service secrets', () => {
    const yaml = `
plex:
  url: http://plex:32400
  token: plex-token
tmdb:
  apikey: tmdb-key
radarr:
  url: http://radarr:7878
  token: radarr-token
`;

    const secrets = extractSecretsFromYaml(yaml);

    expect(secrets.plex?.token).toBe('plex-token');
    expect(secrets.tmdb?.apikey).toBe('tmdb-key');
    expect(secrets.radarr?.url).toBe('http://radarr:7878');
    expect(secrets.radarr?.token).toBe('radarr-token');
  });

  it('should return empty object for invalid YAML', () => {
    const secrets = extractSecretsFromYaml('not an object');
    expect(secrets).toEqual({});
  });
});
