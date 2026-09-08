/**
 * Declarative field schema for the CMS.
 *
 * The editor UI used to infer its controls from the runtime shape of a content
 * document, which meant labels came from camelCase key names, textareas were
 * chosen by a regex over the field name, and there was nowhere to put help
 * text, limits or grouping. Every editing surface now reads this file instead:
 * the document editor, the visual (click-to-edit) overlay and the media picker
 * all resolve a `FieldDef` for a dotted content path and render from it.
 *
 * Zod in `registry.ts` stays the security and correctness boundary. This layer
 * never widens what may be saved — it only describes how a valid value is
 * presented and edited.
 */

import { CONTENT_REGISTRY, type ContentKey } from "./registry";

/* ------------------------------------------------------------------ types */

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "toggle"
  | "select"
  | "image"
  | "link"
  | "email"
  | "tel"
  | "url"
  | "group"
  | "repeater"
  | "blocks"
  | "map"
  | "seo";

export type FieldDef = {
  kind: FieldKind;
  /** Human label. Falls back to a humanised key when omitted. */
  label?: string;
  /** Sentence shown under the control. Explain consequence, not mechanics. */
  help?: string;
  placeholder?: string;
  /** Character budget, mirrored from the Zod schema so counters are truthful. */
  max?: number;
  rows?: number;
  required?: boolean;
  /** Rendered read-only with a lock badge; the schema also rejects changes. */
  locked?: boolean;
  lockReason?: string;
  /** Monospace control for handles, codes and template bodies. */
  mono?: boolean;
  /** Placeholders an email template must retain, shown as insertable chips. */
  variables?: readonly string[];
  options?: ReadonlyArray<{ value: string; label: string }>;

  /** `group` / `seo`: named child fields, rendered in declaration order. */
  fields?: Record<string, FieldDef>;
  /** `repeater` / `map`: the shape of one entry. */
  of?: FieldDef;
  /** `repeater`: which child field titles a collapsed row. */
  itemTitleField?: string;
  /** `repeater`: entries cannot be added, removed or reordered. */
  fixed?: boolean;
  addLabel?: string;
  /** `map`: split entries into sections by the part before the first dot. */
  groupByPrefix?: boolean;
  /** `map`: friendly names for otherwise cryptic entry keys. */
  entryLabels?: Record<string, string>;
};

export type DocumentTab = {
  id: string;
  label: string;
  description?: string;
  /** Top-level field names shown on this tab. */
  fields: string[];
};

export type DocumentSpec = {
  /** One line under the document title in the editor. */
  description: string;
  /** Where this document's wording surfaces, for the "Preview" affordance. */
  previewPath?: string;
  tabs: DocumentTab[];
  fields: Record<string, FieldDef>;
};

/* ------------------------------------------------------------- primitives */

const seoField = (): FieldDef => ({
  kind: "seo",
  label: "Search engine listing",
  help: "Shown in Google results and when the page is shared. Leave the social fields empty to reuse the title and description.",
  fields: {
    title: {
      kind: "text",
      label: "Page title",
      max: 120,
      required: true,
      help: "Around 60 characters shows in full on Google.",
    },
    description: {
      kind: "textarea",
      label: "Meta description",
      max: 320,
      rows: 3,
      required: true,
      help: "Around 155 characters shows in full on Google.",
    },
    ogTitle: {
      kind: "text",
      label: "Social title",
      max: 120,
      placeholder: "Same as the page title",
    },
    ogDescription: {
      kind: "textarea",
      label: "Social description",
      max: 320,
      rows: 2,
      placeholder: "Same as the meta description",
    },
  },
});

const linkField = (label: string, help?: string): FieldDef => ({
  kind: "link",
  label,
  help: help ?? "An internal page, or an https, mailto: or tel: link.",
  max: 500,
});

/* ----------------------------------------------------------------- blocks */

export type BlockKind = "hero" | "text" | "cards" | "list" | "steps" | "media" | "cta";

export type BlockSpec = {
  label: string;
  description: string;
  fields: Record<string, FieldDef>;
  /** Field whose value titles the block in the editor and outline. */
  titleField: string;
};

