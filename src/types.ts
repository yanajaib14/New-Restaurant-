export const T = {
  bg: "#F7F7F3", // Warm Oat (minimal neutral)
  surface: "#FFFFFF",
  border: "#E3E3DE",
  borderStrong: "#D2D2CC",
  text: "#172125", // Deeper Forest
  muted: "#3D484C",
  subtle: "#5C686D",
  gold: "#D88A63", // Brighter terracotta accent
  goldLight: "#FCF4EE",
  goldBorder: "#EFD9CC",
  green: "#6C876F",
  greenLight: "#F1F8F2",
  greenBorder: "#D3E4D5",
  blue: "#5E7691",
  blueLight: "#F1F6FB",
  blueBorder: "#D3E0ED",
  red: "#AA6464",
  redLight: "#FAF2F2",
  redBorder: "#EBD6D6",
  purple: "#846FA0",
  purpleLight: "#F5F1FA",
  purpleBorder: "#DFD4EC",
  orange: "#AA845F",
  orangeLight: "#FAF5F1",
  orangeBorder: "#E9DDCF",
  champagne: "#ECE8E0",
  stone: "#DDD7CF",
};

export const CAT_COLORS: Record<string, any> = {
  "Lease & TI":  { dot: T.blue,   bg: T.blueLight,   border: T.blueBorder,   icon: "🏗️" },
  "Menu & Bar":  { dot: T.gold,   bg: T.goldLight,   border: T.goldBorder,   icon: "🍽️" },
  "Staffing":    { dot: T.green,  bg: T.greenLight,  border: T.greenBorder,  icon: "👥" },
  "Permits":     { dot: T.red,    bg: T.redLight,    border: T.redBorder,    icon: "📋" },
  "Marketing":   { dot: T.purple, bg: T.purpleLight, border: T.purpleBorder, icon: "📣" },
  "Financials":  { dot: T.green,  bg: T.greenLight,  border: T.greenBorder,  icon: "💰" },
  "Operations":  { dot: T.orange, bg: T.orangeLight, border: T.orangeBorder, icon: "⚙️" },
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
  "High":     { bg: T.goldLight,  text: T.gold,  border: T.goldBorder },
  "Critical": { bg: T.redLight,   text: T.red,   border: T.redBorder },
};

export const NOTE_TAG_COLORS: Record<string, any> = {
  "General":    { bg: "#F5F5F5",    text: "#666",   dot: "#BBB" },
  "Vendor":     { bg: T.blueLight,  text: T.blue,  dot: T.blue },
  "Menu":       { bg: T.goldLight,  text: T.gold,  dot: T.gold },
  "Operations": { bg: T.orangeLight,text: T.orange,dot: T.orange },
  "Finance":    { bg: T.greenLight, text: T.green, dot: T.green },
  "Marketing":  { bg: T.purpleLight,text: T.purple,dot: T.purple },
  "Ideas":      { bg: "#EEF7F7", text: "#2E7C7C", dot: "#2E7C7C" },
};

export const CATEGORIES = ["Lease & TI","Menu & Bar","Staffing","Permits","Marketing","Financials","Operations","IT & Systems"];
export const INV_CATEGORIES = ["One-Time Deco", "Furniture", "China/Glassware", "Operating Supplies"];
export const DEPARTMENTS = ["Kitchen", "Bar", "FOH"];
export const MENU_SECTIONS = ["Small Plates","Shared Plates","Catering","Main Plates","Desserts","Drinks","Wine","Specials"];

export const PHASE_COLORS: Record<string, string> = {
  "Pre-Launch": T.gold,
  "Construction": T.blue,
  "Staffing": T.green,
  "Operations": T.orange,
  "Training": T.purple,
  "Launch": T.red,
};

export const WHEN_COLORS: Record<string, any> = {
  "Opening": { dot: T.gold, bg: T.goldLight },
  "During Service": { dot: T.blue, bg: T.blueLight },
  "Closing": { dot: T.purple, bg: T.purpleLight },
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
  "Not Started": { bg: T.goldLight, text: T.gold, border: T.goldBorder },
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
