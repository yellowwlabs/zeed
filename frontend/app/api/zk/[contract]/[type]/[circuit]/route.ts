import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_CONTRACTS = new Set(["accreditation", "founder_majority"]);
const ALLOWED_TYPES = new Set(["keys", "zkir"]);
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  keys: [".prover", ".verifier"],
  zkir: [".zkir", ".bzkir"],
};

const CONTRACTS_MANAGED = path.resolve(
  process.cwd(),
  "../contracts/src/managed",
);

export async function GET(
  _req: NextRequest,
  { params }: { params: { contract: string; type: string; circuit: string } },
) {
  const { contract, type, circuit } = params;

  if (!ALLOWED_CONTRACTS.has(contract) || !ALLOWED_TYPES.has(type)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = ALLOWED_EXTENSIONS[type].find((e) => circuit.endsWith(e));
  if (!ext) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(CONTRACTS_MANAGED, contract, type, circuit);
  // Prevent path traversal
  if (!filePath.startsWith(CONTRACTS_MANAGED)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: { "Content-Type": "application/octet-stream" },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
