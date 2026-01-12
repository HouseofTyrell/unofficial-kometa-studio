import { describe, it, expect } from 'vitest';
import {
  OVERLAY_PRESETS,
  PRESET_CATEGORIES,
  PRESETS_BY_CATEGORY,
  findPresetById,
  getPresetsByCategory,
} from './overlay-presets.data';

describe('Overlay Presets Data', () => {
  describe('OVERLAY_PRESETS', () => {
    it('should contain presets', () => {
      expect(OVERLAY_PRESETS.length).toBeGreaterThan(0);
    });

    it('should have unique IDs', () => {
      const ids = OVERLAY_PRESETS.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have a "none" preset', () => {
      const nonePreset = OVERLAY_PRESETS.find((p) => p.id === 'none');
      expect(nonePreset).toBeDefined();
      expect(nonePreset?.elements).toHaveLength(0);
    });

    it('all presets should have required fields', () => {
      OVERLAY_PRESETS.forEach((preset) => {
        expect(preset.id).toBeDefined();
        expect(preset.name).toBeDefined();
        expect(preset.description).toBeDefined();
        expect(preset.elements).toBeInstanceOf(Array);
      });
    });

    it('all presets should have valid categories', () => {
      OVERLAY_PRESETS.forEach((preset) => {
        if (preset.category) {
          expect(PRESET_CATEGORIES).toContain(preset.category);
        }
      });
    });
  });

  describe('PRESET_CATEGORIES', () => {
    it('should contain expected categories', () => {
      expect(PRESET_CATEGORIES).toContain('Basic');
      expect(PRESET_CATEGORIES).toContain('Resolution');
      expect(PRESET_CATEGORIES).toContain('HDR');
      expect(PRESET_CATEGORIES).toContain('Audio');
      expect(PRESET_CATEGORIES).toContain('Combined');
    });

    it('should have unique categories', () => {
      const uniqueCategories = new Set(PRESET_CATEGORIES);
      expect(uniqueCategories.size).toBe(PRESET_CATEGORIES.length);
    });
  });

  describe('PRESETS_BY_CATEGORY', () => {
    it('should have an entry for each category', () => {
      PRESET_CATEGORIES.forEach((category) => {
        expect(PRESETS_BY_CATEGORY[category]).toBeDefined();
        expect(PRESETS_BY_CATEGORY[category]).toBeInstanceOf(Array);
      });
    });

    it('should contain all presets when combined', () => {
      const allPresets = Object.values(PRESETS_BY_CATEGORY).flat();
      expect(allPresets.length).toBe(OVERLAY_PRESETS.length);
    });
  });

  describe('findPresetById', () => {
    it('should find existing preset', () => {
      const preset = findPresetById('4k-badge');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('4K Badge');
    });

    it('should return undefined for non-existent preset', () => {
      const preset = findPresetById('non-existent-preset');
      expect(preset).toBeUndefined();
    });
  });

  describe('getPresetsByCategory', () => {
    it('should return presets for valid category', () => {
      const presets = getPresetsByCategory('Resolution');
      expect(presets.length).toBeGreaterThan(0);
      presets.forEach((preset) => {
        expect(preset.category).toBe('Resolution');
      });
    });

    it('should return Basic presets', () => {
      const presets = getPresetsByCategory('Basic');
      expect(presets.length).toBeGreaterThan(0);
    });
  });

  describe('Preset Element Validation', () => {
    it('all elements should have valid types', () => {
      const validTypes = ['text', 'image', 'badge', 'ribbon'];

      OVERLAY_PRESETS.forEach((preset) => {
        preset.elements.forEach((element) => {
          expect(validTypes).toContain(element.type);
        });
      });
    });

    it('badge elements should have required properties', () => {
      OVERLAY_PRESETS.forEach((preset) => {
        preset.elements
          .filter((e) => e.type === 'badge')
          .forEach((element) => {
            expect(element.x).toBeDefined();
            expect(element.y).toBeDefined();
            expect(element.width).toBeDefined();
            expect(element.height).toBeDefined();
          });
      });
    });

    it('ribbon elements should span full width', () => {
      OVERLAY_PRESETS.forEach((preset) => {
        preset.elements
          .filter((e) => e.type === 'ribbon' && !e.rotation)
          .forEach((element) => {
            expect(element.width).toBe(1000); // Kometa canvas width
          });
      });
    });
  });
});
