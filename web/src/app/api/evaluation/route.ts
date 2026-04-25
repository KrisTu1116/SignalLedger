import { NextRequest, NextResponse } from "next/server";
import { runEvaluation } from "@/lib/evaluation";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const yesBpsParam = searchParams.get("yesPriceBps");
  const marketYesPriceBps = yesBpsParam !== null ? Number(yesBpsParam) : null;

  const result = runEvaluation(marketYesPriceBps);
  return NextResponse.json(result);
}
