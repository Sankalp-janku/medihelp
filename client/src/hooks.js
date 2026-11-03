import { useCallback, useEffect, useRef, useState } from 'react';

/** Loads data from an async function with loading and error state. */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const latest = useRef(0); // ignores responses from outdated requests
  const run = useCallback(async () => {
    const id = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try { const data = await fn(); if (id === latest.current) setState({ data, loading: false, error: null }); }
    catch (error) { if (id === latest.current) setState({ data: null, loading: false, error }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { run(); }, [run]);
  return { ...state, reload: run };
}

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('disha_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('disha_theme', theme); }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

/** Loads a blob (image or PDF) from the API and exposes it as a temporary object URL. */
export function useBlobUrl(loader, deps = []) {
  const [state, setState] = useState({ url: null, loading: true, error: null });
  useEffect(() => {
    let revoked = false, objectUrl = null;
    setState({ url: null, loading: true, error: null });
    loader().then((blob) => {
      if (revoked) return;
      objectUrl = URL.createObjectURL(blob);
      setState({ url: objectUrl, loading: false, error: null });
    }).catch((error) => { if (!revoked) setState({ url: null, loading: false, error }); });
    return () => { revoked = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
