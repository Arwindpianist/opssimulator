"use client"

import { Check, ChevronDown } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

export type FancyOption = {
  value: string
  label: string
  hint?: string
}

export function FancySelect({
  label,
  value,
  options,
  onChange,
  ariaLabel,
  size = "field",
  menuAlign = "left",
}: {
  label?: string
  value: string
  options: FancyOption[]
  onChange: (value: string) => void
  ariaLabel?: string
  size?: "field" | "compact"
  menuAlign?: "left" | "right"
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((o) => o.value === value)
  const display = selected?.label ?? value ?? "Select"

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [open])

  return (
    <div
      ref={rootRef}
      className={`fancy-select scenario-picker ${size === "compact" ? "fancy-compact" : ""} ${open ? "is-open" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false)
      }}
    >
      {label ? <span className="scenario-caption">{label}</span> : null}
      <button
        className="scenario-trigger"
        type="button"
        role="combobox"
        aria-label={ariaLabel ?? label ?? "Select"}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false)
        }}
      >
        <span className="scenario-value">{display}</span>
        <ChevronDown size={size === "compact" ? 13 : 15} />
      </button>
      {open && (
        <div
          className={`scenario-menu fancy-menu ${menuAlign === "right" ? "align-right" : ""}`}
          id={listId}
          role="listbox"
          aria-label={ariaLabel ?? label ?? "Options"}
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`scenario-option ${value === option.value ? "selected" : ""}`}
              onClick={() => {
                onChange(option.value)
                setOpen(false)
              }}
            >
              <span className="scenario-copy">
                <b>{option.label}</b>
                {option.hint ? <small>{option.hint}</small> : null}
              </span>
              {value === option.value && <Check className="scenario-check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
