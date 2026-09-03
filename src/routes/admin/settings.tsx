import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ExternalLink, Globe, KeyRound, Mail, Navigation, Phone, ShieldCheck } from "lucide-react";

import { CmsShell } from "@/components/admin/CmsShell";
import { Notice } from "@/components/admin/cms-ui";
import { getAdminSession } from "@/lib/admin/admin.functions";
import { cmsHead } from "@/lib/admin/head";
import { getPublishedContent } from "@/lib/content/content.functions";

export const Route = createFileRoute("/admin/settings")({
  head: () => cmsHead("Settings"),
  loader: async () => {
    const staff = await getAdminSession();
    if (!staff) throw redirect({ to: "/admin/login" });
    if (staff.mustChangePassword) throw redirect({ to: "/admin/change-password" });
    const content = await getPublishedContent();
    return { staff, site: content.site, navigation: content.navigation };
  },
  component: SettingsPage,
});

const ENDPOINTS = [
  { href: "/robots.txt", label: "robots.txt", hint: "Crawler rules, built from published settings" },
  { href: "/sitemap.xml", label: "sitemap.xml", hint: "Public route list with the published domain" },
  { href: "/site.webmanifest", label: "site.webmanifest", hint: "Installable app name and colours" },
];

function SettingsPage() {
  const { staff, site, navigation } = Route.useLoaderData();
  const visibleHeader = navigation.header.filter((item) => item.visible).length;

  return (
    <CmsShell
      staff={staff}
      eyebrow="Configuration"
      title="Settings"
      subtitle="Business details, navigation and the machine-readable files that depend on them. Functional behaviour, validation and integrations stay in code."
    >
      <div className="cms-grid cms-grid-2">
        <section className="cms-card">
          <header className="cms-card-head">
            <Globe aria-hidden="true" style={{ width: 15, height: 15 }} />
            <h2 className="cms-card-title">Business details</h2>
            <Link
              to="/admin/content/$key"
              params={{ key: "site" }}
              className="cms-btn cms-btn-sm"
              style={{ marginLeft: "auto" }}
            >
              Edit
            </Link>
          </header>
          <div className="cms-card-pad">
            <dl className="cms-kv">
              <dt>Business name</dt>
              <dd>{site.name}</dd>
              <dt>Website</dt>
              <dd>
                <a className="cms-link" href={site.url} target="_blank" rel="noreferrer">
                  {site.url}
                </a>
              </dd>
              <dt>Email</dt>
              <dd>
                <Mail aria-hidden="true" style={{ width: 13, height: 13, verticalAlign: "-2px" }} />{" "}
                {site.email}
              </dd>
              <dt>Telephone</dt>
              <dd>
                <Phone aria-hidden="true" style={{ width: 13, height: 13, verticalAlign: "-2px" }} />{" "}
                {site.phoneDisplay}
              </dd>
              <dt>WhatsApp</dt>
              <dd>{site.whatsapp}</dd>
              <dt>Location</dt>
              <dd>
                {site.location} · {site.addressLocality} ({site.addressCountry})
              </dd>
              <dt>Opening hours</dt>
              <dd>{site.hours}</dd>
              <dt>Social handle</dt>
              <dd>{site.socialHandle}</dd>
            </dl>
          </div>
        </section>

        <section className="cms-card">
          <header className="cms-card-head">
            <Navigation aria-hidden="true" style={{ width: 15, height: 15 }} />
            <h2 className="cms-card-title">Navigation and footer</h2>
            <Link
              to="/admin/content/$key"
              params={{ key: "navigation" }}
              className="cms-btn cms-btn-sm"
              style={{ marginLeft: "auto" }}
            >
              Edit
            </Link>
          </header>
          <div className="cms-card-pad cms-stack-sm">
            <p className="cms-muted">
              {visibleHeader} of {navigation.header.length} header links are visible. Labels, order and
              visibility are editable; destinations are locked to approved routes so navigation can
              never break.
            </p>
            <p className="cms-faint" style={{ fontSize: 12.5 }}>
              Footer strapline: “{navigation.footerCopy}”
            </p>
          </div>
        </section>

        <section className="cms-card">
          <header className="cms-card-head">
            <ExternalLink aria-hidden="true" style={{ width: 15, height: 15 }} />
            <h2 className="cms-card-title">Generated files</h2>
          </header>
          <div className="cms-list">
            {ENDPOINTS.map((endpoint) => (
              <a
                key={endpoint.href}
                href={endpoint.href}
                target="_blank"
                rel="noreferrer"
                className="cms-row"
              >
                <span className="cms-row-main">
                  <span className="cms-row-title cms-mono">{endpoint.label}</span>
                  <span className="cms-row-meta">{endpoint.hint}</span>
                </span>
                <span className="cms-row-actions">
                  <ExternalLink aria-hidden="true" style={{ width: 14, height: 14, opacity: 0.5 }} />
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="cms-card">
          <header className="cms-card-head">
            <ShieldCheck aria-hidden="true" style={{ width: 15, height: 15 }} />
            <h2 className="cms-card-title">Your account</h2>
          </header>
          <div className="cms-card-pad cms-stack-sm">
            <dl className="cms-kv">
              <dt>Name</dt>
              <dd>{staff.name}</dd>
              <dt>Email</dt>
              <dd>{staff.email}</dd>
              <dt>Role</dt>
              <dd>{staff.role === "admin" ? "Administrator" : "Staff"}</dd>
            </dl>
            <Link to="/admin/change-password" className="cms-btn">
              <KeyRound aria-hidden="true" /> Change password
            </Link>
            <Notice>
              Changing your password signs out every existing session, including this one.
            </Notice>
          </div>
        </section>
      </div>
    </CmsShell>
  );
}
