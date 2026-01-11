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

  useEffect(() => {
    loadProfiles();
  }, []);

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
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedProfile) {
        await profileApi.update(selectedProfile.id, formData);
        alert('Profile updated successfully');
      } else {
        await profileApi.create(formData);
        alert('Profile created successfully');
        setShowNewForm(false);
      }
      loadProfiles();
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this profile? This cannot be undone.')) return;

    try {
      await profileApi.delete(id);
      setSelectedProfile(null);
      loadProfiles();
    } catch (error) {
      console.error('Failed to delete profile:', error);
      alert('Failed to delete profile');
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
            }}
            className={styles.addButton}
          >
            + New
          </button>
        </div>
        <div className={styles.profileList}>
          {profiles.map(profile => (
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
          <div className={styles.emptyState}>
            Select a profile or create a new one
          </div>
        ) : (
          <form onSubmit={handleSave} className={styles.form}>
            <h1 className={styles.title}>
              {selectedProfile ? formData.name : 'New Profile'}
            </h1>

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
              <h3 className={styles.sectionTitle}>Secrets</h3>

              <div className={styles.secretGroup}>
                <h4 className={styles.groupTitle}>Plex</h4>
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
                    type="password"
                    value={formData.secrets?.plex?.token || ''}
                    onChange={(e) => handleSecretChange('plex', 'token', e.target.value)}
                    className={styles.input}
                    placeholder="Enter token"
                  />
                </div>
              </div>

              <div className={styles.secretGroup}>
                <h4 className={styles.groupTitle}>TMDB</h4>
                <div className={styles.field}>
                  <label className={styles.label}>API Key</label>
                  <input
                    type="password"
                    value={formData.secrets?.tmdb?.apikey || ''}
                    onChange={(e) => handleSecretChange('tmdb', 'apikey', e.target.value)}
                    className={styles.input}
                    placeholder="Enter API key"
                  />
                </div>
              </div>

              <div className={styles.secretGroup}>
                <h4 className={styles.groupTitle}>Radarr</h4>
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
                    type="password"
                    value={formData.secrets?.radarr?.token || ''}
                    onChange={(e) => handleSecretChange('radarr', 'token', e.target.value)}
                    className={styles.input}
                    placeholder="Enter token"
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
