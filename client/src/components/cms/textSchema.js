/**
 * Schema describing every editable text field in the public site.
 * Drives the TextContentSection editor: which inputs to render, single-line
 * vs textarea, array shapes, etc. Mirrors translations/en.js + es.js.
 *
 * IMPORTANT: only list fields that are actually RENDERED somewhere on the site.
 * Fields that exist in en.js/es.js but aren't displayed (e.g. legacy copy,
 * internal sentinels, intentionally-hidden pricing) are deliberately omitted so
 * the CMS never shows an input that has no visible effect. The static
 * translation files still hold those values as fallbacks/internal use.
 *
 * Field kinds:
 *  - 'text'     → single-line input
 *  - 'textarea' → multi-line; preserve \n
 *  - 'array'    → array of strings (fixed count = items.length)
 *  - 'list'     → array of objects (fixed count); subfields described in `fields`
 *
 * Sections render in the order declared here.
 */

export const TEXT_SECTIONS = [
  {
    id: 'nav',
    label: 'Navigation',
    fields: [
      { key: 'about', label: 'About', kind: 'text' },
      { key: 'properties', label: 'Properties', kind: 'text' },
      { key: 'gallery', label: 'Gallery', kind: 'text' },
      { key: 'amenities', label: 'Amenities', kind: 'text' },
      { key: 'location', label: 'Location', kind: 'text' },
      { key: 'siteMap', label: 'Site Map', kind: 'text' },
      { key: 'reserveNow', label: 'Reserve Now button', kind: 'text' },
    ],
  },
  {
    id: 'hero',
    label: 'Hero',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'titleEm', label: 'Title (highlighted word)', kind: 'text' },
      { key: 'tagline', label: 'Tagline', kind: 'text' },
    ],
  },
  {
    id: 'about',
    label: 'About',
    fields: [
      { key: 'label', label: 'Eyebrow label', kind: 'text' },
      { key: 'title', label: 'Title (press Enter for line break)', kind: 'textarea' },
      { key: 'titleEm', label: 'Title (highlighted word)', kind: 'text' },
      { key: 'body', label: 'Body paragraph (blank line = new paragraph)', kind: 'textarea' },
      { key: 'stat1Num', label: 'Stat 1 number', kind: 'text' },
      { key: 'stat1Lbl', label: 'Stat 1 label', kind: 'text' },
      { key: 'stat2Num', label: 'Stat 2 number', kind: 'text' },
      { key: 'stat2Lbl', label: 'Stat 2 label', kind: 'text' },
      { key: 'stat3Num', label: 'Stat 3 number', kind: 'text' },
      { key: 'stat3Lbl', label: 'Stat 3 label', kind: 'text' },
    ],
  },
  {
    id: 'properties',
    label: 'Properties',
    fields: [
      { key: 'label', label: 'Eyebrow label', kind: 'text' },
      { key: 'title', label: 'Title (press Enter for line break)', kind: 'textarea' },
      { key: 'titleEm', label: 'Title (highlighted word)', kind: 'text' },
      { key: 'subtitle', label: 'Subtitle', kind: 'textarea' },
      { key: 'enquire', label: 'Enquire button', kind: 'text' },
      {
        key: 'items', label: 'Property cards', kind: 'list', count: 5,
        itemLabel: (i) => `Card ${i + 1}`,
        fields: [
          { key: 'tag', label: 'Tag', kind: 'text' },
          { key: 'name', label: 'Name', kind: 'text' },
          { key: 'area', label: 'Area / sub-line', kind: 'text' },
          { key: 'feats', label: 'Features', kind: 'array', count: 4 },
        ],
      },
    ],
  },
  {
    id: 'gallery',
    label: 'Gallery',
    fields: [
      { key: 'label', label: 'Eyebrow label', kind: 'text' },
      { key: 'title', label: 'Title (start)', kind: 'text' },
      { key: 'titleEm', label: 'Title (highlighted word)', kind: 'text' },
      { key: 'titleEnd', label: 'Title (end, press Enter for break)', kind: 'textarea' },
      { key: 'filters', label: 'Filter labels (All, Villas, Apartments, Beach Club & Amenities, Boca de Yuma)', kind: 'array', count: 5 },
    ],
  },
  {
    id: 'lounge',
    label: 'Lounge',
    fields: [
      { key: 'title', label: 'Title (press Enter for line break)', kind: 'textarea' },
      { key: 'titleEm', label: 'Title (highlighted word)', kind: 'text' },
      { key: 'body', label: 'Body paragraph', kind: 'textarea' },
      { key: 'bookBtn', label: 'Book a Visit button', kind: 'text' },
    ],
  },
  {
    id: 'amenities',
    label: 'Amenities',
    fields: [
      { key: 'label', label: 'Eyebrow label', kind: 'text' },
      { key: 'title', label: 'Title (press Enter for line break)', kind: 'textarea' },
      {
        key: 'items', label: 'Amenity items', kind: 'list', count: 8,
        itemLabel: (i) => `Amenity ${i + 1}`,
        fields: [
          { key: 'name', label: 'Name', kind: 'text' },
          { key: 'desc', label: 'Description', kind: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'cta',
    label: 'CTA Banner',
    fields: [
      { key: 'title', label: 'Title (press Enter for line break)', kind: 'textarea' },
      { key: 'titleEm', label: 'Title (second line)', kind: 'text' },
      { key: 'visitBtn', label: 'Visit button (accessibility label for the circle)', kind: 'text' },
    ],
  },
  {
    id: 'contact',
    label: 'Contact Form',
    fields: [
      { key: 'label', label: 'Eyebrow label', kind: 'text' },
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'titleEm', label: 'Title (highlighted)', kind: 'text' },
      { key: 'namePlaceholder', label: 'Name placeholder', kind: 'text' },
      { key: 'emailPlaceholder', label: 'Email placeholder', kind: 'text' },
      { key: 'phonePlaceholder', label: 'Phone placeholder', kind: 'text' },
      { key: 'interestLabel', label: 'Interest field label', kind: 'text' },
      { key: 'interestOptions', label: 'Interest options', kind: 'array', count: 6 },
      { key: 'messagePlaceholder', label: 'Message placeholder', kind: 'text' },
      { key: 'submitBtn', label: 'Submit button', kind: 'text' },
      { key: 'sending', label: 'Sending state', kind: 'text' },
      { key: 'successTitle', label: 'Success title', kind: 'text' },
      { key: 'successBody', label: 'Success body', kind: 'textarea' },
      { key: 'errorMsg', label: 'Error message', kind: 'textarea' },
    ],
  },
  {
    id: 'sitemap',
    label: 'Site Map',
    fields: [
      { key: 'label', label: 'Eyebrow label', kind: 'text' },
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'titleEm', label: 'Title (highlighted)', kind: 'text' },
      { key: 'subtitle', label: 'Subtitle', kind: 'textarea' },
      { key: 'available', label: 'Available status', kind: 'text' },
      { key: 'limited', label: 'Limited status', kind: 'text' },
      { key: 'soldOut', label: 'Sold Out status', kind: 'text' },
      { key: 'downloadPlan', label: 'Download Plan button', kind: 'text' },
    ],
  },
  {
    id: 'footer',
    label: 'Footer',
    fields: [
      { key: 'contactCol', label: 'Contact column heading (also used on Contact page)', kind: 'text' },
      { key: 'address', label: 'Address (press Enter for line break)', kind: 'textarea' },
      { key: 'email', label: 'Email', kind: 'text' },
      { key: 'phone', label: 'Phone', kind: 'text' },
      { key: 'copyright', label: 'Copyright line', kind: 'text' },
      { key: 'instagram', label: 'Instagram link label', kind: 'text' },
      { key: 'instagramUrl', label: 'Instagram URL', kind: 'text' },
      { key: 'facebook', label: 'Facebook link label', kind: 'text' },
      { key: 'facebookUrl', label: 'Facebook URL', kind: 'text' },
      { key: 'xLabel', label: 'X link label', kind: 'text' },
      { key: 'xUrl', label: 'X URL', kind: 'text' },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard (admin UI strings)',
    fields: [
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'totalLeads', label: 'Total Leads label', kind: 'text' },
      { key: 'newLeads', label: 'New label', kind: 'text' },
      { key: 'noLeads', label: 'Empty state message', kind: 'text' },
      { key: 'status', label: 'Status column', kind: 'text' },
      { key: 'markContacted', label: 'Mark Contacted button', kind: 'text' },
      { key: 'markClosed', label: 'Mark Closed button', kind: 'text' },
      { key: 'notes', label: 'Notes column', kind: 'text' },
      { key: 'saveNotes', label: 'Save button', kind: 'text' },

      // ── Media Manager (CMS panel) — shared actions ──
      { key: 'cmsLoading', label: 'CMS · Loading assets', kind: 'text' },
      { key: 'cmsNoImage', label: 'CMS · "No image" placeholder', kind: 'text' },
      { key: 'cmsUploading', label: 'CMS · Uploading (word)', kind: 'text' },
      { key: 'cmsUploadingDots', label: 'CMS · Uploading… (button)', kind: 'text' },
      { key: 'cmsSave', label: 'CMS · Save', kind: 'text' },
      { key: 'cmsSaved', label: 'CMS · Saved ✓', kind: 'text' },
      { key: 'cmsClear', label: 'CMS · Clear', kind: 'text' },
      { key: 'cmsCancel', label: 'CMS · Cancel', kind: 'text' },
      { key: 'cmsRemove', label: 'CMS · Remove', kind: 'text' },
      { key: 'cmsReplace', label: 'CMS · Replace (thumbnail)', kind: 'text' },
      { key: 'cmsRemoveBtn', label: 'CMS · Remove (thumbnail)', kind: 'text' },
      { key: 'cmsUpload', label: 'CMS · Upload prefix (+ Upload)', kind: 'text' },
      { key: 'cmsReplaceImage', label: 'CMS · Replace Image', kind: 'text' },
      { key: 'cmsRemoving', label: 'CMS · Removing…', kind: 'text' },
      { key: 'cmsImage', label: 'CMS · "image" (singular)', kind: 'text' },
      { key: 'cmsImages', label: 'CMS · "images" (plural)', kind: 'text' },
      { key: 'cmsFrom', label: 'CMS · From (price prefix)', kind: 'text' },
      { key: 'cmsNo', label: 'CMS · No', kind: 'text' },
      // Tabs
      { key: 'cmsTabBranding', label: 'CMS tab · Branding', kind: 'text' },
      { key: 'cmsTabBrandingDesc', label: 'CMS tab · Branding desc', kind: 'text' },
      { key: 'cmsTabHero', label: 'CMS tab · Hero', kind: 'text' },
      { key: 'cmsTabHeroDesc', label: 'CMS tab · Hero desc', kind: 'text' },
      { key: 'cmsTabAbout', label: 'CMS tab · About', kind: 'text' },
      { key: 'cmsTabAboutDesc', label: 'CMS tab · About desc', kind: 'text' },
      { key: 'cmsTabProperties', label: 'CMS tab · Properties', kind: 'text' },
      { key: 'cmsTabPropertiesDesc', label: 'CMS tab · Properties desc', kind: 'text' },
      { key: 'cmsTabGallery', label: 'CMS tab · Gallery', kind: 'text' },
      { key: 'cmsTabGalleryDesc', label: 'CMS tab · Gallery desc', kind: 'text' },
      { key: 'cmsTabLounge', label: 'CMS tab · Lounge', kind: 'text' },
      { key: 'cmsTabLoungeDesc', label: 'CMS tab · Lounge desc', kind: 'text' },
      { key: 'cmsTabDecor', label: 'CMS tab · Decor', kind: 'text' },
      { key: 'cmsTabDecorDesc', label: 'CMS tab · Decor desc', kind: 'text' },
      { key: 'cmsTabSitemap', label: 'CMS tab · Site Map', kind: 'text' },
      { key: 'cmsTabSitemapDesc', label: 'CMS tab · Site Map desc', kind: 'text' },
      // Branding
      { key: 'cmsBrandingHint', label: 'CMS · Branding hint', kind: 'textarea' },
      { key: 'cmsBrandingLogo', label: 'CMS · Logo label', kind: 'text' },
      { key: 'cmsBrandingDefault', label: 'CMS · Bundled default', kind: 'text' },
      { key: 'cmsBrandingUpload', label: 'CMS · Upload Logo', kind: 'text' },
      { key: 'cmsBrandingRemoveConfirm', label: 'CMS · Branding remove confirm', kind: 'textarea' },
      // Hero
      { key: 'cmsHeroHint', label: 'CMS · Hero hint', kind: 'textarea' },
      { key: 'cmsHeroPoster', label: 'CMS · Hero poster label', kind: 'text' },
      { key: 'cmsHeroVideo', label: 'CMS · Hero video label', kind: 'text' },
      { key: 'cmsHeroNoVideo', label: 'CMS · No video set', kind: 'text' },
      { key: 'cmsHeroRemoveConfirm', label: 'CMS · Remove asset confirm', kind: 'text' },
      // About
      { key: 'cmsAboutMain', label: 'CMS · About main image label', kind: 'text' },
      { key: 'cmsAboutAccent', label: 'CMS · About accent image label', kind: 'text' },
      { key: 'cmsRemoveImageConfirm', label: 'CMS · Remove image confirm', kind: 'text' },
      // Properties
      { key: 'cmsPropHint', label: 'CMS · Properties hint', kind: 'textarea' },
      { key: 'cmsPropPriceOverride', label: 'CMS · Price override label', kind: 'text' },
      { key: 'cmsPropHero', label: 'CMS · Hero badge', kind: 'text' },
      { key: 'cmsPropAddImage', label: 'CMS · Add Image', kind: 'text' },
      { key: 'cmsPropComputedLoading', label: 'CMS · Price loading', kind: 'text' },
      { key: 'cmsPropComingSoon', label: 'CMS · Coming Soon (Phase 2)', kind: 'text' },
      { key: 'cmsPropSoldOut', label: 'CMS · Sold Out', kind: 'text' },
      { key: 'cmsPropRemoveConfirm', label: 'CMS · Remove property image confirm ({n}, {name})', kind: 'text' },
      // Gallery
      { key: 'cmsGalDrop', label: 'CMS · Drop images', kind: 'text' },
      { key: 'cmsGalDragDrop', label: 'CMS · Drag & drop images', kind: 'text' },
      { key: 'cmsGalDropSub', label: 'CMS · Dropzone subtitle', kind: 'textarea' },
      { key: 'cmsGalNewTo', label: 'CMS · New images go to', kind: 'text' },
      { key: 'cmsGalReady', label: 'CMS · ready to upload', kind: 'text' },
      { key: 'cmsGalUploadBtn', label: 'CMS · Upload (queue button)', kind: 'text' },
      { key: 'cmsGalSelect', label: 'CMS · Select', kind: 'text' },
      { key: 'cmsGalAll', label: 'CMS · All', kind: 'text' },
      { key: 'cmsGalSelected', label: 'CMS · selected', kind: 'text' },
      { key: 'cmsGalDelete', label: 'CMS · Delete', kind: 'text' },
      { key: 'cmsGalLabelsOn', label: 'CMS · Labels ON', kind: 'text' },
      { key: 'cmsGalLabelsOff', label: 'CMS · Labels OFF', kind: 'text' },
      { key: 'cmsGalLabelsTitle', label: 'CMS · Labels toggle tooltip', kind: 'textarea' },
      { key: 'cmsGalEnLabel', label: 'CMS · EN label placeholder', kind: 'text' },
      { key: 'cmsGalEsLabel', label: 'CMS · ES label placeholder', kind: 'text' },
      { key: 'cmsGalUncat', label: 'CMS · Uncategorized option', kind: 'text' },
      { key: 'cmsGalLegacy', label: 'CMS · Legacy tag', kind: 'text' },
      { key: 'cmsGalEmpty', label: 'CMS · Empty category', kind: 'textarea' },
      { key: 'cmsGalUnsaved', label: 'CMS · Unsaved label changes', kind: 'text' },
      { key: 'cmsGalSaveLabels', label: 'CMS · Save Labels', kind: 'text' },
      // Lounge
      { key: 'cmsLoungeHint', label: 'CMS · Lounge hint', kind: 'textarea' },
      { key: 'cmsLoungeImage', label: 'CMS · Image (n) label', kind: 'text' },
      { key: 'cmsLoungeRemoveConfirm', label: 'CMS · Remove lounge image confirm', kind: 'text' },
      // Decor
      { key: 'cmsDecorHint', label: 'CMS · Decor hint', kind: 'textarea' },
      { key: 'cmsDecorAbout', label: 'CMS · Decor about label', kind: 'text' },
      { key: 'cmsDecorLounge', label: 'CMS · Decor lounge label', kind: 'text' },
      { key: 'cmsDecorCta', label: 'CMS · Decor CTA label', kind: 'text' },
      // Site Map
      { key: 'cmsSmHint', label: 'CMS · Site Map hint', kind: 'textarea' },
      { key: 'cmsSmBackdrop', label: 'CMS · Backdrop label', kind: 'text' },
      { key: 'cmsSmReplaceBackdrop', label: 'CMS · Replace Backdrop', kind: 'text' },
      { key: 'cmsSmPlan', label: 'CMS · Plan image label', kind: 'text' },
      { key: 'cmsSmReplacePlan', label: 'CMS · Replace Plan Image', kind: 'text' },
      { key: 'cmsSmMasterPdf', label: 'CMS · Master Plan PDF label', kind: 'text' },
      { key: 'cmsSmMasterHint', label: 'CMS · Master Plan PDF hint', kind: 'text' },
      { key: 'cmsSmVillasPdf', label: 'CMS · Villas PDF label', kind: 'text' },
      { key: 'cmsSmVillasHint', label: 'CMS · Villas PDF hint', kind: 'text' },
      { key: 'cmsSmBrochurePdf', label: 'CMS · Brochure PDF label', kind: 'text' },
      { key: 'cmsSmBrochureHint', label: 'CMS · Brochure PDF hint', kind: 'text' },
      { key: 'cmsSmAmenitiesPdf', label: 'CMS · Amenities PDF label', kind: 'text' },
      { key: 'cmsSmAmenitiesHint', label: 'CMS · Amenities PDF hint', kind: 'text' },
      { key: 'cmsSmNoPdf', label: 'CMS · No PDF set', kind: 'text' },
      { key: 'cmsSmViewPdf', label: 'CMS · View PDF', kind: 'text' },
      { key: 'cmsSmReplacePdf', label: 'CMS · Replace PDF', kind: 'text' },
      { key: 'cmsSmUploadPdf', label: 'CMS · Upload PDF', kind: 'text' },
      { key: 'cmsSmZoneMap', label: 'CMS · Interactive Zone Map', kind: 'text' },
    ],
  },
];
