/**
 * EditModeContext — drives the in-context (WYSIWYG) text editor.
 *
 * When an admin enables edit mode from the dashboard, every <EditMark> on the
 * public site becomes click-to-edit. Clicking opens a popover with EN + ES
 * inputs for that field; edits live in a `draft` that is layered on top of the
 * CMS overrides + static defaults via deepMerge, so the page updates instantly.
 * Saving PATCHes the full `translations` section (mirrors TextContentSection).
 *
 * Provider order matters: EditModeProvider wraps LanguageProvider so the public
 * `t()` can preview the draft (LanguageContext reads `effective` when editing).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { en as EN } from '../translations/en.js';
import { es as ES } from '../translations/es.js';
import { useAssets, invalidateAssetsCache } from '../hooks/useAssets.js';
import { deepMerge, getByPath, setByPath } from '../utils/textMerge.js';

const EditModeContext = createContext(null);

// sessionStorage mirrors the dashboard's guarded access (private-mode safe).
const ss = {
  get(k) { try { return window.sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { window.sessionStorage.setItem(k, v); } catch { /* noop */ } },
  del(k) { try { window.sessionStorage.removeItem(k); } catch { /* noop */ } },
};

function cloneDeep(v) {
  return v == null ? v : JSON.parse(JSON.stringify(v));
}

export function EditModeProvider({ children }) {
  const { assets, refresh } = useAssets();
  const token = ss.get('yb_admin') || '';

  // Edit mode survives the dashboard → home navigation via sessionStorage.
  const [editing, setEditing] = useState(() => ss.get('yb_edit') === '1' && !!ss.get('yb_admin'));
  const [draft, setDraft]     = useState({ en: {}, es: {} });
  const [touched, setTouched] = useState(() => new Set()); // "lang:path" keys
  const [editor, setEditor]   = useState(null);            // { paths:[], label }
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    document.body.classList.toggle('yb-editing', editing);
    return () => document.body.classList.remove('yb-editing');
  }, [editing]);

  // Effective copy per language = defaults ⊕ CMS overrides ⊕ live draft.
  const effective = useMemo(() => ({
    en: deepMerge(deepMerge(EN, assets?.translations?.en), draft.en),
    es: deepMerge(deepMerge(ES, assets?.translations?.es), draft.es),
  }), [assets, draft]);

  const getValue = useCallback((lang, path) => getByPath(effective[lang], path), [effective]);

  const setValue = useCallback((lang, path, value) => {
    setDraft(d => {
      const next = { ...d, [lang]: cloneDeep(d[lang]) || {} };
      setByPath(next[lang], path, value);
      return next;
    });
    setTouched(s => new Set(s).add(`${lang}:${path}`));
    setSaved(false);
  }, []);

  const enterEdit = useCallback(() => {
    if (!ss.get('yb_admin')) return;
    ss.set('yb_edit', '1');
    setEditing(true);
  }, []);

  const exitEdit = useCallback(() => {
    ss.del('yb_edit');
    setEditing(false);
    setEditor(null);
  }, []);

  const openEditor  = useCallback((paths, label) => setEditor({ paths, label: label || 'Edit text' }), []);
  const closeEditor = useCallback(() => setEditor(null), []);

  const save = useCallback(async () => {
    setSaving(true); setError(null);
    try {
      // PATCH replaces the whole section, so send existing overrides ⊕ draft.
      const next = cloneDeep(assets?.translations) || { en: {}, es: {} };
      next.en = deepMerge(next.en || {}, draft.en);
      next.es = deepMerge(next.es || {}, draft.es);
      const res = await fetch('/api/cms/assets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ section: 'translations', data: next }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Save failed');
      }
      invalidateAssetsCache();
      await refresh?.();
      setDraft({ en: {}, es: {} });
      setTouched(new Set());
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [assets, draft, token, refresh]);

  const value = {
    editing, enterEdit, exitEdit,
    editor, openEditor, closeEditor,
    effective, getValue, setValue,
    dirtyCount: touched.size,
    save, saving, saved, error,
    hasToken: !!token,
  };

  return <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>;
}

export function useEditMode() {
  return useContext(EditModeContext);
}
