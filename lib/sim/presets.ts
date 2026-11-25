import { newId, type Model, type Person, type Rules } from "./types"

const defaultRules = (): Rules => ({
  checklist: true,
  sync: true,
  recovery: true,
  escalation: true,
  antiGaming: true,
  allowClockPause: false,
  preventiveCapacityPct: 35,
  noShowMinutes: 15,
})

const defaultPeople = (): Person[] => [
  {
    id: newId(),
    name: "Facilities lead",
    role: "Ops owner",
    assignments: {
      "capacity-allocation": "R",
      "incident-response": "A",
      "booking-release": "C",
      "vendor-escalation": "I",
      "change-window": "C",
    },
  },
  {
    id: newId(),
    name: "Service owner",
    role: "Service manager",
    assignments: {
      "capacity-allocation": "A",
      "incident-response": "R",
      "booking-release": "A",
      "vendor-escalation": "A",
      "change-window": "R",
    },
  },
]

export const PRESET_LABELS = [
  "Preset 1: Space & Manpower Crunch",
  "Preset 2: Hard & Soft FM",
  "Preset 3: IT & Service Ops",
  "Blank Canvas",
] as const

export type PresetLabel = (typeof PRESET_LABELS)[number]

export function createSpaceCrunchModel(): Model {
  return {
    org: "Northstar Operations",
    openHour: 7,
    closeHour: 18,
    shiftMode: "SinglePeak",
    hours: 8,
    departments: [
      { id: newId(), name: "Transport Operations", headcount: 84, fieldDutyRatio: 28, peakArrivalWindow: 9, priorityTier: 1, stakeholderInfluence: "High", escalationTier: 0 },
      { id: newId(), name: "IT Infrastructure", headcount: 62, fieldDutyRatio: 18, peakArrivalWindow: 9, priorityTier: 1, stakeholderInfluence: "High", escalationTier: 0 },
      { id: newId(), name: "Field Inspection", headcount: 76, fieldDutyRatio: 72, peakArrivalWindow: 10, priorityTier: 1, stakeholderInfluence: "Medium", escalationTier: 0 },
      { id: newId(), name: "Network & Systems", headcount: 58, fieldDutyRatio: 34, peakArrivalWindow: 8, priorityTier: 2, stakeholderInfluence: "High", escalationTier: 0 },
      { id: newId(), name: "Administration", headcount: 52, fieldDutyRatio: 4, peakArrivalWindow: 9, priorityTier: 2, stakeholderInfluence: "Medium", escalationTier: 0 },
      { id: newId(), name: "Support & Security", headcount: 68, fieldDutyRatio: 42, peakArrivalWindow: 11, priorityTier: 2, stakeholderInfluence: "Low", escalationTier: 0 },
    ],
    pools: [
      { id: newId(), name: "Workstations", category: "Dedicated desks", capacity: 286, allocationMode: "Siloed" },
      { id: newId(), name: "Parking bays", category: "Shared parking", capacity: 232, allocationMode: "Hybrid" },
      { id: newId(), name: "Common areas", category: "Shared space", capacity: 180, allocationMode: "Shared" },
      { id: newId(), name: "Field units", category: "Mobile teams", capacity: 96, allocationMode: "Shared" },
    ],
    people: defaultPeople(),
    rules: defaultRules(),
    events: [
      {
        id: newId(),
        title: "Simulation ready",
        detail: "Demand exceeds capacity under siloed allocation",
        time: "07:00",
        severity: "INFO",
      },
    ],
    pdcaLog: [],
  }
}

