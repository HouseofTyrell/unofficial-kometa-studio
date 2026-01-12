/**
 * Custom hook for profile management in Overlay Builder
 *
 * Handles profile loading, selection, and TMDB API key validation.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../api/client';

export interface Profile {
  id: string;
  name: string;
}

export interface UseProfilesResult {
  profiles: Profile[];
  selectedProfile: string;
  profileReady: boolean;
  needsApiKey: boolean;
  loading: boolean;
  setSelectedProfile: (profileId: string) => Promise<void>;
  handleApiKeySubmit: () => Promise<boolean>;
}

export function useProfiles(): UseProfilesResult {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfileState] = useState<string>('');
  const [profileReady, setProfileReady] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkProfileForApiKey = useCallback(async (profileId: string) => {
    try {
      const profile = await profileApi.get(profileId);
      const hasTmdbConfig = profile.secrets?.tmdb?.apikey;

      if (hasTmdbConfig) {
        setProfileReady(true);
        setNeedsApiKey(false);
      } else {
        setProfileReady(false);
        setNeedsApiKey(true);
      }
    } catch (error) {
      console.error('Failed to check profile for API key:', error);
      setProfileReady(false);
      setNeedsApiKey(true);
    }
  }, []);

  const loadProfiles = useCallback(async () => {
    try {
      const { profiles: profileList } = await profileApi.list();
      setProfiles(profileList);

      if (profileList.length === 0) {
        navigate('/profiles');
        return;
      }

      // Auto-select first profile
      const firstProfile = profileList[0];
      setSelectedProfileState(firstProfile.id);
      await checkProfileForApiKey(firstProfile.id);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    } finally {
      setLoading(false);
    }
  }, [navigate, checkProfileForApiKey]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const setSelectedProfile = useCallback(
    async (profileId: string) => {
      setSelectedProfileState(profileId);
      await checkProfileForApiKey(profileId);
    },
    [checkProfileForApiKey]
  );

  const handleApiKeySubmit = useCallback(async (): Promise<boolean> => {
    const key = prompt('Enter your TMDB API key:');
    if (!key) return false;

    try {
      const profile = await profileApi.get(selectedProfile);
      const updatedSecrets = {
        ...profile.secrets,
        tmdb: {
          ...profile.secrets?.tmdb,
          apikey: key,
        },
      };

      await profileApi.update(selectedProfile, { secrets: updatedSecrets });
      setProfileReady(true);
      setNeedsApiKey(false);
      return true;
    } catch (error) {
      console.error('Failed to save API key:', error);
      return false;
    }
  }, [selectedProfile]);

  return {
    profiles,
    selectedProfile,
    profileReady,
    needsApiKey,
    loading,
    setSelectedProfile,
    handleApiKeySubmit,
  };
}
