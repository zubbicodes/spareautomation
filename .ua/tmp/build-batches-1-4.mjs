import fs from 'node:fs'
import path from 'node:path'

const root = 'D:/StratonAlly/Code/spareautomation'
const uaDir = path.join(root, '.ua')
const batchesDoc = JSON.parse(fs.readFileSync(path.join(uaDir, 'intermediate/batches.json'), 'utf8'))

const purposeByPath = {
  'src/components/shopify/AddToCartButton.tsx': 'Renders the product add-to-cart control and coordinates Shopify cart creation, line insertion, browser cart persistence, loading state, and failure feedback.',
  'src/components/shopify/AddToQuoteButton.tsx': 'Adds a selected product and quantity to the browser-stored quote, presenting immediate confirmation to the shopper.',
  'src/components/shopify/BuildQuoteFromCartButton.tsx': 'Converts the current Shopify cart lines into a locally stored quote and directs the shopper into the quote workflow.',
  'src/components/shopify/CollectionPage.tsx': 'Builds a collection landing page with site chrome, product filtering, sorting, empty states, and reusable product cards.',
  'src/components/shopify/PaymentMarks.tsx': 'Provides reusable payment-brand artwork, including card and PayPal marks, for storefront trust and checkout messaging.',
  'src/components/shopify/ProductCard.tsx': 'Presents a Shopify product summary with image, pricing, availability, product navigation, and a quick add-to-cart action.',
  'src/components/shopify/ProductDetail.tsx': 'Implements the full product-detail experience: gallery, variant and quantity selection, VAT-aware pricing, stock status, technical specifications, downloads, videos with consent, support links, cart actions, and quote actions.',
  'src/components/shopify/ReturnRequestForm.tsx': 'Runs the signed-in customer return-request workflow, including order lookup, item selection, reason/details capture, validation, submission, and confirmation.',
  'src/components/shopify/SignInRequired.tsx': 'Displays a consistent sign-in gate with return navigation when an account-only storefront action is attempted anonymously.',
  'src/components/shopify/SiteFooter.tsx': 'Renders the global storefront footer with company, service, policy, contact, and payment information.',
  'src/components/shopify/SiteHeader.tsx': 'Renders the responsive storefront header, catalogue navigation, account links, search access, and cart state.',
  'src/lib/api/shopify.functions.ts': 'Exposes server functions for Shopify storefront operations and customer-account actions while managing the customer access-token session.',
  'src/lib/quote.ts': 'Builds prefilled email and WhatsApp contact links for product questions and quote requests using normalized Shopify product and site contact data.',
  'src/lib/shopify/cart.ts': 'Owns browser session storage of the active Shopify cart identifier.',
  'src/lib/shopify/format.ts': 'Provides Shopify money, VAT, product-price, and image URL formatting helpers shared by storefront views.',
  'src/lib/shopify/quote.ts': 'Defines quote-contact and quote-item structures and owns validation and browser persistence for the quote basket.',
  'src/lib/shopify/types.ts': 'Centralizes the TypeScript shapes used for Shopify products, variants, collections, carts, customers, orders, and resources.',
  'src/lib/site.ts': 'Defines canonical site identity and contact details and converts them into safe email and WhatsApp links.',
  'src/routes/account.tsx': 'Implements the authenticated customer account route with profile details, order history, status presentation, and sign-out behavior.',
  'src/routes/cart.tsx': 'Implements the shopping-cart route with quantity updates, removals, totals, VAT presentation, checkout, and conversion into a quote.',
  'src/routes/delivery-information.tsx': 'Publishes the customer-facing delivery guide, coverage, timing, collection, and contact information with consistent storefront chrome.',
  'src/routes/forgot-password.tsx': 'Provides the customer password-recovery route and submits recovery requests through Shopify.',
  'src/routes/login.tsx': 'Implements customer sign-in with validated credentials, password visibility controls, error handling, redirects, and recovery/registration links.',
  'src/routes/products/$handle.tsx': 'Loads a Shopify product by handle and renders its detailed storefront page, including route-level metadata and not-found handling.',
  'src/routes/products/index.tsx': 'Implements the searchable, filterable, paginated product catalogue and synchronizes catalogue state with URL search parameters.',
  'src/routes/quote.tsx': 'Implements the quote-request basket and form, including item editing, customer details, validation, mail handoff, and quote persistence.',
  'src/routes/register.tsx': 'Implements customer registration with address and contact fields, consent controls, Shopify account creation, and detailed validation/error feedback.',
  'src/routes/resources.tsx': 'Aggregates product manuals, technical documents, and videos into a searchable resources library with consent-aware embedded media.',
  'src/routes/returns.tsx': 'Combines returns-policy guidance with the authenticated return-request form and route metadata.',
  'src/routes/search.tsx': 'Maps a search query into the catalogue experience while preserving the shared storefront layout.',
  'src/routes/track-order.tsx': 'Provides order-tracking guidance and an authenticated lookup path for customer orders.',
  'tests/unit/format.spec.ts': 'Verifies VAT arithmetic, product price formatting, and related Shopify monetary presentation helpers.',
  'tests/unit/quote-prefill.spec.ts': 'Verifies that product-question and quote-request contact links contain the expected prefilled customer and product context.',

  'src/components/admin/AdminShell.tsx': 'Provides the protected administration layout with navigation, current-staff context, responsive structure, and sign-out controls.',
  'src/components/shopify/CreditAccountApplicationForm.tsx': 'Implements the business credit-account application form with company, contact, trading, consent, validation, and submission states.',
  'src/hooks/use-hydrated.ts': 'Reports when a React component has mounted in the browser so hydration-sensitive UI can avoid server/client mismatches.',
  'src/lib/admin/admin.functions.ts': 'Defines the server-function boundary for staff authentication and CMS administration, including submissions, content, products, resources, settings, and audit-aware updates.',
  'src/lib/admin/auth.server.ts': 'Owns staff password hashing, session authentication, authorization guards, login/logout, and initial administrator seeding.',
  'src/lib/api/cms.functions.ts': 'Receives public CMS-backed form submissions and serves managed site content while enforcing validation, rate limits, signed uploads, and notification behavior.',
  'src/lib/api/example.functions.ts': 'Contains the small example server-function operations retained as a framework integration reference.',
  'src/lib/cms/rate-limit.ts': 'Implements an in-memory sliding-window request limiter used to protect public form and upload endpoints.',
  'src/lib/config.server.ts': 'Validates and returns the server runtime configuration for database, Shopify, administration, mail, and public URL integrations.',
  'src/lib/db/index.server.ts': 'Creates and caches the PostgreSQL/Drizzle database connection used by server-side CMS and administration code.',
  'src/lib/db/migrate.server.ts': 'Runs ordered database migrations safely and records applied versions before the application uses CMS storage.',
  'src/lib/db/schema.ts': 'Defines the Drizzle/PostgreSQL schema for staff users, managed content, product resources, submissions, settings, and migration metadata.',
  'src/lib/error-capture.ts': 'Stores and consumes the most recently captured server-rendering error so catastrophic failures can be converted into a stable response.',
  'src/lib/error-page.ts': 'Produces the standalone HTML error page used when normal application rendering cannot complete.',
  'src/lib/notify.server.ts': 'Sends transactional notifications through SMTP or Resend and provides the sales-desk notification entry point.',
  'src/lib/shopify/admin.server.ts': 'Wraps authenticated Shopify Admin GraphQL requests with endpoint, token, error, and response handling.',
  'src/lib/shopify/customer-sync.server.ts': 'Synchronizes registered and credit-account customers into Shopify, maps business metadata, and handles email marketing unsubscription.',
  'src/lib/shopify/fragments.ts': 'Centralizes reusable Shopify Storefront GraphQL fragments for product, variant, price, image, cart, customer, order, and resource fields.',
  'src/lib/shopify/queries.server.ts': 'Implements the Shopify Storefront API query and mutation layer for catalogue browsing, resources, carts, customer accounts, and order history.',
  'src/lib/shopify/storefront.server.ts': 'Wraps Shopify Storefront GraphQL requests with configured credentials, consistent headers, response decoding, and error propagation.',
  'src/routes/admin/index.tsx': 'Renders the administration dashboard with CMS totals, submission summaries, operational shortcuts, and protected staff context.',
  'src/routes/admin/login.tsx': 'Provides the staff login route, validates credentials, and redirects authenticated administrators into the CMS.',
  'src/routes/admin/submissions.$id.tsx': 'Displays a full CMS submission record, attachments, status controls, internal notes, deletion, and type-specific customer details.',
  'src/server.ts': 'Defines the production server entry point and hardens all responses with normalization and security headers, including catastrophic SSR fallback handling.',
  'src/start.ts': 'Connects TanStack Start request handling to the project server runtime and error-capture boundary.',
  'tests/unit/customer-sync.spec.ts': 'Verifies Shopify customer synchronization input mapping and customer-mutation failure handling.',
  'tests/unit/rate-limit.spec.ts': 'Verifies the sliding-window limiter accepts requests within quota and rejects excess traffic.',

  'scripts/sync-shopify-collections.ts': 'Synchronizes the project catalogue taxonomy with Shopify collections through the Shopify CLI, creating or updating collection definitions as needed.',
  'src/components/shopify/InfoPage.tsx': 'Provides the shared visual layout for informational storefront pages with breadcrumbs, hero treatment, article content, and site chrome.',
  'src/components/shopify/SupportRequestForm.tsx': 'Implements the general support/contact request workflow with category selection, contact details, optional attachment, validation, and submission feedback.',
  'src/lib/catalog.ts': 'Defines the spare-parts catalogue taxonomy, collection mappings, route lookup helpers, and normalized catalogue search/filter behavior.',
  'src/lib/seo.ts': 'Builds consistent TanStack route head metadata from a page title and description.',
  'src/routeTree.gen.ts': 'Generated TanStack Router route-tree metadata connecting every file route, parent route, path, and typed route registration.',
  'src/router.tsx': 'Creates the application router with the generated route tree and restores scroll position between navigations.',
  'src/routes/about-us.tsx': 'Publishes the company overview and customer-service positioning using the shared informational page layout.',
  'src/routes/asphalt.tsx': 'Maps the asphalt category route to its configured Shopify collection landing page.',
  'src/routes/automation.tsx': 'Maps the automation category route to its configured Shopify collection landing page.',
  'src/routes/concrete.tsx': 'Maps the concrete category route to its configured Shopify collection landing page.',
  'src/routes/contact-us.tsx': 'Publishes contact channels and operating information alongside the managed support-request form.',
  'src/routes/control-panels-software.tsx': 'Maps the control-panels and software category route to its configured Shopify collection landing page.',
  'src/routes/cookies.tsx': 'Publishes the site cookie policy using the standard informational page layout.',
  'src/routes/credit-account.tsx': 'Hosts the business credit-account application workflow and supporting route metadata.',
  'src/routes/disclaimer.tsx': 'Publishes the legal disclaimer for product information, external links, and liability.',
  'src/routes/got-a-question.tsx': 'Hosts the general customer support form for product and service questions.',
  'src/routes/home-controls.tsx': 'Maps the home-controls category route to its configured Shopify collection landing page.',
  'src/routes/index.tsx': 'Implements the storefront home page with hero content, category discovery, service benefits, featured products, calls to action, and global site chrome.',
  'src/routes/new-arrivals.tsx': 'Maps the new-arrivals route to the configured Shopify collection landing page.',
  'src/routes/packing.tsx': 'Maps the packing category route to its configured Shopify collection landing page.',
  'src/routes/privacy-policy.tsx': 'Publishes the privacy policy covering collected data, purposes, rights, retention, and contact details.',
  'src/routes/returns-policy.tsx': 'Publishes the returns eligibility, exclusions, process, refund, and contact policy.',
  'src/routes/terms-and-conditions.tsx': 'Publishes the storefront terms governing orders, payment, delivery, liability, and use of the site.',
  'src/routes/unsubscribe.tsx': 'Handles customer email-marketing unsubscribe requests and presents the resulting status.',
  'tests/unit/catalog.spec.ts': 'Verifies catalogue route resolution, query normalization, filter mapping, and collection lookup helpers.',
}