export const BLOCK_SPECS: Record<BlockKind, BlockSpec> = {
  hero: {
    label: "Hero",
    description: "Large heading with optional lead paragraph and image.",
    titleField: "title",
    fields: {
      type: { kind: "text", locked: true },
      eyebrow: {
        kind: "text",
        label: "Eyebrow",
        max: 120,
        placeholder: "Small label above the heading",
      },
      title: { kind: "text", label: "Heading", max: 240, required: true },
      copy: { kind: "textarea", label: "Lead paragraph", max: 3000, rows: 4 },
      mediaId: { kind: "image", label: "Image" },
      mediaAlt: {
        kind: "text",
        label: "Image description",
        max: 300,
        help: "Required whenever an image is set. Describe what the image shows for screen readers.",
      },
    },
  },
  text: {
    label: "Text",
    description: "A heading with body copy.",
    titleField: "title",
    fields: {
      type: { kind: "text", locked: true },
      title: { kind: "text", label: "Heading", max: 240, required: true },
      copy: { kind: "textarea", label: "Body", max: 10000, rows: 8, required: true },
    },
  },
  cards: {
    label: "Cards",
    description: "A grid of short titled cards.",
    titleField: "title",
    fields: {
      type: { kind: "text", locked: true },
      title: { kind: "text", label: "Section heading", max: 240 },
      items: {
        kind: "repeater",
        label: "Cards",
        addLabel: "Add card",
        itemTitleField: "title",
        of: {
          kind: "group",
          fields: {
            title: { kind: "text", label: "Card title", max: 240, required: true },
            copy: { kind: "textarea", label: "Card body", max: 5000, rows: 3, required: true },
          },
        },
      },
    },
  },
  list: {
    label: "List",
    description: "A heading followed by bullet points.",
    titleField: "title",
    fields: {
      type: { kind: "text", locked: true },
      title: { kind: "text", label: "Heading", max: 240, required: true },
      items: {
        kind: "repeater",
        label: "Bullet points",
        addLabel: "Add point",
        of: { kind: "text", label: "Point", max: 1000, required: true },
      },
    },
  },
  steps: {
    label: "Steps",
    description: "Numbered steps explaining a process.",
    titleField: "title",
    fields: {
      type: { kind: "text", locked: true },
      title: { kind: "text", label: "Heading", max: 240, required: true },
      items: {
        kind: "repeater",
        label: "Steps",
        addLabel: "Add step",
        itemTitleField: "title",
        of: {
          kind: "group",
          fields: {
            title: { kind: "text", label: "Step title", max: 240, required: true },
            copy: { kind: "textarea", label: "What happens", max: 3000, rows: 3, required: true },
          },
        },
      },
    },
  },
  media: {
    label: "Image",
    description: "A standalone image with a caption.",
    titleField: "caption",
    fields: {
      type: { kind: "text", locked: true },
      mediaId: { kind: "image", label: "Image", required: true },
      mediaAlt: {
        kind: "text",
        label: "Image description",
        max: 300,
        required: true,
        help: "Describe what the image shows for screen readers.",
      },
      caption: { kind: "text", label: "Caption", max: 500 },
    },
  },
  cta: {
    label: "Call to action",
    description: "A prompt with a button.",
    titleField: "title",
    fields: {
      type: { kind: "text", locked: true },
      title: { kind: "text", label: "Heading", max: 240, required: true },
      copy: { kind: "textarea", label: "Supporting copy", max: 3000, rows: 3 },
      label: { kind: "text", label: "Button text", max: 100, required: true },
      to: linkField("Button destination"),
    },
  },
};

const blocksField = (label = "Page sections", max?: number): FieldDef => ({
  kind: "blocks",
  label,
  help: max
    ? `Add, reorder or remove sections. Up to ${max} on this page.`
    : "Add, reorder or remove sections.",
  addLabel: "Add section",
});

/* ------------------------------------------------------ shared page shapes */

const pageFields = (): Record<string, FieldDef> => ({
  seo: seoField(),
  eyebrow: { kind: "text", label: "Eyebrow", max: 120, placeholder: "Small label above the title" },
  title: { kind: "text", label: "Page title", max: 240, required: true },
  intro: { kind: "textarea", label: "Introduction", max: 3000, rows: 4 },
  ctaLabel: { kind: "text", label: "Call-to-action button", max: 100 },
  ctaTo: linkField("Button destination"),
  blocks: blocksField("Page sections", 30),
});

