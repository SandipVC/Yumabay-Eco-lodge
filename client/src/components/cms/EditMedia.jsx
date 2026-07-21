import { useEditMode } from '../../context/EditModeContext.jsx';
import assetsUrls from '../../assetsUrls.json';

// Use an inline SVG fallback if edit-icon.svg is not mapped
const cameraIcon = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>';

export default function EditMedia({ children, section, slot, className = '', style, as: Component = 'div', ...rest }) {
  const em = useEditMode();

  if (!em || !em.editing) {
    return <Component className={className} style={style} {...rest}>{children}</Component>;
  }

  return (
    <Component
      className={`yb-edit-media-wrap ${className}`}
      style={{ position: 'relative', ...style }}
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
        em.openMediaEditor(section, slot);
      }}
      {...rest}
    >
      {children}
      <div className="yb-edit-media-overlay" title="Click to change image">
        <img src={cameraIcon} alt="Edit Image" className="yb-edit-media-icon" />
      </div>
    </Component>
  );
}
