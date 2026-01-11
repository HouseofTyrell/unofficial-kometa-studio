import styles from './IntegrationsEditor.module.css';

interface IntegrationsEditorProps {
  config: any;
  onChange: (updates: any) => void;
}

export function IntegrationsEditor({ config, onChange }: IntegrationsEditorProps) {
  const handleToggle = (integration: string, enabled: boolean) => {
    onChange({
      [integration]: {
        ...config[integration],
        enabled,
      },
    });
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Integrations</h2>
      <p className={styles.description}>
        Enable or disable integrations. Configure secrets in Profiles.
      </p>

      <div className={styles.integrationList}>
        <div className={styles.integration}>
          <div className={styles.integrationHeader}>
            <div>
              <div className={styles.integrationName}>Plex</div>
              <div className={styles.integrationDescription}>
                Required for Kometa to connect to your Plex server
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={config.plex?.enabled !== false}
                onChange={(e) => handleToggle('plex', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        <div className={styles.integration}>
          <div className={styles.integrationHeader}>
            <div>
              <div className={styles.integrationName}>TMDB</div>
              <div className={styles.integrationDescription}>
                The Movie Database - metadata and images
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={config.tmdb?.enabled !== false}
                onChange={(e) => handleToggle('tmdb', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        <div className={styles.integration}>
          <div className={styles.integrationHeader}>
            <div>
              <div className={styles.integrationName}>Tautulli</div>
              <div className={styles.integrationDescription}>
                Plex analytics and statistics
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={config.tautulli?.enabled === true}
                onChange={(e) => handleToggle('tautulli', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        <div className={styles.integration}>
          <div className={styles.integrationHeader}>
            <div>
              <div className={styles.integrationName}>MDBList</div>
              <div className={styles.integrationDescription}>
                Movie and TV show lists and ratings
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={config.mdblist?.enabled === true}
                onChange={(e) => handleToggle('mdblist', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        <div className={styles.integration}>
          <div className={styles.integrationHeader}>
            <div>
              <div className={styles.integrationName}>Radarr</div>
              <div className={styles.integrationDescription}>
                Movie collection manager
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={config.radarr?.enabled === true}
                onChange={(e) => handleToggle('radarr', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        <div className={styles.integration}>
          <div className={styles.integrationHeader}>
            <div>
              <div className={styles.integrationName}>Sonarr</div>
              <div className={styles.integrationDescription}>
                TV show collection manager
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={config.sonarr?.enabled === true}
                onChange={(e) => handleToggle('sonarr', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>

        <div className={styles.integration}>
          <div className={styles.integrationHeader}>
            <div>
              <div className={styles.integrationName}>Trakt</div>
              <div className={styles.integrationDescription}>
                Track your watching history and lists
              </div>
            </div>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={config.trakt?.enabled === true}
                onChange={(e) => handleToggle('trakt', e.target.checked)}
              />
              <span className={styles.toggleSlider}></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
