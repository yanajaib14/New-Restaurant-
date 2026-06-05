export const T = {
  bg: "#FFFFFF",
  surface: "#FAFAFA",
  border: "#EBEBEB",
  borderStrong: "#D4D4D4",
  text: "#111111",
  muted: "#555555",
  subtle: "#888888",
  // Monochrome — all "color" roles use dark text on light gray
  gold: "#111111",
  goldLight: "#F6F6F6",
  goldBorder: "#E4E4E4",
  green: "#111111",
  greenLight: "#F6F6F6",
  greenBorder: "#E4E4E4",
  blue: "#111111",
  blueLight: "#F6F6F6",
  blueBorder: "#E4E4E4",
  // Red kept for danger/overdue only
  red: "#C0392B",
  redLight: "#FEF5F5",
  redBorder: "#F5CBCB",
  purple: "#111111",
  purpleLight: "#F6F6F6",
  purpleBorder: "#E4E4E4",
  orange: "#111111",
  orangeLight: "#F6F6F6",
  orangeBorder: "#E4E4E4",
  champagne: "#F5F5F5",
  stone: "#EBEBEB",
};

export const CAT_COLORS: Record<string, any> = {
  "Lease & TI":  { dot: T.blue,   bg: T.blueLight,   border: T.blueBorder,   icon: "🏗️" },
  "Menu & Bar":  { dot: T.blue,   bg: T.blueLight,   border: T.blueBorder,   icon: "🍽️" },
  "Staffing":    { dot: T.green,  bg: T.greenLight,  border: T.greenBorder,  icon: "👥" },
  "Permits":     { dot: T.red,    bg: T.redLight,    border: T.redBorder,    icon: "📋" },
  "Marketing":   { dot: T.blue,   bg: T.blueLight,   border: T.blueBorder,   icon: "📣" },
  "Financials":  { dot: T.green,  bg: T.greenLight,  border: T.greenBorder,  icon: "💰" },
  "Operations":  { dot: T.green,  bg: T.greenLight,  border: T.greenBorder,  icon: "⚙️" },
  "IT & Systems": { dot: T.blue, bg: T.blueLight, border: T.blueBorder, icon: "💻" },
};

export const STATUS_COLORS: Record<string, any> = {
  "Not Started": { bg: "#F5F5F5",   text: "#888",    border: "#E0E0E0" },
  "In Progress":  { bg: T.blueLight, text: T.blue,   border: T.blueBorder },
  "Complete":     { bg: T.greenLight,text: T.green,  border: T.greenBorder },
  "Overdue":      { bg: T.redLight,  text: T.red,    border: T.redBorder },
};

export const PRIORITY_COLORS: Record<string, any> = {
  "Low":      { bg: "#F5F5F5",    text: "#888",   border: "#E0E0E0" },
  "Medium":   { bg: T.blueLight,  text: T.blue,  border: T.blueBorder },
  "High":     { bg: T.greenLight, text: T.green, border: T.greenBorder },
  "Critical": { bg: T.redLight,   text: T.red,   border: T.redBorder },
};

export const NOTE_TAG_COLORS: Record<string, any> = {
  "General":    { bg: "#F5F5F5",    text: "#666",   dot: "#BBB" },
  "Vendor":     { bg: T.blueLight,  text: T.blue,  dot: T.blue },
  "Menu":       { bg: T.blueLight,  text: T.blue,  dot: T.blue },
  "Operations": { bg: T.greenLight, text: T.green, dot: T.green },
  "Finance":    { bg: T.greenLight, text: T.green, dot: T.green },
  "Marketing":  { bg: T.blueLight, text: T.blue, dot: T.blue },
  "Ideas":      { bg: T.blueLight, text: T.blue, dot: T.blue },
};

