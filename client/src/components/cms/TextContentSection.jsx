/**
 * TextContentSection — bilingual (EN/ES) text editor for every translatable
 * string on the public site. Each section saves independently via
 * PATCH /api/cms/assets with section="translations".
 */
import { useEffect, useMemo, useState } from 'react';
import { useAssets, invalidateAssetsCache } from '../../hooks/useAssets.js';
import { en as EN_DEFAULTS } from '../../translations/en.js';
import { es as ES_DEFAULTS } from '../../translations/es.js';
import { TEXT_SECTIONS } from './textSchema.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function cloneDeep(v) {
  if (v == null) return v;
  return JSON.parse(JSON.stringify(v));
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function mergedSectionData(sectionId, lang, cmsTranslations) {
  const defaults = lang === 'es' ? ES_DEFAULTS : EN_DEFAULTS;
  const baseVal  = defaults[sectionId];
  const override = cmsTranslations?.[lang]?.[sectionId];
  if (override === undefined) return cloneDeep(baseVal);
  // arrays / objects: prefer CMS but fall back to defaults shape
  if (Array.isArray(baseVal) && Array.isArray(override)) {
    return baseVal.map((item, i) => {
      if (override[i] === undefined) return cloneDeep(item);
      if (typeof item === 'object' && item !== null && typeof override[i] === 'object') {
        return { ...cloneDeep(item), ...cloneDeep(override[i]) };
      }
      return override[i];
    });
  }
  if (typeof baseVal === 'object' && baseVal !== null && typeof override === 'object') {
    return { ...cloneDeep(baseVal), ...cloneDeep(override) };
  }
  return cloneDeep(override);
}

async function patchTranslations(payload, token) {
  const res = await fetch('/api/cms/assets', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ section: 'translations', data: payload }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Save failed');
  }
  return res.json();
}

// ── per-field renderers ───────────────────────────────────────────────────────

function FieldPair({ label, kindEn, kindEs, valueEn, valueEs, onChangeEn, onChangeEs }) {
  const renderInput = (kind, value, onChange) => {
    if (kind === 'textarea') {
      return (
        <textarea
          className="cms-text-input cms-text-textarea"
          value={value ?? ''}
          rows={3}
          onChange={e => onChange(e.target.value)}
        />
      );
    }
    return (
      <input
        type="text"
        className="cms-text-input"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
      />
    );
  };
  return (
    <div className="cms-text-row">
      <div className="cms-text-label">{label}</div>
      <div className="cms-text-pair">
        <div className="cms-text-lang">
          <span className="cms-lang-tag">EN</span>
          {renderInput(kindEn, valueEn, onChangeEn)}
        </div>
        <div className="cms-text-lang">
          <span className="cms-lang-tag">ES</span>
          {renderInput(kindEs, valueEs, onChangeEs)}
        </div>
      </div>
    </div>
  );
}

