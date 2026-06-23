/**
 * Schema describing every editable text field in the public site.
 * Drives the TextContentSection editor: which inputs to render, single-line
 * vs textarea, array shapes, etc. Mirrors translations/en.js + es.js exactly.
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
      { key: 'contact', label: 'Contact', kind: 'text' },
      { key: 'siteMap', label: 'Site Map', kind: 'text' },
      { key: 'reserveNow', label: 'Reserve Now button', kind: 'text' },
    ],
  },
  {
    id: 'hero',
    label: 'Hero',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow line', kind: 'text' },
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'titleEm', label: 'Title (highlighted word)', kind: 'text' },
      { key: 'tagline', label: 'Tagline', kind: 'text' },
      { key: 'subtitle', label: 'Subtitle (below tagline, above buttons)', kind: 'text' },
      { key: 'exploreBtn', label: 'Explore button', kind: 'text' },
      { key: 'discoverBtn', label: 'Discover button', kind: 'text' },
    ],
  },
  {
    id: 'strip',
    label: 'Feature Strip',
    isFullArray: true,
    arrayLabel: 'Strip item',
    count: 5,
  },
  {
    id: 'about',
    label: 'About',
    fields: [
      { key: 'label', label: 'Eyebrow label', kind: 'text' },
      { key: 'title', label: 'Title (press Enter for line break)', kind: 'textarea' },
      { key: 'titleEm', label: 'Title (highlighted word)', kind: 'text' },
      { key: 'body', label: 'Body paragraph', kind: 'textarea' },
      { key: 'stat1Num', label: 'Stat 1 number', kind: 'text' },
      { key: 'stat1Lbl', label: 'Stat 1 label', kind: 'text' },
      { key: 'stat2Num', label: 'Stat 2 number', kind: 'text' },
      { key: 'stat2Lbl', label: 'Stat 2 label', kind: 'text' },
      { key: 'stat3Num', label: 'Stat 3 number', kind: 'text' },
      { key: 'stat3Lbl', label: 'Stat 3 label', kind: 'text' },
      { key: 'badge', label: 'Badge text', kind: 'text' },
      { key: 'viewAll', label: 'View All button', kind: 'text' },
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
      { key: 'priceFrom', label: 'Price prefix (From / Desde)', kind: 'text' },
      {
        key: 'items', label: 'Property cards', kind: 'list', count: 5,
        itemLabel: (i) => `Card ${i + 1}`,
        fields: [
          { key: 'tag', label: 'Tag', kind: 'text' },
          { key: 'name', label: 'Name', kind: 'text' },
          { key: 'area', label: 'Area / sub-line', kind: 'text' },
          { key: 'feats', label: 'Features', kind: 'array', count: 4 },
          { key: 'price', label: 'Price string', kind: 'text' },
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
      { key: 'label', label: 'Eyebrow label', kind: 'text' },
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
          { key: 'icon', label: 'Icon emoji', kind: 'text' },
          { key: 'name', label: 'Name', kind: 'text' },
          { key: 'desc', label: 'Description', kind: 'textarea' },
        ],
      },
    ],
  },
  {
    id: 'location',
    label: 'Location',
    fields: [
      { key: 'label', label: 'Eyebrow label', kind: 'text' },
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'titleEm', label: 'Title (highlighted)', kind: 'text' },
      { key: 'body', label: 'Body paragraph', kind: 'textarea' },
      {
        key: 'distances', label: 'Distance items', kind: 'list', count: 4,
        itemLabel: (i) => `Distance ${i + 1}`,
        fields: [
          { key: 'name', label: 'Name', kind: 'text' },
          { key: 'val', label: 'Value', kind: 'text' },
          { key: 'unit', label: 'Unit', kind: 'text' },
        ],
      },
      { key: 'enquireBtn', label: 'Enquire button', kind: 'text' },
    ],
  },
  {
    id: 'cta',
    label: 'CTA Banner',
    fields: [
      { key: 'eyebrow', label: 'Eyebrow', kind: 'text' },
      { key: 'title', label: 'Title (press Enter for line break)', kind: 'textarea' },
      { key: 'titleEm', label: 'Title (highlighted)', kind: 'text' },
      { key: 'brochureBtn', label: 'Brochure button', kind: 'text' },
      { key: 'visitBtn', label: 'Visit button', kind: 'text' },
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
      { key: 'phase', label: 'Phase label', kind: 'text' },
      { key: 'units', label: 'Units label', kind: 'text' },
      { key: 'availability', label: 'Availability label', kind: 'text' },
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
      { key: 'tagline', label: 'Tagline', kind: 'textarea' },
      { key: 'propertiesCol', label: 'Properties column heading', kind: 'text' },
      { key: 'propertiesLinks', label: 'Properties links', kind: 'array', count: 4 },
      { key: 'devCol', label: 'Development column heading', kind: 'text' },
      { key: 'devLinks', label: 'Development links', kind: 'array', count: 4 },
      { key: 'contactCol', label: 'Contact column heading', kind: 'text' },
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
    id: 'project',
    label: 'Project Settings (Phase 0 foundation)',
    fields: [
      { key: 'owner', label: 'Owner / legal entity', kind: 'text' },
      { key: 'developer', label: 'Project director (Ing. ...)', kind: 'text' },
      { key: 'phase1Area', label: 'Phase 1 land area', kind: 'text' },
      { key: 'phase2Area', label: 'Phase 2 land area', kind: 'text' },
      { key: 'totalConstruction', label: 'Total construction area', kind: 'text' },
      { key: 'pricingDate', label: 'Pricing valid as-of date', kind: 'text' },
      { key: 'pricingDisplayMode', label: 'Pricing display mode (starting-at | per-unit)', kind: 'text' },
      { key: 'pricingValidPrefix', label: 'Pricing-valid prefix (e.g. "Pricing valid as of")', kind: 'text' },
      { key: 'pricingNote', label: 'Pricing disclaimer note (footer / sitemap)', kind: 'textarea' },
      { key: 'villaCount', label: 'Total villa count', kind: 'text' },
      { key: 'villaNote', label: 'Villa count note / discrepancy info', kind: 'textarea' },
      { key: 'ownerLabel', label: 'Owner field label (e.g. "Developer")', kind: 'text' },
      { key: 'developerLabel', label: 'Developer field label (e.g. "Project Director")', kind: 'text' },
      { key: 'phase1Label', label: 'Phase 1 short label (About fact strip)', kind: 'text' },
      { key: 'builtLabel', label: 'Built / Construction short label (About fact strip)', kind: 'text' },
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
    ],
  },
];
