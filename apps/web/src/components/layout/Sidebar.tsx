import { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { configApi } from '../../api/client';

export function Sidebar() {
  const location = useLocation();
  const { configId } = useParams();
  const [configs, setConfigs] = useState<any[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    configs: true,
  });

  useEffect(() => {
    loadConfigs();
  }, [location.pathname]);

  const loadConfigs = async () => {
    try {
      const { configs: configList } = await configApi.list();
      setConfigs(configList);
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (path: string) => location.pathname === path;
  const isConfigActive = (id: string) => configId === id;

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.title}>Kometa Studio</h1>
      </div>

      <nav className={styles.nav}>
        <Link to="/" className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}>
          Home
        </Link>

        <div className={styles.section}>
          <button
            className={styles.sectionHeader}
            onClick={() => toggleSection('configs')}
          >
            <span className={styles.arrow}>{expandedSections.configs ? '▼' : '▶'}</span>
            Configurations
          </button>
          {expandedSections.configs && (
            <div className={styles.sectionContent}>
              {configs.map(config => (
                <Link
                  key={config.id}
                  to={`/config/${config.id}`}
                  className={`${styles.navSubItem} ${isConfigActive(config.id) ? styles.active : ''}`}
                >
                  {config.name}
                </Link>
              ))}
              {configs.length === 0 && (
                <div className={styles.emptyMessage}>No configurations yet</div>
              )}
            </div>
          )}
        </div>

        <Link
          to="/profiles"
          className={`${styles.navItem} ${isActive('/profiles') ? styles.active : ''}`}
        >
          Profiles
        </Link>

        <Link
          to="/overlay-builder"
          className={`${styles.navItem} ${isActive('/overlay-builder') ? styles.active : ''}`}
        >
          Overlay Builder
        </Link>

        <Link
          to="/import-export"
          className={`${styles.navItem} ${isActive('/import-export') ? styles.active : ''}`}
        >
          Import / Export
        </Link>
      </nav>

      <div className={styles.footer}>
        <div className={styles.disclaimer}>
          Unofficial project
        </div>
      </div>
    </div>
  );
}
