export type EntityType = "COMPANY" | "RSM" | "TSO" | "SR" | "DEALER" | "PRODUCT";

export interface ForecastBase {
  averageDailySales: number | null;
  runRate: number | null;
  workingDayForecast: number | null;
  momentum: number | null;
  historicalTrend: { slope: number | null; direction: string; points: number; latest: number | null };
  confidenceInputs: {
    elapsedWorkingDayRatio: number | null;
    dailyVolatility: number | null;
    historicalPeriodCount: number;
    activeSellingDays: number;
    confidenceScore: number;
  };
  method: string;
  certification: string;
}

export interface KpiContract {
  entityType: EntityType;
  entityId: string;
  sales: number;
  target: number;
  achievementPct: number | null;
  gap: number;
  forecast: number | null;
  forecastAchievementPct: number | null;
  requiredDailySales: number | null;
  averageDailySales: number | null;
  currentWorkingDay: number;
  dueWorkingDay: number;
  totalWorkingDay: number;
  dealerCount: number;
  srCount: number;
  tsoCount: number;
  rsmCount: number;
  productCount: number;
  collection: number;
  projection: number;
  lifting: number;
  stock: number;
  secondary: number;
  orders: number;
  growthPct: number | null;
  growthComparable: boolean;
  momentumPct: number | null;
  collectionFlowRatioPct: number | null;
  periodSalesCollectionGap: number;
  productVolume: number;
  contributionPct: number | null;
  mixPct: number | null;
  rank: number | null;
  trend: string;
  forecastBase: ForecastBase;
  certification: string;
}

export interface Risk {
  riskId: string;
  type: string;
  severity: "HIGH" | "MEDIUM";
  entityType: EntityType;
  entityId: string;
  metric: string;
  value: number;
  threshold: number;
  reason: string;
}

export interface DashboardData {
  release: string;
  kpiVersion: string;
  masterSchemaVersion: string;
  batchId: string;
  generatedAt: string;
  executive: KpiContract;
  hierarchy: Record<EntityType, KpiContract[]>;
  dealers: { entities: KpiContract[]; top: KpiContract[]; bottom: KpiContract[] };
  products: { entities: KpiContract[]; topProducts: KpiContract[]; bottomProducts: KpiContract[]; unitPolicy: string };
  collection: { total: number; ratio: number | null; trendPct: number | null; coveragePct: number | null; exceptions: string[] };
  projection: { total: number; dealerCount: number; exceptions: string[] };
  lifting: { total: number; stock: number; secondary: number; salesFlowRatioPct: number | null; exceptions: string[] };
  risks: Risk[];
  insights: Array<{ type: string; severity: string; entity: EntityType; entityId: string; metric: string; value: number; threshold: number; riskId: string }>;
  quality: { acceptedRecords: number; excludedRecords: number; masterQualityFlags: number; certification: string };
  performance: { recordsVisited: number; entityContracts: number; calculationMs: number };
}

export interface ApiEnvelope { ok: boolean; data?: DashboardData; error?: { code: string; message: string } }