export const CATEGORIES = ["Lease & TI","Menu & Bar","Staffing","Permits","Marketing","Financials","Operations","IT & Systems"];
export const INV_CATEGORIES = ["One-Time Deco", "Furniture", "China/Glassware", "Operating Supplies"];
export const DEPARTMENTS = ["Kitchen", "Bar", "FOH"];
export const MENU_SECTIONS = ["Small Plates","Shared Plates","Catering","Main Plates","Desserts","Drinks","Wine","Specials"];

export const PHASE_COLORS: Record<string, string> = {
  "Pre-Launch": T.blue,
  "Construction": T.blue,
  "Staffing": T.green,
  "Operations": T.green,
  "Training": T.blue,
  "Launch": T.red,
};

export const WHEN_COLORS: Record<string, any> = {
  "Opening": { dot: T.blue, bg: T.blueLight },
  "During Service": { dot: T.blue, bg: T.blueLight },
  "Closing": { dot: T.red, bg: T.redLight },
};

export interface ChecklistItem {
  id: number;
  text: string;
  done: boolean;
  assignedTo?: string;
}

export interface Task {
  id: number;
  category: string;
  task: string;
  due: string;
  status: string;
  priority: string;
  checklist: ChecklistItem[];
  assignedTo?: string;
  isCritical?: boolean;
  linkedNoteId?: number | null;
}

export interface TodoSubtask {
  id: number;
  text: string;
  done: boolean;
}

export interface TaskTodoItem {
  id: number;
  title: string;
  category: string;
  status: "Not Started" | "In Progress" | "Done" | "On Hold";
  assignedTo?: string;
  linkedTaskId?: number | null;
  linkUrl?: string;
  note?: string;
  subtasks?: TodoSubtask[];
  created_at?: string;
}

export const TODO_STATUSES: TaskTodoItem["status"][] = ["Not Started", "In Progress", "Done", "On Hold"];

export const TODO_STATUS_COLORS: Record<TaskTodoItem["status"], { bg: string; text: string; border: string }> = {
  "Not Started": { bg: T.blueLight, text: T.blue, border: T.blueBorder },
  "In Progress": { bg: T.blueLight, text: T.blue, border: T.blueBorder },
  Done: { bg: T.greenLight, text: T.green, border: T.greenBorder },
  "On Hold": { bg: T.redLight, text: T.red, border: T.redBorder },
};

export interface Ingredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

export interface MenuItem {
  id: number;
  section: string;
  name: string;
  desc: string;
  price: number;
  foodCost: number; // This will now be calculated or kept as a target %
  hero: boolean;
  notes: string;
  imageUrl?: string;
  ingredients: Ingredient[];
  costPerBottle?: number;
  sellPriceBottle?: number;
  sellPriceGlass?: number;
}

export interface StartupCost {
  id: number;
  category: string;
  budgeted: number;
  actual: number;
}

export interface OperatingCost {
  id: number;
  category: string;
  monthly: number;
}

export interface Milestone {
  id: number;
  milestone: string;
  date: string;
  phase: string;
  done: boolean;
  assignedTo?: string;
}

export interface NoteFile {
  id: number;
  name: string;
  size: number;
  type: string;
  url: string;
  isImage: boolean;
}

export interface Note {
  id: number;
  tag: string;
  title: string;
  body: string;
  date: string;
  files: NoteFile[];
  linkedTaskId?: number | null;
}

export interface Vendor {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  category: string;
  deliveryDays: string[];
  notes: string;
}

export interface Contact {
  id: number;
  name: string;
  role: string;
  company: string;
  category: string;
  email: string;
  phone: string;
  notes: string;
}

export type InventoryDepartment = "Kitchen" | "Bar" | "FOH";
export type ProcurementStatus = "Not Ordered" | "Ordered" | "Arrived";
export type InventoryCategory = "One-Time Deco" | "Furniture" | "China/Glassware" | "Operating Supplies";

