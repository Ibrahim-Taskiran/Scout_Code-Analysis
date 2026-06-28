import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AnalysisContext = createContext(null);

export const AnalysisProvider = ({ children }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, currentFile: '', fileIndex: 0, totalFiles: 0 });
  const [analysisConfig, setAnalysisConfig] = useState(null);
  const [error, setError] = useState(null);
  const [completedResults, setCompletedResults] = useState(null);

  // Poll background status on mount
  useEffect(() => {
    if (!window.electronAPI) return;

    // Check initial running status
    window.electronAPI.getAnalysisStatus().then((res) => {
      if (res && res.isAnalyzing) {
        setIsAnalyzing(true);
        if (res.progress) setProgress(res.progress);
        if (res.config) setAnalysisConfig(res.config);
      }
    }).catch(console.error);

    const removeProgress = window.electronAPI.onAnalysisProgress((data) => {
      setIsAnalyzing(true);
      setProgress(data);
    });

    const removeComplete = window.electronAPI.onAnalysisComplete((data) => {
      setIsAnalyzing(false);
      setCompletedResults(data);
    });

    const removeError = window.electronAPI.onAnalysisError((data) => {
      setIsAnalyzing(false);
      setError(data.error);
    });

    return () => {
      removeProgress();
      removeComplete();
      removeError();
    };
  }, []);

  const startAnalysis = useCallback(async (config) => {
    setError(null);
    setCompletedResults(null);
    setIsAnalyzing(true);
    setAnalysisConfig(config);
    setProgress({ percent: 0, currentFile: 'Taranıyor...', fileIndex: 0, totalFiles: 0 });
    try {
      await window.electronAPI.startAnalysis(config);
    } catch (err) {
      setIsAnalyzing(false);
      setError(err.message);
    }
  }, []);

  const cancelAnalysis = useCallback(async () => {
    try {
      await window.electronAPI.cancelAnalysis();
      setIsAnalyzing(false);
      setAnalysisConfig(null);
      setProgress({ percent: 0, currentFile: '', fileIndex: 0, totalFiles: 0 });
    } catch (err) {
      console.error('Failed to cancel analysis:', err);
    }
  }, []);

  const clearCompletedResults = useCallback(() => {
    setCompletedResults(null);
  }, []);

  return (
    <AnalysisContext.Provider
      value={{
        isAnalyzing,
        progress,
        analysisConfig,
        error,
        completedResults,
        startAnalysis,
        cancelAnalysis,
        clearCompletedResults,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysisContext = () => useContext(AnalysisContext);
