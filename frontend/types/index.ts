// Re-export from finance/conversion for convenience and add party types

export type {
  SafeType,
  SafeTerms,
  NoteTerms,
  EquityFinancing,
  ConversionResult,
} from "@/lib/finance/conversion";

export interface PartyInfo {
  legalName: string;
  entityType: "INDIVIDUAL" | "CORPORATION" | "LLC" | "LP" | "TRUST";
  jurisdiction: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  signatory: {
    name: string;
    title: string;
    email: string;
  };
}

export type DealStatus =
  | "DRAFT"
  | "OPEN"
  | "NEGOTIATING"
  | "SIGNING"
  | "CLOSED"
  | "CANCELLED";

export type InvestmentStatus =
  | "INVITED"
  | "REVIEWING"
  | "TERM_AGREED"
  | "SIGNING"
  | "FUNDED"
  | "CLOSED"
  | "DECLINED";

export type DocumentStatus =
  | "DRAFT"
  | "AWAITING_SIGNATURES"
  | "PARTIALLY_SIGNED"
  | "FULLY_SIGNED"
  | "VOID";

export type SecurityType =
  | "COMMON"
  | "PREFERRED_SEED"
  | "PREFERRED_A"
  | "SAFE"
  | "NOTE"
  | "OPTION"
  | "WARRANT";
