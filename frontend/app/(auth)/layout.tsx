import { BrandLockup } from "@/components/layout/brand-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-background p-4">
      <BrandLockup textClassName="text-foreground text-lg" />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