const functionalPageFields = (): Record<string, FieldDef> => ({
  seo: seoField(),
  eyebrow: { kind: "text", label: "Eyebrow", max: 120 },
  title: { kind: "text", label: "Page title", max: 240, required: true },
  intro: { kind: "textarea", label: "Introduction", max: 2000, rows: 3 },
  sectionEyebrow: { kind: "text", label: "Section eyebrow", max: 120 },
  sectionTitle: { kind: "text", label: "Section heading", max: 240 },
  noticeTitle: { kind: "text", label: "Notice heading", max: 240 },
  emptyTitle: {
    kind: "text",
    label: "Empty state heading",
    max: 240,
    help: "Shown when there is nothing to display — an empty cart, no orders, no results.",
  },
  emptyCopy: { kind: "textarea", label: "Empty state copy", max: 2000, rows: 3 },
  loadingLabel: { kind: "text", label: "Loading label", max: 120 },
  helpCopy: { kind: "textarea", label: "Help copy", max: 2000, rows: 3 },
  ctaLabel: { kind: "text", label: "Call-to-action button", max: 100 },
  ctaTo: linkField("Button destination"),
  blocks: blocksField("Extra sections", 12),
});

const PAGE_ENTRY_LABELS: Record<string, string> = {
  "about-us": "About us",
  "terms-and-conditions": "Terms and conditions",
  "returns-policy": "Returns policy",
  "privacy-policy": "Privacy policy",
  cookies: "Cookie policy",
  disclaimer: "Disclaimer",
  "delivery-information": "Delivery information",
  "contact-us": "Contact us",
  resources: "Resources",
};

const FUNCTIONAL_ENTRY_LABELS: Record<string, string> = {
  cart: "Cart",
  quote: "Build a quote",
  account: "My account",
  login: "Sign in",
  register: "Create account",
  "forgot-password": "Forgot password",
  "track-order": "Track order",
  search: "Search",
  returns: "Start a return",
  "got-a-question": "Got a question",
  "credit-account": "Credit account application",
};

const MESSAGE_SECTION_LABELS: Record<string, string> = {
  common: "Shared wording",
  catalogue: "Catalogue",
  quote: "Quotes",
  returns: "Returns",
  account: "Account",
  error: "Error pages",
  cookie: "Cookie banner",
  part: "Part enquiry form",
  auth: "Sign in and passwords",
  cart: "Cart",
  track: "Order tracking",
  support: "Support forms",
  return: "Return request form",
  contact: "Contact details",
};

/* ---------------------------------------------------------- document specs */

