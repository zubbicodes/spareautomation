import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ExternalLink,
  Globe,
  KeyRound,
  Mail,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import { CmsShell } from "@/components/admin/CmsShell";
import { ThemeToggle } from "@/components/admin/theme";
import { InitialsAvatar, Notice, Pill, SectionCard } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
      title="Settings"
      subtitle="Business details, navigation and the machine-readable files that depend on them. Functional behaviour, validation and integrations stay in code."
    >
      <Tabs defaultValue="business">
        <TabsList className="mb-4 h-auto flex-wrap justify-start gap-1 bg-muted/60 p-1">
          <TabsTrigger value="business" className="text-[12.5px]">
            Business
          </TabsTrigger>
          <TabsTrigger value="navigation" className="text-[12.5px]">
            Navigation
          </TabsTrigger>
          <TabsTrigger value="technical" className="text-[12.5px]">
            Technical
          </TabsTrigger>
          <TabsTrigger value="account" className="text-[12.5px]">
            Your account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business" className="mt-0">
          <SectionCard
            title="Business details"
            description="Used by the header, footer, contact page, structured data and every email."
            action={
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/content/$key" params={{ key: "site" }}>
                  Edit
                </Link>
              </Button>
            }
          >
            <dl className="divide-y">
              <Row icon={<Globe />} label="Business name">
                {site.name}
              </Row>
              <Row icon={<ExternalLink />} label="Website">
                <a
                  href={site.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {site.url}
                </a>
              </Row>
              <Row icon={<Mail />} label="Email">
                {site.email}
              </Row>
              <Row icon={<Phone />} label="Telephone">
                {site.phoneDisplay}
                <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                  {site.phoneHref}
                </span>
              </Row>
              <Row icon={<Phone />} label="WhatsApp">
                <span className="font-mono text-[12.5px]">{site.whatsapp}</span>
              </Row>
              <Row icon={<MapPin />} label="Location">
                {site.location} · {site.addressLocality} ({site.addressCountry})
              </Row>
              <Row label="Opening hours">{site.hours}</Row>
              <Row label="Social handle">
                <span className="font-mono text-[12.5px]">{site.socialHandle}</span>
              </Row>
            </dl>
          </SectionCard>
        </TabsContent>

        <TabsContent value="navigation" className="mt-0 space-y-4">
          <SectionCard
            title="Navigation and footer"
            action={
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/content/$key" params={{ key: "navigation" }}>
                  Edit
                </Link>
              </Button>
            }
          >
            <div className="space-y-3 p-4">
              <p className="text-[13px] text-muted-foreground">
                <span className="font-medium text-foreground tabular-nums">
                  {visibleHeader} of {navigation.header.length}
                </span>{" "}
                header links are visible. Labels, order and visibility are editable; destinations are
                locked to approved routes so navigation can never break.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {navigation.header.map((item) => (
                  <Pill key={item.id} tone={item.visible ? "accent" : "neutral"} dot>
                    {item.label}
                  </Pill>
                ))}
              </div>
              <p className="border-t pt-3 text-xs text-muted-foreground">
                Footer strapline: “{navigation.footerCopy}”
              </p>
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="technical" className="mt-0">
          <SectionCard
            title="Generated files"
            description="Built from published settings and the fixed route list."
          >
            <ul className="divide-y">
              {ENDPOINTS.map((endpoint) => (
                <li key={endpoint.href}>
                  <a
                    href={endpoint.href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[12.5px] font-medium">{endpoint.label}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{endpoint.hint}</p>
                    </div>
                    <ExternalLink
                      className="size-3.5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </SectionCard>
        </TabsContent>

        <TabsContent value="account" className="mt-0 space-y-4">
          <SectionCard title="Your account">
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <InitialsAvatar name={staff.name} className="size-10 text-sm" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">{staff.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{staff.email}</p>
                </div>
                <Pill tone={staff.role === "admin" ? "accent" : "neutral"} dot className="ml-auto">
                  {staff.role === "admin" ? "Administrator" : "Staff"}
                </Pill>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/change-password">
                    <KeyRound /> Change password
                  </Link>
                </Button>
              </div>

              <Notice tone="warning">
                Changing your password signs out every existing session, including this one.
              </Notice>
            </div>
          </SectionCard>

          <SectionCard title="Appearance">
            <div className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">Colour theme</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Applies to the CMS only, on this browser. The public website is unaffected.
                </p>
              </div>
              <ThemeToggle />
            </div>
          </SectionCard>

          {staff.role === "admin" ? (
            <SectionCard title="Permissions">
              <div className="space-y-2 p-4 text-[13px] text-muted-foreground">
                <p className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden="true" />
                  Administrators publish content, restore revisions, manage media and manage
                  accounts.
                </p>
                <p className="flex items-start gap-2">
                  <ShieldCheck
                    className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  Staff edit and preview drafts. Every permission is enforced on the server, not just
                  in this interface.
                </p>
              </div>
            </SectionCard>
          ) : null}
        </TabsContent>
      </Tabs>
    </CmsShell>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon?: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-2.5">
      <dt className="flex w-40 shrink-0 items-center gap-2 text-xs text-muted-foreground">
        {icon ? <span className="[&>svg]:size-3.5">{icon}</span> : <span className="size-3.5" />}
        {label}
      </dt>
      <dd className="min-w-0 flex-1 text-[13px]">{children}</dd>
    </div>
  );
}
