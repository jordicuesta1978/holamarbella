// Alter reservas table to make check_in/check_out nullable
const PAT = process.env.SUPABASE_PAT || "REVOKED";
const REF = "kftyemxltrzxafzpyafh";
const API = `https://api.supabase.com/v1/projects/${REF}/database/query`;

async function query(sql) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, error: text };
  return { ok: true, data: JSON.parse(text) };
}

const r1 = await query("ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cleaning_fee INTEGER NOT NULL DEFAULT 40");
console.log("cleaning_fee:", r1.ok ? "OK" : r1.error);

const r2 = await query("ALTER TABLE reservas ADD COLUMN IF NOT EXISTS extras JSONB NOT NULL DEFAULT '[]'");
console.log("extras:", r2.ok ? "OK" : r2.error);

console.log("Done.");
