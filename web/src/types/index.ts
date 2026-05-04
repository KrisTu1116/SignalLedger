export interface OccupancyRecord {
  locationName: string;
  timestamp: string;
  hour: number;
  occupancyPercentage: number;
  capacity: number;
  occupiedSeats: number;
  source: string;
}

export interface OracleResult {
  marketQuestion: string;
  locationName: string;
  threshold: number;
  windowStart: number;
  windowEnd: number;
  actualValue: number;
  exceeded: boolean;
  winningOutcome: "YES" | "NO";
  recordsUsed: number;
}

export interface EvaluationMethod {
  name: string;
  description: string;
  impliedProbability: number;
  predictedOutcome: "YES" | "NO";
  correct: boolean;
}

export interface EvaluationResult {
  actualOutcome: "YES" | "NO";
  actualValue: number;
  threshold: number;
  methods: EvaluationMethod[];
  summary: string;
}
