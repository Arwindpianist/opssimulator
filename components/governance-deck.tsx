"use client"

import { Activity, ArrowUpRight, Check, Clock3, Plus, RotateCcw, Shield, Users } from "lucide-react"
import type { SimulationApi } from "@/hooks/use-simulation"
import { Policy } from "./sim-widgets"

export function GovernanceDeck({ sim, custom, setCustom }: { sim: SimulationApi; custom: string; setCustom: (v: string) => void }) {
  const { model } = sim
  return (
    <section className="control-deck">
      <div className="deck-title">
        <span>
          <Shield /> GOVERNANCE DECK
        </span>
        <small>LIVE POLICY CONTROLS</small>
      </div>
      <div className="policy-switches">
        <Policy
          label="Field-to-HQ sync"
          enabled={model.rules.sync}
          onClick={() => sim.toggleRule("sync")}
          icon={<Users />}
          impact={model.rules.sync ? "FIELD RELEASED" : "OFF"}
        />
        <Policy
          label="Auto-release"
          enabled={model.rules.noShowMinutes > 0}
          onClick={() => sim.setNoShow(model.rules.noShowMinutes ? 0 : 15)}
          icon={<RotateCcw />}
          impact={`${model.rules.noShowMinutes} MIN`}
        />
        <Policy
          label="Close checklist"
          enabled={model.rules.checklist}
          onClick={() => sim.toggleRule("checklist")}
          icon={<Check />}
          impact="SOP"
        />
        <Policy
          label="Block clock-pause"
          enabled={!model.rules.allowClockPause}
          onClick={sim.toggleClockPausePolicy}
          icon={<Clock3 />}
          impact={!model.rules.allowClockPause ? "SEALED" : "LOOPHOLE"}
        />
        <Policy
          label="Anti-gaming"
          enabled={model.rules.antiGaming}
          onClick={() => sim.toggleRule("antiGaming")}
          icon={<Activity />}
          impact="PAIRED"
        />
        <Policy
          label="4-tier escalation"
          enabled={model.rules.escalation}
          onClick={() => sim.toggleRule("escalation")}
          icon={<ArrowUpRight />}
          impact="ARMED"
        />
      </div>
      <div className="deck-bottom">
        <label className="preventive">
          <span>PREVENTIVE CAPACITY</span>
          <b>{model.rules.preventiveCapacityPct}%</b>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={model.rules.preventiveCapacityPct}
            onChange={(e) => sim.setPreventive(Number(e.target.value))}
          />
        </label>
        <div className="chaos-triggers">
          <span>CHAOS INJECT</span>
          {sim.chaosEvents.map((e, i) => (
            <button key={e.title} type="button" onClick={() => sim.injectChaos(i)}>
              <i className={`chaos-dot c${i}`} />
              {e.title}
            </button>
          ))}
          <label className="custom-pill">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing && custom.trim()) {
                  sim.addEvent(custom)
                  setCustom("")
                }
              }}
              placeholder="+ Custom event"
            />
            <button
              type="button"
              onClick={() => {
                if (custom.trim()) {
                  sim.addEvent(custom)
                  setCustom("")
                }
              }}
            >
              <Plus />
            </button>
          </label>
        </div>
      </div>
    </section>
  )
}
