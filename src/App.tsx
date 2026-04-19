import { useState, useEffect, useMemo, useRef } from "react";
import { GoogleGenAI } from "@google/genai";
import { 
  T, CAT_COLORS, STATUS_COLORS, PRIORITY_COLORS, NOTE_TAG_COLORS, 
  CATEGORIES, INV_CATEGORIES, DEPARTMENTS, MENU_SECTIONS, Task, 
  MenuItem, StartupCost, OperatingCost, Milestone, Note, Vendor, 
  InventoryItem, Permit, MarketingPost, TrainingModule, DailyChecklist, 
  UtilityAccount, DigitalAsset, User, ActivityLog, UserRole, Invoice, Position, Candidate
} from "./types";
import { Pill, Btn, SectionHeader, PinGate, ChangePinModal, inpStyle, ProgressRing } from "./components/UI";
import { TaskModal, TaskRow } from "./components/TaskBoard";
import { MenuModal } from "./components/MenuPlanner";
import { FinModal } from "./components/Financials";
import { CostCalculator } from "./components/CostCalculator";
import { TeamOnboarding } from "./components/TeamOnboarding";
import { Timeline, TimelineModal } from "./components/Timeline";
import { NoteModal, NoteCard } from "./components/Notes";
import { AIAssistant } from "./components/AI";

import { VendorManager, VendorModal, InventoryTracker, InventoryModal, PermitTracker, PermitModal, UtilityTracker, UtilityModal } from "./components/Operations";
import { MasterInventory } from "./components/MasterInventory";
import { MarketingCalendar, MarketingModal, TrainingPortal, TrainingModal, DailyChecklistManager, ChecklistModal, DigitalAssetManager, DigitalAssetModal } from "./components/MarketingTraining";
import { InvoicesSection, InvoiceModal } from "./components/Invoices";
import { TalentHiring, PositionModal, CandidateModal } from "./components/Team";
import { LaunchWindow, FullCalendar } from "./components/CalendarView";
import { getGoogleAuthUrl, getGoogleDriveStatus, saveToGoogleDrive, fileToBase64 } from "./services/googleDriveService";
import { exportToCSV } from "./lib/exportUtils";

import { LayoutDashboard, CheckSquare, Utensils, ShoppingCart, Package, DollarSign, FileText, Box, Users, ShieldCheck, Megaphone, GraduationCap, ClipboardList, Calculator, UserPlus, Calendar, FileEdit, Sparkles } from "lucide-react";

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
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
  { id:1, category:"Lease & TI", task:"Sign Lease", due:"2026-04-15", status:"Not Started", priority:"High", checklist:[{id:101,text:"Confirm TI allowance amount",done:false},{id:102,text:"Schedule walk-through inspection",done:false},{id:103,text:"Approve final floor layout",done:false},{id:104,text:"Review lease terms with attorney",done:false}] },
  { id:2, category:"Lease & TI", task:"TI Buildout Start", due:"2026-04-25", status:"Not Started", priority:"High", checklist:[{id:201,text:"Hire general contractor",done:false},{id:202,text:"Pull construction permits",done:false},{id:203,text:"Finalize design plans",done:false}] },
  { id:3, category:"Menu & Bar", task:"Finalize Menu", due:"2026-04-20", status:"In Progress", priority:"High", checklist:[{id:301,text:"Test all recipes with kitchen team",done:true},{id:302,text:"Calculate food cost % per item",done:false},{id:303,text:"Order initial ingredients",done:false},{id:304,text:"Design and print menus",done:false}] },
  { id:4, category:"Permits", task:"Liquor License", due:"2026-04-10", status:"Overdue", priority:"Critical", checklist:[{id:601,text:"File state application",done:true},{id:602,text:"Post public notice",done:true},{id:603,text:"Schedule hearing date",done:false},{id:604,text:"Submit supporting documents",done:false}] },
  { id:5, category:"Permits", task:"Health Permit", due:"2026-04-18", status:"In Progress", priority:"High", checklist:[{id:701,text:"Gather required documents",done:true},{id:702,text:"Schedule health inspection",done:false},{id:703,text:"Submit application",done:false}] },
  { id:6, category:"Staffing", task:"Hire FOH & Kitchen Staff", due:"2026-04-25", status:"Not Started", priority:"High", checklist:[{id:501,text:"Post job ads on Indeed",done:false},{id:502,text:"Screen applications",done:false},{id:503,text:"Schedule interviews",done:false}] },
  { id:7, category:"Financials", task:"Finalize Budget", due:"2026-04-20", status:"In Progress", priority:"High", checklist:[{id:901,text:"Record all startup costs",done:true},{id:902,text:"Forecast monthly expenses",done:false},{id:903,text:"Set up accounting software",done:false}] },
  { id:8, category:"Operations", task:"Set Up POS", due:"2026-04-25", status:"Not Started", priority:"High", checklist:[{id:1001,text:"Choose and purchase POS system",done:false},{id:1002,text:"Configure menu in system",done:false},{id:1003,text:"Train staff on POS",done:false}] },
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
  { id:9, milestone:"🎉 Grand Opening", date:"Jun 7", phase:"Launch", done:false },
];

