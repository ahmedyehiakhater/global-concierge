import { FINANCIAL_DOCUMENTS } from "./financialDocuments.js";
import { MANAGEMENT_DOCUMENTS } from "./managementDocuments.js";
export const OWNERS = [
  {
    id: "nour",
    name: "Nour",
    role: "Product",
    description: "Briefs & acceptance criteria",
  },
  {
    id: "ellie",
    name: "Ellie",
    role: "Design",
    description: "Screens & design decisions",
  },
  {
    id: "omar",
    name: "Omar",
    role: "Engineering",
    description: "Implementation & architecture",
  },
  {
    id: "priya",
    name: "Priya",
    role: "QA",
    description: "Test cases & evidence",
  },
  {
    id: "sami",
    name: "Sami",
    role: "Delivery",
    description: "Scope, timeline & budget",
  },
];
import { PRODUCT_DOCUMENTS } from "./productDocuments.js";
import { DASHBOARD_DOCUMENTS } from "./dashboardDocuments.js";
import { BOOKING_DOCUMENTS } from "./bookingDocuments.js";
export const ARTIFACTS = [
  ...PRODUCT_DOCUMENTS,
  ...DASHBOARD_DOCUMENTS,
  ...BOOKING_DOCUMENTS,
  ...MANAGEMENT_DOCUMENTS,
  ...FINANCIAL_DOCUMENTS,
];
export function getArtifact(id) {
  return ARTIFACTS.find((a) => a.id === id);
}
export function forOwner(owner) {
  return ARTIFACTS.filter((a) => a.owner === owner);
}
export function artifactCard(id) {
  const a = getArtifact(id);
  if (!a) throw new Error(`Unknown artefact: ${id}`);
  return {
    id: a.id,
    title: a.title,
    kind: a.kind,
    status: a.status,
    owner: a.owner,
    version: a.version,
  };
}
