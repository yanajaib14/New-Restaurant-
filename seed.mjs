import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:211919448a449a8c985b520fc3895aeb@arqsta8h.us-west.database.insforge.app:5432/insforge?sslmode=require'
});

const DATA = {
  vendors: [
    { name: "Green Valley Farms", contact: "Maria Garcia", email: "maria@greenvalley.com", phone: "555-0101", category: "Produce", deliveryDays: JSON.stringify(["M", "W", "F"]), notes: "" },
    { name: "Ocean's Best", contact: "Dave Chen", email: "dave@oceansbest.com", phone: "555-0102", category: "Seafood", deliveryDays: JSON.stringify(["T", "Th", "S"]), notes: "" },
    { name: "Artisan Bakery", contact: "Sarah Miller", email: "sarah@artisanbakery.com", phone: "555-0103", category: "Bakery", deliveryDays: JSON.stringify(["M", "T", "W", "Th", "F", "S"]), notes: "" },
  ],
  inventory_items: [
    { name: "Whole Milk", category: "Operating Supplies", department: "Kitchen", procurementStatus: "Arrived", vendorId: 1, price: 45.00, leadTime: "1 day", currentStock: 12, parLevel: 10, unit: "cases", lastOrdered: "Apr 12" },
    { name: "Avocados", category: "Operating Supplies", department: "Kitchen", procurementStatus: "Arrived", vendorId: 2, price: 35.00, leadTime: "2 days", currentStock: 2, parLevel: 5, unit: "flats", lastOrdered: "Apr 13" },
    { name: "Espresso Beans", category: "Operating Supplies", department: "Bar", procurementStatus: "Arrived", vendorId: 3, price: 120.00, leadTime: "3 days", currentStock: 15, parLevel: 8, unit: "kg", lastOrdered: "Apr 10" },
    { name: "Paper Napkins", category: "Operating Supplies", department: "FOH", procurementStatus: "Arrived", vendorId: 1, price: 25.00, leadTime: "5 days", currentStock: 4, parLevel: 6, unit: "cases", lastOrdered: "Apr 05" },
    { name: "Wok", category: "One-Time Deco", department: "Kitchen", procurementStatus: "Ordered", vendorId: 1, price: 85.00, leadTime: "7 days", currentStock: 1, parLevel: 1, unit: "pc", lastOrdered: "Apr 14" },
    { name: "Dining Chairs", category: "Furniture", department: "FOH", procurementStatus: "Not Ordered", vendorId: 2, price: 1200.00, leadTime: "14 days", currentStock: 0, parLevel: 24, unit: "pcs", lastOrdered: "" },
  ],
  permits: [
    { name: "Health Operating Permit", issuer: "County Health Dept", expiryDate: "2026-12-31", status: "Active" },
    { name: "Liquor License", issuer: "State ABC Board", expiryDate: "2026-06-15", status: "Active" },
    { name: "Fire Safety Certificate", issuer: "City Fire Marshal", expiryDate: "2026-04-30", status: "Expiring Soon" },
    { name: "Business License", issuer: "City Clerk", expiryDate: "2026-01-10", status: "Expired" },
  ],
  marketing_posts: [
    { platform: "Instagram", title: "Coming Soon Teaser", date: "2026-04-10", status: "Posted" },
    { platform: "Facebook", title: "Grand Opening Event", date: "2026-04-15", status: "Scheduled" },
    { platform: "Website", title: "Full Menu Reveal", date: "2026-04-20", status: "Draft" },
  ],
  tasks: [
    { category:"Lease & TI", task:"Sign Lease", due:"", status:"Not Started", priority:"High", checklist:JSON.stringify([{id:101,text:"Confirm TI allowance amount",done:false},{id:102,text:"Schedule walk-through inspection",done:false},{id:103,text:"Approve final floor layout",done:false},{id:104,text:"Review lease terms with attorney",done:false}]) },
    { category:"Lease & TI", task:"TI Buildout Start", due:"", status:"Not Started", priority:"High", checklist:JSON.stringify([{id:201,text:"Hire general contractor",done:false},{id:202,text:"Pull construction permits",done:false},{id:203,text:"Finalize design plans",done:false}]) },
    { category:"Menu & Bar", task:"Finalize Menu", due:"", status:"In Progress", priority:"High", checklist:JSON.stringify([{id:301,text:"Test all recipes with kitchen team",done:true},{id:302,text:"Calculate food cost % per item",done:false},{id:303,text:"Order initial ingredients",done:false},{id:304,text:"Design and print menus",done:false}]) },
    { category:"Permits", task:"Liquor License", due:"", status:"Overdue", priority:"Critical", checklist:JSON.stringify([{id:601,text:"File state application",done:true},{id:602,text:"Post public notice",done:true},{id:603,text:"Schedule hearing date",done:false},{id:604,text:"Submit supporting documents",done:false}]) },
    { category:"Permits", task:"Health Permit", due:"", status:"In Progress", priority:"High", checklist:JSON.stringify([{id:701,text:"Gather required documents",done:true},{id:702,text:"Schedule health inspection",done:false},{id:703,text:"Submit application",done:false}]) },
    { category:"Staffing", task:"Hire FOH & Kitchen Staff", due:"", status:"Not Started", priority:"High", checklist:JSON.stringify([{id:501,text:"Post job ads on Indeed",done:false},{id:502,text:"Screen applications",done:false},{id:503,text:"Schedule interviews",done:false}]) },
    { category:"Financials", task:"Finalize Budget", due:"", status:"In Progress", priority:"High", checklist:JSON.stringify([{id:901,text:"Record all startup costs",done:true},{id:902,text:"Forecast monthly expenses",done:false},{id:903,text:"Set up accounting software",done:false}]) },
    { category:"Operations", task:"Set Up POS", due:"", status:"Not Started", priority:"High", checklist:JSON.stringify([{id:1001,text:"Choose and purchase POS system",done:false},{id:1002,text:"Configure menu in system",done:false},{id:1003,text:"Train staff on POS",done:false}]) },
  ],
  task_todos: [
    { title: "Call city about signage permit requirements", category: "Permits", status: "Inbox", assignedTo: "Owner", linkedTaskId: null },
    { title: "Collect internet quotes for FOH and office", category: "IT & Systems", status: "Inbox", assignedTo: "Manager", linkedTaskId: null },
    { title: "Draft opening week training roster", category: "Staffing", status: "Linked", assignedTo: "Partner", linkedTaskId: 6 },
  ],
  menu_items: [
    { section:"Small Plates", name:"Crispy Wings", "desc":"House-smoked, chipotle honey glaze", price:16, foodCost:28, hero:true, notes:"Best seller candidate", imageUrl: "https://picsum.photos/seed/wings/200/200", ingredients: JSON.stringify([{ id: 101, name: "Chicken Wings", quantity: 1, unit: "lb", cost: 4.50 }, { id: 102, name: "Chipotle Paste", quantity: 2, unit: "oz", cost: 0.80 }, { id: 103, name: "Honey", quantity: 1, unit: "oz", cost: 0.40 }]) },
    { section:"Small Plates", name:"Truffle Flatbread", "desc":"Whipped ricotta, wild mushrooms, arugula", price:18, foodCost:25, hero:false, notes:"", imageUrl: "https://picsum.photos/seed/flatbread/200/200", ingredients: JSON.stringify([{ id: 201, name: "Pizza Dough", quantity: 1, unit: "pc", cost: 1.20 }, { id: 202, name: "Ricotta", quantity: 4, unit: "oz", cost: 1.50 }, { id: 203, name: "Truffle Oil", quantity: 0.5, unit: "oz", cost: 2.00 }, { id: 204, name: "Mushrooms", quantity: 3, unit: "oz", cost: 0.90 }]) },
    { section:"Small Plates", name:"Pork Dumplings", "desc":"Pan-fried, ginger-scallion broth", price:15, foodCost:32, hero:false, notes:"Cost needs review", imageUrl: "https://picsum.photos/seed/dumplings/200/200", ingredients: JSON.stringify([{ id: 301, name: "Dumpling Wrappers", quantity: 6, unit: "pc", cost: 0.60 }, { id: 302, name: "Ground Pork", quantity: 4, unit: "oz", cost: 1.80 }, { id: 303, name: "Ginger", quantity: 0.5, unit: "oz", cost: 0.20 }]) },
    { section:"Shared Plates", name:"Lamb Pasta", "desc":"House pappardelle, braised lamb, mint gremolata", price:28, foodCost:30, hero:true, notes:"Weekend special", imageUrl: "https://picsum.photos/seed/pasta/200/200", ingredients: JSON.stringify([{ id: 401, name: "Pappardelle", quantity: 6, unit: "oz", cost: 1.50 }, { id: 402, name: "Lamb Shank", quantity: 8, unit: "oz", cost: 6.00 }, { id: 403, name: "Mint", quantity: 0.2, unit: "oz", cost: 0.30 }]) },
    { section:"Shared Plates", name:"Steak Stir-Fry", "desc":"Wok-charred, seasonal vegetables", price:32, foodCost:34, hero:false, notes:"High cost", imageUrl: "https://picsum.photos/seed/steak/200/200", ingredients: JSON.stringify([{ id: 501, name: "Flank Steak", quantity: 8, unit: "oz", cost: 8.50 }, { id: 502, name: "Broccoli", quantity: 4, unit: "oz", cost: 0.60 }, { id: 503, name: "Soy Sauce", quantity: 1, unit: "oz", cost: 0.20 }]) },
    { section:"Catering", name:"Avocado Toast", "desc":"Sourdough, heirloom tomato, poached egg", price:17, foodCost:22, hero:false, notes:"", imageUrl: "https://picsum.photos/seed/avocado/200/200", ingredients: JSON.stringify([{ id: 601, name: "Sourdough", quantity: 1, unit: "slice", cost: 0.80 }, { id: 602, name: "Avocado", quantity: 0.5, unit: "pc", cost: 1.50 }, { id: 603, name: "Egg", quantity: 1, unit: "pc", cost: 0.40 }]) },
    { section:"Catering", name:"French Toast Stack", "desc":"Brioche, caramelized banana, crème fraîche", price:19, foodCost:20, hero:true, notes:"Photo-worthy", imageUrl: "https://picsum.photos/seed/frenchtoast/200/200", ingredients: JSON.stringify([{ id: 701, name: "Brioche", quantity: 2, unit: "slice", cost: 1.20 }, { id: 702, name: "Banana", quantity: 1, unit: "pc", cost: 0.30 }, { id: 703, name: "Maple Syrup", quantity: 2, unit: "oz", cost: 1.00 }]) },
    { section:"Drinks", name:"Smoked Old Fashioned", "desc":"Bourbon, cherry, smoked orange peel", price:18, foodCost:20, hero:true, notes:"Tableside smoke", imageUrl: "https://picsum.photos/seed/cocktail/200/200", ingredients: JSON.stringify([{ id: 801, name: "Bourbon", quantity: 2, unit: "oz", cost: 3.00 }, { id: 802, name: "Bitters", quantity: 0.1, unit: "oz", cost: 0.20 }]) },
    { section:"Drinks", name:"Aperol Spritz", "desc":"Aperol, prosecco, soda, orange", price:14, foodCost:18, hero:false, notes:"", imageUrl: "https://picsum.photos/seed/spritz/200/200", ingredients: JSON.stringify([{ id: 901, name: "Aperol", quantity: 2, unit: "oz", cost: 1.50 }, { id: 902, name: "Prosecco", quantity: 3, unit: "oz", cost: 1.20 }]) },
    { section:"Drinks", name:"Seasonal Mocktail", "desc":"Rotating botanical, house-made syrups", price:12, foodCost:15, hero:false, notes:"", imageUrl: "https://picsum.photos/seed/mocktail/200/200", ingredients: JSON.stringify([{ id: 1001, name: "House Syrup", quantity: 1, unit: "oz", cost: 0.50 }, { id: 1002, name: "Club Soda", quantity: 6, unit: "oz", cost: 0.30 }]) },
    { section:"Wine", name:"Cabernet Sauvignon", "desc":"Napa Valley, 2019. Bold with dark fruit notes.", price:0, foodCost:33, hero:true, notes:"Premium selection", imageUrl: "https://picsum.photos/seed/wine/200/200", ingredients: '[]', costPerBottle: 28, sellPriceBottle: 85, sellPriceGlass: 22 },
    { section:"Specials", name:"Pan-Seared Scallops", "desc":"Cauliflower purée, crispy pancetta, lemon butter", price:38, foodCost:28, hero:true, notes:"Weekend special", imageUrl: "https://picsum.photos/seed/scallops/200/200", ingredients: JSON.stringify([{ id: 1201, name: "U10 Scallops", quantity: 4, unit: "pc", cost: 8.00 }, { id: 1202, name: "Pancetta", quantity: 1, unit: "oz", cost: 1.20 }, { id: 1203, name: "Cauliflower", quantity: 4, unit: "oz", cost: 0.50 }]) },
  ],
  startup_costs: [
    { category:"Lease & Deposits", budgeted:45000, actual:45000 },
    { category:"TI Build-Out", budgeted:120000, actual:98000 },
    { category:"Equipment & FF&E", budgeted:75000, actual:82000 },
    { category:"Initial Inventory", budgeted:18000, actual:14500 },
    { category:"Marketing & Branding", budgeted:15000, actual:9200 },
    { category:"Licenses & Permits", budgeted:8000, actual:6800 },
    { category:"Technology & POS", budgeted:12000, actual:10500 },
    { category:"Working Capital", budgeted:50000, actual:50000 },
  ],
  operating_costs: [
    { category:"Payroll (FOH)", monthly:18000 },
    { category:"Payroll (BOH)", monthly:14000 },
    { category:"Food Cost (~30%)", monthly:22000 },
    { category:"Beverage Cost (~22%)", monthly:8800 },
    { category:"Rent", monthly:12000 },
    { category:"Utilities", monthly:3200 },
    { category:"Insurance", monthly:1800 },
    { category:"Marketing", monthly:2500 },
    { category:"Misc / Supplies", monthly:2200 },
  ],
  milestones: [
    { milestone:"Lease Signed", date:"Apr 15", phase:"Pre-Launch", done:false },
    { milestone:"Permits Filed", date:"Apr 18", phase:"Pre-Launch", done:false },
    { milestone:"TI Buildout Starts", date:"Apr 25", phase:"Construction", done:false },
    { milestone:"Staff Hired", date:"May 5", phase:"Staffing", done:false },
    { milestone:"Menu Finalized", date:"May 10", phase:"Operations", done:false },
    { milestone:"POS Live", date:"May 15", phase:"Operations", done:false },
    { milestone:"Staff Training", date:"May 18", phase:"Training", done:false },
    { milestone:"Soft Opening", date:"May 28", phase:"Launch", done:false },
    { milestone:"🎉 Grand Opening", date:"Jun 7", phase:"Launch", done:false },
  ],
  notes: [
    { tag:"Vendor", title:"Produce Supplier", body:"Green Valley Farms — ask about net-30 terms. Contact: Maria ext. 204", date:"Apr 8", files: '[]' },
    { tag:"Menu", title:"Seasonal Additions", body:"Consider stone fruit for summer desserts. Peach cobbler or apricot tart?", date:"Apr 9", files: '[]' },
    { tag:"Operations", title:"Opening Checklists", body:"Need AM and PM opening/closing checklists. Check competitor templates.", date:"Apr 9", files: '[]' },
  ],
  utility_accounts: [
    { name: "Pacific Gas & Electric", accountNumber: "9823-112-09", loginInfo: "User: restaurant_admin / Pass: P@ssw0rd123", monthlyCost: 1250, startDate: "2025-03-01", fileUrl: "https://example.com/bill.pdf" },
    { name: "City Water & Waste", accountNumber: "W-88291-X", loginInfo: "User: manager_foh / Pass: Water2025!", monthlyCost: 450, startDate: "2025-03-05" },
    { name: "Comcast Business", accountNumber: "8499 10 122 0092", loginInfo: "User: owner_wifi / Pass: FastNet99", monthlyCost: 280, startDate: "2025-03-10" },
  ],
  training_modules: [
    { title: "Espresso Machine Basics", category: "FOH", completed: false, videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", date: "2026-04-18", steps: JSON.stringify([{ id: 1, text: "Grind settings", done: true }, { id: 2, text: "Milk steaming", done: false }, { id: 3, text: "Cleaning cycle", done: false }]) },
    { title: "Kitchen Safety & Sanitation", category: "BOH", completed: false, date: "2026-04-22", steps: JSON.stringify([{ id: 4, text: "Hand washing", done: true }, { id: 5, text: "Knife handling", done: true }, { id: 6, text: "Chemical storage", done: false }]) },
  ],
  daily_checklists: [
    { title: "FOH Opening", shift: "AM", items: JSON.stringify([{ id: 1, text: "Unlock doors", done: true }, { id: 2, text: "Count till", done: true }, { id: 3, text: "Brew coffee", done: false }]) },
    { title: "Kitchen Closing", shift: "PM", items: JSON.stringify([{ id: 4, text: "Clean grills", done: false }, { id: 5, text: "Sweep floors", done: false }, { id: 6, text: "Lock walk-in", done: false }]) },
  ],
  positions: [
    { role: "General Manager", openings: 1, hired: 0, status: "Urgent" },
    { role: "Executive Chef", openings: 1, hired: 1, status: "Filled" },
    { role: "Servers", openings: 6, hired: 2, status: "Urgent" },
    { role: "Bartenders", openings: 4, hired: 1, status: "Urgent" },
  ],
  candidates: [
    { name: "Alice Smith", position: "General Manager", stage: "Interviewed", date: "2026-04-16", feedback: "Strong background in upscale dining. Partner needs to meet her.", trialScores: null },
    { name: "Bob Johnson", position: "Servers", stage: "Trial Shift", date: "2026-04-19", feedback: "Local student, available weekends.", trialScores: JSON.stringify({ technique: 4, speed: 3, vibe: 5 }), partnerNotes: "Very outgoing, perfect for FOH." },
  ],
  activity_logs: [
    { "user": "Owner", action: "Updated staffing budget for Kitchen", timestamp: "10 mins ago" },
    { "user": "Partner", action: "Added new candidate: Alice Smith", timestamp: "45 mins ago" },
    { "user": "Manager", action: "Completed 'Grind Settings' training module", timestamp: "2 hours ago" },
  ],
  digital_assets: [
    { name: "Instagram", category: "Social Media", url: "instagram.com/ourrestaurant", loginInfo: "User: ourrest_admin\nPass: *********", notes: "Main marketing channel" },
    { name: "Shopify", category: "Software", url: "shopify.com", loginInfo: "Email: owner@rest.com", notes: "Merch and gift cards" },
    { name: "Toast POS", category: "POS", url: "toasttab.com", loginInfo: "Admin: manager1", notes: "Primary point of sale" },
  ]
};

async function seed() {
  console.log("Connecting database to purge all current dummy data...");
  await client.connect();
  
  // Truncate cascades all data across all tables instantly
  await client.query(`
    TRUNCATE vendors, inventory_items, permits, marketing_posts, task_todos, tasks, menu_items, startup_costs, operating_costs, milestones, notes, utility_accounts, training_modules, daily_checklists, invoices, positions, candidates, activity_logs, digital_assets RESTART IDENTITY CASCADE;
  `);
  
  console.log("Database Purged! Inserting 'Glai Kangwon' full data set via direct PG client...");

  for (const [table, rows] of Object.entries(DATA)) {
    console.log(`  Seeding ${table}...`);
    for (const row of rows) {
      const keys = Object.keys(row).map(k => `"${k}"`);
      const values = Object.values(row);
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
      try {
        await client.query(sql, values);
      } catch (err) {
        console.error(`    ✗ Error in ${table}:`, err.message);
      }
    }
    console.log(`    ✓ ${table} complete`);
  }
  
  console.log("\nRefresh Complete!");
  await client.end();
}
seed().catch(console.error);
