/**
 * EditMark — wraps a piece of public-site text to make it click-to-edit.
 *
 * Crucially a NO-OP outside edit mode: it returns its children unchanged (zero
 * extra DOM), so the public site renders exactly as before. Only when an admin
 * turns on edit mode does it wrap the children in a highlightable element whose
 * capture-phase click opens the editor popover (and swallows the click so links
 * / buttons don't navigate while editing).
 *
 * Usage patterns:
 *   - Text leaf  → wrap the text INSIDE its element (default <span>):
 *       <p className="x"><EditMark path="hero.tagline">{t.hero.tagline}</EditMark></p>
 *   - Whole block (e.g. an animated <SplitText/>) → wrap the element with as="div":
 *       <EditMark as="div" path={['about.title','about.titleEm']}><SplitText .../></EditMark>
 *
 * `path` is a dotted key path (or array of them) into the translations tree.
 */
import { useEditMode } from '../../context/EditModeContext.jsx';

export default function EditMark({ path, label, as: Tag = 'span', children }) {
  const em = useEditMode();

  // Public site (or no provider): render children verbatim, no wrapper.
  if (!em || !em.editing) return <>{children}</>;

  const paths = Array.isArray(path) ? path : [path];
  const onClickCapture = (e) => {
    e.preventDefault();
    e.stopPropagation();
    em.openEditor(paths, label);
  };

  return (
    <Tag className="yb-em" data-yb-edit={paths.join(',')} onClickCapture={onClickCapture}>
      {children}
    </Tag>
  );
}
