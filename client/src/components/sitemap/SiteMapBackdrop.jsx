/**
 * Static SVG backdrop for the master-plan map (bay, roads, beach, gardens,
 * compass). Shared by the public SiteMap page and the CMS visual editor so the
 * two always line up. Render inside an <svg viewBox="0 0 840 480">.
 *
 * `idPrefix` keeps the gradient id unique when two maps are on one page.
 */
export default function SiteMapBackdrop({ idPrefix = 'sm' }) {
  const backdropUrl = "https://firebasestorage.googleapis.com/v0/b/vessel-contianer.firebasestorage.app/o/assets%2Fsitemap%2FYumabay_Layout.png?alt=media";

  return (
    <image
      href={backdropUrl}
      x="0"
      y="0"
      width="840"
      height="480"
      preserveAspectRatio="none"
    />
  );
}
