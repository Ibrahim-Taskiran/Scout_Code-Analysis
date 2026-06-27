import { useState, useCallback } from 'react';

export const useDatabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getProjects = useCallback(async () => {
    if (!window.electronAPI) return [];
    setLoading(true);
    try {
      const projects = await window.electronAPI.getProjects();
      setLoading(false);
      return projects;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, []);

  const getAnalysisResults = useCallback(async (projectId) => {
    if (!window.electronAPI) return null;
    setLoading(true);
    try {
      const res = await window.electronAPI.getAnalysisResults(projectId);
      setLoading(false);
      return res;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return null;
    }
  }, []);

  const deleteProject = useCallback(async (projectId) => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.deleteProject(projectId);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const renameProject = useCallback(async (projectId, name) => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.renameProject(projectId, name);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const getSettings = useCallback(async () => {
    if (!window.electronAPI) return null;
    try {
      return await window.electronAPI.getSettings();
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const saveSettings = useCallback(async (settings) => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.saveSettings(settings);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const getLibraryStats = useCallback(async () => {
    if (!window.electronAPI) return null;
    try {
      return await window.electronAPI.getLibraryStats();
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    getProjects,
    getAnalysisResults,
    deleteProject,
    renameProject,
    getSettings,
    saveSettings,
    getLibraryStats,
  };
};
