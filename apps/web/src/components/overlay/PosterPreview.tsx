import { useEffect, useRef, useState } from 'react';
import styles from './PosterPreview.module.css';

export interface OverlayElement {
  type: 'text' | 'image' | 'badge' | 'ribbon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  padding?: number;
  imageUrl?: string;
  rotation?: number;
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

  const renderPreview = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setLoading(true);
    setError(null);

    try {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw poster image if available
      if (posterUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            ctx.drawImage(img, 0, 0, width, height);
            resolve();
          };
          img.onerror = () => reject(new Error('Failed to load poster image'));
          img.src = posterUrl;
        });
      } else {
        // Draw placeholder
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#666';
        ctx.font = '20px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('No Poster Available', width / 2, height / 2);
      }

      // Draw overlay elements
      for (const element of overlayElements) {
        ctx.save();

        if (element.rotation) {
          const centerX = element.x + (element.width || 0) / 2;
          const centerY = element.y + (element.height || 0) / 2;
          ctx.translate(centerX, centerY);
          ctx.rotate((element.rotation * Math.PI) / 180);
          ctx.translate(-centerX, -centerY);
        }

        switch (element.type) {
          case 'text':
            renderTextElement(ctx, element);
            break;
          case 'badge':
            renderBadgeElement(ctx, element);
            break;
          case 'ribbon':
            renderRibbonElement(ctx, element);
            break;
          case 'image':
            await renderImageElement(ctx, element);
            break;
        }

        ctx.restore();
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to render preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to render preview');
      setLoading(false);
    }
  };

  const renderTextElement = (ctx: CanvasRenderingContext2D, element: OverlayElement) => {
    if (!element.text) return;

    ctx.font = `${element.fontSize || 24}px ${element.fontFamily || 'system-ui'}`;
    ctx.fillStyle = element.color || '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(element.text, element.x, element.y);
  };

  const renderBadgeElement = (ctx: CanvasRenderingContext2D, element: OverlayElement) => {
    if (!element.text) return;

    const padding = element.padding || 8;
    const fontSize = element.fontSize || 20;
    const borderRadius = element.borderRadius || 4;

    ctx.font = `bold ${fontSize}px ${element.fontFamily || 'system-ui'}`;
    const textMetrics = ctx.measureText(element.text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    const badgeWidth = element.width || textWidth + padding * 2;
    const badgeHeight = element.height || textHeight + padding * 2;

    // Draw background with rounded corners
    ctx.fillStyle = element.backgroundColor || 'rgba(0, 0, 0, 0.8)';
    ctx.beginPath();
    ctx.roundRect(element.x, element.y, badgeWidth, badgeHeight, borderRadius);
    ctx.fill();

    // Draw text
    ctx.fillStyle = element.color || '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      element.text,
      element.x + badgeWidth / 2,
      element.y + badgeHeight / 2
    );
  };

  const renderRibbonElement = (ctx: CanvasRenderingContext2D, element: OverlayElement) => {
    if (!element.text) return;

    const fontSize = element.fontSize || 18;
    const ribbonHeight = element.height || 40;
    const ribbonWidth = element.width || width;

    // Draw ribbon background
    ctx.fillStyle = element.backgroundColor || 'rgba(255, 193, 7, 0.9)';
    ctx.fillRect(element.x, element.y, ribbonWidth, ribbonHeight);

    // Draw text
    ctx.font = `bold ${fontSize}px ${element.fontFamily || 'system-ui'}`;
    ctx.fillStyle = element.color || '#000000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(element.text, element.x + ribbonWidth / 2, element.y + ribbonHeight / 2);
  };

  const renderImageElement = async (
    ctx: CanvasRenderingContext2D,
    element: OverlayElement
  ) => {
    if (!element.imageUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        const w = element.width || img.width;
        const h = element.height || img.height;
        ctx.drawImage(img, element.x, element.y, w, h);
        resolve();
      };
      img.onerror = () => reject(new Error('Failed to load overlay image'));
      img.src = element.imageUrl;
    });
  };

  return (
    <div className={styles.container}>
      {loading && <div className={styles.loading}>Loading preview...</div>}
      {error && <div className={styles.error}>Error: {error}</div>}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={styles.canvas}
      />
    </div>
  );
}
