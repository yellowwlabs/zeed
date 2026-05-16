// src/app/companies/[id]/deals/new/page.tsx
import { NewDealForm } from "./form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NewDealPage({ params }: Props) {
  const { id } = await params;
  return <NewDealForm companyId={id} />;
}

