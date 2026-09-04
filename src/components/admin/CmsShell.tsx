import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ChevronDown,
  ChevronsUpDown,
  ExternalLink,
  FileText,
  HelpCircle,
  Images,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Avatar } from "@/components/admin/cms-ui";
import { adminLogout, type AdminSession } from "@/lib/admin/admin.functions";
import { CONTENT_KEYS, CONTENT_REGISTRY } from "@/lib/content/registry";

const SUBMISSION_SEARCH = { type: "all", status: "all", search: "", page: 1 } as const;
const ACTIVITY_SEARCH = { page: 1, action: "" } as const;

type Crumb = { label: string; to?: string };

type CmsShellProps = {
  staff: AdminSession;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  /** Buttons or links rendered at the right of the page header. */
  actions?: ReactNode;
  /** Trail shown above the page title. */
  breadcrumbs?: Crumb[];
  /** Optional count badge for the submissions inbox. */
  inboxCount?: number;
  children: ReactNode;
};

/** Content documents listed under the Content group, driven by the registry. */
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(path.startsWith("/admin/content"));
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDrawerOpen(false);
    setAccountOpen(false);
  }, [path]);

  useEffect(() => {
    if (!accountOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  async function signOut() {
    await adminLogout();
    void navigate({ to: "/admin/login" });
  }

  return (
    <div className="cms">
      <div className="cms-layout">
        {drawerOpen ? (
          <button
            type="button"
            aria-label="Close navigation"
            className="cms-scrim"
            onClick={() => setDrawerOpen(false)}
          />
        ) : null}

        <aside className="cms-sidebar" data-open={drawerOpen ? "true" : "false"}>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            className="cms-btn cms-btn-ghost cms-btn-icon"
            aria-label="Close navigation"
            data-cms-drawer-toggle
            style={{ alignSelf: "flex-end" }}
          >
            <X />
          </button>
          <div className="cms-menu-wrap" ref={accountRef}>
            <button
              type="button"
              className="cms-account"
              onClick={() => setAccountOpen((open) => !open)}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
            >
              <Avatar name={staff.name} />
              <span style={{ minWidth: 0 }}>
                <span className="cms-account-name">{staff.name}</span>
                <span className="cms-account-role">
                  {staff.role === "admin" ? "Administrator" : "Staff"}
                </span>
              </span>
              <ChevronsUpDown aria-hidden="true" />
            </button>
            {accountOpen ? (
              <div className="cms-menu" role="menu" style={{ left: 4, right: 4 }}>
                <div className="cms-menu-label">{staff.email}</div>
                <Link to="/admin/settings" role="menuitem">
                  <Settings aria-hidden="true" /> Settings
                </Link>
                <Link to="/admin/change-password" role="menuitem">
                  <Users aria-hidden="true" /> Change password
                </Link>
                <a href="/" target="_blank" rel="noreferrer" role="menuitem">
                  <ExternalLink aria-hidden="true" /> View website
                </a>
                <div className="cms-menu-sep" />
                <button type="button" role="menuitem" onClick={signOut} className="cms-menu-danger">
                  <LogOut aria-hidden="true" /> Sign out
                </button>
              </div>
            ) : null}
          </div>

          <nav className="cms-nav" aria-label="CMS sections">
            <NavItem
              to="/admin"
              icon={<LayoutDashboard />}
              label="Dashboard"
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
                  width: 15,
                  height: 15,
                  transform: contentOpen ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 120ms ease",
                }}
              />
            </button>
            {contentOpen ? (
              <div className="cms-subnav">
                <NavItem
                  to="/admin/content"
                  label="All documents"
                  active={path === "/admin/content"}
                />
                {CONTENT_LINKS.map((item) => (
                  <NavItem
                    key={item.key}
                    to="/admin/content/$key"
                    params={{ key: item.key }}
                    label={item.label}
                    active={path === `/admin/content/${item.key}`}
                  />
                ))}
              </div>
            ) : null}

            <NavItem
              to="/admin/media"
              icon={<Images />}
              label="Media"
              active={path.startsWith("/admin/media")}
            />
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
                search={ACTIVITY_SEARCH}
                icon={<Activity />}
                label="Activity"
                active={path.startsWith("/admin/activity")}
              />
            ) : null}
          </nav>

          <div className="cms-sidebar-foot">
            <NavItem
              to="/admin/settings"
              icon={<Settings />}
              label="Settings"
              active={path.startsWith("/admin/settings")}
            />
            <a href="/" target="_blank" rel="noreferrer" className="cms-nav-item">
              <HelpCircle />
              <span className="cms-nav-label">View website</span>
              <ExternalLink aria-hidden="true" style={{ marginLeft: "auto", width: 13, height: 13 }} />
            </a>
          </div>
        </aside>

        <div className="cms-main">
          <main id="main-content" className="cms-content">
            <div className="cms-page-head">
              <div style={{ minWidth: 0 }}>
                <div className="cms-row-inline" style={{ gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(true)}
                    className="cms-btn cms-btn-ghost cms-btn-icon"
                    aria-label="Open navigation"
                    data-cms-drawer-toggle
                  >
                    <Menu />
                  </button>
                  {breadcrumbs.length ? (
                    <nav aria-label="Breadcrumb" className="cms-crumbs" style={{ margin: 0 }}>
                      {breadcrumbs.map((crumb) => (
                        <span key={crumb.label} style={{ display: "flex", gap: 6 }}>
                          {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
                          <span aria-hidden="true">/</span>
                        </span>
                      ))}
                      <span>{title}</span>
                    </nav>
                  ) : eyebrow ? (
                    <span className="cms-eyebrow" style={{ margin: 0 }}>
                      {eyebrow}
                    </span>
                  ) : null}
                </div>
                <h1 className="cms-title" style={{ marginTop: 6 }}>
                  {title}
                </h1>
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
  icon?: ReactNode;
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
