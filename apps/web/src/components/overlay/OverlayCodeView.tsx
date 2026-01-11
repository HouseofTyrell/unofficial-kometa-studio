import { useState } from 'react';
import { OverlayElement } from './PosterPreview';
import styles from './OverlayCodeView.module.css';

export interface OverlayCodeViewProps {
  elements: OverlayElement[];
  onElementsChange: (elements: OverlayElement[]) => void;
}

export function OverlayCodeView({ elements, onElementsChange }: OverlayCodeViewProps) {
  const [codeError, setCodeError] = useState<string | null>(null);

  // Generate YAML-like representation of overlay config
  const generateCode = (): string => {
    if (elements.length === 0) {
      return '# No overlay elements defined\noverlays: []';
    }

    const lines = ['overlays:'];

    elements.forEach((element, index) => {
      lines.push(`  - # Element ${index + 1}`);
      lines.push(`    type: ${element.type}`);
      lines.push(`    position:`);
      lines.push(`      x: ${element.x}`);
      lines.push(`      y: ${element.y}`);

      if (element.width !== undefined) {
        lines.push(`    width: ${element.width}`);
      }

      if (element.height !== undefined) {
        lines.push(`    height: ${element.height}`);
      }

      if (element.text !== undefined) {
        lines.push(`    text: "${element.text}"`);
      }

      if (element.fontSize !== undefined) {
        lines.push(`    font_size: ${element.fontSize}`);
      }

      if (element.fontFamily !== undefined) {
        lines.push(`    font_family: "${element.fontFamily}"`);
      }

      if (element.color !== undefined) {
        lines.push(`    color: "${element.color}"`);
      }

      if (element.backgroundColor !== undefined) {
        lines.push(`    background_color: "${element.backgroundColor}"`);
      }

      if (element.borderRadius !== undefined) {
        lines.push(`    border_radius: ${element.borderRadius}`);
      }

      if (element.padding !== undefined) {
        lines.push(`    padding: ${element.padding}`);
      }

      if (element.imageUrl !== undefined) {
        lines.push(`    image_url: "${element.imageUrl}"`);
      }

      if (element.rotation !== undefined && element.rotation !== 0) {
        lines.push(`    rotation: ${element.rotation}`);
      }

      if (index < elements.length - 1) {
        lines.push('');
      }
    });

    return lines.join('\n');
  };

  const [code, setCode] = useState(generateCode());

  // Update code when elements change externally
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setCodeError(null);

    // Try to parse the code and update elements
    try {
      // This is a simplified parser - in a real implementation, you'd use a proper YAML parser
      // For now, we'll just keep the code in sync visually
      // TODO: Implement proper YAML parsing if needed
    } catch (error) {
      setCodeError(error instanceof Error ? error.message : 'Invalid format');
    }
  };

  // Regenerate code when elements prop changes
  const currentCode = generateCode();
  if (currentCode !== code && !codeError) {
    setCode(currentCode);
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Overlay Configuration Code</h3>
        <button onClick={handleCopyCode} className={styles.copyButton}>
          Copy
        </button>
      </div>

      {codeError && <div className={styles.error}>Error: {codeError}</div>}

      <textarea
        value={code}
        onChange={(e) => handleCodeChange(e.target.value)}
        className={styles.codeEditor}
        spellCheck={false}
        placeholder="# Overlay configuration will appear here"
      />

      <div className={styles.info}>
        <p>
          This represents your overlay configuration in YAML format. Changes made in
          the visual editor are automatically reflected here.
        </p>
      </div>
    </div>
  );
}
