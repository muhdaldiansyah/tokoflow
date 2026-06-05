import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TypographyProps {
  children: ReactNode;
  className?: string;
}

export function H1({ children, className }: TypographyProps) {
  return (
    <h1
      className={cn(
        "text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl",
        className
      )}
    >
      {children}
    </h1>
  );
}

export function H2({ children, className }: TypographyProps) {
  return (
    <h2
      className={cn(
        "text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl",
        className
      )}
    >
      {children}
    </h2>
  );
}

export function H3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn("text-xl font-semibold text-gray-900", className)}>
      {children}
    </h3>
  );
}

export function H4({ children, className }: TypographyProps) {
  return (
    <h4 className={cn("text-lg font-semibold text-gray-900", className)}>
      {children}
    </h4>
  );
}

export function P({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-base text-gray-600 leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function Lead({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-xl text-gray-600 leading-relaxed", className)}>
      {children}
    </p>
  );
}

export function Small({ children, className }: TypographyProps) {
  return (
    <p className={cn("text-sm text-gray-500", className)}>{children}</p>
  );
}

interface SectionHeadingProps {
  badge?: string;
  title: string;
  description?: string;
  className?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  badge,
  title,
  description,
  className,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {badge && (
        <span className="inline-block px-3 py-1 mb-4 text-sm font-medium text-gray-900 bg-gray-100 rounded-full">
          {badge}
        </span>
      )}
      <H2 className="mb-4">{title}</H2>
      {description && <Lead>{description}</Lead>}
    </div>
  );
}
