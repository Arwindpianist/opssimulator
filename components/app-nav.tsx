"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity } from "lucide-react"
import type { ReactNode } from "react"

const LINKS = [
  { href: "/", label: "Simulation" },
  { href: "/dashboard-builder", label: "Dashboard Builder" },
  { href: "/calculators", label: "Calculators" },
] as const

export function AppNav({
  subtitle,
  actions,
}: {
  subtitle?: string
  actions?: ReactNode
}) {
  const pathname = usePathname()
  return (
    <header className="masthead app-nav-masthead">
      <div className="brand">
        <span className="logo">
          <Activity size={22} />
        </span>
        <div>
          <h1>
            OpsSim <small>LIVE GOVERNANCE</small>
          </h1>
          <p>
            {subtitle ?? "SPACE + SERVICE CONTROL"} <i /> TRAINING SUITE
          </p>
        </div>
      </div>
      <nav className="app-nav-pills" aria-label="Primary">
        {LINKS.map((link) => {
          const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
          return (
            <Link key={link.href} href={link.href} className={`app-nav-pill ${active ? "active" : ""}`}>
              {link.label}
            </Link>
          )
        })}
      </nav>
      {actions ? <div className="mast-actions">{actions}</div> : null}
    </header>
  )
}