export function createHardSoftFmModel(): Model {
  return {
    org: "Campus Facilities",
    openHour: 6,
    closeHour: 20,
    shiftMode: "Staggered",
    hours: 10,
    departments: [
      { id: newId(), name: "Facilities", headcount: 42, fieldDutyRatio: 12, peakArrivalWindow: 8, priorityTier: 1, stakeholderInfluence: "High", escalationTier: 0 },
      { id: newId(), name: "Cleaning services", headcount: 36, fieldDutyRatio: 75, peakArrivalWindow: 7, priorityTier: 2, stakeholderInfluence: "Medium", escalationTier: 0 },
      { id: newId(), name: "Building systems", headcount: 24, fieldDutyRatio: 48, peakArrivalWindow: 9, priorityTier: 1, stakeholderInfluence: "High", escalationTier: 0 },
      { id: newId(), name: "Guest services", headcount: 30, fieldDutyRatio: 5, peakArrivalWindow: 10, priorityTier: 2, stakeholderInfluence: "Medium", escalationTier: 0 },
    ],
    pools: [
      { id: newId(), name: "Service queues", category: "Work orders", capacity: 44, allocationMode: "Shared" },
      { id: newId(), name: "Plant rooms", category: "Critical spaces", capacity: 12, allocationMode: "Siloed" },
      { id: newId(), name: "Consumables", category: "Inventory", capacity: 180, allocationMode: "Hybrid" },
      { id: newId(), name: "Meeting rooms", category: "Soft FM", capacity: 28, allocationMode: "Shared" },
    ],
    people: defaultPeople(),
    rules: { ...defaultRules(), noShowMinutes: 20, preventiveCapacityPct: 40 },
    events: [
      {
        id: newId(),
        title: "FM shift loaded",
        detail: "Hard and soft FM queues active",
        time: "06:00",
        severity: "INFO",
      },
    ],
    pdcaLog: [],
  }
}

export function createItServiceOpsModel(): Model {
  return {
    org: "Digital Service Ops",
    openHour: 8,
    closeHour: 18,
    shiftMode: "RotationalHybrid",
    hours: 8,
    departments: [
      { id: newId(), name: "Service Desk", headcount: 46, fieldDutyRatio: 8, peakArrivalWindow: 9, priorityTier: 1, stakeholderInfluence: "High", escalationTier: 0 },
      { id: newId(), name: "Cloud Platform", headcount: 28, fieldDutyRatio: 20, peakArrivalWindow: 10, priorityTier: 1, stakeholderInfluence: "High", escalationTier: 0 },
      { id: newId(), name: "Business Apps", headcount: 34, fieldDutyRatio: 5, peakArrivalWindow: 9, priorityTier: 2, stakeholderInfluence: "Medium", escalationTier: 0 },
      { id: newId(), name: "Security Operations", headcount: 22, fieldDutyRatio: 32, peakArrivalWindow: 11, priorityTier: 1, stakeholderInfluence: "High", escalationTier: 0 },
    ],
    pools: [
      { id: newId(), name: "Service queues", category: "IT support", capacity: 80, allocationMode: "Shared" },
      { id: newId(), name: "Endpoints", category: "Devices", capacity: 112, allocationMode: "Hybrid" },
      { id: newId(), name: "Change windows", category: "Maintenance", capacity: 16, allocationMode: "Siloed" },
      { id: newId(), name: "War rooms", category: "Incident bridge", capacity: 12, allocationMode: "Shared" },
    ],
    people: defaultPeople(),
    rules: { ...defaultRules(), checklist: true, antiGaming: true, noShowMinutes: 15 },
    events: [
      {
        id: newId(),
        title: "IT ops ready",
        detail: "Service queues and change windows loaded",
        time: "08:00",
        severity: "INFO",
      },
    ],
    pdcaLog: [],
  }
}

export function createBlankCanvasModel(): Model {
  return {
    org: "New environment",
    openHour: 7,
    closeHour: 18,
    shiftMode: "SinglePeak",
    hours: 8,
    departments: [],
    pools: [],
    people: [],
    rules: defaultRules(),
    events: [],
    pdcaLog: [],
  }
}

export function loadPresetModel(label: string): Model {
  if (label.includes("Blank")) return createBlankCanvasModel()
  if (label.includes("IT") || label.includes("Service Ops")) return createItServiceOpsModel()
  if (label.includes("Hard") || label.includes("Facility") || label.includes("FM")) return createHardSoftFmModel()
  return createSpaceCrunchModel()
}

export const CHAOS_EVENTS = [
  { title: "Morning surge", severity: "P2" as const, detail: "Peak arrivals exceed planned capacity" },
  { title: "Ghost wave", severity: "P3" as const, detail: "Hoarded bookings inflate ghost occupancy" },
  { title: "Space hoarding", severity: "P2" as const, detail: "Departments lock seats under siloed policy" },
  { title: "SLA breach", severity: "P1" as const, detail: "Critical incident timer at risk" },
]
