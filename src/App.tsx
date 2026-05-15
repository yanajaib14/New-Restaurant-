import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  T, CAT_COLORS, STATUS_COLORS, PRIORITY_COLORS, NOTE_TAG_COLORS,
  CATEGORIES, INV_CATEGORIES, DEPARTMENTS, MENU_SECTIONS, Task, TaskTodoItem, TodoSubtask, TODO_STATUS_COLORS, TODO_STATUSES,
  MenuItem, StartupCost, OperatingCost, Milestone, Note, Vendor,
  InventoryItem, Permit, MarketingPost, TrainingModule, DailyChecklist,
  UtilityAccount, DigitalAsset, User, ActivityLog, UserRole, Invoice, Position, Candidate,
  CalendarEvent, PHASE_COLORS
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
import { VendorManager, VendorModal, VendorDetailModal, InventoryTracker, InventoryModal, InventoryDetailModal, PermitTracker, PermitModal, PermitDetailModal, UtilityTracker, UtilityModal } from "./components/Operations";
import { MasterInventory } from "./components/MasterInventory";
import { MarketingCalendar, MarketingModal, TrainingPortal, TrainingModal, DailyChecklistManager, ChecklistModal, DigitalAssetManager, DigitalAssetModal } from "./components/MarketingTraining";
import { InvoicesSection, InvoiceModal } from "./components/Invoices";
import { TalentHiring, TeamMap, TeamMapMemberModal, PositionModal, CandidateModal } from "./components/Team";
import { LaunchWindow, FullCalendar } from "./components/CalendarView";
import { getGoogleAuthUrl, getGoogleDriveStatus, saveToGoogleDrive, fileToBase64 } from "./services/googleDriveService";
import { exportToCSV } from "./lib/exportUtils";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { LayoutDashboard, CheckSquare, Utensils, ShoppingCart, Package, DollarSign, FileText, Box, Users, ShieldCheck, Megaphone, GraduationCap, ClipboardList, Calculator, UserPlus, Calendar, FileEdit, Sparkles, PenLine, Trash2, Printer, Download, Upload, ChevronRight, ChevronDown, Search, LayoutGrid, List } from "lucide-react";

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

// All content continues...