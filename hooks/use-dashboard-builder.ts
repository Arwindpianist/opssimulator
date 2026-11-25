"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { suggestKpisForRole } from "@/lib/dashboard/autocomplete"
import { exportDashboardJson, loadDashboardBlueprint, migrateBlueprint, saveDashboardBlueprint } from "@/lib/dashboard/persistence"
import { WEIGHT_PRESETS, blankBlueprint, defaultKpiCatalog } from "@/lib/dashboard/presets"
import { detectDashboardPdca, kpiFaceScore, overallDashboardScore, walkthroughProgress } from "@/lib/dashboard/score"
import type { AudiencePersona, DashboardBlueprint, DashboardKpi, ReviewCadence, SubMetric, WeightPresetId } from "@/lib/dashboard/types"
import { isBalanced, newId, normalizeWeights, sumWeights } from "@/lib/shared/weights"

export function useDashboardBuilder() {
  const [blueprint, setBlueprint] = useState<DashboardBlueprint>(() => ({ ...blankBlueprint(), kpis: defaultKpiCatalog() }))
  const [step, setStep] = useState(1)
  const [hasHydrated, setHasHydrated] = useState(false)
  const [notice, setNotice] = useState("")
  const [printOpen, setPrintOpen] = useState(false)

  useEffect(() => {
    const stored = loadDashboardBlueprint()
    if (stored) setBlueprint(stored)
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (!hasHydrated) return
    saveDashboardBlueprint(blueprint)
  }, [blueprint, hasHydrated])

  useEffect(() => {
    if (!hasHydrated) return
    const adds = detectDashboardPdca(blueprint)
    if (adds.length) {
      setBlueprint((b) => ({ ...b, pdcaLog: [...adds, ...b.pdcaLog].slice(0, 40) }))
    }
  }, [blueprint.kpis, hasHydrated])

  const overall = useMemo(() => overallDashboardScore(blueprint), [blueprint])
  const walkthrough = useMemo(() => walkthroughProgress(blueprint), [blueprint])
  const kpiWeightSum = useMemo(() => sumWeights(blueprint.kpis), [blueprint.kpis])
  const weightsOk = useMemo(() => isBalanced(blueprint.kpis), [blueprint.kpis])

  const patch = useCallback((p: Partial<DashboardBlueprint>) => {
    setBlueprint((b) => ({ ...b, ...p }))
  }, [])

  const setAudience = useCallback((persona: AudiencePersona, cadence: ReviewCadence) => {
    setBlueprint((b) => ({ ...b, persona, cadence }))
  }, [])

  const applyRole = useCallback((role: string, replace: boolean) => {
    const suggested = suggestKpisForRole(role)
    setBlueprint((b) => ({
      ...b,
      roleDepartment: role,
      kpis: replace || !b.kpis.length ? suggested : b.kpis,
    }))
    setNotice(replace || !blueprint.kpis.length ? `Loaded KPIs for ${role}` : `Role set to ${role}`)
  }, [blueprint.kpis.length])

  const startBlank = useCallback(() => {
    setBlueprint(blankBlueprint())
    setNotice("Started blank canvas")
  }, [])

  const loadCatalog = useCallback(() => {
    setBlueprint((b) => ({ ...b, kpis: defaultKpiCatalog() }))
    setNotice("Loaded default KPI catalog")
  }, [])

  const addKpi = useCallback(() => {
    setBlueprint((b) => ({
      ...b,
      kpis: [
        ...b.kpis,
        {
          id: newId(),
          name: "New KPI",
          owner: "",
          target: 85,
          redFlag: 70,
          dataSource: "",
          cadence: b.cadence,
          indicatorType: "Leading",
          antiGamingCounter: "",
          weightPct: 0,
          subMetrics: [],
        },
      ],
    }))
  }, [])

  const updateKpi = useCallback((id: string, patchKpi: Partial<DashboardKpi>) => {
    setBlueprint((b) => ({
      ...b,
      kpis: b.kpis.map((k) => (k.id === id ? { ...k, ...patchKpi } : k)),
    }))
  }, [])

  const removeKpi = useCallback((id: string) => {
    setBlueprint((b) => ({ ...b, kpis: b.kpis.filter((k) => k.id !== id) }))
  }, [])

  const moveKpi = useCallback((id: string, dir: -1 | 1) => {
    setBlueprint((b) => {
      const idx = b.kpis.findIndex((k) => k.id === id)
      if (idx < 0) return b
      const next = idx + dir
      if (next < 0 || next >= b.kpis.length) return b
      const kpis = [...b.kpis]
      ;[kpis[idx], kpis[next]] = [kpis[next], kpis[idx]]
      return { ...b, kpis }
    })
  }, [])

  const addSub = useCallback((kpiId: string) => {
    setBlueprint((b) => ({
      ...b,
      kpis: b.kpis.map((k) =>
        k.id === kpiId
          ? {
              ...k,
              subMetrics: [
                ...k.subMetrics,
                { id: newId(), name: "New matrix item", formula: "", value: 0, target: 100, status: "watch", weightPct: 0 },
              ],
            }
          : k,
      ),
    }))
  }, [])

  const updateSub = useCallback((kpiId: string, subId: string, patchSub: Partial<SubMetric>) => {
    setBlueprint((b) => ({
      ...b,
      kpis: b.kpis.map((k) =>
        k.id === kpiId
          ? { ...k, subMetrics: k.subMetrics.map((m) => (m.id === subId ? { ...m, ...patchSub } : m)) }
          : k,
      ),
    }))
  }, [])

  const removeSub = useCallback((kpiId: string, subId: string) => {
    setBlueprint((b) => ({
      ...b,
      kpis: b.kpis.map((k) => (k.id === kpiId ? { ...k, subMetrics: k.subMetrics.filter((m) => m.id !== subId) } : k)),
    }))
  }, [])

  const normalizeKpiWeights = useCallback(() => {
    setBlueprint((b) => ({ ...b, kpis: normalizeWeights(b.kpis) }))
  }, [])

  const normalizeSubWeights = useCallback((kpiId: string) => {
    setBlueprint((b) => ({
      ...b,
      kpis: b.kpis.map((k) => (k.id === kpiId ? { ...k, subMetrics: normalizeWeights(k.subMetrics) } : k)),
    }))
  }, [])

  const applyWeightPreset = useCallback((id: WeightPresetId) => {
    const preset = WEIGHT_PRESETS[id]
    setBlueprint((b) => ({
      ...b,
      kpis: b.kpis.map((k, i) => ({
        ...k,
        weightPct: preset.weights[i] ?? Math.round(100 / Math.max(1, b.kpis.length)),
      })),
    }))
    setNotice(`Applied ${preset.label}`)
  }, [])

  const exportAll = useCallback(() => {
    exportDashboardJson(blueprint)
    setPrintOpen(true)
  }, [blueprint])

  const importJson = useCallback((file?: File) => {
    file?.text().then((t) => {
      try {
        setBlueprint(migrateBlueprint(JSON.parse(t)))
        setNotice("Dashboard blueprint imported")
      } catch {
        setNotice("Invalid dashboard blueprint")
      }
    })
  }, [])

  return {
    blueprint,
    setBlueprint,
    patch,
    step,
    setStep,
    overall,
    walkthrough,
    kpiWeightSum,
    weightsOk,
    kpiFaceScore,
    setAudience,
    applyRole,
    startBlank,
    loadCatalog,
    addKpi,
    updateKpi,
    removeKpi,
    moveKpi,
    addSub,
    updateSub,
    removeSub,
    normalizeKpiWeights,
    normalizeSubWeights,
    applyWeightPreset,
    exportAll,
    importJson,
    notice,
    setNotice,
    printOpen,
    setPrintOpen,
    weightPresets: WEIGHT_PRESETS,
  }
}
