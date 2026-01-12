import { useState, useEffect } from 'react';
import styles from './ProfilesPage.module.css';
import { profileApi } from '../api/client';

export function ProfilesPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    secrets: {},
  });
  const [unmaskedSecrets, setUnmaskedSecrets] = useState<any>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [showSecrets, setShowSecrets] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const { profiles: profileList } = await profileApi.list();
      setProfiles(profileList);
      if (profileList.length > 0 && !selectedProfile) {
        loadProfile(profileList[0].id);
      }
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (id: string) => {
    try {
      const profile = await profileApi.get(id);
      setSelectedProfile(profile);
      setFormData(profile);
      // Clear unmasked secrets when loading a profile
      setUnmaskedSecrets({});
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Merge unmasked secrets into formData before saving
      const dataToSave = {
        ...formData,
        secrets: {
          ...formData.secrets,
        },
      };

      // Override with unmasked values where available
      Object.keys(unmaskedSecrets).forEach((service) => {
        if (unmaskedSecrets[service]) {
          dataToSave.secrets[service] = {
            ...dataToSave.secrets[service],
            ...unmaskedSecrets[service],
          };
        }
      });

      if (selectedProfile) {
        await profileApi.update(selectedProfile.id, dataToSave);
        setNotification({ message: 'Profile updated successfully', type: 'success' });
      } else {
        await profileApi.create(dataToSave);
        setNotification({ message: 'Profile created successfully', type: 'success' });
        setShowNewForm(false);
      }
      loadProfiles();
    } catch (error) {
      console.error('Failed to save profile:', error);
      setNotification({ message: 'Failed to save profile', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    setNotification({ message: 'Deleting profile...', type: 'info' });

    try {
      await profileApi.delete(id);
      setSelectedProfile(null);
      setNotification({ message: 'Profile deleted successfully', type: 'success' });
      loadProfiles();
    } catch (error) {
      console.error('Failed to delete profile:', error);
      setNotification({ message: 'Failed to delete profile', type: 'error' });
    }
  };

  const handleSecretChange = (service: string, field: string, value: string) => {
    setFormData({
      ...formData,
      secrets: {
        ...formData.secrets,
        [service]: {
          ...formData.secrets?.[service],
          [field]: value || undefined,
        },
      },
    });

    // Track unmasked values separately
    setUnmaskedSecrets({
      ...unmaskedSecrets,
      [service]: {
        ...unmaskedSecrets?.[service],
        [field]: value || undefined,
      },
    });
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  // Get the value to display (unmasked if available, otherwise masked from formData)
  const getSecretValue = (service: string, field: string): string => {
    return unmaskedSecrets?.[service]?.[field] || formData.secrets?.[service]?.[field] || '';
  };

  // Check if a value is masked (format: XXXX****YYYY)
  const isMasked = (value: string | undefined): boolean => {
    if (!value) return false;
    return value.includes('****');
  };

  // Check if any secrets in the current profile are masked
  const hasMaskedSecrets = (): boolean => {
    if (!formData.secrets) return false;

    for (const service of Object.values(formData.secrets)) {
      if (service && typeof service === 'object') {
        for (const value of Object.values(service)) {
          if (typeof value === 'string' && isMasked(value)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const testConnection = async (service: string) => {
    setTesting({ ...testing, [service]: true });

    try {
      // Use unmasked secrets if available, fallback to formData
      const secrets = unmaskedSecrets?.[service] || formData.secrets?.[service];
      if (!secrets) {
        showNotification(`No ${service} credentials configured`, 'error');
        return;
      }

      switch (service) {
        case 'tmdb': {
          if (!secrets.apikey) {
            showNotification('TMDB API key is required', 'error');
            return;
          }
          const tmdbResponse = await fetch(
            `https://api.themoviedb.org/3/movie/603?api_key=${secrets.apikey}`
          );
          if (tmdbResponse.ok) {
            showNotification('TMDB connection successful!', 'success');
          } else {
            const error = await tmdbResponse.json();
            showNotification(
              `TMDB connection failed: ${error.status_message || tmdbResponse.statusText}`,
              'error'
            );
          }
          break;
        }

        case 'plex': {
          if (!secrets.url || !secrets.token) {
            showNotification('Plex URL and token are required', 'error');
            return;
          }
          const plexResponse = await fetch(`${secrets.url}/identity`, {
            headers: { 'X-Plex-Token': secrets.token },
          });
          if (plexResponse.ok) {
            showNotification('Plex connection successful!', 'success');
          } else {
            showNotification(`Plex connection failed: ${plexResponse.statusText}`, 'error');
          }
          break;
        }

        case 'radarr':
        case 'sonarr': {
          if (!secrets.url || !secrets.token) {
            showNotification(
              `${service.charAt(0).toUpperCase() + service.slice(1)} URL and token are required`,
              'error'
            );
            return;
          }
          const arrResponse = await fetch(`${secrets.url}/api/v3/system/status`, {
            headers: { 'X-Api-Key': secrets.token },
          });
          if (arrResponse.ok) {
            const data = await arrResponse.json();
            showNotification(
              `${service.charAt(0).toUpperCase() + service.slice(1)} connection successful! Version: ${data.version}`,
              'success'
            );
          } else {
            showNotification(
              `${service.charAt(0).toUpperCase() + service.slice(1)} connection failed: ${arrResponse.statusText}`,
              'error'
            );
          }
          break;
        }

        case 'tautulli': {
          if (!secrets.url || !secrets.apikey) {
            showNotification('Tautulli URL and API key are required', 'error');
            return;
          }
          const tautulliResponse = await fetch(
            `${secrets.url}/api/v2?apikey=${secrets.apikey}&cmd=get_server_info`
          );
          if (tautulliResponse.ok) {
            showNotification('Tautulli connection successful!', 'success');
          } else {
            showNotification(`Tautulli connection failed: ${tautulliResponse.statusText}`, 'error');
          }
          break;
        }

        case 'mdblist':
          if (!secrets.apikey) {
            showNotification('MDBList API key is required', 'error');
            return;
          }
          showNotification('MDBList test not yet implemented - key saved', 'info');
          break;

        case 'trakt':
          if (!secrets.client_id || !secrets.client_secret) {
            showNotification('Trakt client ID and secret are required', 'error');
            return;
          }
          showNotification('Trakt test not yet implemented - credentials saved', 'info');
          break;

        default:
          showNotification('Test not implemented for this service', 'info');
      }
    } catch (error) {
      console.error(`Test ${service} failed:`, error);
      showNotification(`Connection test failed: ${(error as Error).message}`, 'error');
    } finally {
      setTesting({ ...testing, [service]: false });
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading profiles...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2 className={styles.sidebarTitle}>Profiles</h2>
          <button
            onClick={() => {
              setShowNewForm(true);
              setSelectedProfile(null);
              setFormData({ name: '', description: '', secrets: {} });
              setUnmaskedSecrets({});
            }}
            className={styles.addButton}
          >
            + New
          </button>
        </div>
        <div className={styles.profileList}>
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={`${styles.profileItem} ${selectedProfile?.id === profile.id ? styles.active : ''}`}
              onClick={() => loadProfile(profile.id)}
            >
              <div className={styles.profileName}>{profile.name}</div>
              {profile.description && (
                <div className={styles.profileDescription}>{profile.description}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.content}>
        {!selectedProfile && !showNewForm ? (
          <div className={styles.emptyState}>Select a profile or create a new one</div>
        ) : (
          <form onSubmit={handleSave} className={styles.form}>
            {notification && (
              <div className={`${styles.notification} ${styles[notification.type]}`}>
                {notification.message}
                <button
                  type="button"
                  onClick={() => setNotification(null)}
                  className={styles.notificationClose}
                >
                  ×
                </button>
              </div>
            )}

            <h1 className={styles.title}>{selectedProfile ? formData.name : 'New Profile'}</h1>

            {hasMaskedSecrets() && (
              <div
                className={`${styles.notification} ${styles.info}`}
                style={{ marginTop: '16px' }}
              >
                <span>
                  ⚠️ This profile contains masked secrets. To use them, re-enter the actual API
                  keys/tokens in the fields below and save.
                </span>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={styles.input}
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={styles.input}
              />
            </div>

            <div className={styles.secretsSection}>
              <div className={styles.secretsHeader}>
                <h3 className={styles.sectionTitle}>Secrets</h3>
                <div className={styles.toggleContainer}>
                  <span className={styles.toggleLabel}>Show Secrets</span>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={showSecrets}
                      onChange={(e) => setShowSecrets(e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>

              <div className={styles.secretGroup}>
                <div className={styles.groupHeader}>
                  <h4 className={styles.groupTitle}>Plex</h4>
                  <button
                    type="button"
                    onClick={() => testConnection('plex')}
                    disabled={testing.plex}
                    className={styles.testButton}
                  >
                    {testing.plex ? 'Testing...' : 'Test'}
                  </button>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>URL</label>
                  <input
                    type="url"
                    value={formData.secrets?.plex?.url || ''}
                    onChange={(e) => handleSecretChange('plex', 'url', e.target.value)}
                    className={styles.input}
                    placeholder="http://localhost:32400"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Token</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={getSecretValue('plex', 'token')}
                    onChange={(e) => handleSecretChange('plex', 'token', e.target.value)}
                    className={styles.input}
                    placeholder="Enter token"
                  />
                </div>
              </div>

              <div className={styles.secretGroup}>
                <div className={styles.groupHeader}>
                  <h4 className={styles.groupTitle}>TMDB</h4>
                  <button
                    type="button"
                    onClick={() => testConnection('tmdb')}
                    disabled={testing.tmdb}
                    className={styles.testButton}
                  >
                    {testing.tmdb ? 'Testing...' : 'Test'}
                  </button>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>API Key</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={getSecretValue('tmdb', 'apikey')}
                    onChange={(e) => handleSecretChange('tmdb', 'apikey', e.target.value)}
                    className={styles.input}
                    placeholder="Enter API key"
                  />
                </div>
              </div>

              <div className={styles.secretGroup}>
                <div className={styles.groupHeader}>
                  <h4 className={styles.groupTitle}>Tautulli</h4>
                  <button
                    type="button"
                    onClick={() => testConnection('tautulli')}
                    disabled={testing.tautulli}
                    className={styles.testButton}
                  >
                    {testing.tautulli ? 'Testing...' : 'Test'}
                  </button>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>URL</label>
                  <input
                    type="url"
                    value={formData.secrets?.tautulli?.url || ''}
                    onChange={(e) => handleSecretChange('tautulli', 'url', e.target.value)}
                    className={styles.input}
                    placeholder="http://localhost:8181"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>API Key</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={getSecretValue('tautulli', 'apikey')}
                    onChange={(e) => handleSecretChange('tautulli', 'apikey', e.target.value)}
                    className={styles.input}
                    placeholder="Enter API key"
                  />
                </div>
              </div>

              <div className={styles.secretGroup}>
                <div className={styles.groupHeader}>
                  <h4 className={styles.groupTitle}>MDBList</h4>
                  <button
                    type="button"
                    onClick={() => testConnection('mdblist')}
                    disabled={testing.mdblist}
                    className={styles.testButton}
                  >
                    {testing.mdblist ? 'Testing...' : 'Test'}
                  </button>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>API Key</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={getSecretValue('mdblist', 'apikey')}
                    onChange={(e) => handleSecretChange('mdblist', 'apikey', e.target.value)}
                    className={styles.input}
                    placeholder="Enter API key"
                  />
                </div>
              </div>

              <div className={styles.secretGroup}>
                <div className={styles.groupHeader}>
                  <h4 className={styles.groupTitle}>Radarr</h4>
                  <button
                    type="button"
                    onClick={() => testConnection('radarr')}
                    disabled={testing.radarr}
                    className={styles.testButton}
                  >
                    {testing.radarr ? 'Testing...' : 'Test'}
                  </button>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>URL</label>
                  <input
                    type="url"
                    value={formData.secrets?.radarr?.url || ''}
                    onChange={(e) => handleSecretChange('radarr', 'url', e.target.value)}
                    className={styles.input}
                    placeholder="http://localhost:7878"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>API Token</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={getSecretValue('radarr', 'token')}
                    onChange={(e) => handleSecretChange('radarr', 'token', e.target.value)}
                    className={styles.input}
                    placeholder="Enter token"
                  />
                </div>
              </div>

              <div className={styles.secretGroup}>
                <div className={styles.groupHeader}>
                  <h4 className={styles.groupTitle}>Sonarr</h4>
                  <button
                    type="button"
                    onClick={() => testConnection('sonarr')}
                    disabled={testing.sonarr}
                    className={styles.testButton}
                  >
                    {testing.sonarr ? 'Testing...' : 'Test'}
                  </button>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>URL</label>
                  <input
                    type="url"
                    value={formData.secrets?.sonarr?.url || ''}
                    onChange={(e) => handleSecretChange('sonarr', 'url', e.target.value)}
                    className={styles.input}
                    placeholder="http://localhost:8989"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>API Token</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={getSecretValue('sonarr', 'token')}
                    onChange={(e) => handleSecretChange('sonarr', 'token', e.target.value)}
                    className={styles.input}
                    placeholder="Enter token"
                  />
                </div>
              </div>

              <div className={styles.secretGroup}>
                <div className={styles.groupHeader}>
                  <h4 className={styles.groupTitle}>Trakt</h4>
                  <button
                    type="button"
                    onClick={() => testConnection('trakt')}
                    disabled={testing.trakt}
                    className={styles.testButton}
                  >
                    {testing.trakt ? 'Testing...' : 'Test'}
                  </button>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Client ID</label>
                  <input
                    type="text"
                    value={formData.secrets?.trakt?.client_id || ''}
                    onChange={(e) => handleSecretChange('trakt', 'client_id', e.target.value)}
                    className={styles.input}
                    placeholder="Enter client ID"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Client Secret</label>
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={getSecretValue('trakt', 'client_secret')}
                    onChange={(e) => handleSecretChange('trakt', 'client_secret', e.target.value)}
                    className={styles.input}
                    placeholder="Enter client secret"
                  />
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.saveButton}>
                Save Profile
              </button>
              {selectedProfile && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedProfile.id)}
                  className={styles.deleteButton}
                >
                  Delete Profile
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