const uiDescriptions = {
  'accordion.tsx': 'Composable accessible accordion primitives for collapsible content sections.',
  'alert-dialog.tsx': 'Accessible modal confirmation primitives with structured header, body, action, and cancellation areas.',
  'alert.tsx': 'Styled alert container and description primitives for status and warning messages.',
  'avatar.tsx': 'Avatar image and fallback primitives for user identity presentation.',
  'badge.tsx': 'Variant-aware badge primitive for compact labels and statuses.',
  'breadcrumb.tsx': 'Accessible breadcrumb navigation primitives with separators, current-page state, and overflow indication.',
  'button.tsx': 'Variant and size-aware button primitive supporting composition through Radix Slot.',
  'calendar.tsx': 'Styled calendar and day-button primitives built around react-day-picker with range and navigation support.',
  'card.tsx': 'Card container primitives for consistently structured headers, content, descriptions, and footers.',
  'carousel.tsx': 'Accessible carousel primitives backed by Embla, including orientation, keyboard navigation, controls, and context.',
  'chart.tsx': 'Recharts composition helpers providing themed colors, responsive containers, tooltips, legends, and payload-to-series configuration.',
  'checkbox.tsx': 'Accessible checkbox primitive with checked-state icon and project styling.',
  'command.tsx': 'Command palette primitives for searchable actions, dialogs, grouped results, empty states, and shortcuts.',
  'context-menu.tsx': 'Accessible context-menu primitives for items, submenus, radio/checkbox choices, labels, separators, and shortcuts.',
  'dialog.tsx': 'Accessible dialog primitives with overlay, close control, structured header/footer, title, and description.',
  'drawer.tsx': 'Responsive drawer primitives with optional background scaling and structured content areas.',
  'dropdown-menu.tsx': 'Accessible dropdown-menu primitives for items, submenus, selectable choices, labels, separators, and shortcuts.',
  'form.tsx': 'React Hook Form integration primitives that connect field state, labels, controls, descriptions, and accessible error messages.',
  'hover-card.tsx': 'Accessible hover-card trigger and content primitives for contextual previews.',
  'input-otp.tsx': 'One-time-password input primitives with grouped slots, caret rendering, and separators.',
  'input.tsx': 'Consistently styled native input primitive with focus, invalid, file, and disabled states.',
  'label.tsx': 'Accessible styled label primitive built on Radix Label.',
  'menubar.tsx': 'Accessible menubar primitives supporting menus, submenus, radio/checkbox choices, shortcuts, labels, and separators.',
}

