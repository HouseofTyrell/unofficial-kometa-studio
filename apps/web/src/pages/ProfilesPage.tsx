import { useState, useEffect } from 'react';
import styles from './ProfilesPage.module.css';
import { profileApi, proxyApi } from '../api/client';
import { ConfirmDialog } from '../components/shared/ConfirmDialog';
import type { MaskedProfile, ProfileSecrets } from '@kometa-studio/shared';

// Valid service names for secrets
type ServiceName = 'plex' | 'tmdb' | 'tautulli' | 'mdblist' | 'radarr' | 'sonarr' | 'trakt';

// Form data for creating/editing profiles
interface ProfileFormData {
  name: string;
  description?: string;
  secrets: ProfileSecrets;
}

// Helper to safely access nested secret values
function getNestedSecretValue(
  secrets: ProfileSecrets | undefined,
  service: ServiceName,
  field: string
): string | undefined {
  if (!secrets) return undefined;
  const serviceSecrets = secrets[service];
  if (!serviceSecrets || typeof serviceSecrets !== 'object') return undefined;
  return (serviceSecrets as Record<string, string | undefined>)[field];
}

export function ProfilesPage() {
  const [profiles, setProfiles] = useState<MaskedProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<MaskedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData>({
    name: '',
    description: '',
    secrets: {},
  });
  const [unmaskedSecrets, setUnmaskedSecrets] = useState<ProfileSecrets>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [showSecrets, setShowSecrets] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; profileId: string | null }>(
    { isOpen: false, profileId: null }
  );

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
      const mergedSecrets: ProfileSecrets = { ...formData.secrets };

      // Override with unmasked values where available
      const services: ServiceName[] = [
        'plex',
        'tmdb',
        'tautulli',
        'mdblist',
        'radarr',
        'sonarr',
        'trakt',
      ];
      for (const service of services) {
        const unmasked = unmaskedSecrets[service];
        if (unmasked) {
          mergedSecrets[service] = {
            ...mergedSecrets[service],
            ...unmasked,
          } as ProfileSecrets[typeof service];
        }
      }

      const dataToSave = {
        ...formData,
        secrets: mergedSecrets,
      };

      if (selectedProfile?.id) {
        await profileApi.update(selectedProfile.id, dataToSave);
        setNotification({ message: 'Profile updated successfully', type: 'success' });
      } else if (!selectedProfile) {
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

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ isOpen: true, profileId: id });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteConfirm.profileId;
    if (!id) return;

    setDeleteConfirm({ isOpen: false, profileId: null });
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

  const handleDeleteCancel = () => {
    setDeleteConfirm({ isOpen: false, profileId: null });
  };

  const handleSecretChange = (service: ServiceName, field: string, value: string) => {
    setFormData({
      ...formData,
      secrets: {
        ...formData.secrets,
        [service]: {
          ...formData.secrets?.[service],
          [field]: value || undefined,
        } as ProfileSecrets[typeof service],
      },
    });

    // Track unmasked values separately
    setUnmaskedSecrets({
      ...unmaskedSecrets,
      [service]: {
        ...unmaskedSecrets?.[service],
        [field]: value || undefined,
      } as ProfileSecrets[typeof service],
    });
  };

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  // Get the value to display (unmasked if available, otherwise masked from formData)
  const getSecretValue = (service: ServiceName, field: string): string => {
    return (
      getNestedSecretValue(unmaskedSecrets, service, field) ||
      getNestedSecretValue(formData.secrets, service, field) ||
      ''
    );
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

  const testConnection = async (service: ServiceName) => {
    setTesting({ ...testing, [service]: true });

    try {
      // Use unmasked secrets if available, fallback to formData
      const secrets = unmaskedSecrets?.[service] || formData.secrets?.[service];
      if (!secrets) {
        showNotification(`No ${service} credentials configured`, 'error');
        return;
      }

      // Use proxy API to test connection (keeps secrets on backend)
      const result = await proxyApi.testConnection(service, secrets);

      if (result.success) {
        const message = result.version
          ? `${result.message} Version: ${result.version}`
          : result.message || `${service} connection successful!`;
        showNotification(message, 'success');
      } else {
        showNotification(result.error || `${service} connection failed`, 'error');
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
          {profiles
            .filter((p) => p.id)
            .map((profile) => (
              <div
                key={profile.id}
                className={`${styles.profileItem} ${selectedProfile?.id === profile.id ? styles.active : ''}`}
                onClick={() => profile.id && loadProfile(profile.id)}
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
              {selectedProfile?.id &&
                (() => {
                  const profileId = selectedProfile.id;
                  return (
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(profileId)}
                      className={styles.deleteButton}
                    >
                      Delete Profile
                    </button>
                  );
                })()}
            </div>
          </form>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Profile"
        message={`Are you sure you want to delete the profile "${selectedProfile?.name || 'this profile'}"?`}
        warning="This will permanently delete the profile and all its stored secrets. This action cannot be undone."
        confirmText="Delete Profile"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
