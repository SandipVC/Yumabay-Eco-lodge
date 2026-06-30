/**
 * InlineTextEditor — the floating UI for in-context editing.
 *
 * Rendered once (in App), visible only when edit mode is on. Provides:
 *   - a bottom toolbar: unsaved count, Save changes, Exit
 *   - a popover (opened by clicking any <EditMark>) with EN + ES inputs for
 *     each field path, updating the live draft as you type.
 */
import { useEditMode } from '../../context/EditModeContext.jsx';

export default function InlineTextEditor() {
  const em = useEditMode();
  if (!em || !em.editing) return null;

  const {
    editor, closeEditor, getValue, setValue,
    save, saving, saved, dirtyCount, error, exitEdit,
  } = em;

  return (
    <>
      <div className="yb-edit-toolbar">
        <span className="yb-edit-dot" />
        <strong>Editing site text</strong>
        <span className="yb-edit-hint">Click any highlighted text</span>
        <span className="yb-edit-spacer" />
        {error && <span className="yb-edit-err">{error}</span>}
        <span className="yb-edit-count">{dirtyCount} unsaved</span>
        <button className="yb-edit-btn yb-edit-btn-gold" disabled={!dirtyCount || saving} onClick={save}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save changes'}
        </button>
        <button className="yb-edit-btn" onClick={exitEdit}>Exit</button>
      </div>

      {editor && (
        <div
          className="yb-edit-pop-wrap"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeEditor(); }}
        >
          <div className="yb-edit-pop">
            <div className="yb-edit-pop-head">
              <span>{editor.label}</span>
              <button className="yb-edit-x" onClick={closeEditor} aria-label="Close">✕</button>
            </div>

            <div className="yb-edit-pop-body">
              {editor.paths.map((p) => (
                <div className="yb-edit-field" key={p}>
                  <label className="yb-edit-path">{p}</label>
                  <div className="yb-edit-langs">
                    <div className="yb-edit-lang">
                      <span className="yb-edit-flag">EN</span>
                      <textarea
                        className="yb-edit-input"
                        rows={2}
                        value={getValue('en', p) ?? ''}
                        onChange={(e) => setValue('en', p, e.target.value)}
                      />
                    </div>
                    <div className="yb-edit-lang">
                      <span className="yb-edit-flag">ES</span>
                      <textarea
                        className="yb-edit-input"
                        rows={2}
                        value={getValue('es', p) ?? ''}
                        onChange={(e) => setValue('es', p, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="yb-edit-pop-foot">
              <button className="yb-edit-btn" onClick={closeEditor}>Close</button>
              <button className="yb-edit-btn yb-edit-btn-gold" disabled={!dirtyCount || saving} onClick={save}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