function ArrayPair({ label, count, valuesEn, valuesEs, onChangeEn, onChangeEs }) {
  const setEn = (i, v) => {
    const next = [...(valuesEn || [])];
    next[i] = v;
    onChangeEn(next);
  };
  const setEs = (i, v) => {
    const next = [...(valuesEs || [])];
    next[i] = v;
    onChangeEs(next);
  };
  return (
    <div className="cms-text-row">
      <div className="cms-text-label">{label}</div>
      <div className="cms-array-block">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="cms-text-pair">
            <div className="cms-text-lang">
              <span className="cms-lang-tag">EN #{i + 1}</span>
              <input
                type="text"
                className="cms-text-input"
                value={valuesEn?.[i] ?? ''}
                onChange={e => setEn(i, e.target.value)}
              />
            </div>
            <div className="cms-text-lang">
              <span className="cms-lang-tag">ES #{i + 1}</span>
              <input
                type="text"
                className="cms-text-input"
                value={valuesEs?.[i] ?? ''}
                onChange={e => setEs(i, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ListBlock({ field, valuesEn, valuesEs, onChangeEn, onChangeEs }) {
  const setItemEn = (i, key, v) => {
    const next = (valuesEn || []).map((it, idx) =>
      idx === i ? { ...(it || {}), [key]: v } : (it || {}));
    while (next.length < field.count) next.push({});
    onChangeEn(next);
  };
  const setItemEs = (i, key, v) => {
    const next = (valuesEs || []).map((it, idx) =>
      idx === i ? { ...(it || {}), [key]: v } : (it || {}));
    while (next.length < field.count) next.push({});
    onChangeEs(next);
  };
  const setItemArrEn = (i, key, arr) => setItemEn(i, key, arr);
  const setItemArrEs = (i, key, arr) => setItemEs(i, key, arr);

  return (
    <div className="cms-text-row">
      <div className="cms-text-label">{field.label}</div>
      <div className="cms-list-block">
        {Array.from({ length: field.count }).map((_, i) => {
          const itemEn = valuesEn?.[i] || {};
          const itemEs = valuesEs?.[i] || {};
          return (
            <div key={i} className="cms-list-item">
              <div className="cms-list-item-head">
                {typeof field.itemLabel === 'function' ? field.itemLabel(i) : `Item ${i + 1}`}
              </div>
              {field.fields.map(sub => {
                if (sub.kind === 'array') {
                  return (
                    <ArrayPair
                      key={sub.key}
                      label={sub.label}
                      count={sub.count}
                      valuesEn={itemEn[sub.key] || []}
                      valuesEs={itemEs[sub.key] || []}
                      onChangeEn={arr => setItemArrEn(i, sub.key, arr)}
                      onChangeEs={arr => setItemArrEs(i, sub.key, arr)}
                    />
                  );
                }
                return (
                  <FieldPair
                    key={sub.key}
                    label={sub.label}
                    kindEn={sub.kind}
                    kindEs={sub.kind}
                    valueEn={itemEn[sub.key]}
                    valueEs={itemEs[sub.key]}
                    onChangeEn={v => setItemEn(i, sub.key, v)}
                    onChangeEs={v => setItemEs(i, sub.key, v)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── per-section editor ────────────────────────────────────────────────────────

function SectionEditor({ section, cmsTranslations, token, refresh }) {
  const [enData, setEnData] = useState(() => mergedSectionData(section.id, 'en', cmsTranslations));
  const [esData, setEsData] = useState(() => mergedSectionData(section.id, 'es', cmsTranslations));
  const [initial] = useState(() => ({
    en: mergedSectionData(section.id, 'en', cmsTranslations),
    es: mergedSectionData(section.id, 'es', cmsTranslations),
  }));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // If CMS data changes externally (refresh) and we haven't edited, re-sync.
  useEffect(() => {
    const fresh = {
      en: mergedSectionData(section.id, 'en', cmsTranslations),
      es: mergedSectionData(section.id, 'es', cmsTranslations),
    };
    if (deepEqual(enData, initial.en) && deepEqual(esData, initial.es)) {
      setEnData(fresh.en);
      setEsData(fresh.es);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmsTranslations]);

  const dirty = !deepEqual(enData, initial.en) || !deepEqual(esData, initial.es);

  async function handleSave() {
    setSaving(true); setErr(null);
    try {
      const nextTranslations = cloneDeep(cmsTranslations) || { en: {}, es: {} };
      if (!nextTranslations.en) nextTranslations.en = {};
      if (!nextTranslations.es) nextTranslations.es = {};
      nextTranslations.en[section.id] = enData;
      nextTranslations.es[section.id] = esData;
      await patchTranslations(nextTranslations, token);
      invalidateAssetsCache();
      refresh();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
      // Update initial baseline
      initial.en = cloneDeep(enData);
      initial.es = cloneDeep(esData);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setEnData(cloneDeep(initial.en));
    setEsData(cloneDeep(initial.es));
    setErr(null);
  }

  function renderField(field) {
    if (field.kind === 'array') {
      return (
        <ArrayPair
          key={field.key}
          label={field.label}
          count={field.count}
          valuesEn={enData?.[field.key] || []}
          valuesEs={esData?.[field.key] || []}
          onChangeEn={arr => setEnData(d => ({ ...d, [field.key]: arr }))}
          onChangeEs={arr => setEsData(d => ({ ...d, [field.key]: arr }))}
        />
      );
    }
    if (field.kind === 'list') {
      return (
        <ListBlock
          key={field.key}
          field={field}
          valuesEn={enData?.[field.key] || []}
          valuesEs={esData?.[field.key] || []}
          onChangeEn={arr => setEnData(d => ({ ...d, [field.key]: arr }))}
          onChangeEs={arr => setEsData(d => ({ ...d, [field.key]: arr }))}
        />
      );
    }
    return (
      <FieldPair
        key={field.key}
        label={field.label}
        kindEn={field.kind}
        kindEs={field.kind}
        valueEn={enData?.[field.key]}
        valueEs={esData?.[field.key]}
        onChangeEn={v => setEnData(d => ({ ...d, [field.key]: v }))}
        onChangeEs={v => setEsData(d => ({ ...d, [field.key]: v }))}
      />
    );
  }

  // Special-case: strip is a top-level string array, not an object section.
  function renderBody() {
    if (section.isFullArray) {
      const arrEn = Array.isArray(enData) ? enData : [];
      const arrEs = Array.isArray(esData) ? esData : [];
      return (
        <ArrayPair
          label={section.arrayLabel || 'Item'}
          count={section.count}
          valuesEn={arrEn}
          valuesEs={arrEs}
          onChangeEn={arr => setEnData(arr)}
          onChangeEs={arr => setEsData(arr)}
        />
      );
    }
    return (section.fields || []).map(renderField);
  }

  return (
    <div className="cms-section-body">
      <div className="cms-text-status">
        <span className="cms-text-section-title">{section.label}</span>
        {dirty && <span className="cms-text-dirty">● unsaved</span>}
        {savedFlash && <span className="cms-text-saved">✓ saved</span>}
      </div>
      {err && <p className="cms-error">{err}</p>}
      <div className="cms-text-fields">
        {renderBody()}
      </div>
      <div className="cms-text-actions">
        <button
          className="cms-btn-ghost"
          onClick={handleReset}
          disabled={!dirty || saving}
        >
          Reset
        </button>
        <button
          className="cms-btn-gold"
          onClick={handleSave}
          disabled={!dirty || saving}
        >
          {saving ? 'Saving…' : 'Save Section'}
        </button>
      </div>
    </div>
  );
}

// ── main panel ────────────────────────────────────────────────────────────────

export default function TextContentSection({ token }) {
  const { assets, loading, error, refresh } = useAssets();
  const [activeId, setActiveId] = useState(TEXT_SECTIONS[0].id);
  const cmsTranslations = assets?.translations;

  if (loading) return <p className="cms-hint">Loading text content…</p>;
  if (error)   return <p className="cms-error">Could not load: {error}</p>;

  const active = TEXT_SECTIONS.find(s => s.id === activeId) || TEXT_SECTIONS[0];

  return (
    <div className="cms-panel cms-text-panel">
      <p className="cms-hint">
        Edit every text string on the public site. Each section has English (EN) and
        Spanish (ES) inputs side-by-side. Press Enter inside a multi-line field to insert
        a line break. Empty fields fall back to the built-in defaults. Switching sections
        before saving discards unsaved edits.
      </p>

      {/* Horizontal section tabs (matches Media Manager) */}
      <div className="cms-tabs">
        {TEXT_SECTIONS.map(s => (
          <button
            key={s.id}
            className={`cms-tab${activeId === s.id ? ' active' : ''}`}
            onClick={() => setActiveId(s.id)}
          >
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Active section body */}
      <div className="cms-content">
        <SectionEditor
          key={active.id}
          section={active}
          cmsTranslations={cmsTranslations}
          token={token}
          refresh={refresh}
        />
      </div>
    </div>
  );
}
