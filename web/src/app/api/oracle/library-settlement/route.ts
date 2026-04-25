import { NextResponse } from "next/server";
import { computeLibrarySettlement, getSettlementRecords } from "@/lib/oracle";

export async function GET() {
  const result = computeLibrarySettlement();
  const records = getSettlementRecords();
  return NextResponse.json({ result, records });
}
