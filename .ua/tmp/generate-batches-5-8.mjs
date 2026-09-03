import fs from "node:fs";
import path from "node:path";

const projectRoot = "D:/StratonAlly/Code/spareautomation";
const uaDir = path.join(projectRoot, ".ua");
const batchesDoc = JSON.parse(fs.readFileSync(path.join(uaDir, "intermediate/batches.json"), "utf8"));

const uiSummaries = {
  "navigation-menu.tsx": "Provides accessible, styled navigation-menu primitives for site navigation, including triggers, content panels, indicators, and a responsive viewport.",
  "pagination.tsx": "Provides accessible pagination composition primitives and previous, next, link, and ellipsis controls styled with the shared button system.",
  "popover.tsx": "Wraps Radix popover primitives with the project's trigger, anchor, portal, and styled content conventions.",
  "progress.tsx": "Provides an accessible progress indicator whose visual transform reflects the supplied completion value.",
  "radio-group.tsx": "Wraps Radix radio-group primitives with project styling for grouped choices and selected-state indicators.",
  "resizable.tsx": "Provides resizable panel-group and handle components, including an optional visible grip for split layouts.",
  "scroll-area.tsx": "Wraps Radix scroll-area primitives with styled viewport, corner, and horizontal or vertical scrollbars.",
  "select.tsx": "Provides the complete styled select-control family, including trigger, portal content, items, labels, separators, and scroll controls.",
  "separator.tsx": "Provides a styled horizontal or vertical Radix separator with decorative and semantic modes.",
  "sheet.tsx": "Provides an accessible slide-over sheet system with portal, overlay, directional content variants, close control, and structured header/footer elements.",
  "sidebar.tsx": "Implements the application's responsive sidebar system, including context-managed state, keyboard toggling, mobile sheets, rails, menus, groups, badges, and skeleton states.",
  "skeleton.tsx": "Provides a reusable animated placeholder block for loading states.",
  "slider.tsx": "Wraps the Radix slider with a styled track, range, and draggable thumb.",
  "switch.tsx": "Wraps the Radix switch with accessible checked-state styling and a moving thumb.",
  "table.tsx": "Provides styled semantic table primitives for headers, bodies, rows, cells, captions, and footers, with horizontal overflow support.",
  "tabs.tsx": "Wraps Radix tabs with styled lists, triggers, and content panels for keyboard-accessible tabbed interfaces.",
  "textarea.tsx": "Provides the shared styled textarea control with focus, disabled, and validation states.",
  "toggle-group.tsx": "Provides single- or multiple-selection toggle groups that propagate shared size and variant styling to each item.",
  "toggle.tsx": "Defines the reusable toggle control and its visual variants for default, outlined, and sized states.",
  "tooltip.tsx": "Wraps Radix tooltip primitives with the project's provider, trigger, portal, and animated content conventions."
};

const functionSummaries = {
  Pagination: "Renders the semantic navigation container for a pagination control.",
  PaginationLink: "Renders a pagination link using shared button variants and marks the active page accessibly.",
  PaginationPrevious: "Renders a previous-page link with an icon and screen-size-aware label.",
  PaginationNext: "Renders a next-page link with an icon and screen-size-aware label.",
  PaginationEllipsis: "Renders a non-interactive ellipsis and an accessible indication that more pages exist.",
  ResizablePanelGroup: "Styles and orients a resizable panel group for horizontal or vertical layouts.",
  ResizableHandle: "Renders the draggable separator between panels, optionally with a visible grip.",
  SheetHeader: "Groups and styles a sheet's title and descriptive header content.",
  SheetFooter: "Groups and aligns a sheet's action controls across responsive layouts.",
  useSidebar: "Returns the nearest sidebar context and fails fast when used outside its provider.",
  Skeleton: "Renders an animated placeholder while content is loading.",
  useIsMobile: "Tracks whether the viewport is below the mobile breakpoint using matchMedia and a change listener.",
  cn: "Combines conditional class values and resolves conflicting Tailwind utilities into one class string.",
  CookieConsent: "Loads saved cookie choices, presents consent and preference controls, persists decisions, and publishes browser events when consent changes.",
  PreferenceCard: "Renders one cookie category with description and a controlled checkbox, including immutable necessary cookies.",
  reportLovableError: "Forwards client-side errors and route context to the optional Lovable telemetry bridge without affecting server rendering.",
  NotFoundComponent: "Renders the root-level 404 page with explanatory copy and a link back to the storefront.",
  ErrorComponent: "Reports root route failures and renders recovery actions that invalidate the router or return home.",
  RootShell: "Defines the root HTML document shell and mounts TanStack head metadata and scripts around routed content."
};

