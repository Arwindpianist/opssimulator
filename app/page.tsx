"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Check,
  ChevronDown,
  Clock3,
  Download,
  GitCompareArrows,
  Maximize2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  SkipForward,
  X,
} from "lucide-react"
import { AppNav } from "@/components/app-nav"
import { BlueprintPrint } from "@/components/blueprint-print"
import { ConfigureWorld } from "@/components/configure-world"
import { GovernanceDeck } from "@/components/governance-deck"
import { MessyDashboard } from "@/components/messy-dashboard"
import { CompareModal, RunComparePanel } from "@/components/run-compare"
import { SpatialMap } from "@/components/spatial-map"
import { GaugeCard } from "@/components/sim-widgets"
import { useSimulation } from "@/hooks/use-simulation"
import type { Speed } from "@/lib/sim/types"

const fmt = (n: number) => new Intl.NumberFormat("en-US").format(n)

export default function Page() {
  const sim = useSimulation()
  const [tab, setTab] = useState("Floor")
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [compare, setCompare] = useState(false)
  const [custom, setCustom] = useState("")
  const [blueprintOpen, setBlueprintOpen] = useState(false)
  const [inspectFlaws, setInspectFlaws] = useState(false)
  const { model, frame, running, hour, speed } = sim

  const utilTone = frame.kpis.netUtilization > 92 ? "rose" : frame.kpis.netUtilization > 78 ? "amber" : "mint"
  const frictionTone = frame.kpis.frictionRejection > 38 ? "rose" : "amber"
  const slaTone = frame.kpis.slaCompliance < 70 ? "rose" : "mint"
  const ghostTone = frame.kpis.ghostBooking > 30 ? "amber" : "purple"

  const exportAll = () => {
    sim.exportBlueprint()
    setBlueprintOpen(true)
  }

  return (
    <main className={`stage ${sim.presenting ? "is-presenting" : ""}`}>
      <AppNav
        subtitle={`${model.org} · SPACE + SERVICE CONTROL`}
        actions={
          <>
            <div
              className={`scenario-picker ${scenarioOpen ? "is-open" : ""}`}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setScenarioOpen(false)
              }}
            >
              <span className="scenario-caption">SCENARIO</span>
              <button
                className="scenario-trigger"
                type="button"
                role="combobox"
                aria-label="Scenario"
                aria-expanded={scenarioOpen}
                aria-controls="scenario-options"
                onClick={() => setScenarioOpen((open) => !open)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setScenarioOpen(false)
                }}
              >
                <span className="scenario-value">{sim.preset}</span>
                <ChevronDown size={15} />
              </button>
              {scenarioOpen && (
                <div className="scenario-menu" id="scenario-options" role="listbox" aria-label="Choose a simulation scenario">
                  <div className="scenario-menu-heading">
                    <span>SIMULATION SCENARIOS</span>
                    <small>{sim.presets.length} PRESETS</small>
                  </div>
                  {sim.presets.map((option, index) => (
                    <button
                      key={option}
                      type="button"
                      role="option"
                      aria-selected={sim.preset === option}
                      className={`scenario-option ${sim.preset === option ? "selected" : ""}`}
                      onClick={() => {
                        sim.loadPreset(option)
                        setScenarioOpen(false)
                      }}
                    >
                      <span className="scenario-number">{index === 3 ? <Plus size={14} /> : String(index + 1).padStart(2, "0")}</span>
                      <span className="scenario-copy">
                        <b>{option.replace(/^Preset \d+: /, "")}</b>
                        <small>
                          {index === 0
                            ? "Multi-team · shared capacity"
                            : index === 1
                              ? "Facilities · hard and soft FM"
                              : index === 2
                                ? "IT · service operations"
                                : "Start from an empty environment"}
                        </small>
                      </span>
                      {sim.preset === option && <Check className="scenario-check" size={16} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Link className="action-btn export" href="/dashboard-builder">
              Build Clean Dashboard →
            </Link>
            <button className="action-btn configure" type="button" onClick={() => setDrawer(true)}>
              <Settings2 /> Configure World
            </button>
            <button className="action-btn" type="button" onClick={sim.saveRunA}>
              <Check /> Save Run A
            </button>
            <button className="action-btn" type="button" onClick={() => setCompare(true)}>
              <GitCompareArrows /> Compare
            </button>
            <button className="action-btn export" type="button" onClick={exportAll}>
              <Download /> Export Blueprint
            </button>
            <label className="action-btn import">
              <input type="file" accept="application/json" hidden onChange={(e) => sim.importBlueprint(e.target.files?.[0])} />
              <Download /> Import
            </label>
            <button className="action-btn" type="button" onClick={sim.togglePresentation} aria-label="Presentation fullscreen">
              <Maximize2 /> Present
            </button>
          </>
        }
      />

      <section className="transport">
        <div className="sim-state">
          <span className={running ? "beacon" : "beacon idle"} />
          <strong>{running ? "SIMULATION LIVE" : "READY TO SIMULATE"}</strong>
        </div>
        <div className="time-read">
          <Clock3 />
          <b>{String(hour).padStart(2, "0")}:00</b>
          <span>/ {String(model.closeHour).padStart(2, "0")}:00</span>
        </div>
        <div className="transport-actions">
          <button type="button" onClick={() => sim.setRunning(!running)} className="transport-primary">
            {running ? <Pause /> : <Play fill="currentColor" />}
            {running ? "Pause" : "Play simulation"}
          </button>
          <button type="button" onClick={sim.stepHour}>
            <SkipForward /> +1 HOUR
          </button>
          <div className="speed" role="radiogroup" aria-label="Simulation speed">
            {(["1x", "5x", "30d"] as Speed[]).map((s) => (
              <button key={s} type="button" role="radio" aria-checked={speed === s} className={speed === s ? "chosen" : ""} onClick={() => sim.setSpeed(s)}>
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={inspectFlaws ? "transport-primary" : ""}
            aria-pressed={inspectFlaws}
            onClick={() => setInspectFlaws((v) => !v)}
          >
            Inspect Flaws: {inspectFlaws ? "On" : "Off"}
          </button>
          <button className="reset" type="button" onClick={sim.resetClock} aria-label="Reset clock">
            <RotateCcw />
          </button>
        </div>
        <div className="day-meter">
          <span>DAY 01</span>
          <div>
            <i style={{ width: `${Math.max(3, ((hour - model.openHour) / Math.max(1, model.closeHour - model.openHour)) * 100)}%` }} />
          </div>
          <span>DAY 30</span>
        </div>
      </section>

      <MessyDashboard inspect={inspectFlaws} />

      <div className={`telemetry-row ${inspectFlaws ? "inspect-on" : ""}`}>
        <div className={inspectFlaws ? "flaw-wrap" : undefined}>
          {inspectFlaws && <span className="flaw-tag">Lagging Only</span>}
          <GaugeCard label="NET UTILIZATION" value={frame.kpis.netUtilization} tone={utilTone} />
        </div>
        <div className={inspectFlaws ? "flaw-wrap" : undefined}>
          {inspectFlaws && <span className="flaw-tag">No Counter-Metric</span>}
          <GaugeCard label="FRICTION / REJECTION" value={frame.kpis.frictionRejection} tone={frictionTone} />
        </div>
        <GaugeCard label="SLA HEALTH" value={frame.kpis.slaCompliance} tone={slaTone} />
        <GaugeCard label="GHOST BOOKINGS" value={frame.kpis.ghostBooking} tone={ghostTone} />
        <div className="mini-context">
          <span>ON-SITE</span>
          <b>{fmt(frame.kpis.onSite)}</b>
          <small>OF {fmt(frame.kpis.demand)} PEOPLE</small>
        </div>
        <div className="mini-context overflow">
          <span>OVERFLOW QUEUE</span>
          <b>{frame.kpis.overflowQueue}</b>
          <small>ARRIVALS WAITING</small>
        </div>
      </div>

      <SpatialMap
        tab={tab}
        setTab={setTab}
        hour={hour}
        frame={frame}
        banner={model.events[0]}
        countdown={sim.countdown}
        onDismiss={sim.dismissBanner}
        onSlotClick={(label) => sim.setNotice(label)}
        onConfigure={() => setDrawer(true)}
      />

      <GovernanceDeck sim={sim} custom={custom} setCustom={setCustom} />
      <RunComparePanel sim={sim} />

      <footer>
        <span>
          OPSSIM <i /> VISUAL GOVERNANCE
        </span>
        <span>
          <i className="pulse-dot" /> LOCAL SIMULATION
        </span>
        <span>1080P READY · 4K FRIENDLY</span>
      </footer>

      <ConfigureWorld open={drawer} onClose={() => setDrawer(false)} sim={sim} />
      <CompareModal open={compare} onClose={() => setCompare(false)} sim={sim} />
      <BlueprintPrint open={blueprintOpen} onClose={() => setBlueprintOpen(false)} model={model} frame={frame} />

      {sim.notice && (
        <div className="toast">
          {sim.notice}
          <button type="button" onClick={() => sim.setNotice("")}>
            <X />
          </button>
        </div>
      )}
    </main>
  )
}