export const FIELD_SPECS: Record<ContentKey, DocumentSpec> = {
  site: {
    description:
      "Company name and contact details. These appear in the header, footer, contact page, structured data and every transactional email.",
    previewPath: "/",
    tabs: [
      { id: "identity", label: "Identity", fields: ["name", "url", "socialHandle"] },
      {
        id: "contact",
        label: "Contact",
        description: "Used by the contact page, footer and WhatsApp links.",
        fields: ["email", "phoneDisplay", "phoneHref", "whatsapp"],
      },
      {
        id: "location",
        label: "Location and hours",
        fields: ["location", "hours", "addressLocality", "addressCountry"],
      },
    ],
    fields: {
      name: { kind: "text", label: "Business name", max: 120, required: true },
      url: {
        kind: "url",
        label: "Website address",
        required: true,
        placeholder: "https://example.com",
        help: "Must start with https://. Used to build canonical links and the sitemap.",
      },
      socialHandle: {
        kind: "text",
        label: "Social handle",
        placeholder: "@SparesAutomation",
        mono: true,
        help: "An @handle used in structured data.",
      },
      email: { kind: "email", label: "Contact email", required: true },
      phoneDisplay: {
        kind: "text",
        label: "Phone number (as shown)",
        max: 60,
        required: true,
        help: "Formatted for people to read, e.g. 0161 000 0000.",
      },
      phoneHref: {
        kind: "tel",
        label: "Phone number (dialled)",
        mono: true,
        required: true,
        placeholder: "+441610000000",
        help: "International format with no spaces. This is what a phone actually dials.",
      },
      whatsapp: {
        kind: "text",
        label: "WhatsApp number",
        mono: true,
        placeholder: "441610000000",
        help: "Digits only, including the country code and no plus sign.",
      },
      location: { kind: "text", label: "Location", max: 200, required: true },
      hours: {
        kind: "text",
        label: "Opening hours",
        max: 200,
        required: true,
        placeholder: "Mon-Fri, 8am-5pm",
      },
      addressLocality: { kind: "text", label: "Town or city", max: 120, required: true },
      addressCountry: {
        kind: "text",
        label: "Country code",
        max: 2,
        mono: true,
        required: true,
        help: "Two-letter ISO code, e.g. GB.",
      },
    },
  },

  navigation: {
    description:
      "Menu wording and visibility. Destinations are fixed so a renamed link can never break a page — hide an entry instead of repointing it.",
    previewPath: "/",
    tabs: [
      { id: "header", label: "Header menu", fields: ["header"] },
      { id: "information", label: "Footer: information", fields: ["information"] },
      { id: "help", label: "Footer: help", fields: ["help"] },
      { id: "footer", label: "Footer text", fields: ["footerCopy"] },
    ],
    fields: {
      header: {
        kind: "repeater",
        label: "Header menu",
        fixed: true,
        itemTitleField: "label",
        help: "Reorder with the arrows, rename with the label, or switch an entry off. Entries cannot be added or removed.",
        of: {
          kind: "group",
          fields: {
            id: { kind: "text", label: "Identifier", locked: true, mono: true },
            label: { kind: "text", label: "Menu label", max: 100, required: true },
            to: {
              kind: "link",
              label: "Destination",
              locked: true,
              lockReason: "Destinations are fixed so links cannot be pointed at a missing page.",
            },
            visible: { kind: "toggle", label: "Show in menu" },
          },
        },
      },
      information: {
        kind: "repeater",
        label: "Information column",
        fixed: true,
        itemTitleField: "label",
        of: {
          kind: "group",
          fields: {
            id: { kind: "text", label: "Identifier", locked: true, mono: true },
            label: { kind: "text", label: "Link label", max: 100, required: true },
            to: { kind: "link", label: "Destination", locked: true },
            visible: { kind: "toggle", label: "Show in footer" },
          },
        },
      },
      help: {
        kind: "repeater",
        label: "Help column",
        fixed: true,
        itemTitleField: "label",
        of: {
          kind: "group",
          fields: {
            id: { kind: "text", label: "Identifier", locked: true, mono: true },
            label: { kind: "text", label: "Link label", max: 100, required: true },
            to: { kind: "link", label: "Destination", locked: true },
            visible: { kind: "toggle", label: "Show in footer" },
          },
        },
      },
      footerCopy: {
        kind: "textarea",
        label: "Footer strapline",
        max: 500,
        rows: 2,
        required: true,
        help: "One or two lines under the company name in the footer.",
      },
    },
  },

  home: {
    description: "Headings and copy on the homepage, outside the product panels.",
    previewPath: "/",
    tabs: [
      { id: "seo", label: "Search listing", fields: ["seo"] },
      { id: "page", label: "Page", fields: ["title"] },
      { id: "resources", label: "Resources panel", fields: ["resourceTitle", "resourceCopy"] },
      {
        id: "finder",
        label: "Part finder",
        description: "The enquiry form visitors use when they cannot find a part.",
        fields: ["finderTitle", "finderCopy", "finderSubmit"],
      },
      { id: "contact", label: "Contact panel", fields: ["contactTitle", "contactCopy"] },
    ],
    fields: {
      seo: seoField(),
      title: { kind: "text", label: "Page heading", max: 240, required: true },
      resourceTitle: { kind: "text", label: "Panel heading", max: 240, required: true },
      resourceCopy: { kind: "textarea", label: "Panel copy", max: 1500, rows: 3, required: true },
      finderTitle: { kind: "text", label: "Form heading", max: 240, required: true },
      finderCopy: { kind: "textarea", label: "Form copy", max: 2000, rows: 3, required: true },
      finderSubmit: { kind: "text", label: "Submit button", max: 100, required: true },
      contactTitle: { kind: "text", label: "Panel heading", max: 240, required: true },
      contactCopy: { kind: "textarea", label: "Panel copy", max: 2000, rows: 3, required: true },
    },
  },

  catalogue: {
    description:
      "Wording and images for the homepage product panels and the category list. Shopify owns the handles, prices and stock — only presentation is editable here.",
    previewPath: "/",
    tabs: [
      {
        id: "ranges",
        label: "Hero panels",
        description: "The large product-range panels on the homepage.",
        fields: ["ranges"],
      },
      { id: "tiles", label: "Category tiles", fields: ["tiles"] },
      { id: "categories", label: "Categories", fields: ["categories"] },
    ],
    fields: {
      ranges: {
        kind: "repeater",
        label: "Hero panels",
        fixed: true,
        itemTitleField: "title",
        help: "Panels and their product lines are fixed. Edit the wording only.",
        of: {
          kind: "group",
          fields: {
            handle: { kind: "text", label: "Shopify handle", locked: true, mono: true },
            title: { kind: "text", label: "Panel title", max: 160, required: true },
            lines: {
              kind: "repeater",
              label: "Product lines",
              fixed: true,
              itemTitleField: "label",
              of: {
                kind: "group",
                fields: {
                  handle: { kind: "text", label: "Shopify handle", locked: true, mono: true },
                  label: { kind: "text", label: "Line label", max: 120, required: true },
                  meta: {
                    kind: "text",
                    label: "Supporting note",
                    max: 160,
                    placeholder: "Optional detail shown beside the label",
                  },
                },
              },
            },
          },
        },
      },
      tiles: {
        kind: "repeater",
        label: "Category tiles",
        fixed: true,
        itemTitleField: "title",
        of: {
          kind: "group",
          fields: {
            handle: { kind: "text", label: "Shopify handle", locked: true, mono: true },
            title: { kind: "text", label: "Tile title", max: 160, required: true },
          },
        },
      },
      categories: {
        kind: "repeater",
        label: "Categories",
        fixed: true,
        itemTitleField: "label",
        help: "Rename, describe, illustrate or hide a category. The Shopify handle behind it never changes.",
        of: {
          kind: "group",
          fields: {
            handle: { kind: "text", label: "Shopify handle", locked: true, mono: true },
            label: { kind: "text", label: "Display name", max: 160, required: true },
            description: {
              kind: "textarea",
              label: "Description",
              max: 1000,
              rows: 3,
              required: true,
            },
            visible: { kind: "toggle", label: "Show on the website" },
            mediaId: { kind: "image", label: "Category image" },
            mediaAlt: {
              kind: "text",
              label: "Image description",
              max: 300,
              help: "Required whenever an image is set.",
            },
          },
        },
      },
    },
  },

  pages: {
    description:
      "The information and legal pages. Each has its own search listing, introduction and stack of sections.",
    tabs: [{ id: "pages", label: "Pages", fields: ["__map"] }],
    fields: {
      __map: {
        kind: "map",
        label: "Pages",
        entryLabels: PAGE_ENTRY_LABELS,
        of: { kind: "group", fields: pageFields() },
      },
    },
  },

  functional: {
    description:
      "Explanatory wording on the cart, account, sign-in and form pages. The behaviour of these pages is code-owned; only what customers read is editable.",
    tabs: [{ id: "pages", label: "Pages", fields: ["__map"] }],
    fields: {
      __map: {
        kind: "map",
        label: "Pages",
        entryLabels: FUNCTIONAL_ENTRY_LABELS,
        of: { kind: "group", fields: functionalPageFields() },
      },
    },
  },

  product: {
    description:
      "Shared wording on the catalogue listing and every product page. Product names, prices, images and stock come from Shopify.",
    previewPath: "/products",
    tabs: [
      { id: "seo", label: "Search listing", fields: ["listingSeo"] },
      {
        id: "listing",
        label: "Catalogue listing",
        fields: ["listingEyebrow", "listingTitle", "listingHighlight", "listingIntro"],
      },
      {
        id: "empty",
        label: "Empty states",
        description: "Shown when the catalogue is unavailable or filters match nothing.",
        fields: ["emptyTitle", "emptyCopy", "filteredEmptyTitle", "filteredEmptyCopy"],
      },
      {
        id: "product",
        label: "Product page",
        fields: [
          "tabDetails",
          "tabPdf",
          "tabVideo",
          "documentsLabel",
          "videosLabel",
          "quantityLabel",
          "viewCartLabel",
          "outOfStockLabel",
          "imagePendingLabel",
          "enlargeHint",
          "leadTimeNote",
        ],
      },
      {
        id: "support",
        label: "Support panel",
        fields: ["supportEyebrow", "supportTitle", "questionLabel", "questionCopy", "questionCta"],
      },
    ],
    fields: {
      listingSeo: seoField(),
      listingEyebrow: { kind: "text", label: "Eyebrow", max: 120 },
      listingTitle: { kind: "text", label: "Listing heading", max: 240, required: true },
      listingHighlight: {
        kind: "text",
        label: "Highlighted word",
        max: 120,
        help: "Rendered in the accent colour beside the heading.",
      },
      listingIntro: { kind: "textarea", label: "Introduction", max: 2000, rows: 3 },
      emptyTitle: { kind: "text", label: "Catalogue unavailable heading", max: 240, required: true },
      emptyCopy: {
        kind: "textarea",
        label: "Catalogue unavailable copy",
        max: 2000,
        rows: 3,
        required: true,
      },
      filteredEmptyTitle: { kind: "text", label: "No results heading", max: 240, required: true },
      filteredEmptyCopy: {
        kind: "textarea",
        label: "No results copy",
        max: 2000,
        rows: 3,
        required: true,
      },
      supportEyebrow: { kind: "text", label: "Eyebrow", max: 120, required: true },
      supportTitle: { kind: "text", label: "Panel heading", max: 240, required: true },
      tabDetails: { kind: "text", label: "Details tab", max: 80, required: true },
      tabPdf: { kind: "text", label: "PDF tab", max: 80, required: true },
      tabVideo: { kind: "text", label: "Video tab", max: 80, required: true },
      documentsLabel: { kind: "text", label: "Documents heading", max: 120, required: true },
      videosLabel: { kind: "text", label: "Videos heading", max: 120, required: true },
      questionLabel: { kind: "text", label: "Question heading", max: 120, required: true },
      questionCopy: { kind: "textarea", label: "Question copy", max: 1000, rows: 3, required: true },
      questionCta: { kind: "text", label: "Question button", max: 80, required: true },
      quantityLabel: { kind: "text", label: "Quantity label", max: 40, required: true },
      viewCartLabel: { kind: "text", label: "View cart button", max: 80, required: true },
      outOfStockLabel: { kind: "text", label: "Out of stock label", max: 80, required: true },
      imagePendingLabel: { kind: "text", label: "Missing image label", max: 80, required: true },
      enlargeHint: { kind: "text", label: "Enlarge hint", max: 160, required: true },
      leadTimeNote: { kind: "text", label: "Lead time note", max: 300, required: true },
    },
  },

  messages: {
    description:
      "Short strings reused across forms, buttons, banners and error states. Changing wording here never changes what a form validates or accepts.",
    tabs: [{ id: "messages", label: "Messages", fields: ["__map"] }],
    fields: {
      __map: {
        kind: "map",
        label: "Messages",
        groupByPrefix: true,
        entryLabels: MESSAGE_SECTION_LABELS,
        of: { kind: "text", max: 5000, required: true },
      },
    },
  },

  emails: {
    description:
      "Subjects and bodies of automatic emails. Placeholders in double braces are replaced with real values when the email is sent, and required ones cannot be removed.",
    tabs: [
      { id: "returnAcknowledgement", label: "Return received", fields: ["returnAcknowledgement"] },
      { id: "returnStatus", label: "Return update", fields: ["returnStatus"] },
      { id: "salesNotification", label: "Sales notification", fields: ["salesNotification"] },
    ],
    fields: {
      returnAcknowledgement: {
        kind: "group",
        label: "Sent when a customer submits a return request",
        fields: {
          subject: {
            kind: "text",
            label: "Subject",
            max: 300,
            required: true,
            variables: ["{{reference}}", "{{orderNumber}}"],
          },
          body: {
            kind: "textarea",
            label: "Body",
            max: 12000,
            rows: 12,
            required: true,
            mono: true,
            variables: ["{{reference}}", "{{orderNumber}}"],
            help: "Plain text. Must keep {{reference}} and {{orderNumber}}.",
          },
        },
      },
      returnStatus: {
        kind: "group",
        label: "Sent when a return changes status",
        fields: {
          subject: {
            kind: "text",
            label: "Subject",
            max: 300,
            required: true,
            variables: ["{{reference}}", "{{status}}"],
          },
          body: {
            kind: "textarea",
            label: "Body",
            max: 12000,
            rows: 12,
            required: true,
            mono: true,
            variables: ["{{reference}}", "{{status}}", "{{statusMessage}}"],
            help: "Plain text. Must keep {{reference}} and {{status}}.",
          },
        },
      },
      salesNotification: {
        kind: "group",
        label: "Sent to the sales desk for every website submission",
        fields: {
          subject: {
            kind: "text",
            label: "Subject",
            max: 300,
            required: true,
            variables: ["{{reference}}", "{{submissionType}}"],
          },
          body: {
            kind: "textarea",
            label: "Body",
            max: 12000,
            rows: 12,
            required: true,
            mono: true,
            variables: ["{{reference}}", "{{submissionType}}", "{{details}}"],
            help: "Plain text. Must keep {{reference}}, {{submissionType}} and {{details}}.",
          },
        },
      },
    },
  },
};

