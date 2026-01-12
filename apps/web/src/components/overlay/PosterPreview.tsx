import { useEffect, useRef, useState } from 'react';
import styles from './PosterPreview.module.css';

export interface OverlayElement {
  type: 'text' | 'image' | 'badge' | 'ribbon';
  // Support both absolute positioning (x/y) and relative positioning (position/offset)
  x?: number;
  y?: number;
  position?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'center' | 'bottom';
  };
  offset?: {
    horizontal?: number;
    vertical?: number;
  };
  width?: number;
  height?: number;
  // Support both 'text' and 'content' for text content
  text?: string;
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontColor?: string; // Add support for fontColor (used by Kometa)
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  imageUrl?: string;
  rotation?: number;
  // Kometa addon system - logo images positioned with text (for ratings)
  addonImage?: string; // URL to logo image (e.g., IMDb, TMDB, RT logo)
  addonPosition?: 'left' | 'right' | 'top' | 'bottom'; // Position of addon relative to text
  addonOffset?: number; // Spacing between addon and text
}

export interface PosterPreviewProps {
  posterUrl: string | null;
  overlayElements?: OverlayElement[];
  width?: number;
  height?: number;
}

export function PosterPreview({
  posterUrl,
  overlayElements = [],
  width = 500,
  height = 750,
}: PosterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    renderPreview();
  }, [posterUrl, overlayElements]);

  // Convert position-based coordinates to absolute x/y
  // Kometa uses 1000x1500 coordinate system for movies (portrait)
  // We render on that coordinate system and scale when displaying
  const calculateAbsolutePosition = (element: OverlayElement): { x: number; y: number } => {
    // If element already has x/y, use those
    if (element.x !== undefined && element.y !== undefined) {
      return { x: element.x, y: element.y };
    }

    // Kometa's canvas size for movies (portrait)
    const KOMETA_CANVAS_WIDTH = 1000;
    const KOMETA_CANVAS_HEIGHT = 1500;

    // Otherwise, calculate from position and offset using Kometa's coordinate system
    const position = element.position || { horizontal: 'left', vertical: 'top' };
    const offset = element.offset || { horizontal: 0, vertical: 0 };
    const elementWidth = element.width || 200;
    const elementHeight = element.height || 100;

    let x = 0;
    let y = 0;

    // Calculate horizontal position - Kometa's logic from overlay.py get_cord()
    switch (position.horizontal) {
      case 'left':
        x = offset.horizontal || 0;
        break;
      case 'center':
        x =
          Math.floor(KOMETA_CANVAS_WIDTH / 2) -
          Math.floor(elementWidth / 2) +
          (offset.horizontal || 0);
        break;
      case 'right':
        // Kometa: image_value - over_value - value
        x = KOMETA_CANVAS_WIDTH - elementWidth - (offset.horizontal || 0);
        break;
      default:
        x = offset.horizontal || 0;
    }

    // Calculate vertical position - Kometa's logic
    switch (position.vertical) {
      case 'top':
        y = offset.vertical || 0;
        break;
      case 'center':
        y =
          Math.floor(KOMETA_CANVAS_HEIGHT / 2) -
          Math.floor(elementHeight / 2) +
          (offset.vertical || 0);
        break;
      case 'bottom':
        // Kometa: image_value - over_value - value
        y = KOMETA_CANVAS_HEIGHT - elementHeight - (offset.vertical || 0);
        break;
      default:
        y = offset.vertical || 0;
    }

    return { x, y };
  };

  const renderPreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setLoading(true);
    setError(null);

    try {
      // Kometa renders on 1000x1500 canvas for movies, we scale to 500x750 for display
      const KOMETA_WIDTH = 1000;
      const KOMETA_HEIGHT = 1500;
      const SCALE_FACTOR = width / KOMETA_WIDTH; // 0.5 for 500px display width

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Set up scaling transform to match Kometa's coordinate system
      ctx.save();
      ctx.scale(SCALE_FACTOR, SCALE_FACTOR);

      // Draw poster image if available
      if (posterUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            // Draw at Kometa's full size (1000x1500), it will be scaled by transform
            ctx.drawImage(img, 0, 0, KOMETA_WIDTH, KOMETA_HEIGHT);
            resolve();
          };
          img.onerror = () => reject(new Error('Failed to load poster image'));
          img.src = posterUrl;
        });
      } else {
        // Draw placeholder
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, KOMETA_WIDTH, KOMETA_HEIGHT);
        ctx.fillStyle = '#666';
        ctx.font = '40px system-ui'; // Larger font for 1000x1500 canvas
        ctx.textAlign = 'center';
        ctx.fillText('No Poster Available', KOMETA_WIDTH / 2, KOMETA_HEIGHT / 2);
      }

      // Draw overlay elements
      for (const element of overlayElements) {
        ctx.save();

        // Calculate absolute position
        const pos = calculateAbsolutePosition(element);

        if (element.rotation) {
          const centerX = pos.x + (element.width || 0) / 2;
          const centerY = pos.y + (element.height || 0) / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((element.rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }

        switch (element.type) {
          case 'text':
            renderTextElement(ctx, { ...element, ...pos });
            break;
          case 'badge':
            await renderBadgeElement(ctx, { ...element, ...pos });
            break;
          case 'ribbon':
            renderRibbonElement(ctx, { ...element, ...pos });
            break;
          case 'image':
            await renderImageElement(ctx, { ...element, ...pos });
            break;
        }

        ctx.restore();
      }

      // Restore the scaling transform
      ctx.restore();

      setLoading(false);
    } catch (err) {
      console.error('Failed to render preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to render preview');
      setLoading(false);
    }
  };

  const renderTextElement = (ctx: CanvasRenderingContext2D, element: OverlayElement) => {
    const textContent = element.text || element.content;
    if (!textContent) return;
    if (!element.x || !element.y) return;

    // Support backgroundColor for text elements
    if (element.backgroundColor) {
      const fontSize = element.fontSize || 24;
      ctx.font = `${fontSize}px ${element.fontFamily || 'system-ui'}`;
      const metrics = ctx.measureText(textContent);
      const padding = element.padding || 8;
      const textHeight = fontSize;
      const bgWidth = metrics.width + padding * 2;
      const bgHeight = textHeight + padding * 2;

      ctx.fillStyle = element.backgroundColor;
      ctx.fillRect(element.x - padding, element.y - padding, bgWidth, bgHeight);
    }

    ctx.font = `${element.fontSize || 24}px ${element.fontFamily || 'system-ui'}`;
    ctx.fillStyle = element.fontColor || element.color || '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(textContent, element.x, element.y);
  };

  const renderBadgeElement = async (ctx: CanvasRenderingContext2D, element: OverlayElement) => {
    const textContent = element.text || element.content;
    if (!textContent) return;
    if (element.x === undefined || element.y === undefined) return;

    // Kometa's rendering logic from overlay.py get_backdrop()
    // Uses back_padding, back_width, back_height, back_radius from YAML
    const backPadding = element.padding || 0; // Kometa default: 0 for most, 15 for ratings
    const fontSize = element.fontSize || 36; // Kometa default: 36
    const borderRadius = element.borderRadius || 0; // Kometa default: 0, 30 for ratings
    const addonOffset = element.addonOffset || 15; // Kometa default: 15px between logo and text

    // Set font - Kometa uses Inter-Bold.ttf, we'll use system bold
    // Kometa draws text with anchor="lt" (left-top alignment)
    ctx.font = `bold ${fontSize}px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`;

    // Measure text using Kometa's approach (textbbox with anchor='lt')
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const textMetrics = ctx.measureText(textContent);
    const textWidth = textMetrics.width;

    // Kometa calculates text height from font metrics
    const fontBoundingBoxAscent = textMetrics.actualBoundingBoxAscent || fontSize * 0.8;
    const fontBoundingBoxDescent = textMetrics.actualBoundingBoxDescent || fontSize * 0.2;
    const textHeight = fontBoundingBoxAscent + fontBoundingBoxDescent;

    // Load addon image if specified (Kometa's logo system for ratings)
    let addonImg: HTMLImageElement | null = null;
    let addonWidth = 0;
    let addonHeight = 0;

    if (element.addonImage) {
      try {
        addonImg = new Image();
        addonImg.crossOrigin = 'anonymous';
        await new Promise<void>((resolve) => {
          addonImg!.onload = () => {
            // Kometa scales addon images to match badge height (with some padding)
            const targetHeight = (element.height || 80) - backPadding * 2;
            const aspectRatio = addonImg!.width / addonImg!.height;
            addonHeight = targetHeight;
            addonWidth = targetHeight * aspectRatio;
            resolve();
          };
          addonImg!.onerror = () => {
            // Continue without logo if failed
            resolve();
          };
          addonImg!.src = element.addonImage!;
        });
      } catch {
        // Continue without addon image
      }
    }

    // Calculate content width (logo + spacing + text)
    const contentWidth = addonWidth > 0 ? addonWidth + addonOffset + textWidth : textWidth;

    // Use element's fixed width/height if provided (Kometa's back_width/back_height)
    // Otherwise calculate from content size + padding
    const badgeWidth = element.width || Math.ceil(contentWidth + backPadding * 2);
    const badgeHeight =
      element.height || Math.ceil(Math.max(textHeight, addonHeight) + backPadding * 2);

    // Kometa's drawing logic:
    // 1. Draw background rectangle (rounded if back_radius is set)
    ctx.fillStyle = element.backgroundColor || '#00000099'; // Kometa default
    ctx.beginPath();

    if (borderRadius > 0) {
      // Kometa: drawing.rounded_rectangle(cords, fill=back_color, radius=back_radius)
      ctx.roundRect(element.x, element.y, badgeWidth, badgeHeight, borderRadius);
    } else {
      // Kometa: drawing.rectangle(cords, fill=back_color)
      ctx.rect(element.x, element.y, badgeWidth, badgeHeight);
    }
    ctx.fill();

    // 2. Draw addon image (logo) if present - Kometa's addon_position="left"
    let textStartX = element.x + backPadding;

    if (addonImg && addonWidth > 0) {
      const logoX = element.x + backPadding;
      const logoY = element.y + (badgeHeight - addonHeight) / 2;
      ctx.drawImage(addonImg, logoX, logoY, addonWidth, addonHeight);
      textStartX = logoX + addonWidth + addonOffset;
    } else {
      // No logo - center text horizontally
      textStartX = element.x + (badgeWidth - textWidth) / 2;
    }

    // 3. Draw text with Kometa's positioning
    // Kometa: drawing.text((main_x, main_y), text, font=font, fill=font_color, anchor="lt")
    // anchor="lt" means the coordinates refer to left-top of the text
    const textY = element.y + (badgeHeight - textHeight) / 2;

    ctx.fillStyle = element.fontColor || '#FFFFFF'; // Kometa default
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(textContent, textStartX, textY);
  };

  const renderRibbonElement = (ctx: CanvasRenderingContext2D, element: OverlayElement) => {
    const textContent = element.text || element.content;
    if (!textContent) return;
    if (!element.x || !element.y) return;

    const fontSize = element.fontSize || 18;
    const ribbonHeight = element.height || 40;
    const ribbonWidth = element.width || width;

    // Draw ribbon background
    ctx.fillStyle = element.backgroundColor || 'rgba(255, 193, 7, 0.9)';
    ctx.fillRect(element.x, element.y, ribbonWidth, ribbonHeight);

    // Draw text
    ctx.font = `bold ${fontSize}px ${element.fontFamily || 'system-ui'}`;
    ctx.fillStyle = element.fontColor || element.color || '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(textContent, element.x + ribbonWidth / 2, element.y + ribbonHeight / 2);
  };

  const renderImageElement = async (ctx: CanvasRenderingContext2D, element: OverlayElement) => {
    const imageUrl = element.imageUrl || element.content;
    if (!imageUrl) return;
    if (element.x === undefined || element.y === undefined) return;

    const elementX = element.x;
    const elementY = element.y;
    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve) => {
      img.onload = () => {
        const w = element.width || img.width;
        const h = element.height || img.height;
        ctx.drawImage(img, elementX, elementY, w, h);
        resolve();
      };
      img.onerror = () => {
        // If image fails to load, show a placeholder
        ctx.fillStyle = '#333';
        ctx.fillRect(elementX, elementY, element.width || 200, element.height || 100);
        ctx.fillStyle = '#999';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          imageUrl.split('/').pop() || 'Image',
          elementX + (element.width || 200) / 2,
          elementY + (element.height || 100) / 2
        );
        resolve();
      };
      img.src = imageUrl;
    });
  };

  return (
    <div className={styles.container}>
      {loading && <div className={styles.loading}>Loading preview...</div>}
      {error && <div className={styles.error}>Error: {error}</div>}
      <canvas ref={canvasRef} width={width} height={height} className={styles.canvas} />
    </div>
  );
}
