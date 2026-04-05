import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { getSocialIcon } from "~/components/icons/social";
import { labels } from "~/lib/config/labels";
import type { SiteConfigSocialLinks } from "~/lib/graphql/__generated__/graphql";
import type { LayoutData } from "~/lib/graphql/queries/get-layout-data";
import { menuItemPath } from "~/lib/utils/menu";

function SocialIcon({ link }: { link: SiteConfigSocialLinks }) {
  const platform = Array.isArray(link.platform)
    ? link.platform[0]
    : link.platform;
  if (!platform || !link.url) return null;

  const icon = getSocialIcon(platform);

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground transition-colors"
      aria-label={platform}
    >
      {icon ?? <ExternalLink className="size-5" />}
    </a>
  );
}

interface FooterProps {
  menuItems: LayoutData["footerMenu"];
  siteSettings: LayoutData["siteSettings"];
}

export function Footer({ menuItems, siteSettings }: FooterProps) {
  const socialLinks = (siteSettings?.socialLinks ?? []).filter(
    (link): link is SiteConfigSocialLinks => !!link?.platform && !!link.url,
  );
  const copyright =
    siteSettings?.copyrightText ??
    `\u00A9 ${labels.site.name}. ${labels.footer.allRightsReserved}`;

  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          {menuItems.length > 0 && (
            <nav className="flex flex-wrap gap-x-6 gap-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={menuItemPath(item)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          {socialLinks.length > 0 && (
            <div className="flex items-center gap-4">
              {socialLinks.map((link) => (
                <SocialIcon key={link.url} link={link} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 border-t pt-4">
          <p className="text-xs text-muted-foreground">{copyright}</p>
        </div>
      </div>
    </footer>
  );
}