/* -------------------------------------------------------------- resolution */

/** "finderSubmit" -> "Finder submit". Used when a spec omits a label. */
export function humanise(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function specFor(key: ContentKey): DocumentSpec {
  return FIELD_SPECS[key];
}

export function labelForDocument(key: ContentKey) {
  return CONTENT_REGISTRY[key].label;
}

export function groupForDocument(key: ContentKey) {
  return CONTENT_REGISTRY[key].group;
}

/** True for documents whose fields live under a single dynamic map. */
export function isMapDocument(key: ContentKey) {
  return "__map" in FIELD_SPECS[key].fields;
}

/** The root field definition for a document, map-backed or not. */
export function rootFieldOf(key: ContentKey): FieldDef {
  const spec = FIELD_SPECS[key];
  return isMapDocument(key) ? spec.fields.__map : { kind: "group", fields: spec.fields };
}

function readSegment(value: unknown, segment: string): unknown {
  if (value === null || value === undefined) return undefined;
  if (Array.isArray(value)) return value[Number(segment)];
  if (typeof value === "object") return (value as Record<string, unknown>)[segment];
  return undefined;
}

/**
 * Resolve the field definition at a dotted path inside a document, following
 * groups, repeaters, maps and blocks. Array indices and map keys are consumed
 * by their container. Returns null when the path is not editable.
 */
export function resolveField(key: ContentKey, path: string[], value: unknown): FieldDef | null {
  let field: FieldDef | null = rootFieldOf(key);
  let current: unknown = value;

  for (const segment of path) {
    if (!field) return null;
    const next = readSegment(current, segment);

    switch (field.kind) {
      case "group":
      case "seo":
        field = field.fields?.[segment] ?? null;
        break;
      case "map":
      case "repeater":
        field = field.of ?? null;
        break;
      case "blocks": {
        // A block index selects the block; the next segment selects its field.
        const type = (next as { type?: string } | null | undefined)?.type;
        field =
          type && type in BLOCK_SPECS
            ? { kind: "group", fields: BLOCK_SPECS[type as BlockKind].fields }
            : null;
        break;
      }
      default:
        return null;
    }
    current = next;
  }

  return field;
}

/** Section heading for a dotted message key such as "cookie.title". */
export function messageSectionOf(entryKey: string) {
  const prefix = entryKey.split(".")[0];
  return MESSAGE_SECTION_LABELS[prefix] ?? humanise(prefix);
}

export { PAGE_ENTRY_LABELS, FUNCTIONAL_ENTRY_LABELS, MESSAGE_SECTION_LABELS };