const INIT_NOTES: Note[] = [
  { id:1, tag:"Vendor", title:"Produce Supplier", body:"Green Valley Farms — ask about net-30 terms. Contact: Maria ext. 204", date:"Apr 8", files:[] },
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
  const [tab, setTab] = useState("overview");

  // Data states
  const [tasks, setTasks]       = useState<Task[]>(INIT_TASKS);
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

  // Modal states
  const [taskModal, setTaskModal]   = useState<any>(null); // null | "new" | task obj
  const [menuModal, setMenuModal]   = useState<any>(null);
  const [finModal, setFinModal]     = useState<any>(null); // {type, item|null}
  const [tlModal, setTlModal]       = useState<any>(null);
  const [noteModal, setNoteModal]   = useState<any>(null);
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
  const [assetModal, setAssetModal] = useState<DigitalAsset | "new" | null>(null);
  const [calDate, setCalDate]       = useState<string | null>(null);
  const [invoiceModal, setInvoiceModal] = useState<any>(null);
  const [isMobile, setIsMobile]     = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("app_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [securityPin, setSecurityPin] = useState(() => localStorage.getItem("app_security_pin") || "1234");
  const [activity, setActivity] = useState<ActivityLog[]>(INIT_ACTIVITY);
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);

  const genAI = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }), []);

  const logActivity = (action: string) => {
    const newLog = { id: Date.now(), user: currentUser?.role || "System", action, timestamp: "Just now" };
    setActivity(p => [newLog, ...p.slice(0, 4)]);
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

  const [delConfirm, setDelConfirm] = useState<any>(null); // {label, onConfirm}

  // Filters
  const [catFilter, setCatF]    = useState("All");
  const [statFilter, setStatF]  = useState("All");
  const [menuSecF, setMenuSecF] = useState("All");
  const [shopCatF, setShopCatF] = useState("All");
  const [shopDeptF, setShopDeptF] = useState("All");
  const [noteSearch, setNoteSearch] = useState("");
  const [noteTagF, setNoteTagF] = useState("All");

  // AI
  const [aiMsgs, setAiMsgs] = useState([{ role: "assistant", content: "Welcome! I'm your restaurant launch assistant. Ask me anything — task status, budget, menu, or what needs attention.", suggestions: ["What tasks are due this week?", "Which permits are pending?", "What's over budget?"] }]);
  const [aiLoad, setAiLoad] = useState(false);

  // ── Derived ──
  const completed = tasks.filter(t=>t.status==="Complete").length;
  const overdue   = tasks.filter(t=>t.status==="Overdue").length;
  const criticalOverdue = tasks.filter(t => t.isCritical && t.status === "Overdue").length;
  const prog      = Math.round((completed/tasks.length)*100);
  
  const invoiceStartupTotal = invoices.filter(i => i.category === "Lease & TI").reduce((s, i) => s + Number(i.amount), 0);
  const totBudget = startup.reduce((s,c)=>s+(+c.budgeted),0);
  const totActual = startup.reduce((s,c)=>s+(+c.actual),0) + invoiceStartupTotal;
  
  const invoiceOpTotal = invoices.filter(i => i.category !== "Lease & TI").reduce((s, i) => s + Number(i.amount), 0);
  const totOp     = operating.reduce((s,c)=>s+(+c.monthly),0) + invoiceOpTotal;
  const projRev   = totOp/0.30;

  const totOpenings = positions.reduce((s, p) => s + p.openings, 0);
  const totHired = positions.reduce((s, p) => s + p.hired, 0);
  const staffingProg = totOpenings > 0 ? Math.round((totHired / totOpenings) * 100) : 0;

  // ── Task CRUD ──
  const saveTask = (form: any) => {
    const isNew = !taskModal || taskModal === "new";
    if (form._delete) {
      setTasks(p => p.filter(t => t.id !== form.id));
      logActivity(`Deleted task: ${form.task}`);
    } else if (taskModal && taskModal!=="new") {
      setTasks(p=>p.map(t=>t.id===taskModal.id?{...form,id:taskModal.id}:t));
      logActivity(`Updated task: ${form.task}`);
    } else {
      setTasks(p=>[...p,{...form,id:Date.now()}]);
      logActivity(`Added task: ${form.task}`);
    }
    setTaskModal(null);
    setCalDate(null);
  };

  // ── Menu CRUD ──
  const saveMenu = (form: any) => {
    if (menuModal && menuModal!=="new") {
      setMenuItems(p=>p.map(m=>m.id===menuModal.id?{...form,id:menuModal.id}:m));
      logActivity(`Updated menu item: ${form.name}`);
    } else {
      setMenuItems(p=>[...p,{...form,id:Date.now()}]);
      logActivity(`Added menu item: ${form.name}`);
    }
    setMenuModal(null);
  };

  // ── Financial CRUD ──
  const saveFin = (form: any) => {
    const { type, item } = finModal;
    if (item) {
      if (type==="startup") setStartup(p=>p.map(x=>x.id===item.id?{...form,id:item.id}:x));
      else setOp(p=>p.map(x=>x.id===item.id?{...form,id:item.id}:x));
      logActivity(`Updated financial item: ${form.category}`);
    } else {
      if (type==="startup") setStartup(p=>[...p,{...form,id:Date.now()}]);
      else setOp(p=>[...p,{...form,id:Date.now()}]);
      logActivity(`Added financial item: ${form.category}`);
    }
    setFinModal(null);
  };

  // ── Timeline CRUD ──
  const saveTL = (form: any) => {
    if (tlModal && tlModal!=="new") setTL(p=>p.map(t=>t.id===tlModal.id?{...form,id:tlModal.id}:t));
    else setTL(p=>[...p,{...form,id:Date.now()}]);
    setTlModal(null);
  };

  // ── Notes CRUD ──
  const saveNote = (form: any) => {
    const d = new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"});
    if (noteModal && noteModal!=="new") setNotes(p=>p.map(n=>n.id===noteModal.id?{...form,id:noteModal.id}:n));
    else setNotes(p=>[...p,{...form,id:Date.now(),date:d}]);
    setNoteModal(null);
  };

  const filteredNotes = notes.filter(n => {
    const matchTag  = noteTagF==="All" || n.tag===noteTagF;
    const matchSearch = !noteSearch || n.title.toLowerCase().includes(noteSearch.toLowerCase()) || n.body?.toLowerCase().includes(noteSearch.toLowerCase());
    return matchTag && matchSearch;
  });

  // ── Vendor CRUD ──
  const saveVendor = (form: any) => {
    if (vendorModal && vendorModal !== "new") setVendors(p => p.map(v => v.id === vendorModal.id ? { ...form, id: vendorModal.id } : v));
    else setVendors(p => [...p, { ...form, id: Date.now() }]);
    setVendorModal(null);
  };

  // ── Inventory CRUD ──
  const saveInv = (form: any) => {
    if (invModal && invModal !== "new") setInventory(p => p.map(i => i.id === invModal.id ? { ...form, id: invModal.id } : i));
    else setInventory(p => [...p, { ...form, id: Date.now(), lastOrdered: "Just now" }]);
    setInvModal(null);
  };

  // ── Permit CRUD ──
  const savePermit = (form: any) => {
    if (permitModal && permitModal !== "new") setPermits(p => p.map(x => x.id === permitModal.id ? { ...form, id: permitModal.id } : x));
    else setPermits(p => [...p, { ...form, id: Date.now() }]);
    setPermitModal(null);
  };

  // ── Marketing CRUD ──
  const saveMkt = (form: any) => {
    if (form._delete) {
      setMarketing(p => p.filter(x => x.id !== form.id));
    } else if (mktModal && mktModal !== "new") {
      setMarketing(p => p.map(x => x.id === mktModal.id ? { ...form, id: mktModal.id } : x));
    } else {
      setMarketing(p => [...p, { ...form, id: Date.now() }]);
    }
    setMktModal(null);
  };

  // ── Training CRUD ──
  const saveTrain = (form: any) => {
    if (form._delete) {
      setTraining(p => p.filter(x => x.id !== form.id));
    } else if (trainModal && trainModal !== "new") {
      setTraining(p => p.map(x => x.id === trainModal.id ? { ...form, id: trainModal.id } : x));
    } else {
      setTraining(p => [...p, { ...form, id: Date.now() }]);
    }
    setTrainModal(null);
  };

  const savePos = (form: Position) => {
    if (posModal && posModal !== "new") setPositions(p => p.map(x => x.id === posModal.id ? { ...form, id: posModal.id } : x));
    else setPositions(p => [...p, { ...form, id: Date.now() }]);
    setPosModal(null);
  };

  const saveCan = (form: Candidate & { _delete?: boolean }) => {
    if (form._delete) {
      setCandidates(p => p.filter(x => x.id !== form.id));
      logActivity(`Removed candidate: ${form.name}`);
    } else if (canModal && canModal !== "new") {
      setCandidates(p => p.map(x => x.id === canModal.id ? { ...form, id: canModal.id } : x));
      logActivity(`Updated candidate: ${form.name}`);
    } else {
      setCandidates(p => [...p, { ...form, id: Date.now() }]);
      logActivity(`Added candidate: ${form.name}`);
    }
    setCanModal(null);
  };

  const saveAsset = (form: DigitalAsset & { _delete?: boolean }) => {
    if (form._delete) {
      setAssets(p => p.filter(x => x.id !== form.id));
    } else if (assetModal && assetModal !== "new") {
      setAssets(p => p.map(x => x.id === assetModal.id ? { ...form, id: assetModal.id } : x));
    } else {
      setAssets(p => [...p, { ...form, id: Date.now() }]);
    }
    setAssetModal(null);
  };

  // ── Invoice CRUD ──
  const saveInvoice = (form: any) => {
    if (invoiceModal && invoiceModal !== "new") setInvoices(p => p.map(i => i.id === invoiceModal.id ? { ...form, id: invoiceModal.id } : i));
    else setInvoices(p => [...p, { ...form, id: Date.now() }]);
    setInvoiceModal(null);
  };

  // ── Checklist CRUD ──
  const saveChk = (form: any) => {
    if (chkModal && chkModal !== "new") setChecklists(p => p.map(x => x.id === chkModal.id ? { ...form, id: chkModal.id } : x));
    else setChecklists(p => [...p, { ...form, id: Date.now() }]);
    setChkModal(null);
  };

  // ── AI ──
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

  const sendAi = async (msg: string) => {
    setAiMsgs(p => [...p, { role: "user", content: msg }]);
    setAiLoad(true);

    try {
      const promptContext = `
        You are the AI Restaurant Launch Assistant.
        Current Restaurant: New Restaurant
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

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: msg,
        config: {
          systemInstruction: promptContext
        }
      });

      const response = result.text || "I'm sorry, I couldn't process that request.";
      
      const suggestions: string[] = [];
      const cleanResponse = response.replace(/\[\[(.*?)\]\]/g, (_, q) => {
        if (!suggestions.includes(q)) suggestions.push(q);
        return "";
      }).trim();
      
      setAiMsgs(p => [...p, { role: "assistant", content: cleanResponse, suggestions }]);
    } catch (error) {
      console.error("AI Error:", error);
      setAiMsgs(p => [...p, { role: "assistant", content: "I encountered an error connecting to my core intelligence. Please ensure your API key is configured." }]);
    } finally {
      setAiLoad(false);
    }
  };

  const saveAiToNotes = () => {
    if (aiMsgs.length <= 1) return; // Only welcome message
    const content = aiMsgs.map(m => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n\n");
    const newNote: Note = {
      id: Date.now(),
      tag: "General",
      title: `AI Conversation - ${new Date().toLocaleDateString()}`,
      body: content,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      files: []
    };
    setNotes(p => [newNote, ...p]);
    setTab("notes");
  };

  const [activeGroup, setActiveGroup] = useState("DASHBOARD");

  const TABS = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, group: "DASHBOARD" },
    { id: "ai", label: "AI Assistant", icon: Sparkles, group: "DASHBOARD" },
    
    { id: "calendar", label: "Calendar", icon: Calendar, group: "PLANNING" },
    { id: "timeline", label: "Timeline", icon: Calendar, group: "PLANNING" },
    { id: "tasks", label: "Tasks", icon: CheckSquare, group: "PLANNING" },
    { id: "notes", label: "Notes", icon: FileEdit, group: "PLANNING" },
    
    { id: "menu", label: "Menu & Bar", icon: Utensils, group: "KITCHEN" },
    { id: "shopping", label: "Shopping List", icon: ShoppingCart, group: "KITCHEN" },
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
  ];

  const GROUPS = ["DASHBOARD", "PLANNING", "KITCHEN", "OPERATIONS", "FINANCIALS", "TEAM"];

  // Sync group when tab changes
  useEffect(() => {
    const currentTab = TABS.find(t => t.id === tab);
    if (currentTab && currentTab.group !== activeGroup) {
      setActiveGroup(currentTab.group);
    }
  }, [tab]);

  // ── Shopping List Logic ──
  const aggregatedIngredients = useMemo(() => {
    const map: Record<string, { name: string, quantity: number, unit: string, totalCost: number, items: string[], category: string, department: string }> = {};
    menuItems.forEach(item => {
      (item.ingredients || []).forEach(ing => {
        const key = `${ing.name.toLowerCase()}-${ing.unit.toLowerCase()}`;
        if (!map[key]) {
          // Try to find in inventory to get category/department
          const invItem = inventory.find(i => i.name.toLowerCase() === ing.name.toLowerCase());
          map[key] = { 
            name: ing.name, 
            quantity: 0, 
            unit: ing.unit, 
            totalCost: 0, 
            items: [],
            category: invItem?.category || "Operating Supplies",
            department: invItem?.department || "Kitchen"
          };
        }
        map[key].quantity += ing.quantity;
        map[key].totalCost += ing.cost;
        if (!map[key].items.includes(item.name)) map[key].items.push(item.name);
      });
    });
    return Object.values(map)
      .filter(ing => (shopCatF === "All" || ing.category === shopCatF) && (shopDeptF === "All" || ing.department === shopDeptF))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [menuItems, inventory, shopCatF, shopDeptF]);

  return (
    <div style={{ minHeight:"100vh", background:T.bg, color:T.text, fontFamily:"'DM Sans',sans-serif" }}>
      {/* ── LOGIN SCREEN ── */}
      {!currentUser ? (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #F9F8F6 0%, #E1D9D1 100%)", padding: 20 }}>
          <div style={{ background: "#FFF", padding: "3rem", borderRadius: 24, boxShadow: "0 32px 64px rgba(0,0,0,0.1)", width: "100%", maxWidth: 440, textAlign: "center" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: T.text, marginBottom: 10 }}>New Restaurant</div>
            <p style={{ color: T.muted, fontSize: 14, marginBottom: 40 }}>Select your role to access the launch dashboard</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { name: "Restaurant Owner", role: "Owner" as UserRole, desc: "Full access to financials, team, and assets." },
                { name: "Opening Manager", role: "Manager" as UserRole, desc: "Manage tasks, menu, and candidates. No financials." }
              ].map(r => (
                <button 
                  key={r.role}
                  onClick={() => {
                    const u = { id: r.role.toLowerCase(), name: r.name, role: r.role, pin: "1234" };
                    setCurrentUser(u);
                    localStorage.setItem("app_user", JSON.stringify(u));
                  }}
                  style={{ 
                    textAlign: "left", padding: "1.5rem", borderRadius: 16, border: `1px solid ${T.border}`, 
                    background: "#FFF", cursor: "pointer", transition: "all .2s", display: "flex", flexDirection: "column", gap: 4
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.gold; e.currentTarget.style.background = T.goldLight; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = "#FFF"; }}
                >
                  <span style={{ fontWeight: 700, fontSize: 16, color: T.text }}>{r.name}</span>
                  <span style={{ fontSize: 12, color: T.muted }}>{r.desc}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 40, borderTop: `1px solid ${T.border}`, paddingTop: 24 }}>
              <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: T.subtle, letterSpacing: 1.2 }}>PROTOTYPE V1.2.0</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* ── HEADER ── */}
          <div className="glass" style={{ borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 100 }}>
            {/* Critical Banner */}
            {criticalOverdue > 0 && (
              <div style={{ 
                background: T.red, color: "#FFF", padding: "8px 32px", textAlign: "center", 
                fontSize: 12, fontWeight: 700, letterSpacing: 0.5, animation: "pulse 2s infinite" 
              }}>
                🚨 CRITICAL PATH ALERT: {criticalOverdue} MANDATORY TASKS ARE OVERDUE. LAUNCH DATE AT RISK.
              </div>
            )}
            {/* Row 1: Logo, Search, Stats */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "14px 16px" : "18px 32px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {isMobile && (
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.text, padding: 4 }}
              >
                {isMenuOpen ? "✕" : "☰"}
              </button>
            )}
            <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: T.text, letterSpacing: -0.8 }}>New Restaurant</span>
              {!isMobile && <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 10, color: T.subtle, letterSpacing: 1, fontWeight: 600 }}>LAUNCH DASHBOARD</span>}
            </div>
            
            {/* AI Search Bar */}
            <div style={{ display: "flex", alignItems: "center", background: "#FFF", borderRadius: 24, padding: "4px 16px", border: `1px solid ${T.border}`, width: isMobile ? 160 : 280, height: 36, marginLeft: isMobile ? 8 : 24, boxShadow: "0 2px 12px rgba(0,0,0,0.03)" }}>
              <span style={{ fontSize: 12, marginRight: 8, opacity: 0.7 }}>✦</span>
              <input 
                placeholder="Ask assistant..." 
                style={{ background: "none", border: "none", outline: "none", fontSize: 11, width: "100%", color: T.text, fontFamily: "'Inter', sans-serif" }}
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
          
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {isUnlocked && (
              <button 
                onClick={() => setIsUnlocked(false)}
                title="Lock sensitive data"
                style={{ background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 12, padding: "6px 12px", cursor: "pointer", color: T.gold, display: "flex", alignItems: "center", gap: 6 }}
              >
                <ShieldCheck size={14} />
                <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>LOCK</span>
              </button>
            )}
            <button 
              onClick={() => { setCurrentUser(null); localStorage.removeItem("app_user"); setIsUnlocked(false); }}
              style={{ background: T.stone, border: `1px solid ${T.border}`, borderRadius: 12, padding: "6px 16px", fontSize: 11, fontWeight: 600, color: T.text, cursor: "pointer" }}
            >
              Sign Out ({currentUser?.role})
            </button>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: T.subtle, fontWeight: 500 }}>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
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
                  padding: "16px 0", cursor: "pointer", fontSize: 14, fontFamily: "'Inter', sans-serif",
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
          <div style={{ position:"fixed", inset:0, top:60, background:"#FFF", zIndex:100, padding:20, display:"flex", flexDirection:"column", gap:4, overflowY:"auto" }}>
            {GROUPS.map(group => (
              <div key={group} style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:T.subtle, letterSpacing:1, padding:"0 12px", marginBottom:8 }}>{group}</div>
                {TABS.filter(t => t.group === group).map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => { setTab(t.id); setIsMenuOpen(false); }}
                    style={{ textAlign:"left", background:tab===t.id ? T.goldLight : "none", border:"none", padding:"10px 16px", borderRadius:8, color:tab===t.id ? T.gold : T.text, fontWeight:tab===t.id ? 600 : 400, fontSize:14, width:"100%", display:"flex", alignItems:"center", gap:10 }}
                  >
                    <t.icon size={16} />
                    {t.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

      {/* ── MODALS ── */}
      {taskModal  && <TaskModal task={taskModal==="new"?null:taskModal} initialDate={calDate || undefined} onSave={saveTask} onClose={()=>{setTaskModal(null); setCalDate(null);}}/>}
      {menuModal  && <MenuModal item={menuModal==="new"?null:menuModal} onSave={saveMenu} onClose={()=>setMenuModal(null)}/>}
      {finModal   && <FinModal item={finModal.item||null} type={finModal.type} onSave={saveFin} onClose={()=>setFinModal(null)} userRole={currentUser?.role} />}
      {tlModal    && <TimelineModal item={tlModal==="new"?null:tlModal} onSave={saveTL} onClose={()=>setTlModal(null)}/>}
      {noteModal  && <NoteModal note={noteModal==="new"?null:noteModal} onSave={saveNote} onClose={()=>setNoteModal(null)}/>}
      {invoiceModal && <InvoiceModal invoice={invoiceModal === "new" ? null : invoiceModal} vendors={vendors} onSave={saveInvoice} onClose={() => setInvoiceModal(null)} />}
      {vendorModal && <VendorModal vendor={vendorModal === "new" ? null : vendorModal} onSave={saveVendor} onClose={() => setVendorModal(null)} />}
      {invModal && <InventoryModal item={invModal === "new" ? null : invModal} vendors={vendors} onSave={saveInv} onClose={() => setInvModal(null)} />}
      {permitModal && <PermitModal permit={permitModal === "new" ? null : permitModal} onSave={savePermit} onClose={() => setPermitModal(null)} />}
      {mktModal && <MarketingModal post={mktModal === "new" ? null : mktModal} onSave={saveMkt} onClose={() => setMktModal(null)} />}
      {trainModal && <TrainingModal module={trainModal === "new" ? null : trainModal} onSave={saveTrain} onClose={() => setTrainModal(null)} />}
      {posModal && <PositionModal position={posModal === "new" ? null : posModal} onSave={savePos} onClose={() => setPosModal(null)} userRole={currentUser?.role} />}
      {canModal && <CandidateModal candidate={canModal === "new" ? null : canModal} initialDate={calDate || undefined} positions={positions} onSave={saveCan} onClose={() => { setCanModal(null); setCalDate(null); }} userRole={currentUser?.role} />}
      {assetModal && <DigitalAssetModal asset={assetModal === "new" ? null : assetModal} onSave={saveAsset} onClose={() => setAssetModal(null)} />}
      {utilityModal && <UtilityModal account={utilityModal === "new" ? null : utilityModal} onSave={form => {
        if (utilityModal === "new") setUtilities(p => [...p, { ...form, id: Date.now() }]);
        else setUtilities(p => p.map(x => x.id === (utilityModal as any).id ? form : x));
        setUtilityModal(null);
      }} onClose={() => setUtilityModal(null)} />}
      {chkModal && <ChecklistModal checklist={chkModal === "new" ? null : chkModal} onSave={saveChk} onClose={() => setChkModal(null)} />}
      {delConfirm && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.3)",zIndex:998,display:"flex",alignItems:"center",justifyContent:"center" }} onClick={()=>setDelConfirm(null)}>
          <div style={{ background:"#FFF",borderRadius:14,padding:26,width:340,boxShadow:"0 16px 40px rgba(0,0,0,.12)" }} onClick={e=>e.stopPropagation()}>
            <div style={{ fontFamily:"'Playfair Display',serif",fontSize:17,marginBottom:10 }}>Remove this item?</div>
            <div style={{ fontSize:13,color:T.muted,marginBottom:22 }}><strong style={{color:T.text}}>{delConfirm.label}</strong> will be permanently removed.</div>
            <div style={{ display:"flex",gap:10,justifyContent:"flex-end" }}>
              <Btn onClick={()=>setDelConfirm(null)} variant="ghost">Cancel</Btn>
              <Btn onClick={()=>{delConfirm.onConfirm();setDelConfirm(null);}} variant="danger">Remove</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "28px 32px", maxWidth: 1440, margin: "0 auto", display: "flex", gap: 32 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* ══════ OVERVIEW ══════ */}
        {tab==="overview" && (
          <div className="fu">
            <div style={{ display: "flex", gap: 32 }}>
              <div style={{ flex: 1 }}>
                <SectionHeader title="Launch Overview" subtitle="Track your restaurant's journey from concept to opening day"/>
                {/* Progress */}
                <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, padding: 32, marginBottom: 40, display: "flex", alignItems: "center", gap: 40 }}>
                  <ProgressRing progress={prog} size={160} stroke={10} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.muted, letterSpacing: 1.2, marginBottom: 16, fontWeight: 600 }}>CUMULATIVE LAUNCH STATUS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
                      {["In Progress", "Complete", "Overdue"].map(s => (
                        <div key={s} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: (STATUS_COLORS as any)[s].text }} />
                            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Playfair Display', serif", color: T.text }}>
                              {tasks.filter(t => t.status === s).length}
                            </span>
                          </div>
                          <span style={{ fontSize: 10, color: T.muted, fontFamily: "'Inter', sans-serif", fontWeight: 600, letterSpacing: 0.5 }}>{s.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 24, height: 8, background: T.bg, borderRadius: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${prog}%`, background: T.gold, borderRadius: 10, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                    </div>
                  </div>
                </div>

                {/* Launch Window Calendar */}
                <LaunchWindow tasks={tasks} permits={permits} candidates={candidates} />

                {/* To-Do Overview */}
                <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, padding: 32, marginTop: 40 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.muted, letterSpacing: 1.2, fontWeight: 600 }}>PRIORITY FOCUS</span>
                    <Btn onClick={() => setTab("tasks")} variant="ghost" small>Full Board →</Btn>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                    {tasks.filter(t => t.status !== "Complete").slice(0, 4).map(t => (
                      <div key={t.id} 
                        className="todo-card"
                        style={{ display: "flex", alignItems: "center", gap: 16, padding: 16, border: `1px solid ${T.border}`, borderRadius: 16, transition: "all .2s ease", cursor: "pointer" }}
                        onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.06)"; e.currentTarget.style.borderColor = T.goldBorder; }}
                        onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.borderColor = T.border; }}
                      >
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: (PRIORITY_COLORS as any)[t.priority].text }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 2 }}>{t.task}</div>
                          <div style={{ fontSize: 11, color: T.muted, fontFamily: "'Inter', sans-serif" }}>Due {t.due} • {t.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Category breakdown + alerts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 40 }}>
                  <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, padding: 32 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.muted, letterSpacing: 1.2, marginBottom: 24, fontWeight: 600 }}>DEPARTMENTAL SYNC</div>
                    {CATEGORIES.map(cat => {
                      const cc = CAT_COLORS[cat]; const ct = tasks.filter(t => t.category === cat);
                      const d = ct.filter(t => t.status === "Complete").length; const p = ct.length ? Math.round((d / ct.length) * 100) : 0;
                      return (
                        <div key={cat} style={{ marginBottom: 16 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ fontSize: 13, color: T.text, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: cc.dot }} />
                              {cat}
                            </span>
                            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.muted }}>{d}/{ct.length}</span>
                          </div>
                          <div style={{ height: 6, background: T.bg, borderRadius: 10 }}>
                            <div style={{ height: "100%", width: `${p}%`, background: cc.dot, borderRadius: 10, transition: "width .5s ease" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, padding: 32 }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.muted, letterSpacing: 1.2, marginBottom: 24, fontWeight: 600 }}>SYSTEM ALERTS</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {tasks.filter(t => t.status === "Overdue" || t.priority === "Critical").slice(0, 3).map(t => (
                        <div key={`alert-${t.id}`} style={{ background: T.redLight, border: `1px solid ${T.redBorder}`, borderRadius: 16, padding: "12px 16px" }}>
                          <div style={{ fontSize: 13, color: T.red, fontWeight: 700 }}>{t.task}</div>
                          <div style={{ fontSize: 11, color: "#8A4A4A", marginTop: 4, opacity: 0.8 }}>{t.category} · Due {t.due}</div>
                        </div>
                      ))}
                      <button onClick={() => setTab("ai")} style={{ width: "100%", marginTop: 12, background: T.goldLight, border: `1px solid ${T.goldBorder}`, borderRadius: 12, padding: "12px", color: T.gold, cursor: "pointer", fontSize: 12, fontFamily: "'Inter',sans-serif", fontWeight: 700, transition: "all .2s" }}>✨ Ask Assistant for Remediation →</button>
                    </div>
                  </div>
                </div>
          </div>

          <div style={{ width: 320, flexShrink: 0 }}>
            {/* Activity Feed */}
            <div style={{ background:"#FFF", border:`1px solid ${T.border}`, borderRadius:12, padding:20, marginBottom:18 }}>
              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.muted, letterSpacing:.8, marginBottom:18, display: "flex", justifyContent: "space-between" }}>
                <span>RECENT ACTIVITY</span>
                <span style={{ color: T.gold }}>LIVE</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {activity.map(a => (
                  <div key={a.id} style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.user === "Owner" ? T.gold : T.border, marginTop: 4 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{a.action}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: T.muted }}>{a.user}</span>
                        <span style={{ fontSize: 10, color: T.subtle }}>{a.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cloud Status */}
            <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: T.muted, letterSpacing: 1.2, marginBottom: 18, fontWeight: 700 }}>CLOUD SYNC ARCHITECTURE</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: isDriveConnected ? T.greenLight : T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Package size={20} color={isDriveConnected ? T.green : T.muted} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Google Drive</div>
                  <div style={{ fontSize: 11, color: isDriveConnected ? T.green : T.red }}>
                    {isDriveConnected ? "Connected & Syncing" : "Cloud Sync Disabled"}
                  </div>
                </div>
                {!isDriveConnected && (
                  <button onClick={handleGoogleConnect} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 11, cursor: "pointer" }}>Fix</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

        {/* ══════ TASKS ══════ */}
        {tab==="tasks" && (
          <div className="fu">
            <SectionHeader title="Task Boards" subtitle={`${tasks.length} tasks · Click ▶ to expand subtask checklist`}
              action={
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn onClick={() => exportToCSV(tasks, 'Restaurant_Launch_Tasks', [
                    { key: 'task', label: 'Task Name' },
                    { key: 'category', label: 'Department' },
                    { key: 'due', label: 'Due Date' },
                    { key: 'status', label: 'Status' },
                    { key: 'priority', label: 'Priority' },
                    { key: 'checklist', label: 'Checklist Details' }
                  ])} variant="outline" small>📥 Export CSV</Btn>
                  <Btn onClick={()=>setTaskModal("new")} variant="primary">+ New Task</Btn>
                </div>
              }/>
            {/* Filters */}
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
              {["All",...CATEGORIES].map(c=>(
                <button key={c} onClick={()=>setCatF(c)}
                  style={{ cursor:"pointer", borderRadius:24, padding:"6px 16px", fontSize:11, fontFamily:"'Inter', sans-serif", border:`1px solid ${catFilter===c?(CAT_COLORS[c]?.dot||T.gold):T.border}`, background:catFilter===c?(CAT_COLORS[c]?.bg||T.goldLight):"#FFF", color:catFilter===c?(CAT_COLORS[c]?.dot||T.gold):T.muted, fontWeight:catFilter===c?700:500 }}>
                  {c==="All"?"All Categories":c}
                </button>
              ))}
              <div style={{ width:1, height:20, background:T.border, margin:"0 4px" }}/>
              {["All","Not Started","In Progress","Complete","Overdue"].map(s=>(
                <button key={s} onClick={()=>setStatF(s)}
                  style={{ cursor:"pointer", borderRadius:24, padding:"6px 16px", fontSize:11, fontFamily:"'Inter', sans-serif", border:`1px solid ${statFilter===s?((STATUS_COLORS as any)[s]?.border||T.borderStrong):T.border}`, background:statFilter===s?((STATUS_COLORS as any)[s]?.bg||"#F5F5F5"):"#FFF", color:statFilter===s?((STATUS_COLORS as any)[s]?.text||T.text):T.muted, fontWeight:statFilter===s?700:500 }}>
                  {s==="All"?"All Status":s}
                </button>
              ))}
            </div>
            {/* Table */}
            <div style={{ background:"#FFF", border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"28px 1fr 120px 140px 100px 90px 70px", padding:"10px 18px", background:T.bg, borderBottom:`1px solid ${T.border}` }}>
                {["","TASK / PROGRESS","DUE","STATUS","OWNER","PRIORITY",""].map((h,i)=>(
                  <div key={i} style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.subtle, letterSpacing:.8 }}>{h}</div>
                ))}
              </div>
              {tasks.filter(t=>(catFilter==="All"||t.category===catFilter)&&(statFilter==="All"||t.status===statFilter)).length===0
                ? <div style={{ padding:36, textAlign:"center", color:T.muted, fontSize:13 }}>No tasks match these filters. <button onClick={()=>setTaskModal("new")} style={{ marginLeft:8, background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"5px 12px", cursor:"pointer", color:T.gold, fontSize:12 }}>+ Add Task</button></div>
                : tasks.filter(t=>(catFilter==="All"||t.category===catFilter)&&(statFilter==="All"||t.status===statFilter)).map(t=>(
                  <TaskRow key={t.id} task={t} onEdit={setTaskModal}
                    onDelete={t=>setDelConfirm({label:t.task,onConfirm:()=>setTasks(p=>p.filter(x=>x.id!==t.id))})}
                    onStatusChange={(id,s)=>setTasks(p=>p.map(x=>x.id===id?{...x,status:s}:x))}
                    onToggleCheck={(tid,cid)=>setTasks(p=>p.map(x=>x.id===tid?{...x,checklist:x.checklist.map(c=>c.id===cid?{...c,done:!c.done}:c)}:x))}/>
                ))}
            </div>
          </div>
        )}

        {/* ══════ MENU & BAR ══════ */}
        {tab==="menu" && (
          <div className="fu">
            <SectionHeader title="Menu & Bar Planner" subtitle="Track items, costs, and hero dishes"
              action={<Btn onClick={()=>setMenuModal("new")} variant="primary">+ Add Item</Btn>}/>
            {/* Section filter */}
            <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
              {["All",...MENU_SECTIONS].map(s=>(
                <button key={s} onClick={()=>setMenuSecF(s)}
                  style={{ cursor:"pointer", borderRadius:24, padding:"6px 16px", fontSize:11, fontFamily:"'Inter', sans-serif", border:`1px solid ${menuSecF===s?T.gold:T.border}`, background:menuSecF===s?T.goldLight:"#FFF", color:menuSecF===s?T.gold:T.muted, fontWeight:menuSecF===s?700:500 }}>
                  {s}
                </button>
              ))}
            </div>
            <div style={{ background:"#FFF", border:`1px solid ${T.border}`, borderRadius:12, overflow:"hidden" }}>
              <div style={{ display:"grid", gridTemplateColumns:"110px 44px 1fr 1.8fr 70px 80px 52px 1fr 70px", padding:"10px 18px", background:T.bg, borderBottom:`1px solid ${T.border}` }}>
                {["SECTION","","NAME","DESCRIPTION","PRICE / B&G","COST %","HERO","NOTES",""].map((h,i)=>(
                  <div key={i} style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:T.subtle, letterSpacing:.8 }}>{h}</div>
                ))}
              </div>
              {menuItems.filter(m=>menuSecF==="All"||m.section===menuSecF).map((item,i)=>(
                <div key={item.id} style={{ display:"grid", gridTemplateColumns:"110px 44px 1fr 1.8fr 70px 80px 52px 1fr 70px", padding:"13px 18px", borderBottom:`1px solid ${T.border}`, background:i%2===0?"#FFF":T.bg, alignItems:"center" }}>
                  <div style={{ fontSize:10, color:T.muted, fontFamily:"'DM Mono',monospace" }}>{item.section}</div>
                  <div style={{ width:32, height:32, borderRadius:6, background:T.bg, border:`1px solid ${T.border}`, overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} style={{ width:"100%", height:"100%", objectFit:"cover" }} /> : <span style={{ fontSize:12 }}>🍽️</span>}
                  </div>
                  <div style={{ fontSize:13, fontFamily:"'Playfair Display',serif", fontWeight:600, color:T.text }}>{item.name}</div>
                  <div style={{ fontSize:11, color:T.muted, fontStyle:"italic" }}>{item.desc}</div>
                  <div style={{ fontSize:13, fontFamily:"'DM Mono',monospace", color:T.green, fontWeight:600 }}>
                    {item.section === "Wine" ? (
                      <div style={{ lineHeight: 1.2 }}>
                        <div style={{ fontSize:10, color:T.muted }}>B: ${item.sellPriceBottle}</div>
                        <div style={{ fontSize:10, color:T.muted }}>G: ${item.sellPriceGlass}</div>
                      </div>
                    ) : `$${item.price}`}
                  </div>
                  <div><span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", fontWeight:600, color:item.foodCost>30?T.red:T.green, background:item.foodCost>30?T.redLight:T.greenLight, padding:"2px 8px", borderRadius:4 }}>{item.foodCost}%</span></div>
                  <div style={{ textAlign:"center", fontSize:14 }}>{item.hero?"⭐":"—"}</div>
                  <div style={{ fontSize:11, color:T.muted }}>{item.notes||"—"}</div>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>setMenuModal(item)} style={{ background:"none",border:`1px solid ${T.border}`,borderRadius:6,padding:"3px 7px",color:T.muted,cursor:"pointer",fontSize:11 }}>✎</button>
                    <button onClick={()=>setDelConfirm({label:item.name,onConfirm:()=>setMenuItems(p=>p.filter(x=>x.id!==item.id))})} style={{ background:"none",border:`1px solid ${T.redBorder}`,borderRadius:6,padding:"3px 7px",color:T.red,cursor:"pointer",fontSize:11 }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════ SHOPPING LIST ══════ */}
        {tab === "shopping" && (
          <div className="fu">
            <SectionHeader title="Consolidated Shopping List" subtitle="All ingredients required for your current menu items"
              action={<Btn onClick={() => window.print()} variant="outline">🖨️ Print List</Btn>} />
            
            {/* Filters */}
            <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 18 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: T.muted, width: 100 }}>CATEGORY:</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["All", ...INV_CATEGORIES].map(cat => (
                      <button key={cat} onClick={() => setShopCatF(cat)}
                        style={{ cursor: "pointer", borderRadius: 20, padding: "4px 12px", fontSize: 11, border: `1px solid ${shopCatF === cat ? T.gold : T.border}`, background: shopCatF === cat ? T.goldLight : "#FFF", color: shopCatF === cat ? T.gold : T.muted, fontWeight: shopCatF === cat ? 600 : 400 }}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: T.muted, width: 100 }}>DEPARTMENT:</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["All", ...DEPARTMENTS].map(dept => (
                      <button key={dept} onClick={() => setShopDeptF(dept)}
                        style={{ cursor: "pointer", borderRadius: 20, padding: "4px 12px", fontSize: 11, border: `1px solid ${shopDeptF === dept ? T.blue : T.border}`, background: shopDeptF === dept ? T.blueLight : "#FFF", color: shopDeptF === dept ? T.blue : T.muted, fontWeight: shopDeptF === dept ? 600 : 400 }}>
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "#FFF", border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 120px 120px 2fr", padding: "10px 18px", background: T.bg, borderBottom: `1px solid ${T.border}` }}>
                {["INGREDIENT", "CATEGORY", "DEPT", "TOTAL QTY", "TOTAL COST", "USED IN DISHES"].map(h => (
                  <div key={h} style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.subtle, letterSpacing: .8 }}>{h}</div>
                ))}
              </div>
              {aggregatedIngredients.length === 0 ? (
                <div style={{ padding: 40, textAlign: "center", color: T.muted }}>No ingredients found matching filters.</div>
              ) : (
                aggregatedIngredients.map((ing, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 120px 120px 2fr", padding: "14px 18px", borderBottom: `1px solid ${T.border}`, alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{ing.name}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{ing.category}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{ing.department}</div>
                    <div style={{ fontSize: 13, fontFamily: "'DM Mono',monospace", color: T.text }}>{ing.quantity} {ing.unit}</div>
                    <div style={{ fontSize: 13, fontFamily: "'DM Mono',monospace", color: T.green, fontWeight: 600 }}>${ing.totalCost.toFixed(2)}</div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {ing.items.map(dish => (
                        <span key={dish} style={{ fontSize: 10, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 4, padding: "2px 6px", color: T.muted }}>{dish}</span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "master-inventory" && (
          <MasterInventory 
            items={inventory} 
            vendors={vendors} 
            onEdit={setInvModal} 
            onDelete={id => setDelConfirm({ label: "Inventory Item", onConfirm: () => setInventory(p => p.filter(x => x.id !== id)) })}
            onAdd={() => setInvModal("new")}
          />
        )}

        {/* ══════ FINANCIALS ══════ */}
        {tab==="financials" && (
          !isUnlocked ? <PinGate onUnlock={() => setIsUnlocked(true)} correctPin={securityPin} /> : (
          <div className="fu">
            <SectionHeader 
              title="Financial Tracker" 
              subtitle="Startup costs, operating expenses & break-even"
              action={
                <div style={{ display: "flex", gap: 10 }}>
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
                  }} variant="outline" small>📥 Export CSV</Btn>
                  <Btn onClick={() => setIsChangePinOpen(true)} variant="outline" small>Change PIN</Btn>
                </div>
              }
            />
            
            {/* Financial KPIs */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:18 }}>
              {[
                {label:"Startup Budget",value:`$${(totBudget/1000).toFixed(0)}K`,sub:`Actual $${(totActual/1000).toFixed(0)}K`,color:totActual>totBudget?T.red:T.green,dot:totActual>totBudget?T.redLight:T.greenLight},
                {label:"Break-Even / Mo",value:`$${(totOp/1000).toFixed(1)}K`,sub:"Monthly operating costs",color:T.gold,dot:T.goldLight},
                {label:"Proj. Revenue / Mo",value:`$${(projRev/1000).toFixed(0)}K`,sub:"At 30% food cost",color:T.blue,dot:T.blueLight},
              ].map(k=>(
                <div key={k.label} style={{ background:"#FFF", border:`1px solid ${T.border}`, borderRadius:12, padding:20 }}>
                  <div style={{ fontSize:11, color:T.muted, fontFamily:"'DM Mono',monospace", marginBottom:8, letterSpacing:.5 }}>{k.label.toUpperCase()}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:k.color }}>{k.value}</div>
                  <div style={{ fontSize:11, color:T.muted, marginTop:4 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
              {/* Startup Costs */}
              <div style={{ background:"#FFF", border:`1px solid ${T.border}`, borderRadius:12, padding:22 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.muted, letterSpacing:.8 }}>STARTUP COSTS</span>
                  <Btn onClick={()=>setFinModal({type:"startup",item:null})} variant="outline" small>+ Add</Btn>
                </div>
                {startup.map(c=>{
                  const diff=Number(c.actual)-Number(c.budgeted);
                  return (
                    <div key={c.id} style={{ marginBottom:14 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, alignItems:"center" }}>
                        <span style={{ fontSize:12, color:T.text }}>{c.category}</span>
                        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                          <span style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:T.muted }}>${Number(c.budgeted).toLocaleString()}</span>
                          <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", fontWeight:600, color:diff>0?T.red:T.green }}>${Number(c.actual).toLocaleString()} {diff>0?"▲":"▼"}</span>
                          <button onClick={()=>setFinModal({type:"startup",item:c})} style={{ background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11,padding:"0 2px" }}>✎</button>
                          <button onClick={()=>setDelConfirm({label:c.category,onConfirm:()=>setStartup(p=>p.filter(x=>x.id!==c.id))})} style={{ background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:11,padding:"0 2px" }}>✕</button>
                        </div>
                      </div>
                      <div style={{ height:4, background:T.border, borderRadius:2 }}>
                        <div style={{ height:"100%", width:`${Math.min((Number(c.actual)/Number(c.budgeted))*100,100)}%`, background:diff>0?T.red:T.green, borderRadius:2 }}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div>
                <div style={{ background:"#FFF", border:`1px solid ${T.border}`, borderRadius:12, padding:22, marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:T.muted, letterSpacing:.8 }}>MONTHLY OPERATING COSTS</span>
                    <Btn onClick={()=>setFinModal({type:"operating",item:null})} variant="outline" small>+ Add</Btn>
                  </div>
                  {operatingCostsWithUtilities.map(c=>(
                    <div key={c.id} style={{ display:"flex", justifyContent:"space-between", padding:"7px 0", borderBottom:`1px solid ${T.border}`, alignItems:"center" }}>
                      <div>
                        <span style={{ fontSize:12, color:T.text }}>{c.category}</span>
                        {c.category === "Utilities" && (
                          <div style={{ fontSize:9, color:T.blue, marginTop:2 }}>Calculated from active Service Accounts</div>
                        )}
                      </div>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:T.muted }}>${Number(c.monthly).toLocaleString()}</span>
                        <button onClick={()=>setFinModal({type:"operating",item:c})} style={{ background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:11 }}>✎</button>
                        <button onClick={()=>setDelConfirm({label:c.category,onConfirm:()=>setOp(p=>p.filter(x=>x.id!==c.id))})} style={{ background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:11 }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          )
        )}

        {/* ══════ COST CALCULATOR ══════ */}
        {tab==="costcalc" && <CostCalculator menuItems={menuItems} />}

        {/* ══════ TEAM ONBOARDING ══════ */}
        {tab==="onboarding" && <TeamOnboarding />}

        {/* ══════ TIMELINE ══════ */}
        {tab==="timeline" && <Timeline timeline={timeline} onToggle={id=>setTL(t=>t.map(x=>x.id===id?{...x,done:!x.done}:x))} onEdit={setTlModal} onDelete={m=>setDelConfirm({label:m.milestone,onConfirm:()=>setTL(p=>p.filter(x=>x.id!==m.id))})} onAdd={()=>setTlModal("new")} />}

        {/* ══════ NOTES ══════ */}
        {tab==="notes" && (
          <div className="fu">
            <SectionHeader title="Notes & Ideas" subtitle="Capture ideas, vendor contacts, recipes, and attach files"
              action={
                <div style={{ display: "flex", gap: 10 }}>
                  {!isDriveConnected && (
                    <Btn onClick={handleGoogleConnect} variant="outline" small>
                      <span style={{ color: T.blue }}>▲</span> Connect Drive
                    </Btn>
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
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>🔍</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {["All", ...Object.keys(NOTE_TAG_COLORS)].map(tag => (
                  <button key={tag} onClick={() => setNoteTagF(tag)}
                    style={{ cursor: "pointer", borderRadius: 20, padding: "6px 14px", fontSize: 12, fontFamily: "'DM Sans',sans-serif", border: `1px solid ${noteTagF === tag ? T.gold : T.border}`, background: noteTagF === tag ? T.goldLight : "#FFF", color: noteTagF === tag ? T.gold : T.muted, fontWeight: noteTagF === tag ? 600 : 400 }}>
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
                    onEdit={setNoteModal} 
                    onDelete={id=>setDelConfirm({label:n.title,onConfirm:()=>setNotes(p=>p.filter(x=>x.id!==id))})}
                    isDriveConnected={isDriveConnected}
                    onSaveToDrive={handleSaveToDrive}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* ══════ VENDORS ══════ */}
        {tab === "vendors" && <VendorManager vendors={vendors} onAdd={() => setVendorModal("new")} onEdit={setVendorModal} onDelete={id => setDelConfirm({ label: "Vendor", onConfirm: () => setVendors(p => p.filter(x => x.id !== id)) })} />}

        {/* ══════ INVENTORY ══════ */}
        {tab === "inventory" && <InventoryTracker items={inventory} onUpdateStock={(id, val) => setInventory(p => p.map(x => x.id === id ? { ...x, currentStock: val } : x))} onAdd={() => setInvModal("new")} onEdit={setInvModal} onDelete={id => setDelConfirm({ label: "Inventory Item", onConfirm: () => setInventory(p => p.filter(x => x.id !== id)) })} />}

        {/* ══════ PERMITS ══════ */}
        {tab === "permits" && (
          <>
            <PermitTracker permits={permits} onAdd={() => setPermitModal("new")} onEdit={setPermitModal} onDelete={id => setDelConfirm({ label: "Permit", onConfirm: () => setPermits(p => p.filter(x => x.id !== id)) })} />
            <UtilityTracker utilities={utilities} onAdd={() => setUtilityModal("new")} onEdit={setUtilityModal} onDelete={id => setDelConfirm({ label: "Utility Account", onConfirm: () => setUtilities(p => p.filter(x => x.id !== id)) })} />
          </>
        )}

        {/* ══════ CALENDAR ══════ */}
        {tab === "calendar" && (
          <FullCalendar 
            tasks={tasks} 
            marketing={marketing} 
            training={training} 
            candidates={candidates} 
            onEditTask={setTaskModal}
            onEditMkt={setMktModal}
            onEditTrain={setTrainModal}
            onEditCan={setCanModal}
            onAddEvent={(d) => { setCalDate(d); setTaskModal("new"); }}
          />
        )}

        {/* ══════ MARKETING ══════ */}
        {tab === "marketing" && (
          <>
            <MarketingCalendar posts={marketing} onAdd={() => setMktModal("new")} onEdit={setMktModal} onDelete={id => setDelConfirm({ label: "Marketing Post", onConfirm: () => setMarketing(p => p.filter(x => x.id !== id)) })} />
            {!isUnlocked ? <PinGate onUnlock={() => setIsUnlocked(true)} correctPin={securityPin} /> : (
              <DigitalAssetManager assets={assets} onAdd={() => setAssetModal("new")} onEdit={setAssetModal} onDelete={id => setDelConfirm({ label: "Digital Account", onConfirm: () => setAssets(p => p.filter(x => x.id !== id)) })} />
            )}
          </>
        )}

        {/* ══════ TRAINING ══════ */}
        {tab === "training" && <TrainingPortal modules={training} onToggleStep={(mid, sid) => setTraining(p => p.map(m => m.id === mid ? { ...m, steps: m.steps.map(s => s.id === sid ? { ...s, done: !s.done } : s) } : m))} onAdd={() => setTrainModal("new")} onEdit={setTrainModal} onDelete={id => setDelConfirm({ label: "Training Module", onConfirm: () => setTraining(p => p.filter(x => x.id !== id)) })} />}

        {/* ══════ CHECKLISTS ══════ */}
        {tab === "checklists" && <DailyChecklistManager checklists={checklists} onToggleItem={(cid, iid) => setChecklists(p => p.map(c => c.id === cid ? { ...c, items: c.items.map(i => i.id === iid ? { ...i, done: !i.done } : i) } : c))} onAdd={() => setChkModal("new")} onEdit={setChkModal} onDelete={id => setDelConfirm({ label: "Checklist", onConfirm: () => setChecklists(p => p.filter(x => x.id !== id)) })} />}

        {/* ══════ AI ══════ */}
        {tab==="ai" && <AIAssistant messages={aiMsgs} onSend={sendAi} loading={aiLoad} onSaveToNotes={saveAiToNotes} />}

        {/* ══════ INVOICES ══════ */}
        {tab === "invoices" && (
          <InvoicesSection 
            invoices={invoices} 
            onEdit={setInvoiceModal} 
            onDelete={inv => setDelConfirm({ label: `Invoice from ${inv.vendorName}`, onConfirm: () => setInvoices(p => p.filter(x => x.id !== inv.id)) })} 
            onAdd={() => setInvoiceModal("new")} 
          />
        )}

        {/* ══════ TALENT & HIRING ══════ */}
        {tab === "talent" && (
          !isUnlocked ? <PinGate onUnlock={() => setIsUnlocked(true)} correctPin={securityPin} /> : (
            <div className="fu">
              <TalentHiring 
                positions={positions} 
                candidates={candidates} 
                onAddPos={() => setPosModal("new")}
                onEditPos={setPosModal}
                onDeletePos={(id: number) => setDelConfirm({ label: "This position", onConfirm: () => setPositions(p => p.filter(x => x.id !== id)) })}
                onAddCan={() => setCanModal("new")}
                onEditCan={setCanModal}
                onDeleteCan={(id: number) => setCandidates(p => p.filter(x => x.id !== id))}
                userRole={currentUser?.role}
              />
            </div>
          )
        )}
      </div>
    </div>

      {/* Quick Add FAB */}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 100 }}>
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
          onSave={(newPin) => {
            setSecurityPin(newPin);
            localStorage.setItem("app_security_pin", newPin);
          }} 
          onClose={() => setIsChangePinOpen(false)} 
        />
      )}
    </>
  )}
</div>
  );
}
