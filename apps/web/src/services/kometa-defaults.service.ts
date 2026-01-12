/**
 * Service for fetching and parsing Kometa default overlays
 * from the official Kometa defaults repository
 */

import * as yaml from 'js-yaml';
import { OverlayElement } from '../components/overlay/PosterPreview';

const KOMETA_DEFAULTS_REPO = 'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults';

export interface KometaOverlayDefinition {
  overlays: Record<string, any>;
  templates?: Record<string, any>;
  template_variables?: Record<string, any>;
}

export interface ParsedOverlay {
  name: string;
  description?: string;
  properties: {
    position?: { horizontal?: string; vertical?: string };
    offset?: { horizontal?: number; vertical?: number };
    font?: string;
    fontSize?: number;
    fontColor?: string;
    backgroundColor?: string;
    image?: string;
    text?: string;
    back_width?: number;
    back_height?: number;
  };
}

export class KometaDefaultsService {
  /**
   * Fetch a default overlay file from the Kometa repository
   */
  async fetchDefaultOverlay(overlayName: string): Promise<string> {
    // Map common overlay names to their paths in the repo
    const overlayPaths: Record<string, string> = {
      resolution: 'overlays/resolution.yml',
      audio_codec: 'overlays/audio_codec.yml',
      mediastinger: 'overlays/mediastinger.yml',
      ratings: 'overlays/ratings.yml',
      ribbon: 'overlays/ribbon.yml',
      streaming: 'overlays/streaming.yml',
      studio: 'overlays/studio.yml',
      network: 'overlays/network.yml',
      episode_info: 'overlays/episode_info.yml',
      runtimes: 'overlays/runtimes.yml',
      status: 'overlays/status.yml',
      versions: 'overlays/versions.yml',
    };

    const path = overlayPaths[overlayName];
    if (!path) {
      throw new Error(`Unknown overlay: ${overlayName}`);
    }

    const url = `${KOMETA_DEFAULTS_REPO}/${path}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch overlay: ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Parse template variables and apply them to the overlay definition
   */
  applyTemplateVariables(yaml: string, templateVariables?: Record<string, any>): string {
    if (!templateVariables) {
      return yaml;
    }

    let processedYaml = yaml;

    // Replace template variable references
    for (const [key, value] of Object.entries(templateVariables)) {
      // Handle <<key>> style template variables
      const regex = new RegExp(`<<${key}>>`, 'g');
      processedYaml = processedYaml.replace(regex, String(value));
    }

    return processedYaml;
  }

  /**
   * Parse YAML and extract overlay definitions
   */
  parseOverlayYaml(yamlText: string): KometaOverlayDefinition {
    try {
      const parsed = yaml.load(yamlText) as any;
      return {
        overlays: parsed.overlays || {},
        templates: parsed.templates,
        template_variables: parsed.template_variables,
      };
    } catch (error) {
      console.error('Failed to parse overlay YAML:', error);
      throw new Error('Invalid YAML format');
    }
  }

  /**
   * Extract overlay information from parsed YAML for preview
   */
  parseOverlayForPreview(yamlText: string): ParsedOverlay[] {
    const overlays: ParsedOverlay[] = [];

    try {
      const definition = this.parseOverlayYaml(yamlText);

      // Extract overlay definitions
      for (const [name, overlayDef] of Object.entries(definition.overlays)) {
        const properties: ParsedOverlay['properties'] = {};

        // Extract positioning
        if (overlayDef.horizontal_align || overlayDef.vertical_align) {
          properties.position = {
            horizontal: overlayDef.horizontal_align,
            vertical: overlayDef.vertical_align,
          };
        }

        // Extract offsets
        if (
          overlayDef.horizontal_offset !== undefined ||
          overlayDef.vertical_offset !== undefined
        ) {
          properties.offset = {
            horizontal: overlayDef.horizontal_offset,
            vertical: overlayDef.vertical_offset,
          };
        }

        // Extract text properties
        if (overlayDef.font) properties.font = overlayDef.font;
        if (overlayDef.font_size) properties.fontSize = overlayDef.font_size;
        if (overlayDef.font_color) properties.fontColor = overlayDef.font_color;
        if (overlayDef.back_color) properties.backgroundColor = overlayDef.back_color;
        if (overlayDef.back_width) properties.back_width = overlayDef.back_width;
        if (overlayDef.back_height) properties.back_height = overlayDef.back_height;
        if (overlayDef.text) properties.text = overlayDef.text;

        // Extract image/file reference
        if (overlayDef.file) properties.image = overlayDef.file;
        if (overlayDef.git) properties.image = overlayDef.git;
        if (overlayDef.url) properties.image = overlayDef.url;

        overlays.push({
          name,
          description: overlayDef.summary,
          properties,
        });
      }
    } catch (error) {
      console.error('Failed to parse overlay for preview:', error);
    }

    return overlays;
  }

  /**
   * Convert Kometa overlay properties to OverlayElement format
   */
  convertToOverlayElements(parsedOverlays: ParsedOverlay[]): OverlayElement[] {
    const elements: OverlayElement[] = [];

    for (const overlay of parsedOverlays) {
      const props = overlay.properties;

      // Map horizontal alignment
      const getHorizontalPosition = (align?: string): 'left' | 'center' | 'right' => {
        if (align === 'left') return 'left';
        if (align === 'right') return 'right';
        return 'center';
      };

      // Map vertical alignment
      const getVerticalPosition = (align?: string): 'top' | 'center' | 'bottom' => {
        if (align === 'top') return 'top';
        if (align === 'bottom') return 'bottom';
        return 'center';
      };

      // Calculate position based on alignment and offset
      const horizontal = getHorizontalPosition(props.position?.horizontal);
      const vertical = getVerticalPosition(props.position?.vertical);

      // If there's text, create a text overlay element
      if (props.text || props.fontSize) {
        elements.push({
          type: 'text',
          content: props.text || overlay.name,
          position: { horizontal, vertical },
          offset: props.offset || { horizontal: 0, vertical: 0 },
          fontSize: props.fontSize || 48,
          fontColor: props.fontColor || '#FFFFFF',
          backgroundColor: props.backgroundColor,
          fontFamily: props.font,
        });
      }

      // If there's an image/icon reference, create an image element
      if (props.image) {
        elements.push({
          type: 'image',
          content: props.image,
          position: { horizontal, vertical },
          offset: props.offset || { horizontal: 0, vertical: 0 },
          width: props.back_width || 200,
          height: props.back_height || 100,
        });
      }

      // If there's just positioning with colors (like a badge/banner), create a box
      if (props.backgroundColor && !props.text && !props.image) {
        elements.push({
          type: 'image',
          content: '', // Empty content for color box
          position: { horizontal, vertical },
          offset: props.offset || { horizontal: 0, vertical: 0 },
          width: props.back_width || 200,
          height: props.back_height || 100,
        });
      }
    }

    return elements;
  }

  /**
   * Fetch and convert a default overlay to OverlayElements
   */
  async fetchAndConvertOverlay(
    overlayName: string,
    templateVariables?: Record<string, any>,
    mediaMetadata?: {
      resolution?: string;
      videoCodec?: string;
      audioCodec?: string;
      ratings?: {
        tmdb?: number;
        imdb?: number;
      };
    }
  ): Promise<OverlayElement[]> {
    try {
      // Fetch the overlay YAML
      let yamlText = await this.fetchDefaultOverlay(overlayName);

      // Apply template variables if provided
      if (templateVariables) {
        yamlText = this.applyTemplateVariables(yamlText, templateVariables);
      }

      // Parse the overlay
      const parsedOverlays = this.parseOverlayForPreview(yamlText);

      // Apply metadata to overlay content
      if (mediaMetadata) {
        this.applyMetadataToOverlays(parsedOverlays, mediaMetadata, overlayName);
      }

      // Convert to overlay elements
      return this.convertToOverlayElements(parsedOverlays);
    } catch (error) {
      console.error('Failed to fetch and convert overlay:', error);
      throw error;
    }
  }

  /**
   * Apply media metadata to overlay content (for dynamic text)
   */
  private applyMetadataToOverlays(
    overlays: ParsedOverlay[],
    metadata: {
      resolution?: string;
      videoCodec?: string;
      audioCodec?: string;
      ratings?: {
        tmdb?: number;
        imdb?: number;
      };
    },
    overlayName: string
  ): void {
    for (const overlay of overlays) {
      // Apply resolution
      if (overlayName === 'resolution' && metadata.resolution) {
        overlay.properties.text = metadata.resolution;
      }

      // Apply video codec
      if (overlayName === 'audio_codec' && metadata.videoCodec) {
        overlay.properties.text = metadata.videoCodec;
      }

      // Apply audio codec
      if (metadata.audioCodec && overlay.properties.text?.includes('audio')) {
        overlay.properties.text = metadata.audioCodec;
      }

      // Apply ratings
      if (overlayName === 'ratings' && metadata.ratings) {
        if (overlay.name.includes('tmdb') && metadata.ratings.tmdb) {
          overlay.properties.text = metadata.ratings.tmdb.toFixed(1);
        }
        if (overlay.name.includes('imdb') && metadata.ratings.imdb) {
          overlay.properties.text = metadata.ratings.imdb.toFixed(1);
        }
      }
    }
  }

  /**
   * Generate overlay elements based on media metadata
   * This simulates what Kometa would apply to this specific media
   */
  generateOverlaysForMedia(
    overlayType: string,
    metadata: {
      resolution?: string;
      videoCodec?: string;
      audioCodec?: string;
      audioChannels?: string;
      status?: string;
      ratings?: {
        tmdb?: number;
        imdb?: number;
      };
    },
    templateVars?: Record<string, any>,
    configAssets?: Record<string, string> // Assets extracted from user's config
  ): OverlayElement[] {
    const elements: OverlayElement[] = [];

    // Resolution overlay - Kometa EXACT values from resolution.yml
    // Kometa renders on 1000x1500 canvas for movies
    // Values from YAML: back_width=305, back_height=105, back_color=#00000099
    // Font size: default 36 from overlay.py (no font_size in resolution.yml)
    if (overlayType === 'resolution' && metadata.resolution) {
      // Use Kometa's EXACT values without scaling
      // Kometa values for 1000x1500 canvas:
      const kometaBackWidth = 305;
      const kometaBackHeight = 105;
      const kometaFontSize = 36; // Default from overlay.py __init__
      const kometaHorizontalOffset = 15; // From resolution.yml
      const kometaVerticalOffset = 15; // From resolution.yml

      elements.push({
        type: 'badge',
        content: metadata.resolution.toUpperCase(),
        position: {
          horizontal: templateVars?.horizontal_align || 'left',
          vertical: templateVars?.vertical_align || 'top',
        },
        offset: {
          horizontal: templateVars?.horizontal_offset || kometaHorizontalOffset,
          vertical: templateVars?.vertical_offset || kometaVerticalOffset,
        },
        fontSize: kometaFontSize,
        fontColor: '#FFFFFF',
        backgroundColor: '#00000099', // Kometa default from resolution.yml
        padding: 0, // Kometa: back_padding not set for resolution
        borderRadius: 0, // Kometa: back_radius not set for resolution
        width: kometaBackWidth,
        height: kometaBackHeight,
      });
    }

    // Video codec overlay - render as badge with text
    if (overlayType === 'video_codec' && metadata.videoCodec) {
      elements.push({
        type: 'badge',
        content: metadata.videoCodec.toUpperCase(),
        position: {
          horizontal: templateVars?.horizontal_align || 'left',
          vertical: templateVars?.vertical_align || 'top',
        },
        offset: {
          horizontal: templateVars?.horizontal_offset || 15,
          vertical: (templateVars?.vertical_offset || 15) + 75,
        },
        fontSize: 28,
        fontColor: '#FFFFFF',
        backgroundColor: 'rgba(76, 175, 80, 0.9)',
        padding: 10,
        borderRadius: 6,
        width: 120,
        height: 50,
      });
    }

    // Audio codec overlay - render as badge with text
    if (overlayType === 'audio_codec' && metadata.audioCodec) {
      elements.push({
        type: 'badge',
        content: metadata.audioCodec.toUpperCase(),
        position: {
          horizontal: templateVars?.horizontal_align || 'left',
          vertical: templateVars?.vertical_align || 'top',
        },
        offset: {
          horizontal: templateVars?.horizontal_offset || 15,
          vertical: (templateVars?.vertical_offset || 15) + 135,
        },
        fontSize: 26,
        fontColor: '#FFFFFF',
        backgroundColor: 'rgba(255, 152, 0, 0.9)',
        padding: 8,
        borderRadius: 6,
        width: 120,
        height: 45,
      });
    }

    // Ratings overlay - respects rating1, rating2, rating3 template variables
    if (overlayType === 'ratings' && metadata.ratings) {
      const baseOffset = templateVars?.horizontal_offset || 15;
      const vOffset = templateVars?.vertical_offset || 15;

      console.log('🎯 Generating ratings overlay with template vars:', {
        rating1: templateVars?.rating1,
        rating1_image: templateVars?.rating1_image,
        rating2: templateVars?.rating2,
        rating2_image: templateVars?.rating2_image,
        rating3: templateVars?.rating3,
        rating3_image: templateVars?.rating3_image,
        availableRatings: metadata.ratings,
      });

      // Helper to create rating badge
      const createRatingBadge = (ratingNum: 1 | 2 | 3, yOffset: number): OverlayElement | null => {
        const ratingType = templateVars?.[`rating${ratingNum}`];
        const ratingImage = templateVars?.[`rating${ratingNum}_image`];

        // Determine which rating to use based on rating type or image
        let ratingValue: number | undefined;
        let ratingLabel = '';

        if (ratingType === 'critic' || ratingImage === 'imdb') {
          ratingValue = metadata.ratings?.imdb;
          ratingLabel = 'IMDb';
        } else if (ratingType === 'audience' || ratingImage === 'tmdb') {
          ratingValue = metadata.ratings?.tmdb;
          ratingLabel = 'TMDB';
        } else if (ratingType === 'user' || ratingImage === 'rt_tomato') {
          // For RT, we can use TMDB as fallback since we don't have RT data
          ratingValue = metadata.ratings?.tmdb;
          ratingLabel = 'RT';
        } else {
          // Default: use tmdb for rating1, imdb for rating2, tmdb for rating3 if no config
          if (ratingNum === 1) {
            ratingValue = metadata.ratings?.tmdb;
            ratingLabel = 'TMDB';
          } else if (ratingNum === 2) {
            ratingValue = metadata.ratings?.imdb;
            ratingLabel = 'IMDb';
          } else if (ratingNum === 3) {
            // rating3 defaults to tmdb if imdb isn't available
            ratingValue = metadata.ratings?.tmdb;
            ratingLabel = 'TMDB (3)';
          }
        }

        if (!ratingValue) {
          console.log(`  ❌ Rating ${ratingNum} skipped: no value for ${ratingLabel}`);
          return null;
        }

        console.log(
          `  ✅ Rating ${ratingNum}: ${ratingLabel} ${ratingValue.toFixed(1)} at offset ${yOffset}`
        );

        // Kometa EXACT values from ratings.yml for 1000x1500 canvas
        // rating_alignment: horizontal (default layout)
        // font_size=63, back_width=270, back_height=80
        // back_color=#00000099, back_padding=15, back_radius=30, addon_offset=15
        const kometaFontSize = templateVars?.[`rating${ratingNum}_font_size`] || 63;
        const kometaBackWidth = 270; // horizontal layout from ratings.yml
        const kometaBackHeight = 80; // horizontal layout from ratings.yml
        const kometaBackRadius = 30; // from ratings.yml
        const kometaBackPadding = 15; // from ratings.yml
        const kometaAddonOffset = 15; // from ratings.yml

        // Get rating logo from config assets or use Kometa defaults
        // Map rating label to Kometa's image naming convention
        const ratingImageMap: Record<string, string> = {
          IMDb: 'imdb',
          TMDB: 'tmdb',
          RT: 'rt_tomato',
        };

        const imageKey = ratingImageMap[ratingLabel] || ratingLabel.toLowerCase();

        // Try to get image from config template_variables (rating1_image_url, etc.)
        let logoUrl =
          configAssets?.[`rating${ratingNum}_image_url`] ||
          configAssets?.[`rating${ratingNum}_image`];

        // If not in config, check if template_variables specifies rating image type
        const ratingImageType = templateVars?.[`rating${ratingNum}_image`];
        if (!logoUrl && ratingImageType) {
          // Map Kometa's rating image types to GitHub URLs
          // Note: RT images need Fresh/Rotten suffix based on rating value
          let imageFileName = ratingImageType.toLowerCase();

          if (imageFileName === 'rt_tomato' && ratingValue) {
            // Determine Fresh vs Rotten
            const percentage = ratingValue > 10 ? ratingValue : ratingValue * 10;
            const suffix = percentage >= 60 ? 'Fresh' : 'Rotten';
            imageFileName = `RT-Aud-${suffix}`;
          } else if (imageFileName === 'rt_critic' && ratingValue) {
            const percentage = ratingValue > 10 ? ratingValue : ratingValue * 10;
            const suffix = percentage >= 60 ? 'Fresh' : 'Rotten';
            imageFileName = `RT-Crit-${suffix}`;
          } else {
            // Standard mappings
            imageFileName = imageFileName
              .replace('rt_tomato', 'RT-Aud-Fresh')
              .replace('rt_critic', 'RT-Crit-Fresh')
              .replace('imdb', 'IMDb')
              .replace('tmdb', 'TMDb');
          }

          logoUrl = `https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/images/rating/${imageFileName}.png`;
        }

        // Fallback to Kometa defaults based on rating label
        if (!logoUrl) {
          // For RT, determine Fresh vs Rotten based on rating value (>60% = Fresh)
          let rtSuffix = '';
          if (ratingLabel === 'RT' && ratingValue) {
            // Convert to percentage if needed (TMDB uses 0-10, RT uses 0-100)
            const percentage = ratingValue > 10 ? ratingValue : ratingValue * 10;
            rtSuffix = percentage >= 60 ? 'Fresh' : 'Rotten';
          }

          const kometaDefaults: Record<string, string> = {
            IMDb: 'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/images/rating/IMDb.png',
            TMDB: 'https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/images/rating/TMDb.png',
            RT: `https://raw.githubusercontent.com/Kometa-Team/Kometa/master/defaults/overlays/images/rating/RT-Aud-${rtSuffix || 'Fresh'}.png`,
          };
          logoUrl = kometaDefaults[ratingLabel];
        }

        console.log(`  🖼️  Rating ${ratingNum} logo: ${logoUrl}`);

        // Format rating text based on label
        // Kometa shows: "TMDB 78%", "IMDb 8.0", "FRESH 83%"
        let displayText = '';
        if (ratingLabel === 'RT') {
          // RT shows percentage and Fresh/Rotten status
          const percentage =
            ratingValue > 10 ? Math.round(ratingValue) : Math.round(ratingValue * 10);
          const status = percentage >= 60 ? 'FRESH' : 'ROTTEN';
          displayText = `${status} ${percentage}%`;
        } else if (ratingLabel === 'TMDB') {
          // TMDB shows percentage (convert 0-10 to 0-100)
          const percentage =
            ratingValue > 10 ? Math.round(ratingValue) : Math.round(ratingValue * 10);
          displayText = `${percentage}%`;
        } else if (ratingLabel === 'IMDb') {
          // IMDb shows 0-10 rating
          displayText = ratingValue.toFixed(1);
        } else {
          // Default format
          displayText = ratingValue.toFixed(1);
        }

        return {
          type: 'badge',
          content: displayText,
          text: displayText,
          position: {
            horizontal: templateVars?.horizontal_position || 'right',
            vertical: templateVars?.vertical_align || 'bottom',
          },
          offset: {
            horizontal: baseOffset,
            vertical: yOffset,
          },
          fontSize: kometaFontSize,
          fontColor: templateVars?.[`rating${ratingNum}_font_color`] || '#FFFFFF',
          backgroundColor: templateVars?.[`rating${ratingNum}_back_color`] || '#00000099',
          padding: kometaBackPadding,
          borderRadius: kometaBackRadius,
          width: kometaBackWidth,
          height: kometaBackHeight,
          // Kometa's addon system - logo image positioned to left of text
          addonImage: logoUrl,
          addonPosition: 'left' as const,
          addonOffset: kometaAddonOffset,
        };
      };

      // Collect all valid rating badges
      // Kometa's addon_offset=15 from ratings.yml (spacing between badges on 1000x1500 canvas)
      // Badge height=80 from ratings.yml
      // Total spacing = badge height + addon_offset = 80 + 15 = 95px
      const kometaAddonOffset = 15; // from ratings.yml
      const kometaBackHeight = 80; // from ratings.yml
      const badgeSpacing = kometaBackHeight + kometaAddonOffset; // 95px on 1000x1500
      const badges: OverlayElement[] = [];
      const usedSources = new Set<string>(); // Track which rating sources we've already used

      const rating1 = createRatingBadge(1, vOffset);
      if (rating1) {
        // Extract source from the addon image URL to check for duplicates
        const source = rating1.addonImage?.includes('IMDb')
          ? 'IMDb'
          : rating1.addonImage?.includes('TMDb')
            ? 'TMDB'
            : rating1.addonImage?.includes('RT-')
              ? 'RT'
              : '';
        if (!usedSources.has(source)) {
          badges.push(rating1);
          usedSources.add(source);
        }
      }

      const rating2 = createRatingBadge(2, vOffset + badgeSpacing);
      if (rating2) {
        const source = rating2.addonImage?.includes('IMDb')
          ? 'IMDb'
          : rating2.addonImage?.includes('TMDb')
            ? 'TMDB'
            : rating2.addonImage?.includes('RT-')
              ? 'RT'
              : '';
        if (!usedSources.has(source)) {
          badges.push(rating2);
          usedSources.add(source);
        } else {
          console.log(`  ⚠️  Skipping rating2 - duplicate source: ${source}`);
        }
      }

      const rating3 = createRatingBadge(3, vOffset + badgeSpacing * 2);
      if (rating3) {
        const source = rating3.addonImage?.includes('IMDb')
          ? 'IMDb'
          : rating3.addonImage?.includes('TMDb')
            ? 'TMDB'
            : rating3.addonImage?.includes('RT-')
              ? 'RT'
              : '';
        if (!usedSources.has(source)) {
          badges.push(rating3);
          usedSources.add(source);
        } else {
          console.log(`  ⚠️  Skipping rating3 - duplicate source: ${source}`);
        }
      }

      // Adjust spacing to stack badges from bottom
      // After filtering duplicates, recalculate vertical positions
      badges.forEach((badge, index) => {
        badge.offset!.vertical = vOffset + index * badgeSpacing;
      });

      elements.push(...badges);
      console.log(`  ✅ Generated ${badges.length} unique rating badges`);
    }

    // Status overlay - show banner for show status (airing, ended, canceled)
    if (overlayType === 'status' && metadata.status) {
      console.log('🎬 Generating status overlay for:', metadata.status);

      const statusColors: Record<string, string> = {
        airing: templateVars?.back_color_airing || '#016920',
        'returning series': templateVars?.back_color_returning || '#81007F',
        returning: templateVars?.back_color_returning || '#81007F',
        canceled: templateVars?.back_color_canceled || '#B52222',
        cancelled: templateVars?.back_color_canceled || '#B52222',
        ended: templateVars?.back_color_ended || '#000847',
      };

      const statusText = metadata.status.toUpperCase();
      const bgColor = statusColors[metadata.status.toLowerCase()] || statusColors.ended;

      console.log(`  Status text: "${statusText}", Color: ${bgColor}`);

      // Use canvas-appropriate width (500 for standard poster preview)
      const ribbonWidth = templateVars?.back_width || 500;

      // Scale font size and dimensions for 500x750 canvas
      const templateFontSize = templateVars?.font_size || 60;
      const scaledFontSize = Math.round(templateFontSize * 0.42);
      const templateHeight = templateVars?.back_height || 85;
      const scaledHeight = Math.round(templateHeight * 0.47);

      elements.push({
        type: 'ribbon',
        content: statusText,
        text: statusText,
        position: {
          horizontal: templateVars?.horizontal_align || 'center',
          vertical: templateVars?.vertical_align || 'top',
        },
        offset: {
          horizontal: templateVars?.horizontal_offset || 0,
          vertical: templateVars?.vertical_offset || 0,
        },
        width: ribbonWidth,
        height: scaledHeight,
        fontSize: scaledFontSize,
        fontColor: '#FFFFFF',
        backgroundColor: bgColor,
      });
    }

    // Ribbon overlay - generic ribbon/banner
    if (overlayType === 'ribbon') {
      const ribbonText = templateVars?.text || 'NEW';
      const ribbonStyle = templateVars?.style || 'red';

      const ribbonColors: Record<string, string> = {
        red: '#B52222',
        blue: '#0066CC',
        green: '#016920',
        yellow: '#FFC107',
        orange: '#FF6B00',
        purple: '#81007F',
      };

      // Use canvas-appropriate width (500 for standard poster preview)
      const ribbonWidth = templateVars?.back_width || 500;

      // Scale font size and dimensions for 500x750 canvas
      const templateFontSize = templateVars?.font_size || 50;
      const scaledFontSize = Math.round(templateFontSize * 0.42);
      const templateHeight = templateVars?.back_height || 80;
      const scaledHeight = Math.round(templateHeight * 0.47);

      elements.push({
        type: 'ribbon',
        content: ribbonText,
        text: ribbonText,
        position: {
          horizontal: templateVars?.horizontal_align || 'center',
          vertical: templateVars?.vertical_align || 'top',
        },
        offset: {
          horizontal: templateVars?.horizontal_offset || 0,
          vertical: templateVars?.vertical_offset || 0,
        },
        width: ribbonWidth,
        height: scaledHeight,
        fontSize: scaledFontSize,
        fontColor: '#FFFFFF',
        backgroundColor: ribbonColors[ribbonStyle] || ribbonColors.red,
      });
    }

    return elements;
  }
}