export interface InventoryItem {
  id: number;
  name: string;
  category: InventoryCategory;
  department: InventoryDepartment;
  procurementStatus: ProcurementStatus;
  vendorId?: number;
  price: number;
  leadTime: string;
  currentStock: number;
  parLevel: number;
  unit: string;
  lastOrdered: string;
  notes?: string;
}

export interface UtilityAccount {
  id: number;
  name: string;
  accountNumber: string;
  loginInfo: string;
  monthlyCost: number;
  startDate: string;
  fileUrl?: string;
}

export interface Permit {
  id: number;
  name: string;
  issuer: string;
  expiryDate: string;
  status: "Active" | "Expiring Soon" | "Expired" | "Pending";
  fileUrl?: string;
}

export interface MarketingPost {
  id: number;
  platform: string;
  title: string;
  date: string;
  status: "Draft" | "Scheduled" | "Posted";
  notes?: string;
}

export interface TrainingModule {
  id: number;
  title: string;
  category: "FOH" | "BOH" | "General";
  completed: boolean;
  videoUrl?: string;
  date?: string; // Added for calendar support
  steps: { id: number; text: string; done: boolean }[];
}

export interface DailyChecklist {
  id: number;
  title: string;
  shift: "AM" | "PM";
  assignedTo?: string; // Checklist owner
  items: { id: number; text: string; done: boolean; assignedTo?: string }[];
}

export interface Invoice {
  id: number;
  vendorName: string;
  paidBy?: string;
  paymentMethod?: "Cash" | "Credit Card" | "Check" | "Other";
  creditCardName?: string;
  checkNumber?: string;
  date: string;
  amount: number;
  category: string;
  status: "Paid" | "Pending" | "Overdue";
  items: { name: string; quantity: number; price: number }[];
  fileUrl?: string;
}

export interface Position {
  id: number;
  role: string;
  openings: number;
  hired: number;
  status: "Urgent" | "Filled" | "Future";
  salary?: string;
  compPlan?: string;
  offerLetterUrl?: string;
}

export interface Candidate {
  id: number;
  name: string;
  position: string;
  resumeUrl?: string;
  stage: "Applied" | "Interviewed" | "Trial Shift" | "Hired" | "Rejected";
  date?: string; // Added for calendar support (interview/trial shift date)
  feedback: string;
  trialScores?: {
    technique: number;
    speed: number;
    vibe: number;
  };
  partnerNotes?: string;
}

export interface ActivityLog {
  id: number;
  user: string;
  action: string;
  timestamp: string;
}

export interface DecisionLog {
  id: number;
  title: string;
  decision: string;
  owner: string;
  date: string;
  impact: "Low" | "Medium" | "High";
  status: "Proposed" | "Decided" | "Revisit";
  nextStep?: string;
}

export type UserRole = "Owner" | "Manager";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
}

export interface DigitalAsset {
  id: number;
  name: string;
  category: string;
  url: string;
  folder?: string;
  assetType?: "Link" | "Photo";
  tags?: string;
  loginInfo?: string;
  notes?: string;
}

export type CalendarEventType = "Event" | "Meeting" | "Deadline" | "Reminder";

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  time?: string;
  type: CalendarEventType;
  notes?: string;
}

export const CALENDAR_EVENT_TYPES: CalendarEventType[] = ["Event", "Meeting", "Deadline", "Reminder"];

export const CALENDAR_EVENT_COLORS: Record<CalendarEventType, { bg: string; text: string; dot: string; border: string }> = {
  "Event":    { bg: "#F1F6FB", text: "#5E7691", dot: "#5E7691", border: "#D3E0ED" },
  "Meeting":  { bg: "#FCF4EE", text: "#D88A63", dot: "#D88A63", border: "#EFD9CC" },
  "Deadline": { bg: "#FAF2F2", text: "#AA6464", dot: "#AA6464", border: "#EBD6D6" },
  "Reminder": { bg: "#F5F1FA", text: "#846FA0", dot: "#846FA0", border: "#DFD4EC" },
};