function complexity(nonEmptyLines) {
  return nonEmptyLines > 200 ? "complex" : nonEmptyLines >= 50 ? "moderate" : "simple";
}

function fileNode(result) {
  const name = path.posix.basename(result.path);
  let summary = uiSummaries[name];
  let tags = ["component", "ui-primitive", "accessibility", "react"];
  if (result.path === "src/hooks/use-mobile.tsx") {
    summary = "Provides the responsive viewport hook used by layout components to switch behavior below the mobile breakpoint.";
    tags = ["hook", "responsive-design", "browser-api", "react"];
  } else if (result.path === "src/lib/utils.ts") {
    summary = "Provides the shared class-name utility that combines conditional classes and resolves Tailwind conflicts.";
    tags = ["utility", "styling", "tailwind-css", "serialization"];
  } else if (result.path === "src/components/shopify/CookieConsent.tsx") {
    summary = "Implements the customer-facing cookie consent banner, detailed privacy preferences, local persistence, and consent update events.";
    tags = ["component", "privacy", "consent-management", "browser-storage"];
  } else if (result.path === "src/lib/lovable-error-reporting.ts") {
    summary = "Defines the optional browser telemetry adapter used by the root error boundary to report handled storefront failures to Lovable.";
    tags = ["utility", "error-reporting", "telemetry", "browser-api"];
  } else if (result.path === "src/routes/__root.tsx") {
    summary = "Defines the TanStack Router root route, document metadata, organization structured data, global shell, cookie banner, and root-level 404 and error experiences.";
    tags = ["entry-point", "routing", "error-boundary", "seo", "component"];
  }
  if (!summary) summary = `Provides the shared ${name.replace(/\.tsx?$/, "").replaceAll("-", " ")} user-interface primitive used by application screens.`;
  return {
    id: `file:${result.path}`,
    type: "file",
    name,
    filePath: result.path,
    summary,
    tags,
    complexity: complexity(result.nonEmptyLines)
  };
}

function functionNode(filePath, fn) {
  const isHook = fn.name.startsWith("use");
  return {
    id: `function:${filePath}:${fn.name}`,
    type: "function",
    name: fn.name,
    filePath,
    lineRange: [fn.startLine, fn.endLine],
    summary: functionSummaries[fn.name] ?? `Implements the ${fn.name} component behavior within ${path.posix.basename(filePath)}.`,
    tags: isHook ? ["hook", "react", "state-management"] : ["component", "react", "user-interface"],
    complexity: complexity(fn.endLine - fn.startLine + 1)
  };
}

function edge(source, target, type, weight) {
  return { source, target, type, direction: "forward", weight };
}