function words(name) {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').toLowerCase()
}

function fileSummary(filePath) {
  if (purposeByPath[filePath]) return purposeByPath[filePath]
  const base = path.basename(filePath)
  if (filePath.startsWith('src/components/ui/') && uiDescriptions[base]) return uiDescriptions[base]
  return `Provides the ${words(path.parse(base).name)} implementation used by the application.`
}

function fileTags(filePath) {
  const base = path.basename(filePath)
  if (/\.spec\.|\.test\./.test(base)) return ['test', 'unit-test', 'validation']
  if (filePath.startsWith('src/components/ui/')) return ['component', 'ui-primitive', 'accessibility', words(path.parse(base).name).replaceAll(' ', '-')]
  if (filePath.startsWith('src/components/admin/')) return ['component', 'admin', 'cms', 'layout']
  if (filePath.startsWith('src/components/shopify/')) return ['component', 'storefront', 'shopify', 'customer-experience']
  if (filePath.startsWith('src/routes/admin/')) return ['route', 'admin', 'cms', 'component']
  if (filePath.startsWith('src/routes/')) return ['route', 'page-component', 'storefront']
  if (filePath.startsWith('src/lib/api/')) return ['api-handler', 'server-function', 'validation']
  if (filePath.includes('/db/')) return ['database', 'data-model', 'postgresql']
  if (filePath.includes('/shopify/')) return ['shopify', 'service', 'integration']
  if (filePath.startsWith('src/lib/')) return ['utility', 'service', 'application-core']
  if (filePath.startsWith('scripts/')) return ['script', 'automation', 'shopify', 'data-sync']
  if (filePath.endsWith('routeTree.gen.ts')) return ['generated', 'routing', 'type-definition']
  if (base === 'server.ts' || base === 'start.ts') return ['entry-point', 'server', 'runtime']
  if (base === 'router.tsx') return ['entry-point', 'routing', 'configuration']
  return ['application', 'typescript', 'module']
}

