import { NextResponse } from "next/server";
import { generateFullDataset } from "@/lib/syntheticCongestion";

export async function GET() {
  const { historical, today } = generateFullDataset();
  return NextResponse.json({ historical, today });
}
