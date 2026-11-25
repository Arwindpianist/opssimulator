"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { computeCapacity } from "@/lib/calculators/capacity"
import {
  defaultCalculatorsState,
  exportCalculatorsJson,
  loadCalculators,
  migrateCalculators,
  saveCalculators,
} from "@/lib/calculators/persistence"
import { engagementTip, quadrantFor } from "@/lib/calculators/power-interest"
import { auditRaci, cellKey, cycleLetter, RACI_TEMPLATES } from "@/lib/calculators/raci"
import { penaltyAmount, scorecardTier, scorecardTotal, TIER_LABELS, normalizeWeights as normScore } from "@/lib/calculators/scorecard"
import { computeSlaClock } from "@/lib/calculators/sla-clock"
import type { CalcTab, CalculatorsState, RaciLetter, ScorecardCriterion, Stakeholder, WeightageKpi } from "@/lib/calculators/types"
import {
  WEIGHTAGE_PRESETS,
  antiGamingAlerts,
  compositeIndex,
  kpiWeightedScore,
  normalizeWeights,
  sumWeights,
} from "@/lib/calculators/weightage"
import { newId } from "@/lib/shared/weights"

export function useCalculators() {
  const [state, setState] = useState<CalculatorsState>(defaultCalculatorsState)
  const [tab, setTab] = useState<CalcTab>("weightage")
  const [hasHydrated, setHasHydrated] = useState(false)
  const [notice, setNotice] = useState("")
  const [printOpen, setPrintOpen] = useState(false)

  useEffect(() => {
    const stored = loadCalculators()
    if (stored) setState(stored)
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (!hasHydrated) return
    saveCalculators(state)
  }, [state, hasHydrated])

  const composite = useMemo(() => compositeIndex(state.weightage), [state.weightage])
  const weightSum = useMemo(() => sumWeights(state.weightage), [state.weightage])
  const weightAlerts = useMemo(() => antiGamingAlerts(state.weightage), [state.weightage])
  const raciAudit = useMemo(() => auditRaci(state.raci), [state.raci])
  const scoreTotal = useMemo(() => scorecardTotal(state.scorecard), [state.scorecard])
  const tier = useMemo(() => scorecardTier(scoreTotal), [scoreTotal])
  const penalty = useMemo(() => penaltyAmount(scoreTotal, state.scorecard.penaltyPerTier), [scoreTotal, state.scorecard.penaltyPerTier])
  const slaResult = useMemo(() => computeSlaClock(state.sla), [state.sla])
  const capacityResult = useMemo(() => computeCapacity(state.capacity), [state.capacity])
  const stakeholderViews = useMemo(
    () =>
      state.stakeholders.map((s) => ({
        ...s,
        quadrant: quadrantFor(s),
        tip: engagementTip(quadrantFor(s)),
      })),
    [state.stakeholders],
  )

  const patch = useCallback((p: Partial<CalculatorsState>) => setState((s) => ({ ...s, ...p })), [])

  const applyWeightPreset = useCallback((key: string) => {
    const preset = WEIGHTAGE_PRESETS[key]
    if (!preset) return
    setState((s) => ({ ...s, weightage: preset.kpis() }))
    setNotice(`Applied ${preset.label}`)
  }, [])

  const normalizeKpiWeights = useCallback(() => {
    setState((s) => ({ ...s, weightage: normalizeWeights(s.weightage) }))
  }, [])

  const addKpi = useCallback(() => {
    setState((s) => ({
      ...s,
      weightage: [
        ...s.weightage,
        {
          id: newId(),
          name: "New KPI",
          weightPct: 0,
          counterMetricName: "Counter-metric",
          counterValue: 0,
          counterThreshold: 10,
          subs: [{ id: newId(), name: "Matrix item", weightPct: 100, actual: 80, target: 100 }],
        },
      ],
    }))
  }, [])

  const updateKpi = useCallback((id: string, patchKpi: Partial<WeightageKpi>) => {
    setState((s) => ({
      ...s,
      weightage: s.weightage.map((k) => (k.id === id ? { ...k, ...patchKpi } : k)),
    }))
  }, [])

  const removeKpi = useCallback((id: string) => {
    setState((s) => ({ ...s, weightage: s.weightage.filter((k) => k.id !== id) }))
  }, [])

  const loadRaciTemplate = useCallback((key: string) => {
    const t = RACI_TEMPLATES[key]
    if (!t) return
    setState((s) => ({ ...s, raci: t.build() }))
    setNotice(`Loaded ${t.label}`)
  }, [])

  const setRaciCell = useCallback((stepId: string, roleId: string) => {
    setState((s) => {
      const key = cellKey(stepId, roleId)
      const current = (s.raci.cells[key] ?? "-") as RaciLetter
      return {
        ...s,
        raci: { ...s.raci, cells: { ...s.raci.cells, [key]: cycleLetter(current) } },
      }
    })
  }, [])

  const normalizeScorecard = useCallback(() => {
    setState((s) => ({ ...s, scorecard: { ...s.scorecard, criteria: normScore(s.scorecard.criteria) } }))
  }, [])

  const updateCriterion = useCallback((id: string, patchC: Partial<ScorecardCriterion>) => {
    setState((s) => ({
      ...s,
      scorecard: {
        ...s.scorecard,
        criteria: s.scorecard.criteria.map((c) => (c.id === id ? { ...c, ...patchC } : c)),
      },
    }))
  }, [])

  const addStakeholder = useCallback(() => {
    setState((s) => ({
      ...s,
      stakeholders: [...s.stakeholders, { id: newId(), name: "New stakeholder", power: 5, interest: 5 }],
    }))
  }, [])

  const updateStakeholder = useCallback((id: string, patchS: Partial<Stakeholder>) => {
    setState((s) => ({
      ...s,
      stakeholders: s.stakeholders.map((x) => (x.id === id ? { ...x, ...patchS } : x)),
    }))
  }, [])

  const removeStakeholder = useCallback((id: string) => {
    setState((s) => ({ ...s, stakeholders: s.stakeholders.filter((x) => x.id !== id) }))
  }, [])

  const exportAll = useCallback(() => {
    exportCalculatorsJson(state)
    setPrintOpen(true)
  }, [state])

  const importJson = useCallback((file?: File) => {
    file?.text().then((t) => {
      try {
        setState(migrateCalculators(JSON.parse(t)))
        setNotice("Calculators imported")
      } catch {
        setNotice("Invalid calculators file")
      }
    })
  }, [])

  return {
    state,
    setState,
    patch,
    tab,
    setTab,
    composite,
    weightSum,
    weightAlerts,
    kpiWeightedScore,
    raciAudit,
    scoreTotal,
    tier,
    tierLabel: TIER_LABELS[tier],
    penalty,
    slaResult,
    capacityResult,
    stakeholderViews,
    applyWeightPreset,
    normalizeKpiWeights,
    addKpi,
    updateKpi,
    removeKpi,
    loadRaciTemplate,
    setRaciCell,
    normalizeScorecard,
    updateCriterion,
    addStakeholder,
    updateStakeholder,
    removeStakeholder,
    exportAll,
    importJson,
    notice,
    setNotice,
    printOpen,
    setPrintOpen,
    weightPresets: WEIGHTAGE_PRESETS,
    raciTemplates: RACI_TEMPLATES,
  }
}

export type CalculatorsApi = ReturnType<typeof useCalculators>
