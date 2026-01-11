import { describe, it, expect } from 'vitest';
import { parseKometaYaml } from './parser';

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

    expect(config.libraries?.Movies).toBeDefined();
    expect(config.libraries?.Movies).toEqual({});
  });

  it('should throw on invalid YAML', () => {
    const invalidYaml = 'not: valid: yaml: [';

    expect(() => parseKometaYaml(invalidYaml)).toThrow();
  });
});