function functionSummary(name, parentSummary) {
  const label = words(name)
  if (/^[A-Z]/.test(name)) return `Renders the ${label} UI and owns the interaction and presentation behavior described by its module.`
  if (name.startsWith('get')) return `Retrieves ${words(name.slice(3))} for the module's workflow, applying its required normalization and error handling.`
  if (name.startsWith('set')) return `Persists ${words(name.slice(3))} for later use by the associated workflow.`
  if (name.startsWith('clear')) return `Removes the persisted ${words(name.slice(5))} state.`
  if (name.startsWith('add')) return `Adds ${words(name.slice(3))} while preserving the module's storage and data-shape invariants.`
  if (name.startsWith('create')) return `Creates ${words(name.slice(6))} through the appropriate Shopify or application service boundary.`
  if (name.startsWith('update')) return `Updates ${words(name.slice(6))} and returns the normalized result to callers.`
  if (name.startsWith('remove')) return `Removes ${words(name.slice(6))} through the owning service boundary.`
  if (name.startsWith('format')) return `Formats ${words(name.slice(6))} for consistent storefront presentation.`
  if (name.startsWith('normalize')) return `Normalizes ${words(name.slice(9))} into the canonical form expected by downstream code.`
  if (name.startsWith('parse')) return `Parses ${words(name.slice(5))} into the project's normalized application shape.`
  if (name.startsWith('sync')) return `Synchronizes ${words(name.slice(4))} with Shopify while preserving project field mappings and failure semantics.`
  if (name.startsWith('send') || name.startsWith('notify')) return `Sends ${label} through the configured notification provider with consistent failure handling.`
  if (name.startsWith('require')) return `Enforces ${words(name.slice(7))} and rejects unauthorized access before protected work proceeds.`
  if (name.startsWith('is') || name.startsWith('has') || name.startsWith('matches')) return `Checks whether ${label} satisfies the module's validation rule.`
  if (name.startsWith('use')) return `Exposes the ${label} React hook and enforces the context or lifecycle assumptions required by consumers.`
  if (name.endsWith('Mailto') || name.endsWith('WhatsApp')) return `Builds the ${label} contact link with prefilled product, quote, and customer context.`
  if (name.includes('Field') || name.includes('Textarea')) return `Renders the reusable ${label} form control with labels, validation state, and accessible feedback.`
  if (name.includes('Page') || name === 'Home') return `Renders the ${label} route and coordinates its data, state, actions, and shared site layout.`
  if (name === 'admin') return 'Executes Shopify Admin GraphQL through the locally installed Shopify CLI and returns validated response data to the synchronization script.'
  return `Implements ${label} as a significant part of this module. ${parentSummary.split('.')[0]}.`
}

