import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-3 gap-3">
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-xs text-text-secondary font-mono">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return <p className="p-4 text-sm text-text-secondary">{text}</p>;
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-xs font-mono text-text-secondary hover:text-white mb-3 inline-flex items-center gap-1">
      <span className="material-icons-outlined text-sm">arrow_forward</span>
      {label}
    </Link>
  );
}
