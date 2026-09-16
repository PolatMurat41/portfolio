import type { ComponentType } from "react";
import { GlobeIcon } from "lucide-react";
import { Icons } from "@/components/icons";
import { ReactLight } from "@/components/ui/svgs/reactLight";
import { NextjsIconDark } from "@/components/ui/svgs/nextjsIconDark";
import { Typescript } from "@/components/ui/svgs/typescript";
import { Nodejs } from "@/components/ui/svgs/nodejs";
import { Python } from "@/components/ui/svgs/python";
import { Golang } from "@/components/ui/svgs/golang";
import { Postgresql } from "@/components/ui/svgs/postgresql";
import { Docker } from "@/components/ui/svgs/docker";
import { Kubernetes } from "@/components/ui/svgs/kubernetes";
import { Java } from "@/components/ui/svgs/java";
import { Csharp } from "@/components/ui/svgs/csharp";

export type IconKey =
  | "react"
  | "nextjs"
  | "typescript"
  | "nodejs"
  | "python"
  | "golang"
  | "postgresql"
  | "docker"
  | "kubernetes"
  | "java"
  | "csharp"
  | "globe"
  | "github"
  | "linkedin"
  | "x"
  | "youtube"
  | "email";

type IconComponent = ComponentType<{ className?: string }>;

export const ICON_REGISTRY: Record<IconKey, IconComponent> = {
  react: ReactLight,
  nextjs: NextjsIconDark,
  typescript: Typescript,
  nodejs: Nodejs,
  python: Python,
  golang: Golang,
  postgresql: Postgresql,
  docker: Docker,
  kubernetes: Kubernetes,
  java: Java,
  csharp: Csharp,
  globe: GlobeIcon,
  github: Icons.github,
  linkedin: Icons.linkedin,
  x: Icons.x,
  youtube: Icons.youtube,
  email: Icons.email,
};

export const ICON_KEYS = Object.keys(ICON_REGISTRY) as IconKey[];

export function getIcon(key: string): IconComponent | null {
  return (ICON_REGISTRY as Record<string, IconComponent>)[key] ?? null;
}