function makeCodeBatch(batchIndex) {
  const batch = batchesDoc.batches.find((item) => item.batchIndex === batchIndex);
  const extracted = JSON.parse(fs.readFileSync(path.join(uaDir, `tmp/ua-file-extract-results-${batchIndex}.json`), "utf8"));
  const nodes = [];
  const edges = [];
  const exportedByFile = new Map();
  const createdFunctions = new Map();

  for (const result of extracted.results) {
    nodes.push(fileNode(result));
    const exported = new Set((result.exports ?? []).map((item) => item.name));
    exportedByFile.set(result.path, exported);
    for (const fn of result.functions ?? []) {
      const significant = exported.has(fn.name) || fn.endLine - fn.startLine + 1 >= 10;
      if (!significant) continue;
      const node = functionNode(result.path, fn);
      nodes.push(node);
      createdFunctions.set(`${result.path}:${fn.name}`, node.id);
      edges.push(edge(`file:${result.path}`, node.id, "contains", 1.0));
      if (exported.has(fn.name)) edges.push(edge(`file:${result.path}`, node.id, "exports", 0.8));
    }
  }

  for (const file of batch.files) {
    for (const importedPath of batch.batchImportData[file.path] ?? []) {
      edges.push(edge(`file:${file.path}`, `file:${importedPath}`, "imports", 0.7));
    }
  }

  if (batchIndex === 5) {
    const cnCallers = [
      ["src/components/ui/pagination.tsx", "Pagination"],
      ["src/components/ui/pagination.tsx", "PaginationLink"],
      ["src/components/ui/pagination.tsx", "PaginationPrevious"],
      ["src/components/ui/pagination.tsx", "PaginationNext"],
      ["src/components/ui/pagination.tsx", "PaginationEllipsis"],
      ["src/components/ui/resizable.tsx", "ResizablePanelGroup"],
      ["src/components/ui/resizable.tsx", "ResizableHandle"],
      ["src/components/ui/sheet.tsx", "SheetHeader"],
      ["src/components/ui/sheet.tsx", "SheetFooter"],
      ["src/components/ui/skeleton.tsx", "Skeleton"]
    ];
    for (const [filePath, name] of cnCallers) {
      edges.push(edge(`function:${filePath}:${name}`, "function:src/lib/utils.ts:cn", "calls", 0.8));
    }
    edges.push(edge("function:src/components/ui/pagination.tsx:PaginationLink", "function:src/components/ui/button.tsx:buttonVariants", "calls", 0.8));
  } else {
    edges.push(edge("function:src/components/shopify/CookieConsent.tsx:CookieConsent", "function:src/components/shopify/CookieConsent.tsx:PreferenceCard", "contains", 1.0));
    edges.push(edge("function:src/routes/__root.tsx:ErrorComponent", "function:src/lib/lovable-error-reporting.ts:reportLovableError", "calls", 0.8));
  }

  const expectedImports = batch.files.reduce((sum, file) => sum + (batch.batchImportData[file.path] ?? []).length, 0);
  const actualImports = edges.filter((item) => item.type === "imports").length;
  if (expectedImports !== actualImports) throw new Error(`Batch ${batchIndex}: expected ${expectedImports} import edges, found ${actualImports}`);
  return { nodes, edges };
}

function makeInfraBatch7() {
  const nodes = [
    { id: "service:.dockerignore", type: "service", name: ".dockerignore", filePath: ".dockerignore", summary: "Excludes dependencies, build outputs, repository metadata, documentation, and local Compose files from the Docker build context.", tags: ["infrastructure", "containerization", "build-context"], complexity: "simple" },
    { id: "service:Dockerfile", type: "service", name: "Dockerfile", filePath: "Dockerfile", summary: "Builds the TanStack application in a Node 22 Alpine stage, then produces a production runtime image containing the server output, Drizzle migrations, upload storage, and boot entrypoint.", tags: ["containerization", "infrastructure", "deployment", "multi-stage-build"], complexity: "simple", languageNotes: "A two-stage build separates dependency-heavy compilation from the runtime image and runs with owned application data." },
    { id: "service:Dockerfile:build", type: "service", name: "build", summary: "Installs locked npm dependencies and compiles the application into its production output.", tags: ["containerization", "build-system", "nodejs"], complexity: "simple" },
    { id: "service:Dockerfile:runtime", type: "service", name: "runtime", summary: "Runs the compiled server on port 80 with migrations, persistent upload storage, and a dedicated container entrypoint.", tags: ["containerization", "runtime", "deployment"], complexity: "simple" },
    { id: "service:docker-compose.override.yml", type: "service", name: "docker-compose.override.yml", filePath: "docker-compose.override.yml", summary: "Adds the local-only host port mapping so Docker Compose exposes the application at APP_PORT, defaulting to port 8080.", tags: ["orchestration", "local-development", "configuration"], complexity: "simple" },
    { id: "service:docker-compose.yml", type: "service", name: "docker-compose.yml", filePath: "docker-compose.yml", summary: "Orchestrates the production application and PostgreSQL 16 database with health-gated startup, persistent CMS and upload volumes, environment configuration, and restart policies.", tags: ["orchestration", "infrastructure", "database", "deployment"], complexity: "moderate" }
  ];
  const edges = [
    edge("service:Dockerfile", "service:Dockerfile:build", "contains", 1.0),
    edge("service:Dockerfile", "service:Dockerfile:runtime", "contains", 1.0),
    edge("service:Dockerfile:runtime", "service:Dockerfile:build", "depends_on", 0.6),
    edge("service:.dockerignore", "service:Dockerfile", "related", 0.5),
    edge("service:docker-compose.yml", "service:Dockerfile", "depends_on", 0.6),
    edge("service:docker-compose.override.yml", "service:docker-compose.yml", "related", 0.5)
  ];
  return { nodes, edges };
}

