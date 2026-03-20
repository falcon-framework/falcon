import { db } from "../index.js";
import { falconApp, appCapability } from "../schema/connection.js";

const apps = [
  {
    id: "app_crm",
    slug: "crm",
    name: "CRM",
    description: "Customer relationship management",
    status: "active" as const,
  },
  {
    id: "app_billing",
    slug: "billing",
    name: "Billing",
    description: "Billing and invoicing",
    status: "active" as const,
  },
  {
    id: "app_helpdesk",
    slug: "helpdesk",
    name: "Helpdesk",
    description: "Customer support and ticketing",
    status: "active" as const,
  },
];

const capabilities = [
  {
    id: "cap_crm_read",
    appId: "app_crm",
    scopeKey: "customers.read",
    description: "Read customer data",
  },
  {
    id: "cap_crm_write",
    appId: "app_crm",
    scopeKey: "customers.write",
    description: "Write customer data",
  },
  {
    id: "cap_billing_read",
    appId: "app_billing",
    scopeKey: "invoices.read",
    description: "Read invoices",
  },
  {
    id: "cap_billing_write",
    appId: "app_billing",
    scopeKey: "invoices.write",
    description: "Create/update invoices",
  },
  {
    id: "cap_helpdesk_read",
    appId: "app_helpdesk",
    scopeKey: "tickets.read",
    description: "Read support tickets",
  },
  {
    id: "cap_helpdesk_write",
    appId: "app_helpdesk",
    scopeKey: "tickets.write",
    description: "Create/update tickets",
  },
];

async function seed() {
  console.log("Seeding connection apps...");

  await db.insert(falconApp).values(apps).onConflictDoNothing();

  await db.insert(appCapability).values(capabilities).onConflictDoNothing();

  console.log("Seed complete.");
}

seed().catch(console.error);
