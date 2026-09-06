import { useState, useCallback } from 'react';

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  date?: string;
  body?: string;
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'up-to-date'
  | 'downloading'
  | 'ready'
  | 'error';

export function useAppUpdater() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const isTauriApp = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  const checkForUpdates = useCallback(async (manual = true) => {
    if (!isTauriApp) {
      if (manual) {
        setStatus('error');
        setErrorMessage('Fitur auto-update otomatis hanya aktif pada aplikasi versi Desktop.');
      }
      return;
    }

    try {
      setStatus('checking');
      setErrorMessage('');

      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (update && update.available) {
        setUpdateInfo({
          version: update.version,
          currentVersion: update.currentVersion,
          date: update.date,
          body: update.body,
        });
        setStatus('available');
      } else {
        setStatus('up-to-date');
      }
    } catch (err: any) {
      console.error('Gagal memeriksa pembaruan:', err);
      setStatus('error');
      setErrorMessage(
        err?.message || 'Tidak dapat terhubung ke server pembaruan GitHub Releases.'
      );
    }
  }, [isTauriApp]);

  const installUpdate = useCallback(async () => {
    if (!isTauriApp) return;

    try {
      setStatus('downloading');
      setDownloadProgress(0);

      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();

      if (!update || !update.available) {
        setStatus('up-to-date');
        return;
      }

      let downloaded = 0;
      let contentLength = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setDownloadProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case 'Finished':
            setStatus('ready');
            break;
        }
      });

      setStatus('ready');

      // Restart aplikasi dengan binary yang baru dipasang
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch (err: any) {
      console.error('Gagal mengunduh atau memasang pembaruan:', err);
      setStatus('error');
      setErrorMessage(err?.message || 'Gagal mengunduh atau memasang file pembaruan.');
    }
  }, [isTauriApp]);

  return {
    isTauriApp,
    status,
    updateInfo,
    downloadProgress,
    errorMessage,
    checkForUpdates,
    installUpdate,
  };
}