function makeInfraBatch8() {
  return {
    nodes: [{
      id: "pipeline:.github/workflows/quality.yml",
      type: "pipeline",
      name: "quality.yml",
      filePath: ".github/workflows/quality.yml",
      summary: "Runs the pull-request and main-branch quality gate with PostgreSQL, locked Bun installation, linting, type checking, Playwright browser setup, tests, and a production build.",
      tags: ["ci-cd", "quality-gate", "testing", "build-system", "database"],
      complexity: "simple"
    }],
    edges: []
  };
}

function validate(batchIndex, fragment) {
  const nodeIds = new Set(fragment.nodes.map((node) => node.id));
  if (nodeIds.size !== fragment.nodes.length) throw new Error(`Batch ${batchIndex}: duplicate node IDs`);
  for (const node of fragment.nodes) {
    if (!node.summary || !node.tags?.length || !["simple", "moderate", "complex"].includes(node.complexity)) throw new Error(`Batch ${batchIndex}: invalid node ${node.id}`);
  }
  const batch = batchesDoc.batches.find((item) => item.batchIndex === batchIndex);
  const knownFiles = new Set();
  for (const item of Object.values(batch.batchImportData ?? {})) for (const target of item) knownFiles.add(target);
  for (const entries of Object.values(batch.neighborMap ?? {})) for (const neighbor of entries) knownFiles.add(neighbor.path);
  for (const item of fragment.edges) {
    if (item.source === item.target) throw new Error(`Batch ${batchIndex}: self edge ${item.source}`);
    const resolvable = (id) => nodeIds.has(id) || [...knownFiles].some((file) => id === `file:${file}` || id.startsWith(`function:${file}:`) || id.startsWith(`class:${file}:`));
    if (!resolvable(item.source) || !resolvable(item.target)) throw new Error(`Batch ${batchIndex}: unresolved edge ${item.source} -> ${item.target}`);
  }
  if (fragment.nodes.length > 60 || fragment.edges.length > 120) throw new Error(`Batch ${batchIndex}: output requires partitioning`);
}

for (const batchIndex of [5, 6, 7, 8]) {
  const fragment = batchIndex <= 6 ? makeCodeBatch(batchIndex) : batchIndex === 7 ? makeInfraBatch7() : makeInfraBatch8();
  validate(batchIndex, fragment);
  const outputPath = path.join(uaDir, `intermediate/batch-${batchIndex}.json`);
  fs.writeFileSync(outputPath, `${JSON.stringify(fragment, null, 2)}\n`, "utf8");
  console.log(`batch-${batchIndex}.json: ${fragment.nodes.length} nodes, ${fragment.edges.length} edges`);
}