function functionTags(name, filePath) {
  if (/^[A-Z]/.test(name)) return ['component', 'react', 'ui-behavior']
  if (/^(get|set|clear|add)/.test(name) && filePath.includes('quote')) return ['utility', 'quote', 'browser-storage']
  if (/^(get|set|clear)/.test(name) && filePath.includes('cart')) return ['utility', 'cart', 'browser-storage']
  if (/^(get|create|add|update|remove)/.test(name) && filePath.includes('shopify')) return ['service', 'shopify', 'api-operation']
  if (/^(format|calculate|normalize|parse)/.test(name)) return ['utility', 'transformation', 'validation']
  if (/^(send|notify)/.test(name)) return ['service', 'notification', 'integration']
  if (/^(require|login|logout|hash|seed)/.test(name)) return ['authentication', 'security', 'admin']
  if (/^(is|has|matches)/.test(name)) return ['validation', 'security', 'predicate']
  if (name.startsWith('use')) return ['hook', 'react', 'state']
  return ['function', 'application-logic', ...fileTags(filePath).slice(0, 1)]
}

function complexity(nonEmpty) {
  if (nonEmpty > 200) return 'complex'
  if (nonEmpty >= 50) return 'moderate'
  return 'simple'
}

function addUnique(items, item, key) {
  if (!items.some((candidate) => candidate[key] === item[key])) items.push(item)
}

