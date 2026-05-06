import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  T, CAT_COLORS, STATUS_COLORS, PRIORITY_COLORS, NOTE_TAG_COLORS,
  CATEGORIES, INV_CATEGORIES, DEPARTMENTS, MENU_SECTIONS, Task, TaskTodoItem, TodoSubtask, TODO_STATUS_COLORS, TODO_STATUSES,
  MenuItem, StartupCost, OperatingCost, Milestone, Note, Vendor,
  InventoryItem, Permit, MarketingPost, TrainingModule, DailyChecklist,
  UtilityAccount, DigitalAsset, User, ActivityLog, UserRole, Invoice, Position, Candidate,
  CalendarEvent
} from "./types";
import { Pill, Btn, SectionHeader, PinGate, ChangePinModal, ChangePasswordModal, inpStyle, dropdownStyle, ProgressRing, Modal, Field } from "./components/UI";
import { TaskModal, TaskRow } from "./components/TaskBoard";
import { MenuModal } from "./components/MenuPlanner";
import { FinModal } from "./components/Financials";
import { CostCalculator } from "./components/CostCalculator";
import { TeamOnboarding } from "./components/TeamOnboarding";
import { Timeline, TimelineModal } from "./components/Timeline";
import { NoteModal, NoteCard, NoteDetailModal } from "./components/Notes";
import { AIAssistant } from "./components/AI";
import { useAuth } from "./context/AuthContext";
import { Login } from "./components/Login";
import { insforge, SYNC_CHANNEL, dbSelect, dbInsert, dbUpdate, dbDelete } from "./services/insforge";
import { VendorManager, VendorModal, InventoryTracker, InventoryModal, PermitTracker, PermitModal, UtilityTracker, UtilityModal } from "./components/Operations";
import { MasterInventory } from "./components/MasterInventory";
import { MarketingCalendar, MarketingModal, TrainingPortal, TrainingModal, DailyChecklistManager, ChecklistModal, DigitalAssetManager, DigitalAssetModal } from "./components/MarketingTraining";
import { InvoicesSection, InvoiceModal } from "./components/Invoices";
import { TalentHiring, TeamMap, TeamMapMemberModal, PositionModal, CandidateModal } from "./components/Team";
import { LaunchWindow, FullCalendar } from "./components/CalendarView";
import { getGoogleAuthUrl, getGoogleDriveStatus, saveToGoogleDrive, fileToBase64 } from "./services/googleDriveService";
import { exportToCSV } from "./lib/exportUtils";

import { LayoutDashboard, CheckSquare, Utensils, ShoppingCart, Package, DollarSign, FileText, Box, Users, ShieldCheck, Megaphone, GraduationCap, ClipboardList, Calculator, UserPlus, Calendar, FileEdit, Sparkles, PenLine, Trash2, Printer, Download, Upload } from "lucide-react";

type ShoppingListItem = {
  id: string;
  sourceKey?: string;
  name: string;
  quantity: number;
  unit: string;
  totalCost: number;
  items: string[];
  category: string;
  department: string;
  purchaseType?: "Vendor" | "Store" | "";
  vendorName?: string;
  storeName?: string;
  storeUrl?: string;
  isManual?: boolean;
};

const TASK_TODOS_STORAGE_KEY = "restaurant_task_todos_v1";

