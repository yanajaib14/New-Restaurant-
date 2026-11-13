import { useRef, useState } from 'react';

/** Only confirmed writes may dismiss a draft. A ref also guards rapid double clicks. */
export function useDraftSave(onClose: () => void) {
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const close = () => { if (!busy.current) onClose(); };
  const save = async (action: () => boolean | Promise<boolean>) => {
    if (busy.current) return false;
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const ok = await action();
      if (ok !== true) {
        setError('Changes were not saved. Your draft is still here. Please retry.');
        return false;
      }
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please retry.');
      return false;
    } finally {
      busy.current = false;
      setPending(false);
    }
  };
  return { pending, error, setError, save, close };
}

export function DraftSaveError({ error }: { error: string }) {
  return error ? <p role="alert" style={{ color: '#b42318', fontSize: 13 }}>{error}</p> : null;
}
