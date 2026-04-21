import { InsForgeClient } from "@insforge/sdk";

const client = new InsForgeClient({
  baseUrl: "https://arqsta8h.us-west.insforge.app",
  anonKey: "ik_d3902514ce290fc64bb4900a677890ce"
});

async function diagnose() {
  console.log("=== 1. SELECT test ===");
  const sel = await client.database.from("tasks").select("*");
  console.log("Select error:", sel.error);
  console.log("Select data count:", sel.data?.length);
  if (sel.data?.length) console.log("First row:", JSON.stringify(sel.data[0]));

  console.log("\n=== 2. INSERT test (camelCase column) ===");
  const ins = await client.database.from("vendors").insert([{
    name: "Diagnostic Test Vendor",
    contact: "Tester",
    email: "test@example.com",
    phone: "555-9999",
    category: "Produce",
    deliveryDays: ["M"],
    notes: "Testing case sensitivity"
  }]);
  console.log("Insert error:", ins.error);
  console.log("Insert data:", ins.data);

  console.log("\n=== 3. DELETE test (cleanup) ===");
  const sel2 = await client.database.from("vendors").select("*");
  const testRow = sel2.data?.find((r) => r.name === "Diagnostic Test Vendor");
  if (testRow) {
    const del = await client.database.from("vendors").delete().eq("id", testRow.id);
    console.log("Delete error:", del.error);
    console.log("Delete data:", del.data);
  } else {
    console.log("Could not find inserted row to delete.");
  }

  console.log("\n=== Done ===");
}

diagnose().catch(console.error);
