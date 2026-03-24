import { CreatorToolsPageHeader } from "@/components/design/creator-tools-page-header";
import { FadeIn } from "@/components/motion/fade-in";

export function CreatorToolsShell({
  badge,
  title,
  description,
  actions,
  children,
}: {
  badge: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-w-0 space-y-6">
      <CreatorToolsPageHeader
        badge={badge}
        title={title}
        description={description}
        actions={actions}
      />

      <FadeIn delay={0.05} className="w-full">
        {children}
      </FadeIn>
    </div>
  );
}
