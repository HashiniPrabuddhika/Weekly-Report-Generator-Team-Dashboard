import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

/**
 * The mark is three ascending bars — a week's worth of progress, stamped
 * in the brass/gold accent used elsewhere for "key" flagged items — on a
 * fixed ink-navy badge. Because the badge supplies its own background, it
 * reads correctly on both the dark sidebar and light surfaces (login,
 * favicon) without a separate light/dark variant.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8 shrink-0", className)}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#0b1220" />
      <rect x="8" y="18" width="4" height="8" rx="1" fill="var(--accent)" />
      <rect x="14" y="13" width="4" height="13" rx="1" fill="var(--accent)" />
      <rect x="20" y="7" width="4" height="19" rx="1" fill="var(--accent)" opacity="0.85" />
    </svg>
  );
}

interface BrandLockupProps {
  /** Text color class for the wordmark — defaults to inheriting from context. */
  textClassName?: string;
  markClassName?: string;
  className?: string;
}

export function BrandLockup({ textClassName, markClassName, className }: BrandLockupProps) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <BrandMark className={markClassName} />
      <span className={cn("text-base font-semibold tracking-tight", textClassName)}>
        {APP_NAME}
      </span>
    </span>
  );
}
