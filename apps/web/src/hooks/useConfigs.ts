/**
 * Custom hook for config and overlay file management
 *
 * Handles loading configs, overlay files, and overlay assets.
 */

import { useState, useEffect, useCallback } from 'react';
import { configApi } from '../api/client';

export interface Config {
  id: string;
  name: string;
}

export interface OverlayFile {
  libraryName: string;
  file: {
    default?: string;
    template_variables?: Record<string, unknown>;
    [key: string]: unknown;
  };
  index: number;
  overlayType?: string;
  overlayPath?: string;
  level?: string;
  customFilePath?: string;
}

export interface UseConfigsResult {
  configs: Config[];
  selectedConfig: string;
  setSelectedConfig: (configId: string) => void;
  overlayFiles: OverlayFile[];
  overlayAssets: Record<string, string>;
}

export function useConfigs(): UseConfigsResult {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<string>('');
  const [overlayFiles, setOverlayFiles] = useState<OverlayFile[]>([]);
  const [overlayAssets, setOverlayAssets] = useState<Record<string, string>>({});

  const loadConfigs = useCallback(async () => {
    try {
      const { configs: configList } = await configApi.list();
      setConfigs(configList);

      if (configList.length > 0) {
        setSelectedConfig(configList[0].id);
      }
    } catch (error) {
      console.error('Failed to load configs:', error);
    }
  }, []);

  const loadOverlayFiles = useCallback(async () => {
    if (!selectedConfig) return;

    try {
      const { overlayFiles: files } = await configApi.getOverlayFiles(selectedConfig);
      setOverlayFiles(files);

      const { assets } = await configApi.getOverlayAssets(selectedConfig);
      setOverlayAssets(assets);
    } catch (error) {
      console.error('Failed to load overlay files:', error);
    }
  }, [selectedConfig]);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  useEffect(() => {
    if (selectedConfig) {
      loadOverlayFiles();
    }
  }, [selectedConfig, loadOverlayFiles]);

  return {
    configs,
    selectedConfig,
    setSelectedConfig,
    overlayFiles,
    overlayAssets,
  };
}
