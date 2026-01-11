import { useState, type ReactNode } from 'react';
import styles from './IDELayout.module.css';
import { Sidebar } from './Sidebar';
import { YamlPreviewPanel } from './YamlPreviewPanel';

interface IDELayoutProps {
  children: ReactNode;
}

export function IDELayout({ children }: IDELayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(250);
  const [previewWidth, setPreviewWidth] = useState(400);

  return (
    <div className={styles.layout}>
      <div className={styles.sidebar} style={{ width: sidebarWidth }}>
        <Sidebar />
      </div>
      <div className={styles.resizer} />
      <div className={styles.main}>
        {children}
      </div>
      <div className={styles.resizer} />
      <div className={styles.preview} style={{ width: previewWidth }}>
        <YamlPreviewPanel />
      </div>
    </div>
  );
}
