import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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

// Bounding box for hit detection
interface ElementBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PosterPreviewProps {
  posterUrl: string | null;
  overlayElements?: OverlayElement[];
  width?: number;
  height?: number;
  // Drag & drop support - supports both single and multi-selection
  selectedElementIndex?: number | null; // Legacy single selection
  selectedElementIndices?: number[]; // Multi-selection
  onElementSelect?: (index: number | null) => void;
  onElementsSelect?: (indices: number[]) => void;
  onElementMove?: (index: number, x: number, y: number) => void;
  onElementsMove?: (indices: number[], deltaX: number, deltaY: number) => void;
  interactive?: boolean;
}

// Kometa's canvas size for movies (portrait)
const KOMETA_CANVAS_WIDTH = 1000;
const KOMETA_CANVAS_HEIGHT = 1500;

export function PosterPreview({
  posterUrl,
  overlayElements = [],
  width = 500,
  height = 750,
  selectedElementIndex = null,
  selectedElementIndices = [],
  onElementSelect,
  onElementsSelect,
  onElementMove,
  onElementsMove,
  interactive = false,
}: PosterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    mouseX: number;
    mouseY: number;
    elementPositions: { index: number; x: number; y: number }[];
  } | null>(null);
  const elementBoundsRef = useRef<ElementBounds[]>([]);

  // Compute effective selected indices (prefer multi-selection over single)
  const effectiveSelectedIndices = useMemo(
    () =>
      selectedElementIndices.length > 0
        ? selectedElementIndices
        : selectedElementIndex !== null
          ? [selectedElementIndex]
          : [],
    [selectedElementIndices, selectedElementIndex]
  );

  // Scale factor for converting between display and Kometa coordinates
  const scaleFactor = width / KOMETA_CANVAS_WIDTH;

  // Re-render preview when relevant props change
  useEffect(() => {
    renderPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- renderPreview is defined later but stable; deps are the actual triggers
  }, [
    posterUrl,
    overlayElements,
    selectedElementIndex,
    selectedElementIndices,
    effectiveSelectedIndices,
  ]);

  // Convert position-based coordinates to absolute x/y
  // Kometa uses 1000x1500 coordinate system for movies (portrait)
  // We render on that coordinate system and scale when displaying
  const calculateAbsolutePosition = (element: OverlayElement): { x: number; y: number } => {
    // If element already has x/y, use those
    if (element.x !== undefined && element.y !== undefined) {
      return { x: element.x, y: element.y };
    }

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

      // Track element bounds for hit detection
      const bounds: ElementBounds[] = [];

      // Draw overlay elements
      for (let i = 0; i < overlayElements.length; i++) {
        const element = overlayElements[i];
        ctx.save();

        // Calculate absolute position
        const pos = calculateAbsolutePosition(element);

        // Calculate element bounds for hit detection
        const elementWidth = element.width || getDefaultWidth(element);
        const elementHeight = element.height || getDefaultHeight(element);
        bounds.push({
          x: pos.x,
          y: pos.y,
          width: elementWidth,
          height: elementHeight,
        });

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

      // Draw selection highlight around selected elements (supports multi-selection)
      if (interactive && effectiveSelectedIndices.length > 0) {
        const isMultiSelect = effectiveSelectedIndices.length > 1;

        for (const selectedIdx of effectiveSelectedIndices) {
          if (selectedIdx >= bounds.length) continue;

          const selectedBounds = bounds[selectedIdx];
          ctx.strokeStyle = isMultiSelect ? '#ff9800' : '#4dabf7'; // Orange for multi, blue for single
          ctx.lineWidth = 4;
          ctx.setLineDash([8, 4]);
          ctx.strokeRect(
            selectedBounds.x - 4,
            selectedBounds.y - 4,
            selectedBounds.width + 8,
            selectedBounds.height + 8
          );
          ctx.setLineDash([]);

          // Draw corner handles for resizing (visual only for now)
          const handleSize = 12;
          ctx.fillStyle = isMultiSelect ? '#ff9800' : '#4dabf7';
          // Top-left
          ctx.fillRect(
            selectedBounds.x - handleSize / 2 - 4,
            selectedBounds.y - handleSize / 2 - 4,
            handleSize,
            handleSize
          );
          // Top-right
          ctx.fillRect(
            selectedBounds.x + selectedBounds.width - handleSize / 2 + 4,
            selectedBounds.y - handleSize / 2 - 4,
            handleSize,
            handleSize
          );
          // Bottom-left
          ctx.fillRect(
            selectedBounds.x - handleSize / 2 - 4,
            selectedBounds.y + selectedBounds.height - handleSize / 2 + 4,
            handleSize,
            handleSize
          );
          // Bottom-right
          ctx.fillRect(
            selectedBounds.x + selectedBounds.width - handleSize / 2 + 4,
            selectedBounds.y + selectedBounds.height - handleSize / 2 + 4,
            handleSize,
            handleSize
          );
        }
      }

      // Store bounds for hit detection
      elementBoundsRef.current = bounds;

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

  // Helper functions for default element dimensions
  const getDefaultWidth = (element: OverlayElement): number => {
    switch (element.type) {
      case 'text':
        return (element.fontSize || 24) * ((element.text || element.content || '').length * 0.6);
      case 'badge':
        return 200;
      case 'ribbon':
        return KOMETA_CANVAS_WIDTH;
      case 'image':
        return 200;
      default:
        return 100;
    }
  };

  const getDefaultHeight = (element: OverlayElement): number => {
    switch (element.type) {
      case 'text':
        return (element.fontSize || 24) * 1.5;
      case 'badge':
        return 80;
      case 'ribbon':
        return 60;
      case 'image':
        return 100;
      default:
        return 50;
    }
  };

  // Convert screen coordinates to Kometa canvas coordinates
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };

      const rect = canvas.getBoundingClientRect();
      const x = (screenX - rect.left) / scaleFactor;
      const y = (screenY - rect.top) / scaleFactor;
      return { x, y };
    },
    [scaleFactor]
  );

  // Hit test to find element at position
  const hitTest = useCallback((canvasX: number, canvasY: number): number | null => {
    // Check elements in reverse order (top-most first)
    for (let i = elementBoundsRef.current.length - 1; i >= 0; i--) {
      const bounds = elementBoundsRef.current[i];
      if (
        canvasX >= bounds.x &&
        canvasX <= bounds.x + bounds.width &&
        canvasY >= bounds.y &&
        canvasY <= bounds.y + bounds.height
      ) {
        return i;
      }
    }
    return null;
  }, []);

  // Mouse event handlers for drag & drop with multi-selection support
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive) return;

      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const hitIndex = hitTest(x, y);
      const isShiftKey = e.shiftKey;
      const isCtrlKey = e.ctrlKey || e.metaKey; // Support Cmd on Mac

      if (hitIndex !== null) {
        // Handle multi-selection with Shift or Ctrl/Cmd
        if (onElementsSelect && (isShiftKey || isCtrlKey)) {
          const currentSelection = [...effectiveSelectedIndices];

          if (isCtrlKey) {
            // Toggle selection
            const existingIdx = currentSelection.indexOf(hitIndex);
            if (existingIdx >= 0) {
              currentSelection.splice(existingIdx, 1);
            } else {
              currentSelection.push(hitIndex);
            }
            onElementsSelect(currentSelection);
          } else if (isShiftKey && currentSelection.length > 0) {
            // Range selection
            const lastSelected = currentSelection[currentSelection.length - 1];
            const start = Math.min(lastSelected, hitIndex);
            const end = Math.max(lastSelected, hitIndex);
            const rangeSelection = new Set(currentSelection);
            for (let i = start; i <= end; i++) {
              rangeSelection.add(i);
            }
            onElementsSelect(Array.from(rangeSelection));
          }
        } else {
          // Single selection (clear multi-selection)
          onElementSelect?.(hitIndex);
          onElementsSelect?.([hitIndex]);
        }

        // Start dragging - capture all selected elements' positions
        const indicesToDrag = effectiveSelectedIndices.includes(hitIndex)
          ? effectiveSelectedIndices
          : [hitIndex];

        const elementPositions = indicesToDrag.map((idx) => {
          const element = overlayElements[idx];
          const pos = calculateAbsolutePosition(element);
          return { index: idx, x: pos.x, y: pos.y };
        });

        dragStartRef.current = {
          mouseX: x,
          mouseY: y,
          elementPositions,
        };
        setIsDragging(true);
      } else {
        // Clicked on empty space - deselect all
        onElementSelect?.(null);
        onElementsSelect?.([]);
      }
    },
    [
      interactive,
      screenToCanvas,
      hitTest,
      onElementSelect,
      onElementsSelect,
      overlayElements,
      effectiveSelectedIndices,
    ]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!interactive || !isDragging || !dragStartRef.current) return;

      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const deltaX = x - dragStartRef.current.mouseX;
      const deltaY = y - dragStartRef.current.mouseY;

      // Move all selected elements together
      if (onElementsMove && dragStartRef.current.elementPositions.length > 1) {
        // Multi-element move
        onElementsMove(
          dragStartRef.current.elementPositions.map((p) => p.index),
          Math.round(deltaX),
          Math.round(deltaY)
        );
      } else if (onElementMove && dragStartRef.current.elementPositions.length === 1) {
        // Single element move
        const { index, x: startX, y: startY } = dragStartRef.current.elementPositions[0];
        const newX = Math.max(0, Math.min(KOMETA_CANVAS_WIDTH - 50, startX + deltaX));
        const newY = Math.max(0, Math.min(KOMETA_CANVAS_HEIGHT - 50, startY + deltaY));
        onElementMove(index, Math.round(newX), Math.round(newY));
      }
    },
    [interactive, isDragging, screenToCanvas, onElementMove, onElementsMove]
  );

  const handleMouseUp = useCallback(() => {
    if (!interactive) return;
    setIsDragging(false);
    dragStartRef.current = null;
  }, [interactive]);

  const handleMouseLeave = useCallback(() => {
    if (!interactive) return;
    setIsDragging(false);
    dragStartRef.current = null;
  }, [interactive]);

  // Determine cursor style
  const getCursorStyle = (): string => {
    if (!interactive) return 'default';
    if (isDragging) return 'grabbing';
    return 'crosshair';
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
        style={{ cursor: getCursorStyle() }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
