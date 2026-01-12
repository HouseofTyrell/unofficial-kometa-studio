import { useState, useCallback } from 'react';
import * as yaml from 'js-yaml';
import styles from './GitHubImport.module.css';
import { OverlayElement } from './PosterPreview';

export interface GitHubImportProps {
  onImport: (elements: OverlayElement[], yamlContent: string, sourceUrl: string) => void;
  onClose: () => void;
}

interface ParsedOverlayInfo {
  name: string;
  type: 'text' | 'image' | 'badge';
  position?: string;
  hasTemplate?: boolean;
}

export function GitHubImport({ onImport, onClose }: GitHubImportProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    overlays: ParsedOverlayInfo[];
    yamlContent: string;
    rawUrl: string;
  } | null>(null);

  // Convert GitHub URL to raw URL if needed
  const toRawUrl = (inputUrl: string): string => {
    // Already a raw URL
    if (inputUrl.includes('raw.githubusercontent.com')) {
      return inputUrl;
    }

    // Convert github.com/user/repo/blob/branch/path to raw URL
    const githubMatch = inputUrl.match(
      /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/
    );
    if (githubMatch) {
      const [, user, repo, branch, path] = githubMatch;
      return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;
    }

    // Convert github.com/user/repo/tree/branch/path (directory) - not directly usable
    if (inputUrl.includes('/tree/')) {
      throw new Error('Please provide a direct link to a YAML file, not a directory.');
    }

    return inputUrl;
  };

  // Fetch and parse YAML from GitHub
  const fetchAndParse = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a GitHub URL');
      return;
    }

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const rawUrl = toRawUrl(url.trim());

      const response = await fetch(rawUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const yamlContent = await response.text();

      // Parse YAML
      const parsed = yaml.load(yamlContent) as any;

      if (!parsed) {
        throw new Error('Empty or invalid YAML file');
      }

      // Extract overlay information
      const overlayInfos: ParsedOverlayInfo[] = [];

      // Check for 'overlays' key (standard Kometa format)
      const overlays = parsed.overlays || parsed;

      if (typeof overlays === 'object') {
        for (const [name, def] of Object.entries(overlays)) {
          if (name === 'templates' || name === 'template_variables') continue;

          const overlayDef = def as any;
          const info: ParsedOverlayInfo = {
            name,
            type: 'badge',
            hasTemplate: false,
          };

          // Determine type
          if (overlayDef.file || overlayDef.git || overlayDef.url) {
            info.type = 'image';
          } else if (overlayDef.text) {
            info.type = 'text';
          }

          // Check for template usage
          if (overlayDef.template) {
            info.hasTemplate = true;
          }

          // Get position info
          const hAlign = overlayDef.horizontal_align || 'left';
          const vAlign = overlayDef.vertical_align || 'top';
          info.position = `${vAlign}-${hAlign}`;

          overlayInfos.push(info);
        }
      }

      if (overlayInfos.length === 0) {
        throw new Error('No overlay definitions found in this YAML file');
      }

      setPreview({
        overlays: overlayInfos,
        yamlContent,
        rawUrl,
      });
    } catch (err) {
      console.error('Failed to fetch/parse GitHub YAML:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch or parse YAML');
    } finally {
      setLoading(false);
    }
  }, [url]);

  // Parse YAML and convert to OverlayElements
  const parseOverlaysToElements = (yamlContent: string): OverlayElement[] => {
    const parsed = yaml.load(yamlContent) as any;
    const elements: OverlayElement[] = [];

    // Get overlays and templates
    const overlays = parsed.overlays || parsed;
    const templates = parsed.templates || {};

    // Helper to resolve template variables
    const resolveTemplate = (overlayDef: any): any => {
      if (!overlayDef.template) return overlayDef;

      const templateName = Array.isArray(overlayDef.template)
        ? overlayDef.template[0]
        : overlayDef.template;
      const template = templates[templateName];

      if (!template) return overlayDef;

      // Merge template with overlay, overlay values take precedence
      return {
        ...template,
        ...overlayDef,
      };
    };

    for (const [name, def] of Object.entries(overlays)) {
      if (name === 'templates' || name === 'template_variables') continue;

      const overlayDef = resolveTemplate(def as any);

      // Map Kometa alignment to our position system
      const getHorizontal = (align: string): 'left' | 'center' | 'right' => {
        if (align === 'left') return 'left';
        if (align === 'right') return 'right';
        return 'center';
      };

      const getVertical = (align: string): 'top' | 'center' | 'bottom' => {
        if (align === 'top') return 'top';
        if (align === 'bottom') return 'bottom';
        return 'center';
      };

      const position = {
        horizontal: getHorizontal(overlayDef.horizontal_align || 'left'),
        vertical: getVertical(overlayDef.vertical_align || 'top'),
      };

      const offset = {
        horizontal: overlayDef.horizontal_offset || 0,
        vertical: overlayDef.vertical_offset || 0,
      };

      // Create element based on overlay type
      if (overlayDef.file || overlayDef.git || overlayDef.url) {
        // Image overlay
        let imageUrl = overlayDef.url || '';

        // Handle git reference
        if (overlayDef.git) {
          // Kometa git format: PMM/overlays/images/something.png
          const gitPath = overlayDef.git;
          if (gitPath.startsWith('PMM/') || gitPath.startsWith('Kometa/')) {
            imageUrl = `https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/${gitPath.replace(/^(PMM|Kometa)\//, '')}`;
          } else {
            imageUrl = `https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/images/${gitPath}`;
          }
        }

        elements.push({
          type: 'image',
          imageUrl,
          position,
          offset,
          width: overlayDef.back_width || 200,
          height: overlayDef.back_height || 100,
        });
      } else if (overlayDef.text) {
        // Text overlay - could be badge or plain text
        const hasBackground =
          overlayDef.back_color || overlayDef.back_width || overlayDef.back_height;

        if (hasBackground) {
          elements.push({
            type: 'badge',
            content: overlayDef.text,
            text: overlayDef.text,
            position,
            offset,
            fontSize: overlayDef.font_size || 36,
            fontColor: overlayDef.font_color || '#FFFFFF',
            backgroundColor: overlayDef.back_color || '#00000099',
            width: overlayDef.back_width,
            height: overlayDef.back_height,
            borderRadius: overlayDef.back_radius || 0,
            padding: overlayDef.back_padding || 0,
          });
        } else {
          elements.push({
            type: 'text',
            content: overlayDef.text,
            text: overlayDef.text,
            position,
            offset,
            fontSize: overlayDef.font_size || 36,
            fontColor: overlayDef.font_color || '#FFFFFF',
            color: overlayDef.font_color || '#FFFFFF',
          });
        }
      } else {
        // Just a positioned element with name as content
        elements.push({
          type: 'badge',
          content: name,
          text: name,
          position,
          offset,
          fontSize: overlayDef.font_size || 36,
          fontColor: overlayDef.font_color || '#FFFFFF',
          backgroundColor: overlayDef.back_color || '#00000099',
          width: overlayDef.back_width || 200,
          height: overlayDef.back_height || 80,
        });
      }
    }

    return elements;
  };

  // Handle import
  const handleImport = () => {
    if (!preview) return;

    try {
      const elements = parseOverlaysToElements(preview.yamlContent);
      onImport(elements, preview.yamlContent, preview.rawUrl);
    } catch (err) {
      console.error('Failed to convert overlays:', err);
      setError('Failed to convert overlays to preview elements');
    }
  };

  // Example URLs for quick access
  const exampleUrls = [
    {
      label: 'Resolution',
      url: 'https://github.com/Kometa-Team/Kometa/blob/master/defaults/overlays/resolution.yml',
    },
    {
      label: 'Ratings',
      url: 'https://github.com/Kometa-Team/Kometa/blob/master/defaults/overlays/ratings.yml',
    },
    {
      label: 'Ribbon',
      url: 'https://github.com/Kometa-Team/Kometa/blob/master/defaults/overlays/ribbon.yml',
    },
    {
      label: 'Status',
      url: 'https://github.com/Kometa-Team/Kometa/blob/master/defaults/overlays/status.yml',
    },
  ];

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <h2>Import from GitHub</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.description}>
            Import overlay definitions from GitHub repositories. Paste a URL to a Kometa overlay
            YAML file to preview and import the overlays.
          </p>

          <div className={styles.inputGroup}>
            <label htmlFor="github-url">GitHub URL</label>
            <div className={styles.inputRow}>
              <input
                id="github-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com/user/repo/blob/main/overlays.yml"
                className={styles.input}
              />
              <button
                className={styles.fetchButton}
                onClick={fetchAndParse}
                disabled={loading || !url.trim()}
              >
                {loading ? 'Loading...' : 'Preview'}
              </button>
            </div>
          </div>

          <div className={styles.examples}>
            <span className={styles.examplesLabel}>Kometa Defaults:</span>
            {exampleUrls.map((example) => (
              <button
                key={example.label}
                className={styles.exampleButton}
                onClick={() => setUrl(example.url)}
              >
                {example.label}
              </button>
            ))}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          {preview && (
            <div className={styles.preview}>
              <h3>Found {preview.overlays.length} overlay(s):</h3>
              <div className={styles.overlayList}>
                {preview.overlays.map((overlay, index) => (
                  <div key={index} className={styles.overlayItem}>
                    <span className={styles.overlayName}>{overlay.name}</span>
                    <span className={styles.overlayType}>{overlay.type}</span>
                    {overlay.position && (
                      <span className={styles.overlayPosition}>{overlay.position}</span>
                    )}
                    {overlay.hasTemplate && (
                      <span className={styles.overlayTemplate}>template</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.importButton}
            onClick={handleImport}
            disabled={!preview || loading}
          >
            Import Overlays
          </button>
        </div>
      </div>
    </div>
  );
}
