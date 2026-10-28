import { loadEnv, VARS } from "./env";

// Reports which variables are set. Never prints values.
loadEnv();
let missingRequired = 0;
for (const v of VARS) {
  const set = Boolean(process.env[v.name]?.trim());
  if (!set && v.required) missingRequired++;
  console.log(`${set ? "set    " : "missing"}  ${v.name}${v.required ? "" : " (optional)"}`);
}
if (!process.env.OWNER_TRANSFER_NUMBER?.trim()) console.log("note: transfer number not set, so the transfer tool is omitted.");
process.exit(missingRequired > 0 ? 1 : 0);
