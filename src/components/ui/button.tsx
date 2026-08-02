import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type CommonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
};

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type LinkButtonProps = CommonProps & { href: string };

export function Button(props: ButtonProps | LinkButtonProps) {
  const variant = props.variant ?? "primary";
  const className = `button button--${variant} ${props.className ?? ""}`.trim();
  if ("href" in props && props.href) {
    return (
      <Link className={className} href={props.href}>
        {props.children}
      </Link>
    );
  }
  const { children, ...buttonProps } = props as ButtonProps;
  return (
    <button {...buttonProps} className={className}>
      {children}
    </button>
  );
}