const readStoredTaskTodos = (): TaskTodoItem[] | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(TASK_TODOS_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const normalizeLegacyTodoStatus = (status: unknown): TaskTodoItem["status"] => {
  const value = String(status || "").trim();
  if (value === "Not Started" || value === "In Progress" || value === "Done" || value === "On Hold") return value;
  if (value === "Inbox") return "Not Started";
  if (value === "Linked") return "In Progress";
  return "Not Started";
};

const sanitizeTaskTodo = (todo: any): TaskTodoItem => ({
  id: Number(todo?.id || Date.now()),
  title: String(todo?.title || "Untitled"),
  category: CATEGORIES.includes(String(todo?.category || "")) ? String(todo.category) : CATEGORIES[0],
  status: normalizeLegacyTodoStatus(todo?.status),
  assignedTo: todo?.assignedTo ? String(todo.assignedTo) : undefined,
  linkedTaskId: todo?.linkedTaskId ? Number(todo.linkedTaskId) : null,
  linkUrl: todo?.linkUrl ? String(todo.linkUrl) : undefined,
  note: todo?.note ? String(todo.note) : undefined,
  subtasks: Array.isArray(todo?.subtasks) ? todo.subtasks : [],
  created_at: todo?.created_at ? String(todo.created_at) : new Date().toISOString(),
});

const TODO_STATUS_ORDER: Record<TaskTodoItem["status"], number> = {
  "Not Started": 0,
  "In Progress": 1,
  "On Hold": 2,
  Done: 3,
};

// ������ INITIAL DATA ��������������������������������������������������������������������������������������������������������������������������
const INIT_VENDORS: Vendor[] = [
  { id: 1, name: "Green Valley Farms", contact: "Maria Garcia", email: "maria@greenvalley.com", phone: "555-0101", category: "Produce", deliveryDays: ["M", "W", "F"], notes: "" },
  { id: 2, name: "Ocean's Best", contact: "Dave Chen", email: "dave@oceansbest.com", phone: "555-0102", category: "Seafood", deliveryDays: ["T", "Th", "S"], notes: "" },
  { id: 3, name: "Artisan Bakery", contact: "Sarah Miller", email: "sarah@artisanbakery.com", phone: "555-0103", category: "Bakery", deliveryDays: ["M", "T", "W", "Th", "F", "S"], notes: "" },
];

const INIT_INVENTORY: InventoryItem[] = [
  { id: 1, name: "Whole Milk", category: "Operating Supplies", department: "Kitchen", procurementStatus: "Arrived", vendorId: 1, price: 45.00, leadTime: "1 day", currentStock: 12, parLevel: 10, unit: "cases", lastOrdered: "Apr 12" },
  { id: 2, name: "Avocados", category: "Operating Supplies", department: "Kitchen", procurementStatus: "Arrived", vendorId: 2, price: 35.00, leadTime: "2 days", currentStock: 2, parLevel: 5, unit: "flats", lastOrdered: "Apr 13" },
  { id: 3, name: "Espresso Beans", category: "Operating Supplies", department: "Bar", procurementStatus: "Arrived", vendorId: 3, price: 120.00, leadTime: "3 days", currentStock: 15, parLevel: 8, unit: "kg", lastOrdered: "Apr 10" },
  { id: 4, name: "Paper Napkins", category: "Operating Supplies", department: "FOH", procurementStatus: "Arrived", vendorId: 1, price: 25.00, leadTime: "5 days", currentStock: 4, parLevel: 6, unit: "cases", lastOrdered: "Apr 05" },
  { id: 5, name: "Wok", category: "One-Time Deco", department: "Kitchen", procurementStatus: "Ordered", vendorId: 1, price: 85.00, leadTime: "7 days", currentStock: 1, parLevel: 1, unit: "pc", lastOrdered: "Apr 14" },
  { id: 6, name: "Dining Chairs", category: "Furniture", department: "FOH", procurementStatus: "Not Ordered", vendorId: 2, price: 1200.00, leadTime: "14 days", currentStock: 0, parLevel: 24, unit: "pcs", lastOrdered: "" },
];

const INIT_PERMITS: Permit[] = [
  { id: 1, name: "Health Operating Permit", issuer: "County Health Dept", expiryDate: "2026-12-31", status: "Active" },
  { id: 2, name: "Liquor License", issuer: "State ABC Board", expiryDate: "2026-06-15", status: "Active" },
  { id: 3, name: "Fire Safety Certificate", issuer: "City Fire Marshal", expiryDate: "2026-04-30", status: "Expiring Soon" },
  { id: 4, name: "Business License", issuer: "City Clerk", expiryDate: "2026-01-10", status: "Expired" },
];

const INIT_MARKETING: MarketingPost[] = [
  { id: 1, platform: "Instagram", title: "Coming Soon Teaser", date: "2026-04-10", status: "Posted" },
  { id: 2, platform: "Facebook", title: "Grand Opening Event", date: "2026-04-15", status: "Scheduled" },
  { id: 3, platform: "Website", title: "Full Menu Reveal", date: "2026-04-20", status: "Draft" },
];

const INIT_TRAINING: TrainingModule[] = [
  { id: 1, title: "Espresso Machine Basics", category: "FOH", completed: false, videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", date: "2026-04-18", steps: [{ id: 1, text: "Grind settings", done: true }, { id: 2, text: "Milk steaming", done: false }, { id: 3, text: "Cleaning cycle", done: false }] },
  { id: 2, title: "Kitchen Safety & Sanitation", category: "BOH", completed: false, date: "2026-04-22", steps: [{ id: 4, text: "Hand washing", done: true }, { id: 5, text: "Knife handling", done: true }, { id: 6, text: "Chemical storage", done: false }] },
];

const INIT_CHECKLISTS: DailyChecklist[] = [
  { id: 1, title: "FOH Opening", shift: "AM", items: [{ id: 1, text: "Unlock doors", done: true }, { id: 2, text: "Count till", done: true }, { id: 3, text: "Brew coffee", done: false }] },
  { id: 2, title: "Kitchen Closing", shift: "PM", items: [{ id: 4, text: "Clean grills", done: false }, { id: 5, text: "Sweep floors", done: false }, { id: 6, text: "Lock walk-in", done: false }] },
];

const INIT_TASKS: Task[] = [
  { id:1, category:"Lease & TI", task:"Sign Lease", due:"", status:"Not Started", priority:"High", checklist:[{id:101,text:"Confirm TI allowance amount",done:false},{id:102,text:"Schedule walk-through inspection",done:false},{id:103,text:"Approve final floor layout",done:false},{id:104,text:"Review lease terms with attorney",done:false}] },
  { id:2, category:"Lease & TI", task:"TI Buildout Start", due:"", status:"Not Started", priority:"High", checklist:[{id:201,text:"Hire general contractor",done:false},{id:202,text:"Pull construction permits",done:false},{id:203,text:"Finalize design plans",done:false}] },
  { id:3, category:"Menu & Bar", task:"Finalize Menu", due:"", status:"In Progress", priority:"High", checklist:[{id:301,text:"Test all recipes with kitchen team",done:true},{id:302,text:"Calculate food cost % per item",done:false},{id:303,text:"Order initial ingredients",done:false},{id:304,text:"Design and print menus",done:false}] },
  { id:4, category:"Permits", task:"Liquor License", due:"", status:"Overdue", priority:"Critical", checklist:[{id:601,text:"File state application",done:true},{id:602,text:"Post public notice",done:true},{id:603,text:"Schedule hearing date",done:false},{id:604,text:"Submit supporting documents",done:false}] },
  { id:5, category:"Permits", task:"Health Permit", due:"", status:"In Progress", priority:"High", checklist:[{id:701,text:"Gather required documents",done:true},{id:702,text:"Schedule health inspection",done:false},{id:703,text:"Submit application",done:false}] },
  { id:6, category:"Staffing", task:"Hire FOH & Kitchen Staff", due:"", status:"Not Started", priority:"High", checklist:[{id:501,text:"Post job ads on Indeed",done:false},{id:502,text:"Screen applications",done:false},{id:503,text:"Schedule interviews",done:false}] },
  { id:7, category:"Financials", task:"Finalize Budget", due:"", status:"In Progress", priority:"High", checklist:[{id:901,text:"Record all startup costs",done:true},{id:902,text:"Forecast monthly expenses",done:false},{id:903,text:"Set up accounting software",done:false}] },
  { id:8, category:"Operations", task:"Set Up POS", due:"", status:"Not Started", priority:"High", checklist:[{id:1001,text:"Choose and purchase POS system",done:false},{id:1002,text:"Configure menu in system",done:false},{id:1003,text:"Train staff on POS",done:false}] },
];

const INIT_TASK_TODOS: TaskTodoItem[] = [
  { id: 1, title: "Call city about signage permit requirements", category: "Permits", status: "Not Started", assignedTo: "Owner", note: "Ask for same-day review option", created_at: new Date().toISOString() },
  { id: 2, title: "Collect internet quotes for FOH and office", category: "IT & Systems", status: "In Progress", assignedTo: "Manager", linkUrl: "https://example.com/provider-quotes", created_at: new Date().toISOString() },
  { id: 3, title: "Draft opening week training roster", category: "Staffing", status: "On Hold", assignedTo: "Partner", linkedTaskId: 6, note: "Waiting on final shift budget", created_at: new Date().toISOString() },
];

const INIT_MENU: MenuItem[] = [
  { id:1, section:"Small Plates", name:"Crispy Wings", desc:"House-smoked, chipotle honey glaze", price:16, foodCost:28, hero:true, notes:"Best seller candidate", imageUrl: "https://picsum.photos/seed/wings/200/200", ingredients: [
    { id: 101, name: "Chicken Wings", quantity: 1, unit: "lb", cost: 4.50 },
    { id: 102, name: "Chipotle Paste", quantity: 2, unit: "oz", cost: 0.80 },
    { id: 103, name: "Honey", quantity: 1, unit: "oz", cost: 0.40 }
  ] },
  { id:2, section:"Small Plates", name:"Truffle Flatbread", desc:"Whipped ricotta, wild mushrooms, arugula", price:18, foodCost:25, hero:false, notes:"", imageUrl: "https://picsum.photos/seed/flatbread/200/200", ingredients: [
    { id: 201, name: "Pizza Dough", quantity: 1, unit: "pc", cost: 1.20 },
    { id: 202, name: "Ricotta", quantity: 4, unit: "oz", cost: 1.50 },
    { id: 203, name: "Truffle Oil", quantity: 0.5, unit: "oz", cost: 2.00 },
    { id: 204, name: "Mushrooms", quantity: 3, unit: "oz", cost: 0.90 }
  ] },
  { id:3, section:"Small Plates", name:"Pork Dumplings", desc:"Pan-fried, ginger-scallion broth", price:15, foodCost:32, hero:false, notes:"Cost needs review", imageUrl: "https://picsum.photos/seed/dumplings/200/200", ingredients: [
    { id: 301, name: "Dumpling Wrappers", quantity: 6, unit: "pc", cost: 0.60 },
    { id: 302, name: "Ground Pork", quantity: 4, unit: "oz", cost: 1.80 },
    { id: 303, name: "Ginger", quantity: 0.5, unit: "oz", cost: 0.20 }
  ] },
  { id:4, section:"Shared Plates", name:"Lamb Pasta", desc:"House pappardelle, braised lamb, mint gremolata", price:28, foodCost:30, hero:true, notes:"Weekend special", imageUrl: "https://picsum.photos/seed/pasta/200/200", ingredients: [
    { id: 401, name: "Pappardelle", quantity: 6, unit: "oz", cost: 1.50 },
    { id: 402, name: "Lamb Shank", quantity: 8, unit: "oz", cost: 6.00 },
    { id: 403, name: "Mint", quantity: 0.2, unit: "oz", cost: 0.30 }
  ] },
  { id:5, section:"Shared Plates", name:"Steak Stir-Fry", desc:"Wok-charred, seasonal vegetables", price:32, foodCost:34, hero:false, notes:"High cost", imageUrl: "https://picsum.photos/seed/steak/200/200", ingredients: [
    { id: 501, name: "Flank Steak", quantity: 8, unit: "oz", cost: 8.50 },
    { id: 502, name: "Broccoli", quantity: 4, unit: "oz", cost: 0.60 },
    { id: 503, name: "Soy Sauce", quantity: 1, unit: "oz", cost: 0.20 }
  ] },
  { id:6, section:"Catering", name:"Avocado Toast", desc:"Sourdough, heirloom tomato, poached egg", price:17, foodCost:22, hero:false, notes:"", imageUrl: "https://picsum.photos/seed/avocado/200/200", ingredients: [
    { id: 601, name: "Sourdough", quantity: 1, unit: "slice", cost: 0.80 },
    { id: 602, name: "Avocado", quantity: 0.5, unit: "pc", cost: 1.50 },
    { id: 603, name: "Egg", quantity: 1, unit: "pc", cost: 0.40 }
  ] },
  { id:7, section:"Catering", name:"French Toast Stack", desc:"Brioche, caramelized banana, crème fraîche", price:19, foodCost:20, hero:true, notes:"Photo-worthy", imageUrl: "https://picsum.photos/seed/frenchtoast/200/200", ingredients: [
    { id: 701, name: "Brioche", quantity: 2, unit: "slice", cost: 1.20 },
    { id: 702, name: "Banana", quantity: 1, unit: "pc", cost: 0.30 },
    { id: 703, name: "Maple Syrup", quantity: 2, unit: "oz", cost: 1.00 }
  ] },
  { id:8, section:"Drinks", name:"Smoked Old Fashioned", desc:"Bourbon, cherry, smoked orange peel", price:18, foodCost:20, hero:true, notes:"Tableside smoke", imageUrl: "https://picsum.photos/seed/cocktail/200/200", ingredients: [
    { id: 801, name: "Bourbon", quantity: 2, unit: "oz", cost: 3.00 },
    { id: 802, name: "Bitters", quantity: 0.1, unit: "oz", cost: 0.20 }
  ] },
  { id:9, section:"Drinks", name:"Aperol Spritz", desc:"Aperol, prosecco, soda, orange", price:14, foodCost:18, hero:false, notes:"", imageUrl: "https://picsum.photos/seed/spritz/200/200", ingredients: [
    { id: 901, name: "Aperol", quantity: 2, unit: "oz", cost: 1.50 },
    { id: 902, name: "Prosecco", quantity: 3, unit: "oz", cost: 1.20 }
  ] },
  { id:10, section:"Drinks", name:"Seasonal Mocktail", desc:"Rotating botanical, house-made syrups", price:12, foodCost:15, hero:false, notes:"", imageUrl: "https://picsum.photos/seed/mocktail/200/200", ingredients: [
    { id: 1001, name: "House Syrup", quantity: 1, unit: "oz", cost: 0.50 },
    { id: 1002, name: "Club Soda", quantity: 6, unit: "oz", cost: 0.30 }
  ] },
  { id:11, section:"Wine", name:"Cabernet Sauvignon", desc:"Napa Valley, 2019. Bold with dark fruit notes.", price:0, foodCost:33, hero:true, notes:"Premium selection", imageUrl: "https://picsum.photos/seed/wine/200/200", ingredients: [], costPerBottle: 28, sellPriceBottle: 85, sellPriceGlass: 22 },
  { id:12, section:"Specials", name:"Pan-Seared Scallops", desc:"Cauliflower purée, crispy pancetta, lemon butter", price:38, foodCost:28, hero:true, notes:"Weekend special", imageUrl: "https://picsum.photos/seed/scallops/200/200", ingredients: [
    { id: 1201, name: "U10 Scallops", quantity: 4, unit: "pc", cost: 8.00 },
    { id: 1202, name: "Pancetta", quantity: 1, unit: "oz", cost: 1.20 },
    { id: 1203, name: "Cauliflower", quantity: 4, unit: "oz", cost: 0.50 }
  ] },
];

const INIT_UTILITIES: UtilityAccount[] = [
  { id: 1, name: "Pacific Gas & Electric", accountNumber: "9823-112-09", loginInfo: "User: restaurant_admin / Pass: P@ssw0rd123", monthlyCost: 1250, startDate: "2025-03-01", fileUrl: "https://example.com/bill.pdf" },
  { id: 2, name: "City Water & Waste", accountNumber: "W-88291-X", loginInfo: "User: manager_foh / Pass: Water2025!", monthlyCost: 450, startDate: "2025-03-05" },
  { id: 3, name: "Comcast Business", accountNumber: "8499 10 122 0092", loginInfo: "User: owner_wifi / Pass: FastNet99", monthlyCost: 280, startDate: "2025-03-10" },
];

const INIT_STARTUP: StartupCost[] = [
  { id:1, category:"Lease & Deposits", budgeted:45000, actual:45000 },
  { id:2, category:"TI Build-Out", budgeted:120000, actual:98000 },
  { id:3, category:"Equipment & FF&E", budgeted:75000, actual:82000 },
  { id:4, category:"Initial Inventory", budgeted:18000, actual:14500 },
  { id:5, category:"Marketing & Branding", budgeted:15000, actual:9200 },
  { id:6, category:"Licenses & Permits", budgeted:8000, actual:6800 },
  { id:7, category:"Technology & POS", budgeted:12000, actual:10500 },
  { id:8, category:"Working Capital", budgeted:50000, actual:50000 },
];

const INIT_OPERATING: OperatingCost[] = [
  { id:1, category:"Payroll (FOH)", monthly:18000 },
  { id:2, category:"Payroll (BOH)", monthly:14000 },
  { id:3, category:"Food Cost (~30%)", monthly:22000 },
  { id:4, category:"Beverage Cost (~22%)", monthly:8800 },
  { id:5, category:"Rent", monthly:12000 },
  { id:6, category:"Utilities", monthly:3200 },
  { id:7, category:"Insurance", monthly:1800 },
  { id:8, category:"Marketing", monthly:2500 },
  { id:9, category:"Misc / Supplies", monthly:2200 },
];

const INIT_TIMELINE: Milestone[] = [
  { id:1, milestone:"Lease Signed", date:"Apr 15", phase:"Pre-Launch", done:false },
  { id:2, milestone:"Permits Filed", date:"Apr 18", phase:"Pre-Launch", done:false },
  { id:3, milestone:"TI Buildout Starts", date:"Apr 25", phase:"Construction", done:false },
  { id:4, milestone:"Staff Hired", date:"May 5", phase:"Staffing", done:false },
  { id:5, milestone:"Menu Finalized", date:"May 10", phase:"Operations", done:false },
  { id:6, milestone:"POS Live", date:"May 15", phase:"Operations", done:false },
  { id:7, milestone:"Staff Training", date:"May 18", phase:"Training", done:false },
  { id:8, milestone:"Soft Opening", date:"May 28", phase:"Launch", done:false },
  { id:9, milestone:"Grand Opening", date:"Jun 7", phase:"Launch", done:false },
];

const INIT_NOTES: Note[] = [
  { id:1, tag:"Vendor", title:"Produce Supplier", body:"Green Valley Farms - ask about net-30 terms. Contact: Maria ext. 204", date:"Apr 8", files:[] },
  { id:2, tag:"Menu", title:"Seasonal Additions", body:"Consider stone fruit for summer desserts. Peach cobbler or apricot tart?", date:"Apr 9", files:[] },
  { id:3, tag:"Operations", title:"Opening Checklists", body:"Need AM and PM opening/closing checklists. Check competitor templates.", date:"Apr 9", files:[] },
];

const INIT_POSITIONS: Position[] = [
  { id: 1, role: "General Manager", openings: 1, hired: 0, status: "Urgent" },
  { id: 2, role: "Executive Chef", openings: 1, hired: 1, status: "Filled" },
  { id: 3, role: "Servers", openings: 6, hired: 2, status: "Urgent" },
  { id: 4, role: "Bartenders", openings: 4, hired: 1, status: "Urgent" },
];

const INIT_CANDIDATES: Candidate[] = [
  { id: 1, name: "Alice Smith", position: "General Manager", stage: "Interviewed", date: "2026-04-16", feedback: "Strong background in upscale dining. Partner needs to meet her." },
  { id: 2, name: "Bob Johnson", position: "Servers", stage: "Trial Shift", date: "2026-04-19", feedback: "Local student, available weekends.", trialScores: { technique: 4, speed: 3, vibe: 5 }, partnerNotes: "Very outgoing, perfect for FOH." },
];

const INIT_ACTIVITY: ActivityLog[] = [
  { id: 1, user: "Owner", action: "Updated staffing budget for Kitchen", timestamp: "10 mins ago" },
  { id: 2, user: "Partner", action: "Added new candidate: Alice Smith", timestamp: "45 mins ago" },
  { id: 3, user: "Manager", action: "Completed 'Grind Settings' training module", timestamp: "2 hours ago" },
  { id: 4, user: "Owner", action: "Critical task 'Liquor License' is now OVERDUE", timestamp: "3 hours ago" },
  { id: 5, user: "Partner", action: "Added 'Truffle Flatbread' to Seasonal Menu", timestamp: "5 hours ago" },
];

const INIT_ASSETS: DigitalAsset[] = [
  { id: 1, name: "Instagram", category: "Social Media", url: "instagram.com/ourrestaurant", loginInfo: "User: ourrest_admin\nPass: *********", notes: "Main marketing channel" },
  { id: 2, name: "Shopify", category: "Software", url: "shopify.com", loginInfo: "Email: owner@rest.com", notes: "Merch and gift cards" },
  { id: 3, name: "Toast POS", category: "POS", url: "toasttab.com", loginInfo: "Admin: manager1", notes: "Primary point of sale" },
];

export default function App() {
  type AccessUser = {
    id: number;
    email: string;
    name?: string;
    role: string;
    is_active: boolean;
    last_login_at?: string;
    revoked_at?: string;
    revoked_by?: string;
  };

  const [tab, setTab] = useState("overview");

  // Data states
  const [tasks, setTasks]       = useState<Task[]>(INIT_TASKS);
  const [taskTodos, setTaskTodos] = useState<TaskTodoItem[]>(() => {
    const stored = readStoredTaskTodos();
    return stored.length ? stored.map(sanitizeTaskTodo) : INIT_TASK_TODOS.map(sanitizeTaskTodo);
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INIT_MENU);
  const [startup, setStartup]   = useState<StartupCost[]>(INIT_STARTUP);
  const [operating, setOp]      = useState<OperatingCost[]>(INIT_OPERATING);
  const [timeline, setTL]       = useState<Milestone[]>(INIT_TIMELINE);
  const [notes, setNotes]       = useState<Note[]>(INIT_NOTES);
  const [vendors, setVendors]   = useState<Vendor[]>(INIT_VENDORS);
  const [inventory, setInventory] = useState<InventoryItem[]>(INIT_INVENTORY);
  const [permits, setPermits]   = useState<Permit[]>(INIT_PERMITS);
  const [utilities, setUtilities] = useState<UtilityAccount[]>(INIT_UTILITIES);
  const [utilityModal, setUtilityModal] = useState<UtilityAccount | "new" | null>(null);
  const [marketing, setMarketing] = useState<MarketingPost[]>(INIT_MARKETING);
  const [training, setTraining]   = useState<TrainingModule[]>(INIT_TRAINING);
  const [checklists, setChecklists] = useState<DailyChecklist[]>(INIT_CHECKLISTS);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // Modal states
  const [taskModal, setTaskModal]   = useState<any>(null); // null | "new" | task obj
  const [todoModal, setTodoModal]   = useState<TaskTodoItem | "new" | null>(null);
  const [menuModal, setMenuModal]   = useState<any>(null);
  const [finModal, setFinModal]     = useState<any>(null); // {type, item|null}
  const [tlModal, setTlModal]       = useState<any>(null);
  const [noteModal, setNoteModal]   = useState<any>(null);
  const [noteDetail, setNoteDetail] = useState<Note | null>(null);
  const [vendorModal, setVendorModal] = useState<any>(null);
  const [invModal, setInvModal]     = useState<any>(null);
  const [permitModal, setPermitModal] = useState<any>(null);
  const [mktModal, setMktModal]     = useState<any>(null);
  const [trainModal, setTrainModal] = useState<any>(null);
  const [chkModal, setChkModal]     = useState<any>(null);
  const [invoices, setInvoices]     = useState<Invoice[]>([]);
  const [positions, setPositions]   = useState<Position[]>(INIT_POSITIONS);
  const [candidates, setCandidates] = useState<Candidate[]>(INIT_CANDIDATES);
  const [assets, setAssets]         = useState<DigitalAsset[]>(INIT_ASSETS);
  const [posModal, setPosModal]     = useState<Position | "new" | null>(null);
  const [canModal, setCanModal]     = useState<Candidate | "new" | null>(null);
  const [teamMapModal, setTeamMapModal] = useState<Candidate | "new" | null>(null);
  const [assetModal, setAssetModal] = useState<DigitalAsset | "new" | null>(null);
  const [calDate, setCalDate]       = useState<string | null>(null);
  const [calendarFocusDate, setCalendarFocusDate] = useState<string | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<any>(null);
  const [isMobile, setIsMobile]     = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const { user: currentUser, role: userRole, logout, isLoading: isAuthLoading } = useAuth();
  const [securityPin, setSecurityPin] = useState(() => localStorage.getItem("app_security_pin") || "1379");
  const [activity, setActivity] = useState<ActivityLog[]>(INIT_ACTIVITY);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [appTitle, setAppTitle] = useState("ไกลกังวล");
  const [editTitle, setEditTitle] = useState("ไกลกังวล");
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>([]);
  const [accessLoading, setAccessLoading] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState("");
  const [taskTodoStore, setTaskTodoStore] = useState<"local" | "db">("local");
  const currentUserEmail = String(currentUser?.email || "").toLowerCase();
  const isPartnerAccount = currentUserEmail === "yanajaib@gmail.com";
  const canManageAccess = userRole === "Owner" || isPartnerAccount;


  const loadAllData = useCallback(async () => {
    try {
      const tableBindings: Array<{ table: string; set: (rows: any[]) => void }> = [
        { table: "tasks", set: setTasks as any },
        { table: "menu_items", set: setMenuItems as any },
        { table: "startup_costs", set: setStartup as any },
        { table: "operating_costs", set: setOp as any },
        { table: "milestones", set: setTL as any },
        { table: "notes", set: setNotes as any },
        { table: "vendors", set: setVendors as any },
        { table: "inventory_items", set: setInventory as any },
        { table: "utility_accounts", set: setUtilities as any },
        { table: "permits", set: setPermits as any },
        { table: "marketing_posts", set: setMarketing as any },
        { table: "training_modules", set: setTraining as any },
        { table: "daily_checklists", set: setChecklists as any },
        { table: "invoices", set: setInvoices as any },
        { table: "positions", set: setPositions as any },
        { table: "candidates", set: setCandidates as any },
        { table: "digital_assets", set: setAssets as any },
        { table: "shopping_list_items", set: setDbShoppingItems as any },
        { table: "cost_calculator_overrides", set: setDbCostCalcOverrides as any },
        { table: "calendar_events", set: setCalendarEvents as any },
      ];

      await Promise.all(
        tableBindings.map(async ({ table, set }) => {
          const { data, error } = await dbSelect(table);
          // Only update state when we get a real response (data is a non-null array).
          // A null data + no error means the SDK silently failed; keep current state.
          if (!error && Array.isArray(data)) set(data as any);
        })
      );

      const { data: todoRows, error: todoError } = await dbSelect("task_todos");
      if (!todoError && Array.isArray(todoRows)) {
        setTaskTodos(((todoRows as TaskTodoItem[]) || []).map(sanitizeTaskTodo));
        setTaskTodoStore("db");
      } else {
        setTaskTodoStore("local");
        const stored = readStoredTaskTodos();
        setTaskTodos((stored ?? INIT_TASK_TODOS).map(sanitizeTaskTodo));
      }

      const { data: activityRows, error: activityErr } = await dbSelect("activity_logs");
      if (!activityErr) {
        const rows = (activityRows as any[])
          .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
          .slice(0, 10)
          .map((a) => ({ id: Number(a.id), user: a.user, action: a.action, timestamp: a.timestamp }));
        setActivity(rows as ActivityLog[]);
      }
    } catch (e) {
      console.error("Insforge Sync Error:", e);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  useEffect(() => {
    if (taskTodoStore !== "local" || typeof window === "undefined") return;
    window.localStorage.setItem(TASK_TODOS_STORAGE_KEY, JSON.stringify(taskTodos));
  }, [taskTodos, taskTodoStore]);

  useEffect(() => {
    const loadTitle = async () => {
      try {
        const res = await fetch("/api/settings/title");
        const body = await res.json();
        const title = body?.title || "ไกลกังวล";
        setAppTitle(title);
        setEditTitle(title);
      } catch {
        setAppTitle("ไกลกังวล");
        setEditTitle("ไกลกังวล");
      }
    };
    loadTitle();
  }, []);

  const refreshAccessUsers = useCallback(async () => {
    setAccessLoading(true);
    try {
      const res = await fetch("/api/access/users");
      const body = await res.json();
      setAccessUsers((body?.users || []) as AccessUser[]);
    } catch (e) {
      console.error("Access list load failed", e);
    } finally {
      setAccessLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "settings" && isUnlocked) {
      refreshAccessUsers();
    }
  }, [tab, isUnlocked, refreshAccessUsers]);

  useEffect(() => {
    let active = true;

    const handleSync = () => {
      if (!active) return;
      loadAllData();
    };

    const bootRealtime = async () => {
      try {
        await insforge.realtime.connect();
        const sub = await insforge.realtime.subscribe(SYNC_CHANNEL);
        if (!sub.ok) {
          console.warn("Realtime subscribe failed", "error" in sub ? sub.error : sub);
          return;
        }
        insforge.realtime.on("db_changed", handleSync);
      } catch (e) {
        console.warn("Realtime connect failed", e);
      }
    };

    bootRealtime();

    const poll = setInterval(() => {
      loadAllData();
    }, 20000);

    const onFocus = () => loadAllData();
    window.addEventListener("focus", onFocus);

    return () => {
      active = false;
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
      insforge.realtime.off("db_changed", handleSync);
      insforge.realtime.unsubscribe(SYNC_CHANNEL);
      insforge.realtime.disconnect();
    };
  }, [loadAllData]);

  const logActivity = (action: string) => {
    const actor = isPartnerAccount
      ? "Partner"
      : (
        (currentUser?.metadata as any)?.name ||
        currentUser?.email ||
        userRole ||
        "System"
      );

    const timestamp = new Date().toLocaleString();
    const optimisticLog = { id: Date.now(), user: actor, action, timestamp };
    setActivity((p) => [optimisticLog, ...p.slice(0, 9)]);

    void dbInsert("activity_logs", {
      user: actor,
      action,
      timestamp,
    });
  };

  // Auto-lock logic
  const lastActive = useRef(Date.now());
  useEffect(() => {
    if (!isUnlocked) return;
    const interval = setInterval(() => {
      if (Date.now() - lastActive.current > 5 * 60 * 1000) { // 5 mins
        setIsUnlocked(false);
      }
    }, 10000);
    const activityHandler = () => { lastActive.current = Date.now(); };
    window.addEventListener("mousedown", activityHandler);
    window.addEventListener("keydown", activityHandler);
    return () => {
      clearInterval(interval);
      window.removeEventListener("mousedown", activityHandler);
      window.removeEventListener("keydown", activityHandler);
    };
  }, [isUnlocked]);

  useEffect(() => {
    const checkDriveStatus = async () => {
      try {
        const { connected } = await getGoogleDriveStatus();
        setIsDriveConnected(connected);
      } catch (e) {
        console.error("Failed to check Drive status", e);
      }
    };
    checkDriveStatus();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        setIsDriveConnected(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGoogleConnect = async () => {
    try {
      const { url } = await getGoogleAuthUrl();
      window.open(url, 'google_auth', 'width=600,height=700');
    } catch (e) {
      console.error("Failed to get Google Auth URL", e);
    }
  };

  const handleSaveToDrive = async (file: any) => {
    try {
      const base64 = await fileToBase64(file.url);
      const res = await saveToGoogleDrive({ name: file.name, type: file.type, base64 });
      if (res.success) {
        alert(`Saved "${file.name}" to Google Drive!`);
      } else {
        alert("Failed to save to Drive: " + (res.error || "Unknown error"));
      }
    } catch (e) {
      console.error("Save to Drive error", e);
      alert("Error saving to Google Drive");
    }
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // ���� State: Database persistence ����
  const [dbShoppingItems, setDbShoppingItems] = useState<any[]>([]);
  const [dbCostCalcOverrides, setDbCostCalcOverrides] = useState<any[]>([]);

  // Sync database shopping items to UI state
  useEffect(() => {
    const manual = dbShoppingItems.filter(item => !item.sourceKey).map(item => ({
      id: String(item.id),
      name: item.name,
      quantity: Number(item.quantity),
      unit: item.unit,
      totalCost: Number(item.totalCost),
      items: Array.isArray(item.items) ? item.items : (typeof item.items === 'string' ? item.items.split(',').filter(s => s.trim()) : []),
      category: item.category,
      department: item.department,
      purchaseType: (item.purchaseType as "Vendor" | "Store" | "") || "",
      vendorName: item.vendorName || "",
      storeName: item.storeName || "",
      storeUrl: item.storeUrl || "",
      isManual: true,
    } as ShoppingListItem));
    setShopManualItems(manual);

    const overrides: Record<string, Partial<ShoppingListItem>> = {};
    dbShoppingItems.filter(item => item.sourceKey).forEach(item => {
      overrides[item.sourceKey] = {
        name: item.name,
        quantity: Number(item.quantity),
        unit: item.unit,
        totalCost: Number(item.totalCost),
        items: Array.isArray(item.items) ? item.items : (typeof item.items === 'string' ? item.items.split(',').filter(s => s.trim()) : []),
        category: item.category,
        department: item.department,
        purchaseType: (item.purchaseType as "Vendor" | "Store" | "") || "",
        vendorName: item.vendorName || "",
        storeName: item.storeName || "",
        storeUrl: item.storeUrl || "",
      };
    });
    setShopItemOverrides(overrides);
  }, [dbShoppingItems]);

  const [delConfirm, setDelConfirm] = useState<any>(null); // {label, onConfirm}
  const [todoDraft, setTodoDraft] = useState<{
    title: string; category: string; status: TaskTodoItem["status"];
    assignedTo: string; linkedTaskId: string; linkUrl: string; note: string;
    subtasks: TodoSubtask[];
  }>({
    title: "",
    category: CATEGORIES[0],
    status: "Not Started" as TaskTodoItem["status"],
    assignedTo: "",
    linkedTaskId: "",
    linkUrl: "",
    note: "",
    subtasks: [],
  });
  const [quickTodoTitle, setQuickTodoTitle] = useState("");
  const [quickTodoCategory, setQuickTodoCategory] = useState(CATEGORIES[0]);
  const [expandedTaskCards, setExpandedTaskCards] = useState<Record<number, boolean>>({});
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<number, string>>({});
  const [expandedPlanningCats, setExpandedPlanningCats] = useState<Record<string, boolean>>(() =>
    CATEGORIES.reduce((acc, category) => ({ ...acc, [category]: true }), {} as Record<string, boolean>)
  );

  // Filters
  const [catFilter, setCatF]    = useState("All");
  const [statFilter, setStatF]  = useState("All");
  const [todoCatFilter, setTodoCatFilter] = useState("All");
  const [todoStatusFilter, setTodoStatusFilter] = useState<TaskTodoItem["status"] | "All">("All");
  const [menuSecF, setMenuSecF] = useState("All");
  const [shopCatF, setShopCatF] = useState("All");
  const [shopDeptF, setShopDeptF] = useState("All");
  const [shopSourceF, setShopSourceF] = useState("All");
  const [shopVendorF, setShopVendorF] = useState("All");
  const [shopStoreF, setShopStoreF] = useState("All");
  const [shopManualItems, setShopManualItems] = useState<ShoppingListItem[]>([]);
  const [shopItemOverrides, setShopItemOverrides] = useState<Record<string, Partial<ShoppingListItem>>>({});
  const [shopRemovedSourceKeys, setShopRemovedSourceKeys] = useState<string[]>([]);
  const [shopItemModal, setShopItemModal] = useState<ShoppingListItem | "new" | null>(null);
  const [shopItemDraft, setShopItemDraft] = useState({
    name: "",
    category: "Operating Supplies",
    department: "Kitchen",
    quantity: 0,
    unit: "",
    totalCost: 0,
    items: "",
    purchaseType: "" as "Vendor" | "Store" | "",
    vendorName: "",
    storeName: "",
    storeUrl: "",
  });
  const [noteSearch, setNoteSearch] = useState("");
  const [noteTagF, setNoteTagF] = useState("All");

  // AI
  const [aiMsgs, setAiMsgs] = useState([{ role: "assistant", content: "Welcome! I'm your restaurant launch assistant. Ask me anything about task status, budget, menu, or what needs attention.", suggestions: ["What tasks are due this week?", "Which permits are pending?", "What's over budget?"] }]);
  const [aiLoad, setAiLoad] = useState(false);

  // ���� Derived ����
  const completed = tasks.filter(t=>t.status==="Complete").length;
  const overdue   = tasks.filter(t=>t.status==="Overdue").length;
  const criticalOverdue = tasks.filter(t => t.isCritical && t.status === "Overdue").length;
  const prog      = tasks.length ? Math.round((completed/tasks.length)*100) : 0;
  const openTaskTodos = taskTodos.filter(todo => todo.status !== "Done");
  const doneTaskTodos = taskTodos.filter(todo => todo.status === "Done");
  const filteredTasks = tasks.filter(t => (catFilter === "All" || t.category === catFilter) && (statFilter === "All" || t.status === statFilter));
  const filteredTaskTodos = taskTodos.filter(todo => {
    const categoryMatch = todoCatFilter === "All" || todo.category === todoCatFilter;
    const statusMatch = todoStatusFilter === "All" || todo.status === todoStatusFilter;
    return categoryMatch && statusMatch;
  });
  const groupedTaskTodos = CATEGORIES
    .map(category => ({ category, items: filteredTaskTodos.filter(todo => todo.category === category) }))
    .filter(group => group.items.length > 0);
  const actionListTodos = [...filteredTaskTodos].sort((a, b) => {
    if (TODO_STATUS_ORDER[a.status] !== TODO_STATUS_ORDER[b.status]) {
      return TODO_STATUS_ORDER[a.status] - TODO_STATUS_ORDER[b.status];
    }
    const ad = new Date(a.created_at || 0).getTime();
    const bd = new Date(b.created_at || 0).getTime();
    return bd - ad;
  });
  const taskCategoryOverview = CATEGORIES
    .map(category => {
      const taskCount = tasks.filter(task => task.category === category).length;
      const completedCount = tasks.filter(task => task.category === category && task.status === "Complete").length;
      const todoCount = taskTodos.filter(todo => todo.category === category && todo.status !== "Done").length;
      return { category, taskCount, completedCount, todoCount };
    })
    .filter(group => group.taskCount > 0 || group.todoCount > 0);
  const planningCategoryRows = CATEGORIES
    .map(category => {
      const categoryTasks = tasks.filter(task => task.category === category);
      const categoryTodos = taskTodos.filter(todo => todo.category === category);
      const taskComplete = categoryTasks.filter(task => task.status === "Complete").length;
      const todoComplete = categoryTodos.filter(todo => todo.status === "Done").length;
      const total = categoryTasks.length + categoryTodos.length;
      const completedCount = taskComplete + todoComplete;
      const openCount = Math.max(0, total - completedCount);
      const progress = total ? Math.round((completedCount / total) * 100) : 0;
      return {
        category,
        total,
        openCount,
        completedCount,
        progress,
        taskCount: categoryTasks.length,
        todoCount: categoryTodos.length,
      };
    });
  
  const invoiceStartupTotal = invoices.filter(i => i.category === "Lease & TI").reduce((s, i) => s + Number(i.amount), 0);
  const totBudget = startup.reduce((s,c)=>s+(+c.budgeted),0);
  const totActual = startup.reduce((s,c)=>s+(+c.actual),0) + invoiceStartupTotal;
  
  const invoiceOpTotal = invoices.filter(i => i.category !== "Lease & TI").reduce((s, i) => s + Number(i.amount), 0);
  const totOp     = operating.reduce((s,c)=>s+(+c.monthly),0) + invoiceOpTotal;
  const projRev   = totOp/0.30;

  const totOpenings = positions.reduce((s, p) => s + p.openings, 0);
  const totHired = positions.reduce((s, p) => s + p.hired, 0);
  const staffingProg = totOpenings > 0 ? Math.round((totHired / totOpenings) * 100) : 0;

  const parsePlannerDate = (raw?: string) => {
    if (!raw) return null;
    const value = raw.trim();
    if (!value) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const dt = new Date(`${value}T00:00:00`);
      return Number.isNaN(dt.getTime()) ? null : dt;
    }
    const m = value.match(/^([A-Za-z]{3,9})\s+(\d{1,2})$/);
    if (!m) return null;
    const monthMap: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    };
    const month = monthMap[m[1].slice(0, 3).toLowerCase()];
    if (month === undefined) return null;
    const day = Number(m[2]);
    const year = new Date().getFullYear();
    const dt = new Date(year, month, day);
    return Number.isNaN(dt.getTime()) ? null : dt;
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const permitAlerts = permits
    .map(p => {
      const dt = parsePlannerDate(p.expiryDate);
      const daysLeft = dt ? Math.ceil((dt.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)) : null;
      return { permit: p, daysLeft };
    })
    .filter(x => x.daysLeft !== null && (x.daysLeft as number) <= 30)
    .sort((a, b) => (a.daysLeft as number) - (b.daysLeft as number));

  const mustActNow = [
    ...tasks
      .filter(t => t.status === "Overdue" || t.priority === "Critical")
      .map(t => ({ id: `task-${t.id}`, title: t.task, meta: `${t.category} · ${t.status}` })),
    ...taskTodos
      .filter(todo => todo.status === "Not Started")
      .slice(0, 2)
      .map(todo => ({ id: `todo-${todo.id}`, title: todo.title, meta: `${todo.category} · Todo inbox` })),
    ...permitAlerts
      .filter(x => (x.daysLeft as number) <= 14)
      .map(x => ({ id: `permit-${x.permit.id}`, title: `${x.permit.name} permit follow-up`, meta: `${x.daysLeft as number} days left` })),
  ].slice(0, 4);

  const priorityUrgency: Record<string, number> = { Critical: 40, High: 25, Medium: 15, Low: 5 };
  const statusUrgency: Record<string, number> = { Overdue: 40, "In Progress": 20, "Not Started": 10, Complete: 0 };

  const urgentTaskSubtasks = tasks
    .flatMap(task => {
      const dueDate = parsePlannerDate(task.due);
      const daysLeft = dueDate ? Math.ceil((dueDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24)) : null;
      const dueBonus = daysLeft === null ? 0 : daysLeft < 0 ? 30 : daysLeft <= 3 ? 20 : daysLeft <= 7 ? 12 : daysLeft <= 14 ? 6 : 0;
      const taskScore = (priorityUrgency[task.priority] || 0) + (statusUrgency[task.status] || 0) + dueBonus + (task.isCritical ? 16 : 0);

      const parentItem = task.status === "Complete"
        ? []
        : [{
            id: `task-${task.id}`,
            label: task.task,
            type: "Task",
            meta: `${task.category} · ${task.status}${task.due ? ` · Due ${task.due}` : ""}`,
            score: taskScore,
          }];

      const subtaskItems = task.checklist
        .filter(sub => !sub.done)
        .map(sub => ({
          id: `task-${task.id}-sub-${sub.id}`,
          label: sub.text,
          type: "Subtask",
          meta: `${task.task} · ${task.category}${task.due ? ` · Due ${task.due}` : ""}`,
          score: Math.max(taskScore - 2, 0),
        }));

      return [...parentItem, ...subtaskItems];
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // ���� Helper: re-fetch a single table and update state ����
  const refetch = async (table: string, setter: (d: any[]) => void) => {
    const { data } = await dbSelect(table);
    if (data) setter(data as any);
  };

  const normalizeTodoStatus = (status: TaskTodoItem["status"]): TaskTodoItem["status"] => normalizeLegacyTodoStatus(status);

  const openNewTodo = () => {
    setTodoDraft({
      title: "",
      category: catFilter === "All" ? CATEGORIES[0] : catFilter,
      status: "Not Started",
      assignedTo: "",
      linkedTaskId: "",
      linkUrl: "",
      note: "",
      subtasks: [],
    });
    setTodoModal("new");
  };

  const openEditTodo = (todo: TaskTodoItem) => {
    setTodoDraft({
      title: todo.title,
      category: todo.category,
      status: todo.status,
      assignedTo: todo.assignedTo || "",
      linkedTaskId: todo.linkedTaskId ? String(todo.linkedTaskId) : "",
      linkUrl: todo.linkUrl || "",
      note: todo.note || "",
      subtasks: todo.subtasks || [],
    });
    setTodoModal(todo);
  };

  // ���� Centralized Database Handlers ����
  const deleteRecord = async (table: string, id: any, label: string, setter: (d: any[]) => void) => {
    try {
      const { error } = await dbDelete(table, id);
      if (error) throw error;
      logActivity(`Deleted ${label}`);
      await refetch(table, setter);
    } catch (e: any) {
      console.error(`Delete Error (${table}):`, e);
      alert(`Failed to delete ${label}: ${e.message || JSON.stringify(e)}`);
    }
  };

  const updateRecord = async (table: string, id: any, patch: any, label: string, setter: (d: any[]) => void) => {
    try {
      const { error } = await dbUpdate(table, id, patch);
      if (error) throw error;
      await refetch(table, setter);
    } catch (e: any) {
      console.error(`Update Error (${table}):`, e);
      alert(`Failed to update ${label}: ${e.message || JSON.stringify(e)}`);
    }
  };

  const saveTaskTodo = async () => {
    const title = todoDraft.title.trim();
    if (!title) return;

    const linkedTaskId = todoDraft.linkedTaskId ? Number(todoDraft.linkedTaskId) : null;
    const payload = {
      title,
      category: todoDraft.category,
      status: normalizeTodoStatus(todoDraft.status),
      assignedTo: todoDraft.assignedTo.trim() || null,
      linkedTaskId,
      linkUrl: todoDraft.linkUrl.trim() || null,
      note: todoDraft.note.trim() || null,
      subtasks: todoDraft.subtasks,
    };

    try {
      if (taskTodoStore === "db") {
        if (todoModal && todoModal !== "new") {
          const { error } = await dbUpdate("task_todos", todoModal.id, payload);
          if (error) throw error;
          logActivity(`Updated todo: ${title}`);
        } else {
          const { error } = await dbInsert("task_todos", payload);
          if (error) throw error;
          logActivity(`Added todo: ${title}`);
        }
        await refetch("task_todos", setTaskTodos as any);
      } else {
        const nextTodo: TaskTodoItem = {
          id: todoModal && todoModal !== "new" ? todoModal.id : Date.now(),
          title: payload.title,
          category: payload.category,
          status: payload.status,
          assignedTo: payload.assignedTo || undefined,
          linkedTaskId: payload.linkedTaskId,
          linkUrl: payload.linkUrl || undefined,
          note: payload.note || undefined,
          subtasks: payload.subtasks,
          created_at: todoModal && todoModal !== "new" ? todoModal.created_at : new Date().toISOString(),
        };
        setTaskTodos(prev => {
          if (todoModal && todoModal !== "new") {
            return prev.map(todo => todo.id === todoModal.id ? nextTodo : todo);
          }
          return [nextTodo, ...prev];
        });
        logActivity(`${todoModal && todoModal !== "new" ? "Updated" : "Added"} todo: ${title}`);
      }

      setTodoModal(null);
    } catch (e: any) {
      console.error("Save Todo Error:", e);
      alert(`Failed to save todo: ${e.message || JSON.stringify(e)}`);
    }
  };

  const deleteTaskTodo = async (todo: TaskTodoItem) => {
    try {
      if (taskTodoStore === "db") {
        const { error } = await dbDelete("task_todos", todo.id);
        if (error) throw error;
        await refetch("task_todos", setTaskTodos as any);
      } else {
        setTaskTodos(prev => prev.filter(item => item.id !== todo.id));
      }
      logActivity(`Deleted todo: ${todo.title}`);
      setTodoModal(null);
    } catch (e: any) {
      console.error("Delete Todo Error:", e);
      alert(`Failed to delete todo: ${e.message || JSON.stringify(e)}`);
    }
  };

  const quickAddTodo = async () => {
    const title = quickTodoTitle.trim();
    if (!title) return;

    const payload = {
      title,
      category: quickTodoCategory,
      status: "Not Started" as TaskTodoItem["status"],
      assignedTo: null,
      linkedTaskId: null,
      linkUrl: null,
      note: null,
    };

    try {
      if (taskTodoStore === "db") {
        const { error } = await dbInsert("task_todos", payload);
        if (error) throw error;
        await refetch("task_todos", setTaskTodos as any);
      } else {
        const nextTodo: TaskTodoItem = {
          id: Date.now(),
          title: payload.title,
          category: payload.category,
          status: payload.status,
          created_at: new Date().toISOString(),
        };
        setTaskTodos(prev => [nextTodo, ...prev]);
      }

      setQuickTodoTitle("");
      setTodoCatFilter("All");
      setTodoStatusFilter("All");
      logActivity(`Quick added todo: ${title}`);
    } catch (e: any) {
      console.error("Quick Add Todo Error:", e);
      alert(`Failed to add todo: ${e.message || JSON.stringify(e)}`);
    }
  };

  const toggleTodoDone = async (todo: TaskTodoItem) => {
    const nextStatus: TaskTodoItem["status"] = todo.status === "Done" ? "Not Started" : "Done";

    try {
      if (taskTodoStore === "db") {
        const { error } = await dbUpdate("task_todos", todo.id, { status: nextStatus });
        if (error) throw error;
        await refetch("task_todos", setTaskTodos as any);
      } else {
        setTaskTodos(prev => prev.map(item => item.id === todo.id ? { ...item, status: nextStatus } : item));
      }

      logActivity(`${nextStatus === "Done" ? "Completed" : "Reopened"} todo: ${todo.title}`);
    } catch (e: any) {
      console.error("Toggle Todo Status Error:", e);
      alert(`Failed to update todo: ${e.message || JSON.stringify(e)}`);
    }
  };

  const saveTaskChecklist = async (tid: number, checklist: Task["checklist"]) => {
    await updateRecord('tasks', tid, { checklist }, 'Task Checklist', setTasks);
  };

  const toggleTaskCheck = async (tid: number, cid: number) => {
    const t = tasks.find(x => x.id === tid);
    if (!t) return;
    const newChecklist = t.checklist.map(c => c.id === cid ? { ...c, done: !c.done } : c);
    await saveTaskChecklist(tid, newChecklist);
  };

  const updateTaskSubtaskText = async (tid: number, cid: number, text: string) => {
    const t = tasks.find(x => x.id === tid);
    if (!t) return;
    const newChecklist = t.checklist.map(c => c.id === cid ? { ...c, text } : c);
    await saveTaskChecklist(tid, newChecklist);
  };

  const deleteTaskSubtask = async (tid: number, cid: number) => {
    const t = tasks.find(x => x.id === tid);
    if (!t) return;
    const newChecklist = t.checklist.filter(c => c.id !== cid);
    await saveTaskChecklist(tid, newChecklist);
  };

  const addTaskSubtask = async (tid: number, text: string) => {
    const value = text.trim();
    if (!value) return;
    const t = tasks.find(x => x.id === tid);
    if (!t) return;
    const newChecklist = [...t.checklist, { id: Date.now(), text: value, done: false, assignedTo: "" }];
    await saveTaskChecklist(tid, newChecklist);
  };

  const toggleTrainingStep = async (mid: number, sid: number) => {
    const m = training.find(x => x.id === mid);
    if (!m) return;
    const newSteps = m.steps.map(s => s.id === sid ? { ...s, done: !s.done } : s);
    await updateRecord('training_modules', mid, { steps: newSteps }, 'Training Step', setTraining);
  };

  const toggleChecklistItem = async (cid: number, iid: number) => {
    const ch = checklists.find(x => x.id === cid);
    if (!ch) return;
    const newItems = ch.items.map(i => i.id === iid ? { ...i, done: !i.done } : i);
    await updateRecord('daily_checklists', cid, { items: newItems }, 'Checklist Item', setChecklists);
  };


  // ���� Task CRUD ����
  const saveTask = async (form: any) => {
    const { id, _delete, ...rest } = form;
    try {
      if (_delete) {
        const { error } = await dbDelete('tasks', id);
        if (error) throw error;
        logActivity(`Deleted task: ${form.task}`);
      } else if (taskModal && taskModal !== 'new') {
        const { error } = await dbUpdate('tasks', taskModal.id, rest);
        if (error) throw error;
        logActivity(`Updated task: ${form.task}`);
      } else {
        const { error } = await dbInsert('tasks', rest);
        if (error) throw error;
        logActivity(`Added task: ${form.task}`);
      }
      await refetch('tasks', setTasks);
      setTaskModal(null);
      setCalDate(null);
    } catch (e: any) {
      console.error("Save Task Error:", e);
      alert(`Failed to save task: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ���� Menu CRUD ����
  const saveMenu = async (form: any) => {
    const { id, ...rest } = form;
    try {
      if (menuModal && menuModal !== 'new') {
        const { error } = await dbUpdate('menu_items', menuModal.id, rest);
        if (error) throw error;
        logActivity(`Updated menu item: ${form.name}`);
      } else {
        const { error } = await dbInsert('menu_items', rest);
        if (error) throw error;
        logActivity(`Added menu item: ${form.name}`);
      }
      await refetch('menu_items', setMenuItems);
      setMenuModal(null);
    } catch (e: any) {
      console.error("Save Menu Error:", e);
      alert(`Failed to save menu item: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ���� Financial CRUD ����
  const saveFin = async (form: any) => {
    const { type, item } = finModal;
    const table = type === 'startup' ? 'startup_costs' : 'operating_costs';
    const setter = type === 'startup' ? setStartup : setOp;
    const { id, ...rest } = form;
    try {
      if (item) {
        const { error } = await dbUpdate(table, item.id, rest);
        if (error) throw error;
        logActivity(`Updated financial item: ${form.category}`);
      } else {
        const { error } = await dbInsert(table, rest);
        if (error) throw error;
        logActivity(`Added financial item: ${form.category}`);
      }
      await refetch(table, setter);
      setFinModal(null);
    } catch (e: any) {
      console.error("Save Finance Error:", e);
      alert(`Failed to save financial data: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ���� Timeline CRUD ����
  const saveTL = async (form: any) => {
    const { id, ...rest } = form;
    try {
      if (tlModal && tlModal !== 'new') {
        const { error } = await dbUpdate('milestones', tlModal.id, rest);
        if (error) throw error;
      } else {
        const { error } = await dbInsert('milestones', rest);
        if (error) throw error;
      }
      await refetch('milestones', setTL);
      setTlModal(null);
    } catch (e: any) {
      console.error("Save Timeline Error:", e);
      alert(`Failed to save milestone: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ���� Notes CRUD ����
  const saveNote = async (form: any) => {
    const d = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Phoenix' });
    const { id, ...rest } = form;
    try {
      if (noteModal && noteModal !== 'new') {
        const { error } = await dbUpdate('notes', noteModal.id, rest);
        if (error) throw error;
      } else {
        const { error } = await dbInsert('notes', { ...rest, date: d });
        if (error) throw error;
      }
      await refetch('notes', setNotes);
      setNoteModal(null);
    } catch (e: any) {
      console.error("Save Note Error:", e);
      alert(`Failed to save note: ${e.message || JSON.stringify(e)}`);
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchTag  = noteTagF==='All' || n.tag===noteTagF;
    const matchSearch = !noteSearch || n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.body?.toLowerCase().includes(noteSearch.toLowerCase());
    return matchTag && matchSearch;
  });

  // ─── Calendar Events CRUD ───────────────────────────────────────────────────
  const saveCalendarEvent = async (form: any) => {
    const { _editId, id, ...rest } = form;
    const editId = _editId ?? (id && id !== 0 ? id : null);
    try {
      if (editId) {
        const { error } = await dbUpdate('calendar_events', editId, rest);
        if (error) throw error;
      } else {
        const { error } = await dbInsert('calendar_events', rest);
        if (error) throw error;
      }
      await refetch('calendar_events', setCalendarEvents as any);
    } catch (e: any) {
      console.error('Save Calendar Event Error:', e);
      alert(`Failed to save event: ${e.message || JSON.stringify(e)}`);
    }
  };

  const deleteCalendarEvent = async (id: number) => {
    try {
      const { error } = await dbDelete('calendar_events', id);
      if (error) throw error;
      await refetch('calendar_events', setCalendarEvents as any);
    } catch (e: any) {
      console.error('Delete Calendar Event Error:', e);
      alert(`Failed to delete event: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ���� Vendor CRUD ����
  const saveVendor = async (form: any) => {
    const { id, ...rest } = form;
    try {
      if (vendorModal && vendorModal !== 'new') {
        const { error } = await dbUpdate('vendors', vendorModal.id, rest);
        if (error) throw error;
      } else {
        const { error } = await dbInsert('vendors', rest);
        if (error) throw error;
      }
      await refetch('vendors', setVendors);
      setVendorModal(null);
    } catch (e: any) {
      console.error("Save Vendor Error:", e);
      alert(`Failed to save vendor: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ���� Inventory CRUD ����
  const saveInv = async (form: any) => {
    const { id, ...rest } = form;
    try {
      if (invModal && invModal !== 'new') {
        const { error } = await dbUpdate('inventory_items', invModal.id, rest);
        if (error) throw error;
      } else {
        const { error } = await dbInsert('inventory_items', { ...rest, lastOrdered: 'Just now' });
        if (error) throw error;
      }
      await refetch('inventory_items', setInventory);
      setInvModal(null);
    } catch (e: any) {
      console.error("Save Inventory Error:", e);
      alert(`Failed to save inventory item: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ���� Permit CRUD ����
  const savePermit = async (form: any) => {
    const { id, ...rest } = form;
    try {
      if (permitModal && permitModal !== 'new') {
        const { data, error } = await dbUpdate('permits', permitModal.id, rest);
        if (error) throw error;
        const updated = Array.isArray(data) && data[0] ? data[0] : { ...(permitModal as any), ...rest };
        setPermits(prev => prev.map(p => p.id === (permitModal as any).id ? (updated as any) : p));
      } else {
        const { data, error } = await dbInsert('permits', rest);
        if (error) throw error;
        const inserted = Array.isArray(data) && data[0]
          ? data[0]
          : { id: Date.now(), ...(rest as any) };
        setPermits(prev => [inserted as any, ...prev]);
      }
      await refetch('permits', setPermits);
      setPermitModal(null);
    } catch (e: any) {
      console.error("Save Permit Error:", e);
      alert(`Failed to save permit: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ���� Marketing CRUD ����
  const saveMkt = async (form: any) => {
    const { id, _delete, ...rest } = form;
    try {
      if (_delete) {
        const { error } = await dbDelete('marketing_posts', id);
        if (error) throw error;
      } else if (mktModal && mktModal !== 'new') {
        const { error } = await dbUpdate('marketing_posts', mktModal.id, rest);
        if (error) throw error;
      } else {
        const { error } = await dbInsert('marketing_posts', rest);
        if (error) throw error;
      }
      await refetch('marketing_posts', setMarketing);
      setMktModal(null);
    } catch (e: any) {
      console.error("Save Marketing Error:", e);
      alert(`Failed to save marketing post: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ���� Training CRUD ����
  const saveTrain = async (form: any) => {
    const { id, _delete, ...rest } = form;
    try {
      if (_delete) {
        const { error } = await dbDelete('training_modules', id);
        if (error) throw error;
      } else if (trainModal && trainModal !== 'new') {
        const { error } = await dbUpdate('training_modules', trainModal.id, rest);
        if (error) throw error;
      } else {
        const { error } = await dbInsert('training_modules', rest);
        if (error) throw error;
      }
      await refetch('training_modules', setTraining);
      setTrainModal(null);
    } catch (e: any) {
      console.error("Save Training Error:", e);
      alert(`Failed to save training module: ${e.message || JSON.stringify(e)}`);
    }
  };

  const saveUtility = async (form: any) => {
    const { id, ...rest } = form;
    try {
      if (utilityModal && utilityModal !== 'new') {
        const { data, error } = await dbUpdate('utility_accounts', utilityModal.id, rest);
        if (error) throw error;
        const updated = Array.isArray(data) && data[0] ? data[0] : { ...(utilityModal as any), ...rest };
        setUtilities(prev => prev.map(u => u.id === (utilityModal as any).id ? (updated as any) : u));
      } else {
        const { data, error } = await dbInsert('utility_accounts', rest);
        if (error) throw error;
        const inserted = Array.isArray(data) && data[0]
          ? data[0]
          : { id: Date.now(), ...(rest as any) };
        setUtilities(prev => [inserted as any, ...prev]);
      }
      await refetch('utility_accounts', setUtilities);
      setUtilityModal(null);
    } catch (e: any) {
      console.error("Save Utility Error:", e);
      alert(`Failed to save utility account: ${e.message || JSON.stringify(e)}`);
    }
  };

  const savePos = async (form: Position) => {
    const { id, ...rest } = form as any;
    try {
      if (posModal && posModal !== 'new') {
        const { error } = await dbUpdate('positions', (posModal as any).id, rest);
        if (error) throw error;
      } else {
        const { error } = await dbInsert('positions', rest);
        if (error) throw error;
      }
      await refetch('positions', setPositions);
      setPosModal(null);
    } catch (e: any) {
      console.error("Save Position Error:", e);
      alert(`Failed to save position: ${e.message || JSON.stringify(e)}`);
    }
  };

  const saveCan = async (form: Candidate & { _delete?: boolean }) => {
    const { id, _delete, ...rest } = form as any;
    try {
      if (_delete) {
        const { error } = await dbDelete('candidates', id);
        if (error) throw error;
        logActivity(`Removed candidate: ${form.name}`);
      } else if (canModal && canModal !== 'new') {
        const { error } = await dbUpdate('candidates', (canModal as any).id, rest);
        if (error) throw error;
        logActivity(`Updated candidate: ${form.name}`);
      } else {
        const { error } = await dbInsert('candidates', rest);
        if (error) throw error;
        logActivity(`Added candidate: ${form.name}`);
      }
      await refetch('candidates', setCandidates);
      setCanModal(null);
    } catch (e: any) {
      console.error("Save Candidate Error:", e);
      alert(`Failed to save candidate: ${e.message || JSON.stringify(e)}`);
    }
  };

  const saveTeamMapMember = async (form: Candidate) => {
    const { id, ...rest } = form as any;
    const payload = { ...rest, stage: "Hired" };
    try {
      if (teamMapModal && teamMapModal !== "new") {
        const { error } = await dbUpdate("candidates", (teamMapModal as any).id, payload);
        if (error) throw error;
        logActivity(`Updated team member: ${form.name}`);
      } else {
        const { error } = await dbInsert("candidates", payload);
        if (error) throw error;
        logActivity(`Added transferred team member: ${form.name}`);
      }
      await refetch("candidates", setCandidates);
      setTeamMapModal(null);
    } catch (e: any) {
      console.error("Save Team Member Error:", e);
      alert(`Failed to save team member: ${e.message || JSON.stringify(e)}`);
    }
  };

  const saveAsset = async (form: DigitalAsset & { _delete?: boolean }) => {
    const { id, _delete, ...rest } = form as any;
    try {
      if (_delete) {
        const { error } = await dbDelete('digital_assets', id);
        if (error) throw error;
      } else if (assetModal && assetModal !== 'new') {
        const { error } = await dbUpdate('digital_assets', (assetModal as any).id, rest);
        if (error) throw error;
      } else {
        const { error } = await dbInsert('digital_assets', rest);
        if (error) throw error;
      }
      await refetch('digital_assets', setAssets);
      setAssetModal(null);
    } catch (e: any) {
      console.error("Save Asset Error:", e);
      alert(`Failed to save digital asset: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ���� Invoice CRUD ����
  const saveInvoice = async (form: any) => {
    const { id, ...rest } = form;
    try {
      if (invoiceModal && invoiceModal !== 'new') {
        const { error } = await dbUpdate('invoices', invoiceModal.id, rest);
        if (error) throw error;
      } else {
        const { error } = await dbInsert('invoices', rest);
        if (error) throw error;
      }
      await refetch('invoices', setInvoices);
      setInvoiceModal(null);
    } catch (e: any) {
      console.error("Save Invoice Error:", e);
      alert(`Failed to save invoice: ${e.message || JSON.stringify(e)}`);
    }
  };

  const importInvoicesFromCSV = async (rows: Partial<Invoice>[]) => {
    try {
      for (const row of rows) {
        await dbInsert('invoices', row);
      }
      await refetch('invoices', setInvoices);
      alert(`${rows.length} invoice(s) imported successfully.`);
    } catch (e: any) {
      console.error("CSV Invoice Import Error:", e);
      alert(`Import failed: ${e.message || JSON.stringify(e)}`);
    }
  };

  // ���� Checklist CRUD ����
  const saveChk = async (form: any) => {
    const { id, ...rest } = form;
    try {
      if (chkModal && chkModal !== 'new') {
        const { error } = await dbUpdate('daily_checklists', chkModal.id, rest);
        if (error) throw error;
      } else {
        const { error } = await dbInsert('daily_checklists', rest);
        if (error) throw error;
      }
      await refetch('daily_checklists', setChecklists);
      setChkModal(null);
    } catch (e: any) {
      console.error("Save Checklist Error:", e);
      alert(`Failed to save checklist: ${e.message || JSON.stringify(e)}`);
    }
  };


  // ���� AI ����
  const totalMonthlyUtilities = useMemo(() => {
    return utilities.reduce((sum, u) => sum + u.monthlyCost, 0);
  }, [utilities]);

  const operatingCostsWithUtilities = useMemo(() => {
    return operating.map(c => {
      if (c.category === "Utilities") {
        return { ...c, monthly: totalMonthlyUtilities };
      }
      return c;
    });
  }, [operating, totalMonthlyUtilities]);

  const buildLocalAiFallback = (msg: string) => {
    const q = msg.toLowerCase();
    if (q.includes("overdue") || q.includes("task") || q.includes("due")) {
      return {
        content: `I could not reach the AI service, but here is a live task snapshot. You currently have ${overdue} overdue task(s), and overall launch progress is ${prog}%. Start by clearing overdue critical items first, then move to tasks due in the next 7 days.`,
        suggestions: ["Show me the highest-priority overdue tasks", "Which tasks are due in the next 7 days?"]
      };
    }

    if (q.includes("budget") || q.includes("cost") || q.includes("expense") || q.includes("financial")) {
      return {
        content: `I could not reach the AI service, but your financial snapshot is available. Startup budget is $${totBudget.toLocaleString()} and actual spend is $${totActual.toLocaleString()}. Estimated monthly operating cost is $${totOp.toLocaleString()}.`,
        suggestions: ["What is currently over budget?", "How can I reduce monthly operating costs?"]
      };
    }

    return {
      content: `I am having trouble reaching the AI service right now, but your data is loaded. Launch progress is ${prog}%, overdue tasks are ${overdue}, startup spend is $${totActual.toLocaleString()}, and monthly operating cost is $${totOp.toLocaleString()}.`,
      suggestions: ["What should I focus on this week?", "Show a quick risk summary"]
    };
  };

  const sendAi = async (msg: string) => {
    setAiMsgs(p => [...p, { role: "user", content: msg }]);
    setAiLoad(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const promptContext = `
        You are the AI Restaurant Launch Assistant.
        Current Restaurant: ${appTitle}
        Launch Progress: ${prog}%
        Overdue Tasks: ${overdue}
        Startup Budget: $${totBudget.toLocaleString()} (Actual: $${totActual.toLocaleString()})
        Operating Monthly Cost: $${totOp.toLocaleString()}
        
        Recent Activity:
        ${activity.map(a => `- ${a.user}: ${a.action} (${a.timestamp})`).join('\n')}
        
        Answer the user's question precisely using this data. Keep responses concise and professional.
        
        At the end of your response, always include 2-3 brief, relevant follow-up questions the user might want to ask next. Format them strictly as [[Question?]].
        Example: "Your current food cost is 34%. [[How can I lower food costs?]] [[Which menu items are most profitable?]]"
      `;

      const aiRes = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: msg,
          systemInstruction: promptContext,
        }),
      });

      if (!aiRes.ok) {
        const errorBody = await aiRes.json().catch(() => ({}));
        throw new Error(errorBody?.error || "AI request failed");
      }

      const data = await aiRes.json();
      const response = data.text || "I'm sorry, I couldn't process that request.";
      
      const suggestions: string[] = [];
      const cleanResponse = response.replace(/\[\[(.*?)\]\]/g, (_, q) => {
        if (!suggestions.includes(q)) suggestions.push(q);
        return "";
      }).trim();
      
      setAiMsgs(p => [...p, { role: "assistant", content: cleanResponse, suggestions }]);
    } catch (error) {
      console.error("AI Error:", error);
      const fallback = buildLocalAiFallback(msg);
      const reason = error instanceof Error && /not configured/i.test(error.message)
        ? "AI is not configured on the server yet."
        : error instanceof Error && /abort/i.test(error.name)
          ? "AI request timed out."
          : "AI request failed.";

      setAiMsgs(p => [...p, {
        role: "assistant",
        content: `${reason} ${fallback.content}`,
        suggestions: fallback.suggestions
      }]);
    } finally {
      clearTimeout(timeoutId);
      setAiLoad(false);
    }
  };

  const saveAiToNotes = async () => {
    if (aiMsgs.length <= 1) return; // Only welcome message
    const content = aiMsgs.map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n\n");
    const newNote = {
      tag: "General",
      title: `AI Conversation - ${new Date().toLocaleDateString()}`,
      body: content,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Phoenix' }),
      files: []
    };
    try {
      const { error } = await dbInsert('notes', newNote);
      if (error) throw error;
      await refetch('notes', setNotes);
      setTab("notes");
    } catch (e: any) {
      console.error("Save AI Note Error:", e);
      alert(`Failed to save AI conversation: ${e.message || JSON.stringify(e)}`);
    }
  };

  const [activeGroup, setActiveGroup] = useState("DASHBOARD");

  const TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, group: "DASHBOARD" },
    { id: "ai", label: "AI Assistant", icon: Sparkles, group: "DASHBOARD" },
    { id: "settings", label: "Settings", icon: ShieldCheck, group: "DASHBOARD" },
    
    { id: "calendar", label: "Calendar", icon: Calendar, group: "PLANNING" },
    { id: "timeline", label: "Timeline", icon: Calendar, group: "PLANNING" },
    { id: "tasks", label: "Tasks", icon: CheckSquare, group: "PLANNING" },
    { id: "notes", label: "Notes", icon: FileEdit, group: "PLANNING" },
    
    { id: "menu", label: "Menu & Bar", icon: Utensils, group: "KITCHEN" },
    { id: "shopping", label: "Shopping List", icon: ShoppingCart, group: "OPERATIONS" },
    { id: "costcalc", label: "Cost Calculator", icon: Calculator, group: "KITCHEN" },
    
    { id: "master-inventory", label: "Master Inventory", icon: Package, group: "OPERATIONS" },
    { id: "inventory", label: "Inventory", icon: Box, group: "OPERATIONS" },
    { id: "vendors", label: "Vendors", icon: Users, group: "OPERATIONS" },
    { id: "permits", label: "Permits", icon: ShieldCheck, group: "OPERATIONS" },
    { id: "checklists", label: "Checklists", icon: ClipboardList, group: "OPERATIONS" },
    
    { id: "financials", label: "Financials", icon: DollarSign, group: "FINANCIALS" },
    { id: "invoices", label: "Invoices", icon: FileText, group: "FINANCIALS" },
    
    { id: "talent", label: "Talent & Hiring", icon: Users, group: "TEAM" },
    { id: "training", label: "Training", icon: GraduationCap, group: "TEAM" },
    { id: "onboarding", label: "Team Onboarding", icon: UserPlus, group: "TEAM" },
    { id: "marketing", label: "Marketing", icon: Megaphone, group: "TEAM" },
    { id: "teammap", label: "Team Map", icon: Users, group: "TEAM" },
  ];

  const GROUPS = ["DASHBOARD", "PLANNING", "KITCHEN", "OPERATIONS", "FINANCIALS", "TEAM"];

  // Sync group when tab changes
  useEffect(() => {
    const currentTab = TABS.find(t => t.id === tab);
    if (currentTab && currentTab.group !== activeGroup) {
      setActiveGroup(currentTab.group);
    }
  }, [tab]);

  // ���� Shopping List Logic ����
  const aggregatedIngredients = useMemo(() => {
    const map: Record<string, ShoppingListItem> = {};
    menuItems.forEach(item => {
      (item.ingredients || []).forEach(ing => {
        const key = `${ing.name.toLowerCase()}-${ing.unit.toLowerCase()}`;
        if (!map[key]) {
          const invItem = inventory.find(i => i.name.toLowerCase() === ing.name.toLowerCase());
          map[key] = {
            id: `source-${key}`,
            sourceKey: key,
            name: ing.name,
            quantity: 0,
            unit: ing.unit,
            totalCost: 0,
            items: [],
            category: invItem?.category || "Operating Supplies",
            department: invItem?.department || "Kitchen",
            purchaseType: "",
            vendorName: "",
            storeName: "",
            storeUrl: "",
            isManual: false,
          };
        }
        map[key].quantity += ing.quantity;
        map[key].totalCost += ing.cost;
        if (!map[key].items.includes(item.name)) map[key].items.push(item.name);
      });
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }, [menuItems, inventory]);

  const consolidatedShoppingRows = useMemo(() => {
    const sourceRows = aggregatedIngredients
      .filter(row => row.sourceKey && !shopRemovedSourceKeys.includes(row.sourceKey))
      .map(row => {
        const override = row.sourceKey ? shopItemOverrides[row.sourceKey] : undefined;
        return {
          ...row,
          ...override,
          id: row.id,
          sourceKey: row.sourceKey,
          isManual: false,
          items: override?.items || row.items,
          purchaseType: (override?.purchaseType as "Vendor" | "Store" | "") || row.purchaseType || "",
          vendorName: override?.vendorName || row.vendorName || "",
          storeName: override?.storeName || row.storeName || "",
          storeUrl: override?.storeUrl || row.storeUrl || "",
        } as ShoppingListItem;
      });

    const allRows = [...sourceRows, ...shopManualItems]
      .filter(row =>
        (shopCatF === "All" || row.category === shopCatF) &&
        (shopDeptF === "All" || row.department === shopDeptF) &&
        (shopSourceF === "All" || (shopSourceF === "Unassigned" ? !row.purchaseType : row.purchaseType === shopSourceF)) &&
        (shopVendorF === "All" || (row.vendorName || "") === shopVendorF) &&
        (shopStoreF === "All" || (row.storeName || "") === shopStoreF)
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    return allRows;
  }, [aggregatedIngredients, shopRemovedSourceKeys, shopItemOverrides, shopManualItems, shopCatF, shopDeptF, shopSourceF, shopVendorF, shopStoreF]);

  const shopVendorOptions = useMemo(() => {
    const fromVendors = vendors.map(v => v.name).filter(Boolean);
    const fromRows = dbShoppingItems
      .filter(item => item.purchaseType === "Vendor" && item.vendorName)
      .map(item => String(item.vendorName));
    return ["All", ...Array.from(new Set([...fromVendors, ...fromRows])).sort((a, b) => a.localeCompare(b))];
  }, [vendors, dbShoppingItems]);

  const shopStoreOptions = useMemo(() => {
    const fromRows = dbShoppingItems
      .filter(item => item.purchaseType === "Store" && item.storeName)
      .map(item => String(item.storeName));
    return ["All", ...Array.from(new Set<string>(fromRows)).sort((a, b) => a.localeCompare(b))];
  }, [dbShoppingItems]);

  const openNewShopItem = () => {
    setShopItemDraft({
      name: "",
      category: "Operating Supplies",
      department: "Kitchen",
      quantity: 0,
      unit: "",
      totalCost: 0,
      items: "",
      purchaseType: "",
      vendorName: "",
      storeName: "",
      storeUrl: "",
    });
    setShopItemModal("new");
  };

  const openEditShopItem = (item: ShoppingListItem) => {
    setShopItemDraft({
      name: item.name,
      category: item.category,
      department: item.department,
      quantity: item.quantity,
      unit: item.unit,
      totalCost: item.totalCost,
      items: (item.items || []).join(", "),
      purchaseType: item.purchaseType || "",
      vendorName: item.vendorName || "",
      storeName: item.storeName || "",
      storeUrl: item.storeUrl || "",
    });
    setShopItemModal(item);
  };

  const saveShopItem = async () => {
    const name = shopItemDraft.name.trim();
    if (!name) return;
    const rowItems = shopItemDraft.items.split(",").map(v => v.trim()).filter(Boolean);

    if (shopItemModal === "new") {
      const newItem: ShoppingListItem = {
        id: `manual-${Date.now()}`,
        name,
        category: shopItemDraft.category,
        department: shopItemDraft.department,
        quantity: Number(shopItemDraft.quantity) || 0,
        unit: shopItemDraft.unit.trim(),
        totalCost: Number(shopItemDraft.totalCost) || 0,
        items: rowItems,
        isManual: true,
      };
      
      // Save to database
      try {
        await dbInsert("shopping_list_items", {
          name,
          category: shopItemDraft.category,
          department: shopItemDraft.department,
          quantity: Number(shopItemDraft.quantity) || 0,
          unit: shopItemDraft.unit.trim(),
          totalCost: Number(shopItemDraft.totalCost) || 0,
          items: rowItems.join(","),
          purchaseType: shopItemDraft.purchaseType || null,
          vendorName: shopItemDraft.purchaseType === "Vendor" ? (shopItemDraft.vendorName.trim() || null) : null,
          storeName: shopItemDraft.purchaseType === "Store" ? (shopItemDraft.storeName.trim() || null) : null,
          storeUrl: shopItemDraft.purchaseType === "Store" ? (shopItemDraft.storeUrl.trim() || null) : null,
          sourceKey: null,
        });
        await refetch("shopping_list_items", setDbShoppingItems);
      } catch (e) {
        console.error("Failed to save shopping item:", e);
        alert("Failed to save shopping item");
      }
      
      setShopItemModal(null);
      return;
    }

    if (!shopItemModal) return;

    if (shopItemModal.isManual) {
      // Update manual item in DB
      const dbItem = dbShoppingItems.find(item => 
        item.name === shopItemModal.name && 
        !item.sourceKey && 
        item.category === shopItemModal.category
      );
      
      if (dbItem) {
        try {
          await dbUpdate("shopping_list_items", dbItem.id, {
            name,
            category: shopItemDraft.category,
            department: shopItemDraft.department,
            quantity: Number(shopItemDraft.quantity) || 0,
            unit: shopItemDraft.unit.trim(),
            totalCost: Number(shopItemDraft.totalCost) || 0,
            items: rowItems.join(","),
            purchaseType: shopItemDraft.purchaseType || null,
            vendorName: shopItemDraft.purchaseType === "Vendor" ? (shopItemDraft.vendorName.trim() || null) : null,
            storeName: shopItemDraft.purchaseType === "Store" ? (shopItemDraft.storeName.trim() || null) : null,
            storeUrl: shopItemDraft.purchaseType === "Store" ? (shopItemDraft.storeUrl.trim() || null) : null,
          });
          await refetch("shopping_list_items", setDbShoppingItems);
        } catch (e) {
          console.error("Failed to update shopping item:", e);
          alert("Failed to update shopping item");
        }
      }
    } else if (shopItemModal.sourceKey) {
      // Update override item in DB
      const dbItem = dbShoppingItems.find(item => item.sourceKey === shopItemModal.sourceKey);
      
      if (dbItem) {
        try {
          await dbUpdate("shopping_list_items", dbItem.id, {
            name,
            category: shopItemDraft.category,
            department: shopItemDraft.department,
            quantity: Number(shopItemDraft.quantity) || 0,
            unit: shopItemDraft.unit.trim(),
            totalCost: Number(shopItemDraft.totalCost) || 0,
            items: rowItems.join(","),
            purchaseType: shopItemDraft.purchaseType || null,
            vendorName: shopItemDraft.purchaseType === "Vendor" ? (shopItemDraft.vendorName.trim() || null) : null,
            storeName: shopItemDraft.purchaseType === "Store" ? (shopItemDraft.storeName.trim() || null) : null,
            storeUrl: shopItemDraft.purchaseType === "Store" ? (shopItemDraft.storeUrl.trim() || null) : null,
          });
          await refetch("shopping_list_items", setDbShoppingItems);
        } catch (e) {
          console.error("Failed to update shopping override:", e);
          alert("Failed to update shopping override");
        }
      } else {
        // Create new override item if not found
        try {
          await dbInsert("shopping_list_items", {
            name,
            category: shopItemDraft.category,
            department: shopItemDraft.department,
            quantity: Number(shopItemDraft.quantity) || 0,
            unit: shopItemDraft.unit.trim(),
            totalCost: Number(shopItemDraft.totalCost) || 0,
            items: rowItems.join(","),
            purchaseType: shopItemDraft.purchaseType || null,
            vendorName: shopItemDraft.purchaseType === "Vendor" ? (shopItemDraft.vendorName.trim() || null) : null,
            storeName: shopItemDraft.purchaseType === "Store" ? (shopItemDraft.storeName.trim() || null) : null,
            storeUrl: shopItemDraft.purchaseType === "Store" ? (shopItemDraft.storeUrl.trim() || null) : null,
            sourceKey: shopItemModal.sourceKey,
          });
          await refetch("shopping_list_items", setDbShoppingItems);
        } catch (e) {
          console.error("Failed to save shopping override:", e);
          alert("Failed to save shopping override");
        }
      }
    }

    setShopItemModal(null);
  };

  const removeShopItem = async (item: ShoppingListItem) => {
    if (item.isManual) {
      // Delete manual item from DB
      const dbItem = dbShoppingItems.find(dbItem => 
        dbItem.name === item.name && 
        !dbItem.sourceKey && 
        dbItem.category === item.category
      );
      
      if (dbItem) {
        try {
          await dbDelete("shopping_list_items", dbItem.id);
          await refetch("shopping_list_items", setDbShoppingItems);
        } catch (e) {
          console.error("Failed to delete shopping item:", e);
          alert("Failed to delete shopping item");
        }
      }
      return;
    }
    
    if (item.sourceKey) {
      // Delete override item from DB
      const dbItem = dbShoppingItems.find(dbItem => dbItem.sourceKey === item.sourceKey);
      
      if (dbItem) {
        try {
          await dbDelete("shopping_list_items", dbItem.id);
          await refetch("shopping_list_items", setDbShoppingItems);
        } catch (e) {
          console.error("Failed to delete shopping override:", e);
          alert("Failed to delete shopping override");
        }
      }
    }
  };

  const saveCostCalcOverride = async (itemId: number, data: any) => {
    try {
      // Check if override already exists
      const existing = dbCostCalcOverrides.find((o: any) => o.itemId === itemId);
      
      if (existing) {
        // Update existing
        await dbUpdate("cost_calculator_overrides", existing.id, {
          price: data.price,
          targetFoodCost: data.targetFoodCost,
          ingredients: data.ingredients,
        });
      } else {
        // Create new
        await dbInsert("cost_calculator_overrides", {
          itemId,
          price: data.price,
          targetFoodCost: data.targetFoodCost,
          ingredients: data.ingredients,
        });
      }
      await refetch("cost_calculator_overrides", setDbCostCalcOverrides);
    } catch (e) {
      console.error("Failed to save cost calculator override:", e);
    }
  };

  return (
    <div style={{ minHeight:"100dvh", background:T.bg, color:T.text, fontFamily:"'Segoe UI', 'Helvetica Neue', Arial, sans-serif", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* ���� LOGIN SCREEN ���� */}
      {isAuthLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100dvh', background: T.bg }}>Loading...</div>
      ) : !currentUser ? (
        <Login />
      ) : (
        <>
          {/* ���� HEADER ���� */}
          <div className="glass" style={{ borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100, paddingTop: "calc(env(safe-area-inset-top, 0px) + 20px)" }}>
            {/* Critical Banner */}
            {criticalOverdue > 0 && (
              <div style={{ 
                background: T.red, color: "#FFF", padding: "8px 32px", textAlign: "center", 
                fontSize: 12, fontWeight: 700, letterSpacing: 0.5, animation: "pulse 2s infinite" 
              }}>
                CRITICAL PATH ALERT: {criticalOverdue} MANDATORY TASKS ARE OVERDUE. LAUNCH DATE AT RISK.
              </div>
            )}
            {/* Row 1: Logo, Search, Stats */}
        <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: isMobile ? 14 : 0, padding: isMobile ? "20px 16px 16px" : "28px 32px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {isMobile && (
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.text, padding: 4 }}
              >
                {isMenuOpen ? "✕" : "☰"}
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <span style={{ fontFamily: appTitle === "ไกลกังวล" ? "var(--font-thai-display)" : "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: isMobile ? 27 : 32, lineHeight: 1.3, fontWeight: 700, color: T.text, letterSpacing: -0.3, paddingTop: appTitle === "ไกลกังวล" ? 12 : 2, whiteSpace: "nowrap", overflow: appTitle === "ไกลกังวล" ? "visible" : "hidden", textOverflow: "ellipsis", display: "block" }}>{appTitle}</span>
              {!isMobile && <span style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 12, color: T.subtle, letterSpacing: 1.05, fontWeight: 700 }}>LAUNCH DASHBOARD</span>}
            </div>
          </div>
          
          <div style={{ display: "flex", gap: isMobile ? 10 : 8, alignItems: "center", justifyContent: isMobile ? "space-between" : "flex-end", width: isMobile ? "100%" : "auto" }}>
            {isUnlocked && (
              <button 
                onClick={() => setIsUnlocked(false)}
                title="Lock sensitive data"
                style={{ background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 10, padding: isMobile ? "6px 10px" : "6px 12px", cursor: "pointer", color: T.gold, display: "flex", alignItems: "center", gap: 6 }}
              >
                <ShieldCheck size={14} />
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}>LOCK</span>
              </button>
            )}
            <button 
              onClick={() => { logout(); setIsUnlocked(false); }}
              style={{ background: T.stone, border: `1px solid ${T.border}`, borderRadius: 10, padding: isMobile ? "8px 12px" : "8px 16px", fontSize: 13, fontWeight: 700, color: T.text, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Sign Out ({isPartnerAccount ? 'Admin' : (userRole || 'User')})
            </button>
            {!isMobile && <span style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: 13, color: T.subtle, fontWeight: 600 }}>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Phoenix" })}</span>}
          </div>

          {/* AI Search Bar */}
          <div style={{ display: "flex", alignItems: "center", background: T.goldLight, borderRadius: 24, padding: isMobile ? "10px 16px" : "10px 18px", border: `2px solid ${T.gold}`, width: isMobile ? "100%" : 360, height: isMobile ? 50 : 52, marginLeft: isMobile ? 0 : 24, boxShadow: `0 4px 16px rgba(192, 108, 71, 0.15)`, transition: "all .2s" }}>
            <Sparkles size={15} style={{ marginRight: 10, opacity: 0.85, flexShrink: 0 }} />
            <input 
              placeholder="Ask assistant..." 
              style={{ background: "none", border: "none", outline: "none", fontSize: isMobile ? 15 : 16, width: "100%", color: T.text, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontWeight: 600 }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  const val = e.currentTarget.value;
                  e.currentTarget.value = "";
                  setTab("ai");
                  sendAi(val);
                }
              }}
            />
          </div>
        </div>

        {/* Row 2: Main Groups (Desktop) */}
        {!isMobile && (
          <div style={{ display: "flex", padding: "0 32px", gap: 32, height: 50, alignItems: "center" }}>
            {GROUPS.map(g => (
              <button 
                key={g} 
                onClick={() => {
                  setActiveGroup(g);
                  const firstTab = TABS.find(t => t.group === g);
                  if (firstTab) setTab(firstTab.id);
                }}
                style={{ 
                  background: "none", border: "none", borderBottom: `2px solid ${activeGroup === g ? T.gold : "transparent"}`,
                  padding: "16px 0", cursor: "pointer", fontSize: 15, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
                  color: activeGroup === g ? T.text : T.muted, fontWeight: activeGroup === g ? 700 : 500,
                  letterSpacing: 0.5, transition: "all .2s",
                  opacity: activeGroup === g ? 1 : 0.6
                }}
              >
                {g.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Row 3: Sub-tabs (Desktop) */}
      {!isMobile && (
        <div style={{ display: "flex", background: "#FDFDFD", padding: "0 32px", gap: 8, borderBottom: `1px solid ${T.border}` }}>
          {TABS.filter(t => t.group === activeGroup).map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)}
                style={{ 
                  background: "none", border: "none", padding: "12px 20px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 10, color: active ? T.gold : T.muted,
                  fontSize: 13, fontWeight: active ? 700 : 500, transition: "all .2s",
                  borderBottom: `3px solid ${active ? T.gold : "transparent"}`,
                  marginBottom: -1,
                  opacity: active ? 1 : 0.7
                }}
              >
                <Icon size={16} />
                {t.label}
              </button>
            );
          })}
        </div>
      )}

        {/* Mobile Menu Overlay */}
        {isMobile && isMenuOpen && (
          <div style={{ position:"fixed", inset:0, top:"calc(112px + env(safe-area-inset-top, 0px))", background:"#FFF", zIndex:100, padding:"18px 16px calc(20px + env(safe-area-inset-bottom, 0px))", display:"flex", flexDirection:"column", gap:6, overflowY:"auto", WebkitOverflowScrolling:"touch" }}>
            {GROUPS.map(group => (
              <div key={group} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontFamily:"'IBM Plex Mono',monospace", color:T.subtle, letterSpacing:1, padding:"0 12px", marginBottom:10 }}>{group}</div>
                {TABS.filter(t => t.group === group).map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => { setTab(t.id); setIsMenuOpen(false); }}
                    style={{ textAlign:"left", background:tab===t.id ? T.goldLight : "none", border:"none", padding:"12px 16px", borderRadius:8, color:tab===t.id ? T.gold : T.text, fontWeight:tab===t.id ? 600 : 400, fontSize:14, lineHeight:1.35, width:"100%", display:"flex", alignItems:"center", gap:10 }}
                  >
                    <t.icon size={16} />
                    {t.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

      {/* ���� MODALS ���� */}
      {taskModal  && <TaskModal task={taskModal==="new"?null:taskModal} initialDate={calDate || undefined} notes={notes} onSave={saveTask} onClose={()=>{setTaskModal(null); setCalDate(null);}}/>}
      {todoModal && (
        <Modal title={todoModal === "new" ? "Add Todo Item" : "Edit Todo Item"} onClose={() => setTodoModal(null)} width={460}>
          <Field label="TODO TITLE"><input value={todoDraft.title} onChange={e => setTodoDraft(d => ({ ...d, title: e.target.value }))} style={inpStyle} placeholder="e.g. Confirm POS training schedule" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <Field label="CATEGORY">
              <select value={todoDraft.category} onChange={e => setTodoDraft(d => ({ ...d, category: e.target.value }))} style={{ ...dropdownStyle, height: 42 }}>
                {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
              </select>
            </Field>
            <Field label="STATUS">
              <select value={todoDraft.status} onChange={e => setTodoDraft(d => ({ ...d, status: e.target.value as TaskTodoItem["status"] }))} style={{ ...dropdownStyle, height: 42 }}>
                {TODO_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </Field>
          </div>
          <Field label="ASSIGNED TO"><input value={todoDraft.assignedTo} onChange={e => setTodoDraft(d => ({ ...d, assignedTo: e.target.value }))} style={inpStyle} placeholder="Owner, Manager, Partner" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <Field label="REFERENCE LINK (OPTIONAL)"><input value={todoDraft.linkUrl} onChange={e => setTodoDraft(d => ({ ...d, linkUrl: e.target.value }))} style={inpStyle} placeholder="https://..." /></Field>
            <Field label="SHORT NOTE (OPTIONAL)"><input value={todoDraft.note} onChange={e => setTodoDraft(d => ({ ...d, note: e.target.value }))} style={inpStyle} placeholder="Quick context for this todo" /></Field>
          </div>
          {/* Subtasks */}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.subtle, letterSpacing: 1, fontWeight: 600, marginBottom: 8 }}>SUBTASKS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              {todoDraft.subtasks.map((sub, idx) => (
                <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={sub.done}
                    onChange={() => setTodoDraft(d => ({ ...d, subtasks: d.subtasks.map((s, i) => i === idx ? { ...s, done: !s.done } : s) }))}
                    style={{ width: 14, height: 14, accentColor: T.green, flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, fontSize: 13, color: sub.done ? T.muted : T.text, textDecoration: sub.done ? "line-through" : "none" }}>{sub.text}</span>
                  <button
                    onClick={() => setTodoDraft(d => ({ ...d, subtasks: d.subtasks.filter((_, i) => i !== idx) }))}
                    style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "0 2px" }}
                  >×</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="subtask-input"
                placeholder="Add a subtask..."
                style={{ ...inpStyle, flex: 1, height: 36, fontSize: 13 }}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      setTodoDraft(d => ({ ...d, subtasks: [...d.subtasks, { id: Date.now(), text: val, done: false }] }));
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <Btn variant="outline" small onClick={() => {
                const inp = document.getElementById("subtask-input") as HTMLInputElement;
                const val = inp?.value.trim();
                if (val) {
                  setTodoDraft(d => ({ ...d, subtasks: [...d.subtasks, { id: Date.now(), text: val, done: false }] }));
                  inp.value = "";
                }
              }}>+ Add</Btn>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20, flexWrap: "wrap" }}>
            {todoModal !== "new" && (
              <div style={{ marginRight: "auto" }}>
                <Btn onClick={() => deleteTaskTodo(todoModal)} variant="outline" style={{ color: T.red, borderColor: T.redBorder }}>Delete Todo</Btn>
              </div>
            )}
            <Btn onClick={() => setTodoModal(null)} variant="ghost">Cancel</Btn>
            <Btn onClick={saveTaskTodo} variant="primary">{todoModal === "new" ? "Add Todo" : "Save Todo"}</Btn>
          </div>
        </Modal>
      )}
      {menuModal  && <MenuModal item={menuModal==="new"?null:menuModal} onSave={saveMenu} onClose={()=>setMenuModal(null)}/>}
      {finModal   && <FinModal item={finModal.item||null} type={finModal.type} onSave={saveFin} onClose={()=>setFinModal(null)} userRole={currentUser?.role} />}
      {tlModal    && <TimelineModal item={tlModal==="new"?null:tlModal} onSave={saveTL} onClose={()=>setTlModal(null)}/>}
      {noteModal  && <NoteModal note={noteModal==="new"?null:noteModal} tasks={tasks} onSave={saveNote} onClose={()=>setNoteModal(null)}/>} 
      {noteDetail && <NoteDetailModal note={noteDetail} onClose={() => setNoteDetail(null)} onEdit={(n) => { setNoteDetail(null); setNoteModal(n); }} onDelete={(id) => {
        const selected = noteDetail;
        setNoteDetail(null);
        setDelConfirm({ label: selected.title, onConfirm: () => deleteRecord('notes', id, selected.title, setNotes) });
      }} isDriveConnected={isDriveConnected} onSaveToDrive={handleSaveToDrive} onOpenLinkedTask={(taskId) => {
        const linked = tasks.find(t => t.id === taskId);
        if (linked) {
          setNoteDetail(null);
          setTab("tasks");
          setTaskModal(linked);
        }
      }} />}
      {invoiceModal && <InvoiceModal invoice={invoiceModal === "new" ? null : invoiceModal} vendors={vendors} onSave={saveInvoice} onClose={() => setInvoiceModal(null)} />}
      {vendorModal && <VendorModal vendor={vendorModal === "new" ? null : vendorModal} onSave={saveVendor} onClose={() => setVendorModal(null)} />}
      {invModal && <InventoryModal item={invModal === "new" ? null : invModal} vendors={vendors} onSave={saveInv} onClose={() => setInvModal(null)} />}
      {permitModal && <PermitModal permit={permitModal === "new" ? null : permitModal} onSave={savePermit} onClose={() => setPermitModal(null)} />}
      {shopItemModal && (
        <Modal title={shopItemModal === "new" ? "Add Shopping Item" : "Edit Shopping Item"} onClose={() => setShopItemModal(null)} width={460}>
          <Field label="ITEM NAME"><input value={shopItemDraft.name} onChange={e => setShopItemDraft(d => ({ ...d, name: e.target.value }))} style={inpStyle} placeholder="e.g. Olive Oil" /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="CATEGORY">
              <select value={shopItemDraft.category} onChange={e => setShopItemDraft(d => ({ ...d, category: e.target.value }))} style={{ ...dropdownStyle, height: 42 }}>
                {INV_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </Field>
            <Field label="DEPARTMENT">
              <select value={shopItemDraft.department} onChange={e => setShopItemDraft(d => ({ ...d, department: e.target.value }))} style={{ ...dropdownStyle, height: 42 }}>
                {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
              </select>
            </Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="TOTAL QUANTITY"><input type="number" min={0} step="0.01" value={shopItemDraft.quantity} onChange={e => setShopItemDraft(d => ({ ...d, quantity: Number(e.target.value) }))} style={inpStyle} /></Field>
            <Field label="UNIT"><input value={shopItemDraft.unit} onChange={e => setShopItemDraft(d => ({ ...d, unit: e.target.value }))} style={inpStyle} placeholder="kg, lb, case" /></Field>
          </div>
          <Field label="TOTAL COST ($)"><input type="number" min={0} step="0.01" value={shopItemDraft.totalCost} onChange={e => setShopItemDraft(d => ({ ...d, totalCost: Number(e.target.value) }))} style={inpStyle} /></Field>
          <Field label="WHERE TO BUY">
            <select
              value={shopItemDraft.purchaseType}
              onChange={e => setShopItemDraft(d => ({ ...d, purchaseType: e.target.value as "Vendor" | "Store" | "", vendorName: "", storeName: "", storeUrl: "" }))}
              style={{ ...dropdownStyle, height: 42 }}
            >
              <option value="">Not set</option>
              <option value="Vendor">Order Through Vendor</option>
              <option value="Store">Buy From Store</option>
            </select>
          </Field>
          {shopItemDraft.purchaseType === "Vendor" && (
            <Field label="VENDOR">
              <select value={shopItemDraft.vendorName} onChange={e => setShopItemDraft(d => ({ ...d, vendorName: e.target.value }))} style={{ ...dropdownStyle, height: 42 }}>
                <option value="">Select vendor</option>
                {vendors.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
              </select>
            </Field>
          )}
          {shopItemDraft.purchaseType === "Store" && (
            <>
              <Field label="STORE NAME"><input value={shopItemDraft.storeName} onChange={e => setShopItemDraft(d => ({ ...d, storeName: e.target.value }))} style={inpStyle} placeholder="e.g. Costco" /></Field>
              <Field label="STORE LINK"><input value={shopItemDraft.storeUrl} onChange={e => setShopItemDraft(d => ({ ...d, storeUrl: e.target.value }))} style={inpStyle} placeholder="https://..." /></Field>
            </>
          )}
          <Field label="USED IN DISHES (COMMA SEPARATED)"><input value={shopItemDraft.items} onChange={e => setShopItemDraft(d => ({ ...d, items: e.target.value }))} style={inpStyle} placeholder="Pasta, Salad, Special" /></Field>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
            <Btn onClick={() => setShopItemModal(null)} variant="ghost">Cancel</Btn>
            <Btn onClick={saveShopItem} variant="primary">Save Item</Btn>
          </div>
        </Modal>
      )}
      {mktModal && <MarketingModal post={mktModal === "new" ? null : mktModal} onSave={saveMkt} onClose={() => setMktModal(null)} />}
      {trainModal && <TrainingModal module={trainModal === "new" ? null : trainModal} onSave={saveTrain} onClose={() => setTrainModal(null)} />}
      {posModal && <PositionModal position={posModal === "new" ? null : posModal} onSave={savePos} onClose={() => setPosModal(null)} userRole={currentUser?.role} />}
      {canModal && <CandidateModal candidate={canModal === "new" ? null : canModal} initialDate={calDate || undefined} positions={positions} onSave={saveCan} onClose={() => { setCanModal(null); setCalDate(null); }} userRole={currentUser?.role} />}
      {teamMapModal && <TeamMapMemberModal member={teamMapModal === "new" ? null : teamMapModal} positions={positions} onSave={saveTeamMapMember} onClose={() => setTeamMapModal(null)} />}
      {assetModal && <DigitalAssetModal asset={assetModal === "new" ? null : assetModal} onSave={saveAsset} onClose={() => setAssetModal(null)} />}
      {utilityModal && <UtilityModal account={utilityModal === "new" ? null : utilityModal} onSave={saveUtility} onClose={() => setUtilityModal(null)} />}
      {chkModal && <ChecklistModal checklist={chkModal === "new" ? null : chkModal} onSave={saveChk} onClose={() => setChkModal(null)} />}
      {delConfirm && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={()=>setDelConfirm(null)}>
          <div style={{ background:"#FFF",borderRadius:14,padding:26,width:340,boxShadow:"0 16px 40px rgba(0,0,0,.12)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Segoe UI', 'Helvetica Neue', Arial, sans-serif",fontSize:17,marginBottom:10 }}>Remove this item?</div>
            <div style={{ fontSize:13,color:T.muted,marginBottom:22 }}><strong style={{color:T.text}}>{delConfirm.label}</strong> will be permanently removed.</div>
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <Btn onClick={()=>setDelConfirm(null)} variant="ghost">Cancel</Btn>
              <Btn onClick={()=>{delConfirm.onConfirm();setDelConfirm(null);}} variant="danger">Remove</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: isMobile ? "16px" : "28px 32px", maxWidth: 1440, margin: "0 auto", display: "flex", gap: 32, paddingBottom: isMobile ? "96px" : undefined }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* �"��"��"��"��"��"� OVERVIEW �"��"��"��"��"��"� */}
        {tab==="overview" && (
          <div className="fu">
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 20 : 32 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <SectionHeader title="Launch Overview" subtitle="Track your restaurant's journey from concept to opening day"/>
                {/* At-a-glance */}
                <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 20, padding: isMobile ? "16px" : 24, marginBottom: isMobile ? 16 : 24 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: 1.2, marginBottom: 12, fontWeight: 600 }}>AT A GLANCE</div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "160px 1fr", gap: 12, marginBottom: 12, alignItems: "center" }}>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <ProgressRing progress={prog} size={isMobile ? 110 : 120} stroke={8} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)", gap: 10 }}>
                      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: T.subtle }}>Overdue Tasks</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: overdue > 0 ? T.red : T.green }}>{overdue}</div>
                      </div>
                      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 11, color: T.subtle }}>Permit Risks {"<="} 14d</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: permitAlerts.filter(x => (x.daysLeft as number) <= 14).length > 0 ? T.red : T.green }}>{permitAlerts.filter(x => (x.daysLeft as number) <= 14).length}</div>
                      </div>
                      <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 10, color: T.subtle }}>Staffing Gap</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: (totOpenings - totHired) > 0 ? T.gold : T.green }}>{Math.max(0, totOpenings - totHired)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Btn onClick={() => setTab("tasks")} variant="outline" small>Tasks</Btn>
                    <Btn onClick={() => setTab("permits")} variant="outline" small>Permits</Btn>
                    <Btn onClick={() => setTab("talent")} variant="outline" small>Hiring</Btn>
                    <Btn onClick={() => setTab("shopping")} variant="outline" small>Shopping</Btn>
                  </div>
                </div>

                {/* 7-Day Overview */}
                <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 20, padding: isMobile ? "16px" : 24, marginBottom: isMobile ? 16 : 24 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: 1.2, marginBottom: 12, fontWeight: 600 }}>7-DAY OVERVIEW</div>
                  <LaunchWindow
                    tasks={tasks}
                    permits={permits}
                    candidates={candidates}
                    calendarEvents={calendarEvents}
                    onOpenDay={(dateStr) => {
                      setCalendarFocusDate(dateStr);
                      setTab("calendar");
                    }}
                  />
                </div>

                {/* Must Act Now */}
                <div style={{ marginTop: isMobile ? 16 : 24 }}>
                  <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 20, padding: isMobile ? "16px" : 28 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: T.muted, letterSpacing: 1.2, fontWeight: 600 }}>MUST ACT NOW</div>
                      <Btn onClick={() => setTab("tasks")} variant="ghost" small>Open Tasks</Btn>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {mustActNow.length === 0 ? (
                        <div style={{ fontSize: 12, color: T.green, background: T.greenLight, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px" }}>No urgent actions right now.</div>
                      ) : mustActNow.map(item => (
                        <div key={`must-${item.id}`} style={{ border: `1px solid ${T.redBorder}`, background: T.redLight, borderRadius: 10, padding: "10px 12px" }}>
                          <div style={{ fontSize: 13, color: T.text, fontWeight: 700 }}>{item.title}</div>
                          <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{item.meta}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 20, padding: isMobile ? "16px" : 28, marginTop: isMobile ? 16 : 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: T.muted, letterSpacing: 1.2, fontWeight: 600 }}>TOP 5 URGENT TASKS / SUBTASKS</div>
                      <div style={{ fontSize: 11, color: T.subtle, marginTop: 2 }}>Sorted by urgency and due date</div>
                    </div>
                    <Btn onClick={() => setTab("tasks")} variant="ghost" small>Open Task Manager</Btn>
                  </div>
                  {urgentTaskSubtasks.length === 0 ? (
                    <div style={{ fontSize: 12, color: T.green, background: T.greenLight, border: `1px solid ${T.greenBorder}`, borderRadius: 10, padding: "10px 12px" }}>All clear — no urgent task items right now.</div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {urgentTaskSubtasks.map(item => (
                        <div key={`urgent-${item.id}`} style={{ border: `1px solid ${T.redBorder}`, borderRadius: 10, padding: "10px 12px", background: T.redLight }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, overflowWrap: "anywhere" }}>{item.label}</div>
                            <span style={{ fontSize: 10, borderRadius: 999, border: `1px solid ${T.redBorder}`, padding: "2px 8px", color: T.red, background: "#FFF" }}>{item.type}</span>
                          </div>
                          <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{item.meta}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Permit Alerts */}
                <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 20, padding: isMobile ? "16px" : 28, marginTop: isMobile ? 16 : 24 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: T.muted, letterSpacing: 1.2, fontWeight: 600 }}>PERMIT COUNTDOWN ALERTS (30/14/7 DAYS)</div>
                    <Btn onClick={() => setTab("permits")} variant="ghost" small>Open Permits</Btn>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {permitAlerts.length === 0 ? (
                      <div style={{ fontSize: 12, color: T.green, background: T.greenLight, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px" }}>No permit deadlines in the next 30 days.</div>
                    ) : permitAlerts.map(({ permit, daysLeft }) => (
                      <div key={`permit-alert-${permit.id}`} style={{ border: `1px solid ${(daysLeft as number) <= 7 ? T.redBorder : (daysLeft as number) <= 14 ? T.goldBorder : T.border}`, background: (daysLeft as number) <= 7 ? T.redLight : (daysLeft as number) <= 14 ? T.goldLight : T.bg, borderRadius: 10, padding: "10px 12px", display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{permit.name}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>{permit.issuer} · expires {permit.expiryDate}</div>
                        </div>
                        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: (daysLeft as number) <= 7 ? T.red : (daysLeft as number) <= 14 ? T.gold : T.text, fontWeight: 700 }}>
                          {(daysLeft as number) < 0 ? `${Math.abs(daysLeft as number)}d overdue` : `${daysLeft as number}d left`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

          </div>
        </div>
      </div>
      )}

        {/* �"��"��"��"��"��"� TASKS �"��"��"��"��"��"� */}
        {tab==="tasks" && (
          <div className="fu">
            <SectionHeader title="Planning" subtitle={`${taskTodos.length} inbox items · ${openTaskTodos.length} open · ${doneTaskTodos.length} completed`}
              action={
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: isMobile ? "stretch" : "flex-end" }}>
                  <Btn onClick={openNewTodo} variant="outline" small>+ Full Todo Form</Btn>
                  <Btn onClick={()=>setTaskModal("new")} variant="primary">+ New Master Task</Btn>
                </div>
              }/>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(360px, 0.8fr) minmax(0, 1.2fr)", gap: 16, alignItems: "start" }}>
              <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
                <div style={{ position: "sticky", top: 0, zIndex: 4, padding: isMobile ? "12px" : "14px", background: "#FFF", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: 1.1, fontWeight: 600, marginBottom: 10 }}>ACTION LIST</div>
                  <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(190px, 220px) auto", gap: 8 }}>
                    <input
                      value={quickTodoTitle}
                      onChange={e => setQuickTodoTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") quickAddTodo();
                      }}
                      placeholder="Quick-add todo..."
                      style={{ ...inpStyle, height: 40 }}
                    />
                    <select value={quickTodoCategory} onChange={e => setQuickTodoCategory(e.target.value)} style={{ ...dropdownStyle, height: 40 }}>
                      {CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                    </select>
                    <Btn onClick={quickAddTodo} variant="primary" small>+ Add</Btn>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                    {["All", ...TODO_STATUSES].map(status => (
                      <button
                        key={status}
                        onClick={() => setTodoStatusFilter(status as TaskTodoItem["status"] | "All")}
                        style={{ cursor: "pointer", borderRadius: 999, padding: "4px 10px", fontSize: 10, border: `1px solid ${todoStatusFilter === status ? T.gold : T.border}`, background: todoStatusFilter === status ? T.goldLight : "#FFF", color: todoStatusFilter === status ? T.gold : T.muted, fontWeight: todoStatusFilter === status ? 700 : 500 }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ maxHeight: isMobile ? "none" : "calc(100vh - 290px)", overflowY: "auto" }}>
                  {actionListTodos.length === 0 ? (
                    <div style={{ padding: "18px 14px", color: T.muted, fontSize: 12 }}>No todo items match this filter.</div>
                  ) : (
                    actionListTodos.map(todo => {
                      const isDone = todo.status === "Done";
                      const subtasks = todo.subtasks || [];
                      const subDone = subtasks.filter(s => s.done).length;
                      return (
                        <div key={todo.id} style={{ borderBottom: `1px solid ${T.border}`, padding: "9px 12px", background: isDone ? T.bg : "#FFF" }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => toggleTodoDone(todo)}
                              style={{ width: 14, height: 14, cursor: "pointer", accentColor: T.green, marginTop: 2, flexShrink: 0 }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <button
                                onClick={() => openEditTodo(todo)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  margin: 0,
                                  textAlign: "left",
                                  fontSize: 13,
                                  color: isDone ? T.muted : T.text,
                                  textDecoration: isDone ? "line-through" : "none",
                                  overflowWrap: "anywhere",
                                  cursor: "pointer",
                                  width: "100%",
                                }}
                                title="Edit todo"
                              >
                                {todo.title}
                              </button>
                              <div style={{ display: "flex", gap: 6, marginTop: 5 }}>
                                <button
                                  onClick={() => openEditTodo(todo)}
                                  style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "2px 8px", color: T.muted, cursor: "pointer", fontSize: 10 }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteTaskTodo(todo)}
                                  style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "2px 8px", color: T.red, cursor: "pointer", fontSize: 10 }}
                                >
                                  Delete
                                </button>
                              </div>
                              {subtasks.length > 0 && (
                                <div style={{ marginTop: 5, display: "flex", flexDirection: "column", gap: 4 }}>
                                  {subtasks.map(sub => (
                                    <label key={sub.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                                      <input
                                        type="checkbox"
                                        checked={sub.done}
                                        onChange={() => {
                                          const updated = subtasks.map(s => s.id === sub.id ? { ...s, done: !s.done } : s);
                                          const allDone = updated.every(s => s.done);
                                          const newStatus: TaskTodoItem["status"] = allDone ? "Done" : todo.status === "Done" ? "In Progress" : todo.status;
                                          setTaskTodos(prev => prev.map(t => t.id === todo.id ? { ...t, subtasks: updated, status: newStatus } : t));
                                        }}
                                        style={{ width: 12, height: 12, accentColor: T.green, flexShrink: 0 }}
                                      />
                                      <span style={{ fontSize: 11, color: sub.done ? T.muted : T.subtle, textDecoration: sub.done ? "line-through" : "none" }}>{sub.text}</span>
                                    </label>
                                  ))}
                                  <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{subDone}/{subtasks.length} done</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16, padding: isMobile ? 12 : 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: 1.1, fontWeight: 600 }}>CATEGORIZED OVERVIEW</div>
                    <div style={{ fontSize: 12, color: T.subtle, marginTop: 2 }}>Open vs Completed by planning category</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Btn onClick={() => setTodoStatusFilter("All")} variant="ghost" small>All Statuses</Btn>
                    <Btn onClick={() => setTodoStatusFilter("In Progress")} variant="outline" small>Focus In Progress</Btn>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {planningCategoryRows.map(row => {
                    const cc = CAT_COLORS[row.category] || { bg: T.bg, dot: T.text, border: T.border };
                    const isExpanded = !!expandedPlanningCats[row.category];
                    const categoryTodos = taskTodos
                      .filter(todo => todo.category === row.category)
                      .filter(todo => todoStatusFilter === "All" || todo.status === todoStatusFilter)
                      .sort((a, b) => {
                        if (TODO_STATUS_ORDER[a.status] !== TODO_STATUS_ORDER[b.status]) {
                          return TODO_STATUS_ORDER[a.status] - TODO_STATUS_ORDER[b.status];
                        }
                        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
                      });

                    return (
                      <div key={`planning-row-${row.category}`} style={{ border: `1px solid ${cc.border}`, borderRadius: 14, overflow: "hidden", background: "#FFF" }}>
                        <button
                          onClick={() => setExpandedPlanningCats(prev => ({ ...prev, [row.category]: !prev[row.category] }))}
                          style={{ width: "100%", display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center", textAlign: "left", border: "none", background: cc.bg, padding: "10px 12px", cursor: "pointer", borderBottom: `1px solid ${cc.border}` }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{row.category}</div>
                            <div style={{ marginTop: 4, fontSize: 10, color: T.muted }}>{row.taskCount} master tasks · {row.todoCount} todo items</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 11, color: cc.dot, fontWeight: 700 }}>{row.progress}%</span>
                            <span style={{ fontSize: 14, color: T.muted }}>{isExpanded ? "▾" : "▸"}</span>
                          </div>
                        </button>

                        <div style={{ padding: "12px" }}>
                          <div style={{ height: 7, borderRadius: 999, background: T.bg, border: `1px solid ${T.border}`, overflow: "hidden", marginBottom: 10 }}>
                            <div style={{ height: "100%", width: `${row.progress}%`, background: row.progress >= 70 ? T.green : row.progress >= 40 ? T.gold : T.blue, transition: "width .2s ease" }} />
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                            <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 10px", background: T.bg }}>
                              <div style={{ fontSize: 10, color: T.subtle }}>Open</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: row.openCount > 0 ? T.gold : T.text }}>{row.openCount}</div>
                            </div>
                            <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 10px", background: T.bg }}>
                              <div style={{ fontSize: 10, color: T.subtle }}>Completed</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: T.green }}>{row.completedCount}</div>
                            </div>
                          </div>

                          {isExpanded && (
                            <div style={{ marginTop: 10, borderTop: `1px solid ${T.border}`, paddingTop: 10 }}>
                              {categoryTodos.length === 0 ? (
                                <div style={{ fontSize: 11, color: T.muted }}>No todo items in this category for current status filter.</div>
                              ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                                  {categoryTodos.map(todo => {
                                    const sc = TODO_STATUS_COLORS[todo.status];
                                    return (
                                      <div key={`cat-todo-${row.category}-${todo.id}`} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 10px", background: "#FFF" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                                          <div style={{ fontSize: 12, color: T.text, overflowWrap: "anywhere" }}>{todo.title}</div>
                                          <span style={{ fontSize: 10, color: sc.text, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>{todo.status}</span>
                                        </div>
                                        {(todo.note || todo.linkUrl) && (
                                          <div style={{ marginTop: 6, fontSize: 11, color: T.muted, display: "flex", flexDirection: "column", gap: 3 }}>
                                            {todo.note && <span>{todo.note}</span>}
                                            {todo.linkUrl && <a href={todo.linkUrl} target="_blank" rel="noreferrer" style={{ color: T.blue, textDecoration: "underline", overflowWrap: "anywhere" }}>{todo.linkUrl}</a>}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 16, background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 16, padding: isMobile ? 12 : 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: 1.1, fontWeight: 600 }}>MASTER TASK CHECKLISTS</div>
                  <div style={{ fontSize: 12, color: T.subtle, marginTop: 2 }}>Add subtasks in task editor, then check each item off here when completed.</div>
                </div>
                <Btn onClick={() => setTaskModal("new")} variant="outline" small>+ New Task</Btn>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 10, color: T.subtle, marginBottom: 6 }}>CATEGORY</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["All", ...CATEGORIES].map(category => (
                      <button
                        key={`task-cat-${category}`}
                        onClick={() => setCatF(category)}
                        style={{ cursor: "pointer", borderRadius: 999, padding: "4px 10px", fontSize: 10, border: `1px solid ${catFilter === category ? T.gold : T.border}`, background: catFilter === category ? T.goldLight : "#FFF", color: catFilter === category ? T.gold : T.muted, fontWeight: catFilter === category ? 700 : 500 }}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: T.subtle, marginBottom: 6 }}>STATUS</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["All", "Not Started", "In Progress", "Complete", "Overdue"].map(status => (
                      <button
                        key={`task-status-${status}`}
                        onClick={() => setStatF(status)}
                        style={{ cursor: "pointer", borderRadius: 999, padding: "4px 10px", fontSize: 10, border: `1px solid ${statFilter === status ? T.gold : T.border}`, background: statFilter === status ? T.goldLight : "#FFF", color: statFilter === status ? T.gold : T.muted, fontWeight: statFilter === status ? 700 : 500 }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {isMobile ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {filteredTasks.length === 0 ? (
                    <div style={{ border: `1px dashed ${T.border}`, borderRadius: 16, padding: "24px 16px", color: T.muted, fontSize: 13, textAlign: "center", background: "#FFF" }}>
                      No tasks match current filters.
                    </div>
                  ) : (
                    filteredTasks.map(task => {
                      const cc = CAT_COLORS[task.category] || {};
                      const sc = STATUS_COLORS[task.status] || {};
                      const pc = PRIORITY_COLORS[task.priority] || {};
                      const total = task.checklist.length;
                      const done = task.checklist.filter(item => item.done).length;
                      const pct = total ? Math.round((done / total) * 100) : 0;
                      const expanded = !!expandedTaskCards[task.id];
                      const newSubtaskValue = subtaskDrafts[task.id] || "";
                      return (
                        <div key={`task-mobile-${task.id}`} className="mobile-card" style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                          {/* Color accent bar */}
                          <div style={{ height: 4, background: `linear-gradient(90deg, ${cc.dot || T.gold} 0%, ${cc.dot || T.gold}55 100%)` }} />
                          
                          <div style={{ padding: "14px 16px 0" }}>
                            {/* Top row: title + actions */}
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start", marginBottom: 10 }}>
                              <button onClick={() => setExpandedTaskCards(prev => ({ ...prev, [task.id]: !prev[task.id] }))} style={{ background: "none", border: "none", padding: 0, margin: 0, fontSize: 15, fontWeight: 700, color: T.text, lineHeight: 1.3, textAlign: "left", cursor: "pointer", flex: 1, minWidth: 0 }}>{task.task}</button>
                              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                <button onClick={() => setTaskModal(task)} title="Edit" style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: "8px 10px", color: T.muted, cursor: "pointer", display: "flex", alignItems: "center" }}><PenLine size={15} /></button>
                                <button onClick={() => setDelConfirm({ label: task.task, onConfirm: () => deleteRecord('tasks', task.id, task.task, setTasks) })} title="Delete" style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 10, padding: "8px 10px", color: T.red, cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={15} /></button>
                              </div>
                            </div>

                            {/* Meta badges */}
                            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                              <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: cc.bg || T.bg, color: cc.dot || T.muted, border: `1px solid ${cc.border || T.border}`, fontWeight: 600 }}>{task.category}</span>
                              <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: sc.bg || T.bg, color: sc.text || T.muted, border: `1px solid ${sc.border || T.border}`, fontWeight: 600 }}>{task.status}</span>
                              <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: pc.bg || T.bg, color: pc.text || T.muted, border: `1px solid ${pc.border || T.border}`, fontWeight: 700 }}>{task.priority}</span>
                              {task.due && <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 99, background: T.bg, color: T.muted, border: `1px solid ${T.border}` }}>Due {new Date(task.due + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
                            </div>

                            {/* Progress bar */}
                            {total > 0 && (
                              <div style={{ marginBottom: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                                  <span style={{ fontSize: 11, color: T.muted }}>Subtasks</span>
                                  <span style={{ fontSize: 11, color: pct === 100 ? T.green : T.muted, fontWeight: 600 }}>{done}/{total}</span>
                                </div>
                                <div style={{ height: 6, borderRadius: 999, background: T.bg, overflow: "hidden" }}>
                                  <div style={{ height: "100%", width: `${pct}%`, background: pct === 100 ? T.green : T.gold, transition: "width .3s ease", borderRadius: 999 }} />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Expand toggle button */}
                          <button
                            onClick={() => setExpandedTaskCards(prev => ({ ...prev, [task.id]: !prev[task.id] }))}
                            style={{ width: "100%", background: "none", border: "none", borderTop: `1px solid ${T.border}`, padding: "11px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: T.muted, cursor: "pointer", fontSize: 12, fontWeight: 600 }}
                          >
                            {expanded ? "▲ Hide subtasks" : `▼ ${total > 0 ? `${total} subtask${total !== 1 ? "s" : ""}` : "Add subtasks"}`}
                          </button>

                          {/* Subtask panel */}
                          {expanded && (
                            <div style={{ background: T.bg, borderTop: `1px solid ${T.border}`, padding: "14px 16px 16px" }}>
                              {task.checklist.length === 0 && <div style={{ fontSize: 12, color: T.muted, marginBottom: 10, textAlign: "center" }}>No subtasks yet — add one below.</div>}
                              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                                {task.checklist.map(item => (
                                  <div key={`task-mobile-check-${task.id}-${item.id}`} style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFF", borderRadius: 12, padding: "10px 12px", border: `1px solid ${T.border}` }}>
                                    <button onClick={() => toggleTaskCheck(task.id, item.id)} style={{ width: 22, height: 22, minWidth: 22, border: `2px solid ${item.done ? T.green : T.border}`, borderRadius: 6, background: item.done ? T.greenLight : "#FFF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer", padding: 0 }}>
                                      {item.done && <span style={{ color: T.green, fontSize: 12, fontWeight: 700 }}>✓</span>}
                                    </button>
                                    <span style={{ flex: 1, fontSize: 13, color: item.done ? T.muted : T.text, textDecoration: item.done ? "line-through" : "none", lineHeight: 1.4 }}>{item.text}</span>
                                    <button onClick={() => deleteTaskSubtask(task.id, item.id)} style={{ background: "none", border: "none", padding: 4, color: T.subtle, cursor: "pointer", display: "flex", alignItems: "center" }}><Trash2 size={13} /></button>
                                  </div>
                                ))}
                              </div>
                              <div style={{ display: "flex", gap: 8 }}>
                                <input
                                  value={newSubtaskValue}
                                  onChange={e => setSubtaskDrafts(prev => ({ ...prev, [task.id]: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === "Enter") {
                                      addTaskSubtask(task.id, newSubtaskValue);
                                      setSubtaskDrafts(prev => ({ ...prev, [task.id]: "" }));
                                    }
                                  }}
                                  placeholder="Add subtask..."
                                  style={{ ...inpStyle, fontSize: 13, padding: "10px 14px", flex: 1, borderRadius: 12 }}
                                />
                                <Btn onClick={() => {
                                  addTaskSubtask(task.id, newSubtaskValue);
                                  setSubtaskDrafts(prev => ({ ...prev, [task.id]: "" }));
                                }} variant="primary" small>+ Add</Btn>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
                <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", minWidth: 780 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "28px minmax(260px, 1.8fr) 120px 140px 100px 90px minmax(120px, auto)", gap: 0, padding: "10px 18px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                    {["", "TASK / PROGRESS", "DUE", "STATUS", "OWNER", "PRIORITY", ""].map((h, i) => (
                      <div key={`task-head-${i}`} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: T.subtle, letterSpacing: .8 }}>{h}</div>
                    ))}
                  </div>
                  {filteredTasks.length === 0 ? (
                    <div style={{ padding: 26, textAlign: "center", color: T.muted, fontSize: 12 }}>
                      No tasks match current filters.
                    </div>
                  ) : (
                    filteredTasks.map(task => (
                      <TaskRow
                        key={`planning-task-row-${task.id}`}
                        task={task}
                        onEdit={setTaskModal}
                        onDelete={t => setDelConfirm({ label: t.task, onConfirm: () => deleteRecord('tasks', t.id, t.task, setTasks) })}
                        onStatusChange={(id, s) => updateRecord('tasks', id, { status: s }, 'Task Status', setTasks)}
                        onSaveChecklist={saveTaskChecklist}
                      />
                    ))
                  )}
                </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ MENU & BAR */}
        {tab==="menu" && (
          <div className="fu">
            <SectionHeader title="Menu & Bar Planner" subtitle="Track items, costs, and hero dishes"
              action={<Btn onClick={()=>setMenuModal("new")} variant="primary">+ Add Item</Btn>}/>
            {/* Section filter */}
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {["All",...MENU_SECTIONS].map(s=>(
                <button key={s} onClick={()=>setMenuSecF(s)}
                  style={{ cursor:"pointer", borderRadius:24, padding:isMobile?"8px 14px":"6px 16px", fontSize:isMobile?12:11, fontFamily:"'Segoe UI', 'Helvetica Neue', Arial, sans-serif", border:`1px solid ${menuSecF===s?T.gold:T.border}`, background:menuSecF===s?T.goldLight:"#FFF", color:menuSecF===s?T.gold:T.muted, fontWeight:menuSecF===s?700:500 }}>
                  {s}
                </button>
              ))}
            </div>
            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {menuItems.filter(m => menuSecF === "All" || m.section === menuSecF).map(item => (
                  <div key={item.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 8, background: T.bg, border: `1px solid ${T.border}`, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 12, fontWeight: 700 }}>IMG</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{item.section}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{item.desc || "-"}</div>
                        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: T.green, fontWeight: 700 }}>
                            {item.section === "Wine" ? `B ${item.sellPriceBottle} / G ${item.sellPriceGlass}` : `$${item.price}`}
                          </span>
                          <span style={{ fontSize: 10, fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, color: item.foodCost > 30 ? T.red : T.green, background: item.foodCost > 30 ? T.redLight : T.greenLight, padding: "2px 8px", borderRadius: 4 }}>{item.foodCost}%</span>
                          {item.hero && <span style={{ fontSize: 12 }}>⭐ Hero</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 10, justifyContent: "flex-end" }}>
                      <button onClick={() => setMenuModal(item)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 12 }}>Edit</button>
                      <button onClick={() => setDelConfirm({ label: item.name, onConfirm: () => deleteRecord('menu_items', item.id, item.name, setMenuItems) })} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 12 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background:"#FFF", border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
                <div style={{ display:"grid", gridTemplateColumns:"110px 44px 1fr 1.8fr 70px 80px 52px 1fr 70px", padding:"10px 18px", background:T.bg, borderBottom:`1px solid ${T.border}` }}>
                  {["SECTION","","NAME","DESCRIPTION","PRICE / B&G","COST %","HERO","NOTES",""] .map((h,i)=>(
                    <div key={i} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:T.subtle, letterSpacing:.8 }}>{h}</div>
                  ))}
                </div>
                {menuItems.filter(m=>menuSecF==="All"||m.section===menuSecF).map((item,i)=>(
                  <div key={item.id} style={{ display:"grid", gridTemplateColumns:"110px 44px 1fr 1.8fr 70px 80px 52px 1fr 70px", padding:"13px 18px", borderBottom:`1px solid ${T.border}`, background:i%2===0?"#FFF":T.bg, alignItems:"center" }}>
                    <div style={{ fontSize:10, color:T.muted, fontFamily:"'IBM Plex Mono',monospace" }}>{item.section}</div>
                    <div style={{ width:32, height:32, borderRadius:6, background:T.bg, border:`1px solid ${T.border}`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:12, fontWeight:700 }}>IMG</span>}
                    </div>
                    <div style={{ fontSize:13, fontFamily:"'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontWeight:600, color:T.text }}>{item.name}</div>
                    <div style={{ fontSize:11, color:T.muted, fontStyle:"italic" }}>{item.desc}</div>
                    <div style={{ fontSize:13, fontFamily:"'IBM Plex Mono',monospace", color:T.green, fontWeight:600 }}>
                      {item.section === "Wine" ? (
                        <div style={{ lineHeight: 1.2 }}>
                          <div style={{ fontSize:10, color:T.muted }}>B: ${item.sellPriceBottle}</div>
                          <div style={{ fontSize:10, color:T.muted }}>G: ${item.sellPriceGlass}</div>
                        </div>
                      ) : `$${item.price}`}
                    </div>
                    <div><span style={{ fontSize:11, fontFamily:"'IBM Plex Mono',monospace", fontWeight:600, color:item.foodCost>30?T.red:T.green, background:item.foodCost>30?T.redLight:T.greenLight, padding:"2px 8px", borderRadius:4 }}>{item.foodCost}%</span></div>
                    <div style={{ textAlign:"center", fontSize:14 }}>{item.hero ? "⭐" : "-"}</div>
                    <div style={{ fontSize:11, color:T.muted }}>{item.notes || "-"}</div>
                    <div style={{ display:"flex", gap:5 }}>
                      <button onClick={()=>setMenuModal(item)} style={{ background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 7px",color:T.muted,cursor:"pointer",fontSize:11 }}>Edit</button>
                      <button onClick={()=>setDelConfirm({label:item.name,onConfirm:()=>deleteRecord('menu_items', item.id, item.name, setMenuItems)})} style={{ background:"none",border:`1px solid ${T.redBorder}`,borderRadius:6,padding:"3px 7px",color:T.red,cursor:"pointer",fontSize:11 }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* �"��"��"��"��"��"� SHOPPING LIST �"��"��"��"��"��"� */}
        {tab === "shopping" && (
          <div className="fu">
            <SectionHeader title="Consolidated Shopping List" subtitle="All ingredients required for your current menu items"
              action={
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <Btn onClick={() => {
                    // Download CSV template
                    const header = "name,category,department,quantity,unit,totalCost,purchaseType,vendorName,storeName,storeUrl";
                    const eg = "Avocados,Operating Supplies,Kitchen,10,flats,35.00,Vendor,Green Valley Farms,,";
                    const blob = new Blob([header + "\n" + eg], { type: "text/csv" });
                    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "shopping_import_template.csv"; a.click();
                  }} variant="ghost" small><Download size={13} style={{ marginRight: 4 }} />Template</Btn>
                  <label style={{ cursor: "pointer" }}>
                    <input type="file" accept=".csv" style={{ display: "none" }} onChange={async e => {
                      const file = e.target.files?.[0]; if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async () => {
                        try {
                          const text = String(reader.result || "");
                          const lines = text.trim().split("\n");
                          const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
                          const rows = lines.slice(1).map(line => {
                            const vals = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
                            const obj: any = {};
                            headers.forEach((h, i) => { obj[h] = vals[i] ?? ""; });
                            return obj;
                          }).filter(r => r.name);
                          for (const row of rows) {
                            await dbInsert("shopping_list_items", {
                              name: row.name,
                              category: row.category || "Operating Supplies",
                              department: row.department || "Kitchen",
                              quantity: parseFloat(row.quantity) || 0,
                              unit: row.unit || "",
                              totalCost: parseFloat(row.totalCost) || 0,
                              items: "",
                              purchaseType: row.purchaseType || null,
                              vendorName: row.purchaseType === "Vendor" ? (row.vendorName || null) : null,
                              storeName: row.purchaseType === "Store" ? (row.storeName || null) : null,
                              storeUrl: row.purchaseType === "Store" ? (row.storeUrl || null) : null,
                              sourceKey: null,
                            });
                          }
                          await refetch("shopping_list_items", setDbShoppingItems);
                          alert(`${rows.length} item(s) imported.`);
                        } catch { alert("Failed to parse CSV. Please use the template."); }
                        e.target.value = "";
                      };
                      reader.readAsText(file);
                    }} />
                    <Btn onClick={() => {}} variant="outline" small style={{ pointerEvents: "none" }}><Upload size={13} style={{ marginRight: 4 }} />Import CSV</Btn>
                  </label>
                  <Btn onClick={() => {
                    const rows = consolidatedShoppingRows.map(ing => `
                      <tr>
                        <td>${ing.name}</td><td>${ing.category}</td><td>${ing.department}</td>
                        <td>${ing.purchaseType === "Vendor" ? (ing.vendorName || "—") : ing.purchaseType === "Store" ? (ing.storeName || "—") : "—"}</td>
                        <td style="text-align:right">${ing.quantity} ${ing.unit}</td>
                        <td style="text-align:right;font-weight:700">$${ing.totalCost.toFixed(2)}</td>
                      </tr>`).join("");
                    const html = `<html><head><title>Shopping List</title><style>
                      body{font-family:sans-serif;font-size:11px;color:#172125}
                      table{width:100%;border-collapse:collapse}
                      th{background:#F5F2EE;text-align:left;padding:8px 10px;font-size:9px;letter-spacing:1px;border-bottom:2px solid #E8E0D6}
                      td{padding:8px 10px;border-bottom:1px solid #EAE6E0}
                      tr:nth-child(even) td{background:#FAFAF8}
                      h2{font-size:16px;margin:0 0 4px}p{margin:0 0 16px;color:#8B9298;font-size:11px}
                      .total{text-align:right;margin-top:12px;font-weight:700;font-size:13px}
                    </style></head><body>
                      <h2>Shopping List</h2>
                      <p>Printed ${new Date().toLocaleDateString()} · ${consolidatedShoppingRows.length} items</p>
                      <table><thead><tr>${["INGREDIENT","CATEGORY","DEPT","WHERE TO BUY","QTY","COST"].map(h=>`<th>${h}</th>`).join("")}</tr></thead>
                      <tbody>${rows}</tbody></table>
                      <div class="total">Total: $${consolidatedShoppingRows.reduce((s,r)=>s+r.totalCost,0).toFixed(2)}</div>
                    </body></html>`;
                    const w = window.open("", "_blank"); if (!w) return;
                    w.document.write(html); w.document.close(); w.focus(); w.print();
                  }} variant="outline" small><Printer size={13} style={{ marginRight: 4 }} />Print</Btn>
                  <Btn onClick={openNewShopItem} variant="primary">+ Add Item</Btn>
                </div>
              } />
            
            {/* Filters */}
            <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, width: 100 }}>CATEGORY:</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["All", ...INV_CATEGORIES].map(cat => (
                      <button key={cat} onClick={() => setShopCatF(cat)}
                        style={{ cursor: "pointer", borderRadius: 20, padding: isMobile ? "7px 12px" : "4px 12px", fontSize: isMobile ? 12 : 11, border: `1px solid ${shopCatF === cat ? T.gold : T.border}`, background: shopCatF === cat ? T.goldLight : "#FFF", color: shopCatF === cat ? T.gold : T.muted, fontWeight: shopCatF === cat ? 600 : 400 }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, width: 100 }}>DEPARTMENT:</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["All", ...DEPARTMENTS].map(dept => (
                      <button key={dept} onClick={() => setShopDeptF(dept)}
                        style={{ cursor: "pointer", borderRadius: 20, padding: isMobile ? "7px 12px" : "4px 12px", fontSize: isMobile ? 12 : 11, border: `1px solid ${shopDeptF === dept ? T.blue : T.border}`, background: shopDeptF === dept ? T.blueLight : "#FFF", color: shopDeptF === dept ? T.blue : T.muted, fontWeight: shopDeptF === dept ? 600 : 400 }}>
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: T.muted, width: 100 }}>SOURCE:</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["All", "Vendor", "Store", "Unassigned"].map(source => (
                      <button key={source} onClick={() => setShopSourceF(source)}
                        style={{ cursor: "pointer", borderRadius: 20, padding: isMobile ? "7px 12px" : "4px 12px", fontSize: isMobile ? 12 : 11, border: `1px solid ${shopSourceF === source ? T.green : T.border}`, background: shopSourceF === source ? T.greenLight : "#FFF", color: shopSourceF === source ? T.green : T.muted, fontWeight: shopSourceF === source ? 600 : 400 }}>
                        {source}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                  <Field label="FILTER VENDOR">
                    <select value={shopVendorF} onChange={e => setShopVendorF(e.target.value)} style={{ ...dropdownStyle, height: 36, fontSize: 11, padding: "6px 10px" }}>
                      {shopVendorOptions.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </Field>
                  <Field label="FILTER STORE">
                    <select value={shopStoreF} onChange={e => setShopStoreF(e.target.value)} style={{ ...dropdownStyle, height: 36, fontSize: 11, padding: "6px 10px" }}>
                      {shopStoreOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
            </div>

            {isMobile ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {consolidatedShoppingRows.length === 0 ? (
                  <div style={{ padding: 20, textAlign: "center", color: T.muted, background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12 }}>No ingredients found matching filters.</div>
                ) : (
                  consolidatedShoppingRows.map((ing, i) => (
                    <div key={ing.id} style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{ing.name}</div>
                      <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap", fontSize: 11, color: T.muted }}>
                        <span>{ing.category}</span>
                        <span>⬢</span>
                        <span>{ing.department}</span>
                        {(ing.purchaseType === "Vendor" && ing.vendorName) && <><span>⬢</span><span>Vendor: {ing.vendorName}</span></>}
                        {(ing.purchaseType === "Store" && ing.storeName) && <><span>⬢</span><span>Store: {ing.storeName}</span></>}
                      </div>
                      {ing.purchaseType === "Store" && ing.storeUrl && (
                        <div style={{ marginTop: 6 }}>
                          <a href={ing.storeUrl} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: T.blue }}>Open Store Link</a>
                        </div>
                      )}
                      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: T.muted }}>{ing.quantity} {ing.unit}</span>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", color: T.green, fontWeight: 700 }}>${ing.totalCost.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                        {ing.items.map(dish => (
                          <span key={dish} style={{ fontSize: 10, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 6px", color: T.muted }}>{dish}</span>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button onClick={() => openEditShopItem(ing)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                        <button onClick={() => removeShopItem(ing)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "5px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>Remove</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
              <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", minWidth: 900 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr 120px 120px 1.8fr 130px", padding: "10px 18px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                  {["INGREDIENT", "CATEGORY", "DEPT", "WHERE TO BUY", "TOTAL QTY", "TOTAL COST", "USED IN DISHES", "ACTIONS"].map(h => (
                    <div key={h} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: T.subtle, letterSpacing: .8 }}>{h}</div>
                  ))}
                </div>
                {consolidatedShoppingRows.length === 0 ? (
                  <div style={{ padding: 40, textAlign: "center", color: T.muted }}>No ingredients found matching filters.</div>
                ) : (
                  consolidatedShoppingRows.map((ing) => (
                    <div key={ing.id} style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1.2fr 120px 120px 1.8fr 130px", padding: "14px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{ing.name}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{ing.category}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{ing.department}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>
                        {ing.purchaseType === "Vendor" && ing.vendorName ? `Vendor: ${ing.vendorName}` : ing.purchaseType === "Store" && ing.storeName ? `Store: ${ing.storeName}` : "-"}
                        {ing.purchaseType === "Store" && ing.storeUrl && (
                          <div><a href={ing.storeUrl} target="_blank" rel="noreferrer" style={{ color: T.blue }}>Link</a></div>
                        )}
                      </div>
                      <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", color: T.text }}>{ing.quantity} {ing.unit}</div>
                      <div style={{ fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", color: T.green, fontWeight: 600 }}>${ing.totalCost.toFixed(2)}</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {ing.items.map(dish => (
                          <span key={dish} style={{ fontSize: 10, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 6px", color: T.muted }}>{dish}</span>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => openEditShopItem(ing)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 8px", color: T.muted, cursor: "pointer", fontSize: 11 }}>Edit</button>
                        <button onClick={() => removeShopItem(ing)} style={{ background: "none", border: `1px solid ${T.redBorder}`, borderRadius: 6, padding: "4px 8px", color: T.red, cursor: "pointer", fontSize: 11 }}>Delete</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div>
            )}
          </div>
        )}

        {tab === "master-inventory" && (
          <MasterInventory 
            items={inventory} 
            vendors={vendors} 
            onEdit={setInvModal} 
            onDelete={id => {
              const item = inventory.find(x => x.id === id);
              if (item) setDelConfirm({ label: item.name, onConfirm: () => deleteRecord('inventory_items', id, item.name, setInventory) });
            }}
            onAdd={() => setInvModal("new")}
          />
        )}

        {/* �"��"��"��"��"��"� FINANCIALS �"��"��"��"��"��"� */}
        {tab==="financials" && (
          !isUnlocked ? <PinGate onUnlock={() => setIsUnlocked(true)} correctPin={securityPin} /> : (
          <div className="fu">
            <SectionHeader 
              title="Financial Tracker" 
              subtitle="Startup costs, operating expenses & break-even"
              action={
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Btn onClick={() => {
                    const combined = [
                      ...startup.map(s => ({ ...s, type: 'Startup' })),
                      ...operatingCostsWithUtilities.map(o => ({ ...o, type: 'Operating' }))
                    ];
                    exportToCSV(combined, 'Restaurant_Financials', [
                      { key: 'type' as any, label: 'Cost Type' },
                      { key: 'category', label: 'Category' },
                      { key: 'budgeted', label: 'Budgeted/Monthly' },
                      { key: 'actual', label: 'Actual' },
                    ]);
                  }} variant="outline" small>Export</Btn>
                  {canManageAccess && <Btn onClick={() => setIsChangePinOpen(true)} variant="outline" small>Change PIN</Btn>}
                  {canManageAccess && (
                    <Btn onClick={() => setDelConfirm({
                      label: "all financial data",
                      onConfirm: async () => {
                        await Promise.all([
                          ...startup.map(c => dbDelete('startup_costs', c.id)),
                          ...operating.map(c => dbDelete('operating_costs', c.id)),
                        ]);
                        setStartup([]);
                        setOp([]);
                        logActivity("Reset all financial data");
                      }
                    })} variant="danger" small>Reset All</Btn>
                  )}
                </div>
              }
            />
            
            {/* Financial KPIs */}
            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap:12, marginBottom:16 }}>
              {[
                {label:"Startup Budget",value:`$${(totBudget/1000).toFixed(0)}K`,sub:`Actual $${(totActual/1000).toFixed(0)}K`,color:totActual>totBudget?T.red:T.green,dot:totActual>totBudget?T.redLight:T.greenLight},
                {label:"Break-Even / Mo",value:`$${(totOp/1000).toFixed(1)}K`,sub:"Monthly operating costs",color:T.gold,dot:T.goldLight},
                {label:"Proj. Revenue / Mo",value:`$${(projRev/1000).toFixed(0)}K`,sub:"At 30% food cost",color:T.blue,dot:T.blueLight},
              ].map(k=>(
                <div key={k.label} style={{ background:"#FFF", border:`1px solid ${T.border}`, borderRadius:12, padding: isMobile ? "14px 16px" : 20 }}>
                  <div style={{ fontSize:11, color:T.muted, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, letterSpacing:.5 }}>{k.label.toUpperCase()}</div>
                  <div style={{ fontFamily:"'Segoe UI', 'Helvetica Neue', Arial, sans-serif", fontSize: isMobile ? 28 : 24, fontWeight:700, color:k.color }}>{k.value}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap:16 }}>
              {/* Startup Costs */}
              <div style={{ background:"#FFF", border:`1px solid ${T.border}`, borderRadius:12, padding: isMobile ? 16 : 22 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:T.muted, letterSpacing:.8 }}>STARTUP COSTS</span>
                  <Btn onClick={()=>setFinModal({type:"startup",item:null})} variant="outline" small>+ Add</Btn>
                </div>
                {startup.length === 0 && <p style={{ fontSize:13, color:T.muted, textAlign:"center", padding:"20px 0" }}>No startup costs yet. Tap + Add to begin.</p>}
                {startup.map(c=>{
                  const diff=Number(c.actual)-Number(c.budgeted);
                  return (
                    <div key={c.id} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
                        <span style={{ fontSize:13, color:T.text, fontWeight:500 }}>{c.category}</span>
                        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                          <span style={{ fontSize:11, fontFamily:"'IBM Plex Mono',monospace", color:T.muted }}>${Number(c.budgeted).toLocaleString()}</span>
                          <span style={{ fontSize:12, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, color:diff>0?T.red:T.green }}>${Number(c.actual).toLocaleString()}</span>
                          <button onClick={()=>setFinModal({type:"startup",item:c})} style={{ background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:"2px 4px",lineHeight:1 }}>Edit</button>
                          <button onClick={()=>setDelConfirm({label:c.category,onConfirm:()=>deleteRecord('startup_costs', c.id, c.category, setStartup)})} style={{ background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:14,padding:"2px 4px",lineHeight:1 }}>Delete</button>
                        </div>
                      </div>
                      <div style={{ height:5, background:T.border, borderRadius:3 }}>
                        <div style={{ height:"100%", width:`${Math.min((Number(c.actual)/Number(c.budgeted))*100,100)}%`, background:diff>0?T.red:T.green, borderRadius:3 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Operating Costs */}
              <div style={{ background:"#FFF", border:`1px solid ${T.border}`, borderRadius:12, padding: isMobile ? 16 : 22 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:T.muted, letterSpacing:.8 }}>MONTHLY OPERATING COSTS</span>
                  <Btn onClick={()=>setFinModal({type:"operating",item:null})} variant="outline" small>+ Add</Btn>
                </div>
                {operating.length === 0 && <p style={{ fontSize:13, color:T.muted, textAlign:"center", padding:"20px 0" }}>No operating costs yet. Tap + Add to begin.</p>}
                {operatingCostsWithUtilities.map(c=>(
                  <div key={c.id} style={{ display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:`1px solid ${T.border}`, alignItems:"center" }}>
                    <div>
                      <span style={{ fontSize:13, color:T.text, fontWeight:500 }}>{c.category}</span>
                      {c.category === "Utilities" && (
                        <div style={{ fontSize:9, color:T.blue, marginTop:2 }}>Auto from Service Accounts</div>
                      )}
                    </div>
                    <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, fontWeight:600, color:T.text }}>${Number(c.monthly).toLocaleString()}</span>
                      <button onClick={()=>setFinModal({type:"operating",item:c})} style={{ background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,padding:"2px 4px" }}>Edit</button>
                      <button onClick={()=>setDelConfirm({label:c.category,onConfirm:()=>deleteRecord('operating_costs', c.id, c.category, setOp)})} style={{ background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:14,padding:"2px 4px" }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          )
        )}

        {/* �"��"��"��"��"��"� COST CALCULATOR �"��"��"��"��"��"� */}
        {tab==="costcalc" && <CostCalculator menuItems={menuItems} dbCostCalcOverrides={dbCostCalcOverrides} onSaveOverride={saveCostCalcOverride} />}

        {/* �"��"��"��"��"��"� TEAM ONBOARDING �"��"��"��"��"��"� */}
        {tab==="onboarding" && <TeamOnboarding />}

        {/* �"��"��"��"��"��"� TIMELINE �"��"��"��"��"��"� */}
        {tab==="timeline" && <Timeline timeline={timeline} onToggle={id => {
          const m = timeline.find(x => x.id === id);
          if (m) updateRecord('milestones', id, { done: !m.done }, 'Milestone', setTL);
        }} onEdit={setTlModal} onDelete={m => setDelConfirm({ label: m.milestone, onConfirm: () => deleteRecord('milestones', m.id, m.milestone, setTL) })} onAdd={() => setTlModal("new")} />}

        {/* �"��"��"��"��"��"� NOTES �"��"��"��"��"��"� */}
        {tab==="notes" && (
          <div className="fu">
            <SectionHeader title="Notes & Ideas" subtitle="Capture ideas, vendor contacts, recipes, and attach files"
              action={
                <div style={{ display: "flex", gap: 10 }}>
                  {!isDriveConnected && (
                    <Btn onClick={handleGoogleConnect} variant="outline" small>Connect Drive</Btn>
                  )}
                  <Btn onClick={()=>setNoteModal("new")} variant="primary">+ New Note</Btn>
                </div>
              }/>
            
            {/* Search and Filters */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
                <input 
                  value={noteSearch} 
                  onChange={e => setNoteSearch(e.target.value)} 
                  placeholder="Search notes..." 
                  style={{ ...inpStyle, paddingLeft: 36 }} 
                />
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>?</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["All", ...Object.keys(NOTE_TAG_COLORS)].map(tag => (
                  <button key={tag} onClick={() => setNoteTagF(tag)}
                    style={{ cursor: "pointer", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", border: `1px solid ${noteTagF === tag ? T.gold : T.border}`, background: noteTagF === tag ? T.goldLight : "#FFF", color: noteTagF === tag ? T.gold : T.muted, fontWeight: noteTagF === tag ? 600 : 400 }}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
              {filteredNotes.length === 0 ? (
                <div style={{ gridColumn: "1/-1", padding: 60, textAlign: "center", background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, color: T.muted }}>
                  No notes found matching your search or filters.
                </div>
              ) : (
                filteredNotes.map(n=>(
                  <NoteCard 
                    key={n.id} 
                    note={n} 
                    onOpen={setNoteDetail} 
                    onDelete={id => setDelConfirm({ label: n.title, onConfirm: () => deleteRecord('notes', id, n.title, setNotes) })}
                    isDriveConnected={isDriveConnected}
                    onSaveToDrive={handleSaveToDrive}
                    onOpenLinkedTask={(taskId) => {
                      const linked = tasks.find(t => t.id === taskId);
                      if (linked) {
                        setTab("tasks");
                        setTaskModal(linked);
                      }
                    }}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* �"��"��"��"��"��"� VENDORS �"��"��"��"��"��"� */}
        {tab === "vendors" && <VendorManager vendors={vendors} onAdd={() => setVendorModal("new")} onEdit={setVendorModal} onDelete={id => {
          const v = vendors.find(x => x.id === id);
          const label = v?.name || "Vendor";
          setDelConfirm({ label, onConfirm: () => deleteRecord('vendors', id, label, setVendors) });
        }} />}

        {/* �"��"��"��"��"��"� INVENTORY �"��"��"��"��"��"� */}
        {tab === "inventory" && <InventoryTracker items={inventory} onUpdateStock={(id, val) => updateRecord('inventory_items', id, { currentStock: val }, 'Stock Level', setInventory)} onAdd={() => setInvModal("new")} onEdit={setInvModal} onDelete={id => {
          const item = inventory.find(x => x.id === id);
          const label = item?.name || "Inventory Item";
          setDelConfirm({ label, onConfirm: () => deleteRecord('inventory_items', id, label, setInventory) });
        }} />}

        {/* �"��"��"��"��"��"� PERMITS �"��"��"��"��"��"� */}
        {tab === "permits" && (
          <>
            <PermitTracker permits={permits} onAdd={() => setPermitModal("new")} onEdit={setPermitModal} onDelete={id => {
              const p = permits.find(x => x.id === id);
              const label = p?.name || "Permit";
              setDelConfirm({ label, onConfirm: () => deleteRecord('permits', id, label, setPermits) });
            }} />
            <UtilityTracker utilities={utilities} onAdd={() => setUtilityModal("new")} onEdit={setUtilityModal} onDelete={id => {
              const u = utilities.find(x => x.id === id);
              const label = u?.name || "Utility Account";
              setDelConfirm({ label, onConfirm: () => deleteRecord('utility_accounts', id, label, setUtilities) });
            }} />
          </>
        )}

        {/* �"��"��"��"��"��"� CALENDAR �"��"��"��"��"��"� */}
        {tab === "calendar" && (
          <FullCalendar
            tasks={tasks}
            marketing={marketing}
            training={training}
            candidates={candidates}
            calendarEvents={calendarEvents}
            onEditTask={setTaskModal}
            onEditMkt={setMktModal}
            onEditTrain={setTrainModal}
            onEditCan={setCanModal}
            onSaveCalendarEvent={saveCalendarEvent}
            onDeleteCalendarEvent={deleteCalendarEvent}
            initialSelectedDate={calendarFocusDate}
          />
        )}

        {/* �"��"��"��"��"��"� MARKETING �"��"��"��"��"��"� */}
        {tab === "marketing" && (
          <>
            <MarketingCalendar posts={marketing} onAdd={() => setMktModal("new")} onEdit={setMktModal} onDelete={id => {
              const p = marketing.find(x => x.id === id);
              const label = p?.title || "Marketing Post";
              setDelConfirm({ label, onConfirm: () => deleteRecord('marketing_posts', id, label, setMarketing) });
            }} />
            {!isUnlocked ? <PinGate onUnlock={() => setIsUnlocked(true)} correctPin={securityPin} /> : (
              <DigitalAssetManager assets={assets} onAdd={() => setAssetModal("new")} onEdit={setAssetModal} onDelete={id => {
                const a = assets.find(x => x.id === id);
                const label = a?.name || "Digital Asset";
                setDelConfirm({ label, onConfirm: () => deleteRecord('digital_assets', id, label, setAssets) });
              }} />
            )}
          </>
        )}

        {/* �"��"��"��"��"��"� TRAINING �"��"��"��"��"��"� */}
        {tab === "training" && <TrainingPortal modules={training} onToggleStep={toggleTrainingStep} onAdd={() => setTrainModal("new")} onEdit={setTrainModal} onDelete={id => {
          const m = training.find(x => x.id === id);
          const label = m?.title || "Training Module";
          setDelConfirm({ label, onConfirm: () => deleteRecord('training_modules', id, label, setTraining) });
        }} />}

        {/* �"��"��"��"��"��"� CHECKLISTS �"��"��"��"��"��"� */}
        {tab === "checklists" && <DailyChecklistManager checklists={checklists} onToggleItem={toggleChecklistItem} onAdd={() => setChkModal("new")} onEdit={setChkModal} onDelete={id => {
          const c = checklists.find(x => x.id === id);
          const label = c?.title || "Checklist";
          setDelConfirm({ label, onConfirm: () => deleteRecord('daily_checklists', id, label, setChecklists) });
        }} />}

        {/* �"��"��"��"��"��"� AI �"��"��"��"��"��"� */}
        {tab==="ai" && <AIAssistant messages={aiMsgs} onSend={sendAi} loading={aiLoad} onSaveToNotes={saveAiToNotes} />}

        {/* �"��"��"��"��"��"� SETTINGS �"��"��"��"��"��"� */}
        {tab === "settings" && (
          !isUnlocked ? <PinGate onUnlock={() => setIsUnlocked(true)} correctPin={securityPin} /> : !canManageAccess ? (
            <div className="fu">
              <SectionHeader title="Settings" subtitle="Locked controls for title and account access" />
              <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, textAlign: "center" }}>
                <p style={{ color: T.muted, fontSize: 13 }}>Only owner and partner accounts can access settings.</p>
              </div>
            </div>
          ) : (
            <div className="fu">
              <SectionHeader title="Settings" subtitle="Locked controls for title and account access" />

              <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 18 }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: .8, marginBottom: 10 }}>APP TITLE</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    style={{ ...inpStyle, flex: 1, fontFamily: /[\u0E00-\u0E7F]/.test(editTitle) ? "var(--font-thai-display)" : "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}
                    placeholder="Restaurant name"
                  />
                  <Btn onClick={async () => {
                    const title = editTitle.trim();
                    if (!title) return;
                    const res = await fetch("/api/settings/title", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ title }),
                    });
                    const body = await res.json();
                    if (body?.ok) {
                      setAppTitle(body.title || title);
                      setSettingsMsg("Title updated.");
                      logActivity(`Updated app title to ${title}`);
                    } else {
                      setSettingsMsg(body?.error || "Failed to update title");
                    }
                  }} variant="primary">Save Title</Btn>
                </div>
              </div>

              <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 18 }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: .8, marginBottom: 12 }}>ACCOUNT SECURITY</div>
                <div style={{ display: "flex", gap: 10, flexDirection: "column" }}>
                  <Btn onClick={() => setIsChangePinOpen(true)} variant="outline" style={{ width: "100%", justifyContent: "flex-start" }}>Change Security PIN</Btn>
                  <Btn onClick={() => setIsChangePasswordOpen(true)} variant="outline" style={{ width: "100%", justifyContent: "flex-start" }}>Change Sign-In Password</Btn>
                </div>
              </div>

              <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: .8 }}>ACCESS CONTROL</div>
                  <Btn onClick={refreshAccessUsers} variant="outline" small>Refresh</Btn>
                </div>

                {!canManageAccess ? (
                  <div style={{ color: T.muted, fontSize: 13 }}>Only owner-level accounts can manage access.</div>
                ) : accessLoading ? (
                  <div style={{ color: T.muted, fontSize: 13 }}>Loading users...</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {accessUsers.map((u) => (
                      <div key={u.id} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{String(u.email || "").toLowerCase() === "yanajaib@gmail.com" ? "Partner" : (u.name || "User")}</div>
                          <div style={{ fontSize: 11, color: T.muted }}>{u.email} ⬢ {u.role} ⬢ {u.is_active ? "Active" : "Revoked"}</div>
                        </div>
                        {u.is_active ? (
                          <Btn onClick={async () => {
                            await fetch("/api/access/revoke", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: u.email, revokedBy: currentUser?.email || "Owner" }),
                            });
                            logActivity(`Revoked access for ${u.email}`);
                            refreshAccessUsers();
                          }} variant="danger" small>Revoke</Btn>
                        ) : (
                          <Btn onClick={async () => {
                            await fetch("/api/access/restore", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email: u.email }),
                            });
                            logActivity(`Restored access for ${u.email}`);
                            refreshAccessUsers();
                          }} variant="outline" small>Restore</Btn>
                        )}
                      </div>
                    ))}
                    {accessUsers.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>No users yet.</div>}
                  </div>
                )}

                {!!settingsMsg && <div style={{ marginTop: 10, fontSize: 12, color: T.blue }}>{settingsMsg}</div>}
              </div>
            </div>
          )
        )}

        {/* �"��"��"��"��"��"� INVOICES �"��"��"��"��"��"� */}
        {tab === "invoices" && (
          <InvoicesSection 
            invoices={invoices} 
            onEdit={setInvoiceModal} 
            onDelete={inv => setDelConfirm({ label: `Invoice from ${inv.vendorName}`, onConfirm: () => deleteRecord('invoices', inv.id, `Invoice ${inv.vendorName}`, setInvoices) })} 
            onAdd={() => setInvoiceModal("new")}
            onImportCSV={importInvoicesFromCSV}
          />
        )}

        {/* �"��"��"��"��"��"� TALENT & HIRING �"��"��"��"��"��"� */}
        {tab === "talent" && (
          !isUnlocked ? <PinGate onUnlock={() => setIsUnlocked(true)} correctPin={securityPin} /> : (
            <div className="fu">
              <TalentHiring 
                positions={positions} 
                candidates={candidates} 
                onAddPos={() => setPosModal("new")}
                onEditPos={setPosModal}
                onDeletePos={(p: any) => setDelConfirm({ label: p.role, onConfirm: () => deleteRecord('positions', p.id, p.role, setPositions) })}
                onAddCan={() => setCanModal("new")}
                onEditCan={setCanModal}
                onDeleteCan={(c: any) => setDelConfirm({ label: c.name, onConfirm: () => deleteRecord('candidates', c.id, c.name, setCandidates) })}
                userRole={currentUser?.role}
              />
            </div>
          )
        )}

        {/* �"��"��"��"��"��"� TEAM MAP �"��"��"��"��"��"� */}
        {tab === "teammap" && (
          !isUnlocked ? <PinGate onUnlock={() => setIsUnlocked(true)} correctPin={securityPin} /> : (
            <div className="fu">
              <TeamMap
                positions={positions}
                candidates={candidates}
                onAddMember={() => setTeamMapModal("new")}
                onEditMember={(member: Candidate) => setTeamMapModal(member)}
                onDeleteMember={(member: Candidate) => setDelConfirm({ label: member.name, onConfirm: () => deleteRecord("candidates", member.id, member.name, setCandidates) })}
              />
            </div>
          )
        )}
      </div>
    </div>

      {/* Quick Add FAB */}
      <div style={{ position: "fixed", bottom: isMobile ? "calc(16px + env(safe-area-inset-bottom, 0px))" : "calc(24px + env(safe-area-inset-bottom, 0px))", right: isMobile ? 16 : 24, zIndex: 100 }}>
        {quickAddOpen && (
          <div style={{ position: "absolute", bottom: 70, right: 0, display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-end" }}>
            <Btn onClick={() => { setTaskModal("new"); setQuickAddOpen(false); }} variant="primary" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>+ New Task</Btn>
            <Btn onClick={() => { setNoteModal("new"); setQuickAddOpen(false); }} variant="outline" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)", background: "#FFF" }}>+ New Note</Btn>
            <Btn onClick={() => { setInvoiceModal("new"); setQuickAddOpen(false); }} variant="outline" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)", background: "#FFF" }}>+ Import Invoice</Btn>
          </div>
        )}
        <button 
          onClick={() => setQuickAddOpen(!quickAddOpen)}
          style={{ 
            width: 56, height: 56, borderRadius: "50%", background: T.gold, color: "#FFF", 
            border: "none", fontSize: 24, cursor: "pointer", boxShadow: "0 8px 24px rgba(200,151,58,0.3)", 
            display: "flex", alignItems: "center", justifyContent: "center", transition: "transform .2s", 
            transform: quickAddOpen ? "rotate(45deg)" : "none" 
          }}
        >
          +
        </button>
      </div>

      {isChangePinOpen && (
        <ChangePinModal 
          currentPin={securityPin} 
          userRole={userRole || undefined}
          userEmail={currentUserEmail}
          onSave={(newPin) => {
            setSecurityPin(newPin);
            localStorage.setItem("app_security_pin", newPin);
            logActivity("Changed security PIN");
          }} 
          onClose={() => setIsChangePinOpen(false)} 
        />
      )}

      {isChangePasswordOpen && (
        <ChangePasswordModal
          userEmail={currentUserEmail}
          onSendCode={async () => {
            const { error } = await insforge.auth.sendResetPasswordEmail({ email: currentUserEmail });
            if (error) throw new Error(error.message || "Failed to send reset code");
          }}
          onConfirm={async (otp: string, newPassword: string) => {
            // Step 1: exchange the 6-digit code for a reset token
            const { data: exchangeData, error: exchangeError } = await insforge.auth.exchangeResetPasswordToken({ email: currentUserEmail, code: otp });
            if (exchangeError || !exchangeData?.token) throw new Error(exchangeError?.message || "Invalid or expired code. Please request a new one.");
            // Step 2: use the reset token to set the new password
            const { error } = await insforge.auth.resetPassword({ otp: exchangeData.token, newPassword });
            if (error) throw new Error(error.message || "Failed to update password. Please try again.");
            setSettingsMsg("�S& Password updated! Please sign in again.");
            logActivity("Changed sign-in password");
            setIsChangePasswordOpen(false);
            setTimeout(() => logout(), 1500);
          }}
          onClose={() => setIsChangePasswordOpen(false)}
        />
      )}
    </>
  )}
</div>
  );
}


