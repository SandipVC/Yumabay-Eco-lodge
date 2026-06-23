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
      { key: 'subtitle', label: 'Subtitle (below tagline, above buttons)', kind: 'text' },
      { key: 'exploreBtn', label: 'Explore button', kind: 'text' },
      { key: 'discoverBtn', label: 'Discover button', kind: 'text' },
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
      { key: 'filters', label: 'Filter labels (All, Exterior, Interior, Amenities)', kind: 'array', count: 4 },
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
      { key: 'facebook', label: 'Facebook link label', kind: 'text' },
      { key: 'whatsapp', label: 'WhatsApp link label', kind: 'text' },
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
    ],
  },
];