for (const batchIndex of [1, 2, 3, 4]) {
  const batch = batchesDoc.batches.find((item) => item.batchIndex === batchIndex)
  if (!batch) throw new Error(`Missing batch ${batchIndex}`)
  const extraction = JSON.parse(fs.readFileSync(path.join(uaDir, `tmp/ua-file-extract-results-${batchIndex}.json`), 'utf8'))
  if (!extraction.scriptCompleted || extraction.filesAnalyzed !== batch.files.length) {
    throw new Error(`Incomplete extraction for batch ${batchIndex}`)
  }

  const nodes = []
  const edges = []
  for (const result of extraction.results) {
    const fileId = `file:${result.path}`
    const summary = fileSummary(result.path)
    addUnique(nodes, {
      id: fileId,
      type: 'file',
      name: path.basename(result.path),
      filePath: result.path,
      summary,
      tags: fileTags(result.path).slice(0, 5),
      complexity: complexity(result.nonEmptyLines),
      ...(result.path.endsWith('routeTree.gen.ts') ? { languageNotes: 'Generated TanStack Router code should be regenerated from route files rather than edited by hand.' } : {}),
    }, 'id')

    for (const importedPath of batch.batchImportData[result.path] ?? []) {
      edges.push({ source: fileId, target: `file:${importedPath}`, type: 'imports', direction: 'forward', weight: 0.7 })
    }

    const exportedNames = new Set((result.exports ?? []).map((item) => item.name))
    const functionsByName = new Map()
    for (const fn of result.functions ?? []) {
      const lineCount = fn.endLine - fn.startLine + 1
      if (lineCount < 10 && !exportedNames.has(fn.name)) continue
      const existing = functionsByName.get(fn.name)
      if (!existing || existing.endLine - existing.startLine < lineCount) functionsByName.set(fn.name, fn)
    }
    for (const fn of functionsByName.values()) {
      const nodeId = `function:${result.path}:${fn.name}`
      nodes.push({
        id: nodeId,
        type: 'function',
        name: fn.name,
        filePath: result.path,
        lineRange: [fn.startLine, fn.endLine],
        summary: functionSummary(fn.name, summary),
        tags: functionTags(fn.name, result.path).slice(0, 5),
        complexity: complexity(fn.endLine - fn.startLine + 1),
      })
      edges.push({ source: fileId, target: nodeId, type: 'contains', direction: 'forward', weight: 1.0 })
      if (exportedNames.has(fn.name)) edges.push({ source: fileId, target: nodeId, type: 'exports', direction: 'forward', weight: 0.8 })
    }

    const classesByName = new Map()
    for (const cls of result.classes ?? []) {
      const lineCount = cls.endLine - cls.startLine + 1
      if (lineCount < 20 && (cls.methods ?? []).length < 2 && !exportedNames.has(cls.name)) continue
      classesByName.set(cls.name, cls)
    }
    for (const cls of classesByName.values()) {
      const nodeId = `class:${result.path}:${cls.name}`
      nodes.push({
        id: nodeId,
        type: 'class',
        name: cls.name,
        filePath: result.path,
        lineRange: [cls.startLine, cls.endLine],
        summary: cls.name === 'SlidingWindowRateLimiter'
          ? 'Tracks request timestamps per key and enforces a maximum request count within a moving time window.'
          : `Implements the ${words(cls.name)} abstraction used by this module.`,
        tags: cls.name === 'SlidingWindowRateLimiter' ? ['rate-limiting', 'security', 'service'] : ['class', 'application-logic', 'service'],
        complexity: complexity(cls.endLine - cls.startLine + 1),
      })
      edges.push({ source: fileId, target: nodeId, type: 'contains', direction: 'forward', weight: 1.0 })
      if (exportedNames.has(cls.name)) edges.push({ source: fileId, target: nodeId, type: 'exports', direction: 'forward', weight: 0.8 })
    }
  }

  const expectedImports = batch.files.reduce((sum, file) => sum + (batch.batchImportData[file.path] ?? []).length, 0)
  const actualImports = edges.filter((edge) => edge.type === 'imports').length
  if (expectedImports !== actualImports) throw new Error(`Batch ${batchIndex}: expected ${expectedImports} imports, emitted ${actualImports}`)
  if (new Set(nodes.map((node) => node.id)).size !== nodes.length) throw new Error(`Batch ${batchIndex}: duplicate node ids`)
  if (edges.some((edge) => edge.source === edge.target)) throw new Error(`Batch ${batchIndex}: self-referencing edge`)

  const parts = Math.ceil(Math.max(nodes.length / 60, edges.length / 120))
  const sortedFiles = batch.files.map((file) => file.path).sort((a, b) => a.localeCompare(b))
  const filesPerPart = Math.ceil(sortedFiles.length / parts)
  const written = []
  for (let part = 0; part < parts; part += 1) {
    const partFiles = new Set(sortedFiles.slice(part * filesPerPart, (part + 1) * filesPerPart))
    const partNodes = nodes.filter((node) => partFiles.has(node.filePath))
    const partNodeIds = new Set(partNodes.map((node) => node.id))
    const partEdges = edges.filter((edge) => partNodeIds.has(edge.source))
    const outputName = parts === 1 ? `batch-${batchIndex}.json` : `batch-${batchIndex}-part-${part + 1}.json`
    const outputPath = path.join(uaDir, 'intermediate', outputName)
    fs.writeFileSync(outputPath, `${JSON.stringify({ nodes: partNodes, edges: partEdges }, null, 2)}\n`, 'utf8')
    JSON.parse(fs.readFileSync(outputPath, 'utf8'))
    written.push({ outputName, nodeCount: partNodes.length, edgeCount: partEdges.length })
  }
  console.log(JSON.stringify({ batchIndex, totalNodes: nodes.length, totalEdges: edges.length, expectedImports, parts: written }))
}
