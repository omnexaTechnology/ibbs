import { Instagram, Linkedin, Snapchat, Tiktok, TwitterX } from "react-bootstrap-icons";
import { socialLinks } from "@/lib/contact";
import { cn } from "@/lib/utils";
import type { SiteSettings, SocialPlatform } from "@/types/site-settings";

const ICONS: Record<SocialPlatform, { Icon: typeof Linkedin; label: string }> = {
  linkedin: { Icon: Linkedin, label: "LinkedIn" },
  instagram: { Icon: Instagram, label: "Instagram" },
  x: { Icon: TwitterX, label: "X" },
  snapchat: { Icon: Snapchat, label: "Snapchat" },
  tiktok: { Icon: Tiktok, label: "TikTok" },
};

/**
 * Social profile links. Platforms without a URL in the site settings are not
 * rendered at all (no placeholder links); renders nothing when none are set.
 */
export function SocialLinks({
  settings,
  className,
  linkClassName,
  iconClassName,
}: {
  settings: SiteSettings;
  className?: string;
  linkClassName?: string;
  iconClassName?: string;
}) {
  const links = socialLinks(settings);
  if (links.length === 0) return null;

  return (
    <ul className={cn("flex items-center gap-2", className)} data-testid="social-links">
      {links.map(({ platform, url }) => {
        const { Icon, label } = ICONS[platform];
        return (
          <li key={platform}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              data-platform={platform}
              className={linkClassName}
            >
              <Icon className={cn("size-[18px]", iconClassName)} aria-hidden="true" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
