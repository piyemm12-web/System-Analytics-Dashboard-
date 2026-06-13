import { useState, useEffect } from 'react';
import { SystemSnapshot, CPUHistoryPoint, ProcessInfo } from '../types';

export function useStats() {
  const [snapshot, setSnapshot] = useState<SystemSnapshot | null>(null);
  const [history, setHistory] = useState<CPUHistoryPoint[]>([]);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BASE_URL = 'http://localhost:8080';

  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        const [resSnap, resHist] = await Promise.all([
          fetch(`${BASE_URL}/api/stats`),
          fetch(`${BASE_URL}/api/cpu-history`)
        ]);
        const snapData = await resSnap.json();
        const histData = await resHist.json();

        setSnapshot(snapData);
        setHistory(histData);
        setError(null);
      } catch (err) {
        setError('Bridge to monitoring kernel dropped.');
      } finally {
        setLoading(false);
      }
    };

    const fetchProcessData = async () => {
      try {
        const resProc = await fetch(`${BASE_URL}/api/processes`);
        const procData = await resProc.json();
        setProcesses(procData);
      } catch (e) {
        console.error('Process resolution interrupted', e);
      }
    };

    fetchBaseData();
    fetchProcessData();

    const snapshotInterval = setInterval(fetchBaseData, 3000);
    const processInterval = setInterval(fetchProcessData, 5000);

    return () => {
      clearInterval(snapshotInterval);
      clearInterval(processInterval);
    };
  }, []);

  return { snapshot, history, processes, loading, error };
}