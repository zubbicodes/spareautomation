import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  FileText,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { adminLogout, type AdminSession } from "@/lib/admin/admin.functions";
import { CONTENT_KEYS, CONTENT_REGISTRY } from "@/lib/content/registry";

const COLLAPSE_KEY = "sa-cms-sidebar-collapsed";

const SUBMISSION_SEARCH = { type: "all", status: "all", search: "", page: 1 } as const;

type Crumb = { label: string; to?: string };

type CmsShellProps = {
  staff: AdminSession;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  /** Buttons or links rendered at the right of the page header. */
  actions?: ReactNode;
  /** Trail shown in the top bar, excluding the current page. */
  breadcrumbs?: Crumb[];
  /** Optional count badge for the submissions inbox. */
  inboxCount?: number;
  children: ReactNode;
};

/** Content documents grouped for the sidebar, driven by the code registry. */
const CONTENT_LINKS = CONTENT_KEYS.map((key) => ({ key, label: CONTENT_REGISTRY[key].label }));

export function CmsShell({
  staff,
  title,
  eyebrow,
  subtitle,
  actions,
  breadcrumbs = [],
  inboxCount,
  children,
}: CmsShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(path.startsWith("/admin/content"));

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      // Private browsing modes can refuse storage; the default layout is fine.
    }
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  function toggleCollapsed() {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // Ignore storage failures; the preference simply does not persist.
      }
      return next;
    });
  }

  async function signOut() {
    await adminLogout();
    void navigate({ to: "/admin/login" });
  }

  const initials = staff.name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="cms">
      <div className="cms-layout" data-collapsed={collapsed ? "true" : "false"}>
        {drawerOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            className="cms-scrim"
            onClick={() => setDrawerOpen(false)}
          />
        ) : null}

        <aside className="cms-sidebar" data-open={drawerOpen ? "true" : "false"}>
          <div className="cms-brand">
            <span className="cms-brand-mark" aria-hidden="true">
              <ShieldCheck />
            </span>
            <span className="cms-brand-text">
              <span className="cms-brand-name">Spares Automation</span>
              <span className="cms-brand-sub">Content platform</span>
            </span>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="cms-btn cms-btn-ghost cms-btn-icon"
              style={{ marginLeft: "auto", color: "#b9c0cf" }}
              aria-label="Close navigation"
            >
              <X />
            </button>
          </div>

          <nav className="cms-nav" aria-label="CMS sections">
            <NavItem
              to="/admin"
              icon={<LayoutDashboard />}
              label="Overview"
              active={path === "/admin"}
            />
            <NavItem
              to="/admin/submissions"
              search={SUBMISSION_SEARCH}
              icon={<Inbox />}
              label="Submissions"
              active={path.startsWith("/admin/submissions")}
              count={inboxCount}
            />

            <div className="cms-nav-group">Website content</div>
            <button
              type="button"
              className="cms-nav-item"
              data-active={path.startsWith("/admin/content") ? "true" : "false"}
              aria-expanded={contentOpen}
              onClick={() => setContentOpen((open) => !open)}
            >
              <FileText />
              <span className="cms-nav-label">Content</span>
              <ChevronDown
                aria-hidden="true"
                style={{
                  marginLeft: "auto",
                  transform: contentOpen ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 120ms ease",
                }}
              />
            </button>
            {contentOpen ? (
              <div style={{ display: "grid", gap: 2, paddingLeft: 10 }}>
                <NavItem
                  to="/admin/content"
                  icon={<span aria-hidden="true" style={dot} />}
                  label="All documents"
                  active={path === "/admin/content"}
                />
                {CONTENT_LINKS.map((item) => (
                  <NavItem
                    key={item.key}
                    to="/admin/content/$key"
                    params={{ key: item.key }}
                    icon={<span aria-hidden="true" style={dot} />}
                    label={item.label}
                    active={path === `/admin/content/${item.key}`}
                  />
                ))}
              </div>
            ) : null}
            <NavItem
              to="/admin/media"
              icon={<Images />}
              label="Media library"
              active={path.startsWith("/admin/media")}
            />

            <div className="cms-nav-group">Administration</div>
            {staff.role === "admin" ? (
              <NavItem
                to="/admin/users"
                icon={<Users />}
                label="Users"
                active={path.startsWith("/admin/users")}
              />
            ) : null}
            {staff.role === "admin" ? (
              <NavItem
                to="/admin/activity"
                icon={<Activity />}
                label="Activity log"
                active={path.startsWith("/admin/activity")}
              />
            ) : null}
            <NavItem
              to="/admin/settings"
              icon={<Settings />}
              label="Settings"
              active={path.startsWith("/admin/settings")}
            />
          </nav>

          <div className="cms-sidebar-foot">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="cms-nav-item"
              data-active="false"
            >
              <ExternalLink />
              <span className="cms-nav-label">View website</span>
            </a>
            <button type="button" onClick={signOut} className="cms-nav-item">
              <LogOut />
              <span className="cms-nav-label">Sign out</span>
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="cms-nav-item"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
              <span className="cms-nav-label">Collapse</span>
            </button>
          </div>
        </aside>

        <div className="cms-main">
          <header className="cms-topbar">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="cms-btn cms-btn-ghost cms-btn-icon"
              aria-label="Open navigation"
              style={{ display: "inline-flex" }}
              data-cms-drawer-toggle
            >
              <Menu />
            </button>
            <nav aria-label="Breadcrumb" className="cms-crumbs">
              <Link to="/admin">CMS</Link>
              {breadcrumbs.map((crumb) => (
                <span key={crumb.label} style={{ display: "flex", gap: 6 }}>
                  <span aria-hidden="true">/</span>
                  {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
                </span>
              ))}
              <span aria-hidden="true">/</span>
              <span className="cms-crumb-current">{title}</span>
            </nav>
            <div className="cms-topbar-right">
              <Link to="/admin/change-password" className="cms-user">
                <span className="cms-avatar" aria-hidden="true">
                  {initials || "SA"}
                </span>
                <span>
                  <span className="cms-user-name">{staff.name}</span>
                  <span className="cms-user-role">{staff.role}</span>
                </span>
              </Link>
            </div>
          </header>

          <main id="main-content" className="cms-content">
            <div className="cms-page-head">
              <div>
                {eyebrow ? <div className="cms-eyebrow">{eyebrow}</div> : null}
                <h1 className="cms-title">{title}</h1>
                {subtitle ? <p className="cms-subtitle">{subtitle}</p> : null}
              </div>
              {actions ? <div className="cms-page-actions">{actions}</div> : null}
            </div>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

const dot = {
  width: 5,
  height: 5,
  borderRadius: 999,
  background: "currentColor",
  opacity: 0.55,
  display: "block",
} as const;

function NavItem({
  to,
  params,
  search,
  icon,
  label,
  active,
  count,
}: {
  to: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
  icon: ReactNode;
  label: string;
  active: boolean;
  count?: number;
}) {
  return (
    <Link
      to={to}
      params={params as never}
      search={search as never}
      className="cms-nav-item"
      data-active={active ? "true" : "false"}
      title={label}
    >
      {icon}
      <span className="cms-nav-label">{label}</span>
      {count ? <span className="cms-nav-count">{count}</span> : null}
    </Link>
  );
}
