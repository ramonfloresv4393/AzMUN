import React, { useState } from "react";
import { School, Committee, Country, Delegate, Payment, SystemConfig, AdminUser, SchoolCycle } from "../types";
import { formatCurrency, formatDateShort, exportToCSV } from "../utils";
import {
  Settings,
  Users,
  School as SchoolIcon,
  Globe,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Save,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  Search,
  CheckCircle2,
  UserCheck,
  Lock,
  Unlock,
  ShieldCheck,
  PlusCircle,
  FileDown,
  BarChart3
} from "lucide-react";
import ReceiptPrint from "./ReceiptPrint";

interface AdminPortalProps {
  schools: School[];
  committees: Committee[];
  countries: Country[];
  delegates: Delegate[];
  payments: Payment[];
  config: SystemConfig;
  adminUsers?: AdminUser[];
  cycles?: SchoolCycle[];
  activeCycleId?: string;
  
  onCreateCycle?: (name: string) => Promise<void>;
  onChangeActiveCycle?: (cycleId: string) => Promise<void>;
  onUpdateConfig: (config: Partial<SystemConfig>) => Promise<void>;
  onAddSchool: (school: Omit<School, 'id'> & { id?: string }) => Promise<void>;
  onDeleteSchool: (id: string) => Promise<void>;
  onAddCommittee: (committee: { id?: string; name: string; doubleDelegation?: boolean; countries?: string[] }) => Promise<void>;
  onDeleteCommittee: (id: string) => Promise<void>;
  onAddCountry: (country: { id?: string; name: string }) => Promise<void>;
  onDeleteCountry: (id: string) => Promise<void>;
  onAssignDelegate: (delegateId: string, committeeId: string | null, countryId: string | null) => Promise<void>;
  onUpdateDelegateStatus: (delegateId: string, status: 'pending' | 'selected' | 'rejected') => Promise<void>;
  onUpdateDelegate?: (delegate: Partial<Delegate> & { id: string }) => Promise<void>;
  onAddPayment: (payment: Omit<Payment, 'id' | 'folio' | 'date'>) => Promise<void>;
  onDeletePayment: (id: string) => Promise<void>;
  onAddAdmin?: (admin: Omit<AdminUser, 'id'> & { id?: string }) => Promise<void>;
  onDeleteAdmin?: (id: string) => Promise<void>;
}

export default function AdminPortal({
  schools,
  committees,
  countries,
  delegates,
  payments,
  config,
  adminUsers = [],
  cycles = [],
  activeCycleId = "",
  onCreateCycle,
  onChangeActiveCycle,
  onUpdateConfig,
  onAddSchool,
  onDeleteSchool,
  onAddCommittee,
  onDeleteCommittee,
  onAddCountry,
  onDeleteCountry,
  onAssignDelegate,
  onUpdateDelegateStatus,
  onUpdateDelegate,
  onAddPayment,
  onDeletePayment,
  onAddAdmin,
  onDeleteAdmin
}: AdminPortalProps) {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'general' | 'schools' | 'committees' | 'delegates' | 'finances' | 'admins' | 'reports'>('general');

  // Multi-user Admin Authentication state
  const [loggedInAdmin, setLoggedInAdmin] = useState<AdminUser | null>(() => {
    try {
      const saved = localStorage.getItem("loggedInAdmin");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [adminLoginUser, setAdminLoginUser] = useState("");
  const [adminLoginPass, setAdminLoginPass] = useState("");
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  // Admin User CRUD state
  const [adminUserId, setAdminUserId] = useState("");
  const [adminUserName, setAdminUserName] = useState("");
  const [adminUserUsername, setAdminUserUsername] = useState("");
  const [adminUserPassword, setAdminUserPassword] = useState("");
  const [adminUserRole, setAdminUserRole] = useState<'superadmin' | 'finance' | 'coordinator'>("coordinator");
  const [editingAdmin, setEditingAdmin] = useState(false);

  // General Status Alerts
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form States - Schools
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolUsername, setSchoolUsername] = useState("");
  const [schoolPassword, setSchoolPassword] = useState("");
  const [schoolQuota, setSchoolQuota] = useState(10);
  const [schoolRoomsMale, setSchoolRoomsMale] = useState(0);
  const [schoolRoomsFemale, setSchoolRoomsFemale] = useState(0);
  const [schoolRoomNumbersMale, setSchoolRoomNumbersMale] = useState<string[]>([]);
  const [schoolRoomNumbersFemale, setSchoolRoomNumbersFemale] = useState<string[]>([]);
  const [editingSchool, setEditingSchool] = useState(false);

  // Form States - Committees
  const [committeeId, setCommitteeId] = useState("");
  const [committeeName, setCommitteeName] = useState("");
  const [committeeDoubleDelegation, setCommitteeDoubleDelegation] = useState(false);
  const [committeeCountries, setCommitteeCountries] = useState<string[]>([]);
  const [editingCommittee, setEditingCommittee] = useState(false);

  // Form States - Countries
  const [countryId, setCountryId] = useState("");
  const [countryName, setCountryName] = useState("");
  const [editingCountry, setEditingCountry] = useState(false);

  // Form States - Configuration
  const [configPayments, setConfigPayments] = useState(config.numPaymentsRequired);
  const [configAmount, setConfigAmount] = useState(config.paymentAmount);
  const [configTotalAmount, setConfigTotalAmount] = useState(config.totalAmountToPay ?? (config.numPaymentsRequired * config.paymentAmount));

  React.useEffect(() => {
    setConfigPayments(config.numPaymentsRequired);
    setConfigAmount(config.paymentAmount);
    setConfigTotalAmount(config.totalAmountToPay ?? (config.numPaymentsRequired * config.paymentAmount));
  }, [config]);

  // Form States - Payments
  const [payStudentId, setPayStudentId] = useState("");
  const [payAmount, setPayAmount] = useState(config.paymentAmount);
  const [payIndex, setPayIndex] = useState(1);
  const [payNotes, setPayNotes] = useState("");
  const [searchPayStudentQuery, setSearchPayStudentQuery] = useState("");
  const [financesSubTab, setFinancesSubTab] = useState<'individual' | 'batch'>("individual");

  // Form States - Batch School Payments
  const [batchSelectedSchoolId, setBatchSelectedSchoolId] = useState("");
  const [batchPaymentAmounts, setBatchPaymentAmounts] = useState<Record<string, number>>({});
  const [batchPaymentNotes, setBatchPaymentNotes] = useState<Record<string, string>>({});
  const [lastBatchGeneratedPayments, setLastBatchGeneratedPayments] = useState<Payment[]>([]);

  // Search/Filters - Delegates
  const [filterSchool, setFilterSchool] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignment, setFilterAssignment] = useState("all");
  const [searchDelegateQuery, setSearchDelegateQuery] = useState("");
  const [activeReportSubTab, setActiveReportSubTab] = useState<'shirts' | 'committees' | 'balances'>('shirts');

  // States for Editing Delegate Modal
  const [editingDelegate, setEditingDelegate] = useState<Delegate | null>(null);
  const [editDelNames, setEditDelNames] = useState("");
  const [editDelLastNames, setEditDelLastNames] = useState("");
  const [editDelEmail, setEditDelEmail] = useState("");
  const [editDelPhone, setEditDelPhone] = useState("");
  const [editDelSex, setEditDelSex] = useState<'Hombre' | 'Mujer'>("Hombre");
  const [editDelShirtSize, setEditDelShirtSize] = useState<'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'>("M");
  const [editDelLanguage, setEditDelLanguage] = useState<'Español' | 'Inglés' | 'Bilingüe'>("Español");
  const [editDelSchoolId, setEditDelSchoolId] = useState("");
  const [editDelChoices, setEditDelChoices] = useState<string[]>(["", "", ""]);

  const startEditDelegate = (delegate: Delegate) => {
    setEditingDelegate(delegate);
    setEditDelNames(delegate.names);
    setEditDelLastNames(delegate.lastNames);
    setEditDelEmail(delegate.email);
    setEditDelPhone(delegate.phone);
    setEditDelSex(delegate.sex || "Hombre");
    setEditDelShirtSize(delegate.shirtSize || "M");
    setEditDelLanguage(delegate.language || "Español");
    setEditDelSchoolId(delegate.schoolId);
    setEditDelChoices([
      delegate.choices[0] || "",
      delegate.choices[1] || "",
      delegate.choices[2] || ""
    ]);
  };

  const handleSaveDelegateEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDelegate) return;
    if (!editDelNames.trim() || !editDelLastNames.trim() || !editDelEmail.trim() || !editDelSchoolId) {
      showToast('error', 'Por favor llena los campos obligatorios.');
      return;
    }
    setActionLoading(true);
    try {
      if (onUpdateDelegate) {
        await onUpdateDelegate({
          id: editingDelegate.id,
          names: editDelNames,
          lastNames: editDelLastNames,
          email: editDelEmail,
          phone: editDelPhone,
          sex: editDelSex,
          shirtSize: editDelShirtSize,
          language: editDelLanguage,
          schoolId: editDelSchoolId,
          choices: editDelChoices
        });
        showToast('success', 'Datos del estudiante actualizados con éxito.');
        setEditingDelegate(null);
      } else {
        throw new Error("Función onUpdateDelegate no configurada.");
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error al actualizar datos del estudiante.');
    } finally {
      setActionLoading(false);
    }
  };

  // Printable Receipt Selection
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<Payment | null>(null);

  // School Cycle states & handlers
  const [newCycleInputName, setNewCycleInputName] = useState("");

  const handleCreateNewCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycleInputName.trim()) return;
    setActionLoading(true);
    try {
      if (onCreateCycle) {
        await onCreateCycle(newCycleInputName.trim());
        setNewCycleInputName("");
        showToast('success', `Ciclo Escolar "${newCycleInputName}" creado exitosamente.`);
      }
    } catch (err: any) {
      showToast('error', err.message || "Error al crear ciclo escolar.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectCycle = async (cycleId: string) => {
    setActionLoading(true);
    try {
      if (onChangeActiveCycle) {
        await onChangeActiveCycle(cycleId);
        showToast('success', `Ciclo escolar activo cambiado exitosamente.`);
      }
    } catch (err: any) {
      showToast('error', err.message || "Error al cambiar de ciclo escolar.");
    } finally {
      setActionLoading(false);
    }
  };

  // Helpers
  const showToast = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setSuccessMsg(text);
      setErrorMsg(null);
    } else {
      setErrorMsg(text);
      setSuccessMsg(null);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 4000);
  };

  const getSchoolName = (id: string) => schools.find(s => s.id === id)?.name || "Sin escuela";
  const getCommitteeName = (id: string | null) => id ? (committees.find(c => c.id === id)?.name || "Sin asignar") : "Sin asignar";
  const getCountryName = (id: string | null) => id ? (countries.find(c => c.id === id)?.name || "Sin asignar") : "Sin asignar";

  const getStudentPaymentsCount = (studentId: string) => payments.filter(p => p.studentId === studentId).length;
  const getStudentPaymentsSum = (studentId: string) => payments.filter(p => p.studentId === studentId).reduce((sum, p) => sum + p.amount, 0);

  const getStudentSuggestedPayment = (studentId: string) => {
    const paidSum = getStudentPaymentsSum(studentId);
    const totalRequired = config.totalAmountToPay ?? (config.paymentAmount * config.numPaymentsRequired);
    const remaining = Math.max(0, totalRequired - paidSum);
    if (remaining <= 0) return 0;
    return Math.min(config.paymentAmount, remaining);
  };

  const getAvailableCountriesForCommittee = (delegate: Delegate, committeeId: string | null) => {
    if (!committeeId) return [];
    const committee = committees.find(c => c.id === committeeId);
    if (!committee) return [];

    const linkedCountryIds = committee.countries || [];
    const maxQuota = committee.doubleDelegation ? 2 : 1;

    return countries.filter(country => {
      // Must be linked to this committee
      if (!linkedCountryIds.includes(country.id)) return false;

      // Count assignments by other active delegates
      const otherAssigned = delegates.filter(
        d => d.id !== delegate.id &&
             d.status === "selected" &&
             d.assignedCommitteeId === committeeId &&
             d.assignedCountryId === country.id
      );

      // If already assigned to another student up to capacity, do not show it!
      if (otherAssigned.length >= maxQuota) {
        return false;
      }

      return true;
    });
  };

  // Actions - Admin Authentication
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminLoginUser.trim() || !adminLoginPass.trim()) {
      setAdminLoginError("Por favor, rellena todos los campos.");
      return;
    }
    const user = adminUsers.find(
      u => u.username.toLowerCase() === adminLoginUser.toLowerCase().trim() && 
      u.passwordHash === adminLoginPass
    );
    if (user) {
      setLoggedInAdmin(user);
      localStorage.setItem("loggedInAdmin", JSON.stringify(user));
      setAdminLoginError(null);
      setAdminLoginUser("");
      setAdminLoginPass("");
      showToast('success', `Bienvenido de vuelta, ${user.name}`);
    } else {
      setAdminLoginError("Usuario o contraseña incorrectos.");
    }
  };

  const handleAdminLogout = () => {
    setLoggedInAdmin(null);
    localStorage.removeItem("loggedInAdmin");
  };

  // Actions - Admin Users CRUD
  const handleSaveAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUserName.trim() || !adminUserUsername.trim() || !adminUserPassword.trim()) {
      showToast('error', 'Por favor llena todos los campos del usuario.');
      return;
    }
    setActionLoading(true);
    try {
      if (onAddAdmin) {
        await onAddAdmin({
          id: adminUserId || undefined,
          name: adminUserName.trim(),
          username: adminUserUsername.trim(),
          passwordHash: adminUserPassword.trim(),
          role: adminUserRole
        });
        showToast('success', editingAdmin ? 'Usuario admin actualizado.' : 'Usuario admin registrado.');
        setAdminUserId("");
        setAdminUserName("");
        setAdminUserUsername("");
        setAdminUserPassword("");
        setAdminUserRole("coordinator");
        setEditingAdmin(false);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error al guardar administrador.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdminClick = async (id: string) => {
    if (loggedInAdmin?.id === id) {
      showToast('error', 'No puedes eliminar tu propio usuario de sesión activo.');
      return;
    }
    if (!window.confirm("¿Estás seguro de eliminar este usuario administrador? Perderá el acceso de forma inmediata.")) return;
    setActionLoading(true);
    try {
      if (onDeleteAdmin) {
        await onDeleteAdmin(id);
        showToast('success', 'Usuario administrador eliminado.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error al eliminar administrador.');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions - Batch Payments
  const handleProcessBatchPayments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchSelectedSchoolId) {
      showToast('error', 'Debe seleccionar una escuela para el pago por lote.');
      return;
    }

    const schoolStudents = delegates.filter(d => d.schoolId === batchSelectedSchoolId && d.status === 'selected');
    if (schoolStudents.length === 0) {
      showToast('error', 'Esta escuela no tiene alumnos seleccionados para abonar pagos.');
      return;
    }

    const paymentRecords: { studentId: string; amount: number; notes?: string }[] = [];
    schoolStudents.forEach(student => {
      const amt = batchPaymentAmounts[student.id];
      if (amt && amt > 0) {
        paymentRecords.push({
          studentId: student.id,
          amount: Number(amt),
          notes: (batchPaymentNotes[student.id] || "").trim()
        });
      }
    });

    if (paymentRecords.length === 0) {
      showToast('error', 'Debe ingresar al menos un monto de pago mayor a $0.');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch("/api/payments/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments: paymentRecords }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al procesar pagos por lote.");

      showToast('success', `Se registraron ${res.count} recibos por lote exitosamente en una sola transacción.`);
      
      if (res.payments && res.payments.length > 0) {
        setLastBatchGeneratedPayments(res.payments);
      }

      setBatchPaymentAmounts({});
      setBatchPaymentNotes({});
    } catch (err: any) {
      showToast('error', err.message || 'Error al guardar pagos por lote.');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions - Config
  const handleSaveConfig = async () => {
    setActionLoading(true);
    try {
      await onUpdateConfig({
        numPaymentsRequired: Number(configPayments),
        paymentAmount: Number(configAmount),
        totalAmountToPay: Number(configTotalAmount)
      });
      showToast('success', 'Configuración de pagos guardada con éxito.');
    } catch (err: any) {
      showToast('error', err.message || 'Error al actualizar configuración.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRegistration = async () => {
    setActionLoading(true);
    try {
      await onUpdateConfig({ registrationEnabled: !config.registrationEnabled });
      showToast('success', `Registro de alumnos ${!config.registrationEnabled ? 'Habilitado' : 'Deshabilitado'} correctamente.`);
    } catch (err: any) {
      showToast('error', err.message || 'Error al cambiar estatus de registro.');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions - Schools
  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim() || !schoolUsername.trim() || !schoolPassword.trim()) {
      showToast('error', 'Por favor llena todos los campos de la escuela.');
      return;
    }

    setActionLoading(true);
    try {
      const cleanRoomNumbersMale = Array.from({ length: Number(schoolRoomsMale) }, (_, i) => schoolRoomNumbersMale[i] || "");
      const cleanRoomNumbersFemale = Array.from({ length: Number(schoolRoomsFemale) }, (_, i) => schoolRoomNumbersFemale[i] || "");

      await onAddSchool({
        id: schoolId || undefined,
        name: schoolName.trim(),
        username: schoolUsername.trim().toLowerCase(),
        passwordHash: schoolPassword.trim(),
        maxQuota: Number(schoolQuota),
        roomsMale: Number(schoolRoomsMale),
        roomsFemale: Number(schoolRoomsFemale),
        roomNumbersMale: cleanRoomNumbersMale,
        roomNumbersFemale: cleanRoomNumbersFemale
      });
      showToast('success', editingSchool ? 'Escuela actualizada con éxito.' : 'Escuela registrada con éxito.');
      // Clear
      setSchoolId("");
      setSchoolName("");
      setSchoolUsername("");
      setSchoolPassword("");
      setSchoolQuota(10);
      setSchoolRoomsMale(0);
      setSchoolRoomsFemale(0);
      setSchoolRoomNumbersMale([]);
      setSchoolRoomNumbersFemale([]);
      setEditingSchool(false);
    } catch (err: any) {
      showToast('error', err.message || 'Error al guardar escuela.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSchoolClick = (s: School) => {
    setSchoolId(s.id);
    setSchoolName(s.name);
    setSchoolUsername(s.username);
    setSchoolPassword(s.passwordHash);
    setSchoolQuota(s.maxQuota);
    setSchoolRoomsMale(s.roomsMale || 0);
    setSchoolRoomsFemale(s.roomsFemale || 0);
    setSchoolRoomNumbersMale(s.roomNumbersMale || Array(s.roomsMale || 0).fill(""));
    setSchoolRoomNumbersFemale(s.roomNumbersFemale || Array(s.roomsFemale || 0).fill(""));
    setEditingSchool(true);
  };

  const handleDeleteSchoolClick = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta escuela? Los alumnos asociados ya no tendrán institución asignada.")) return;
    setActionLoading(true);
    try {
      await onDeleteSchool(id);
      showToast('success', 'Escuela eliminada del sistema.');
    } catch (err: any) {
      showToast('error', err.message || 'Error al eliminar escuela.');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions - Committees
  const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!committeeName.trim()) return;

    setActionLoading(true);
    try {
      await onAddCommittee({
        id: committeeId || undefined,
        name: committeeName.trim(),
        doubleDelegation: committeeDoubleDelegation,
        countries: committeeCountries
      });
      showToast('success', editingCommittee ? 'Comité actualizado.' : 'Comité registrado.');
      setCommitteeId("");
      setCommitteeName("");
      setCommitteeDoubleDelegation(false);
      setCommitteeCountries([]);
      setEditingCommittee(false);
    } catch (err: any) {
      showToast('error', err.message || 'Error al registrar comité.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCommitteeClick = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este comité? Los alumnos asignados a él quedarán sin asignación.")) return;
    setActionLoading(true);
    try {
      await onDeleteCommittee(id);
      showToast('success', 'Comité eliminado.');
    } catch (err: any) {
      showToast('error', err.message || 'Error al eliminar comité.');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions - Countries
  const handleSaveCountry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName.trim()) return;

    setActionLoading(true);
    try {
      await onAddCountry({ id: countryId || undefined, name: countryName.trim() });
      showToast('success', editingCountry ? 'País actualizado.' : 'País habilitado.');
      setCountryId("");
      setCountryName("");
      setEditingCountry(false);
    } catch (err: any) {
      showToast('error', err.message || 'Error al guardar país.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCountryClick = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este país? Alumnos asignados quedarán sin país.")) return;
    setActionLoading(true);
    try {
      await onDeleteCountry(id);
      showToast('success', 'País deshabilitado del sistema.');
    } catch (err: any) {
      showToast('error', err.message || 'Error al eliminar país.');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions - Delegate Assignment
  const handleAssignClick = async (delegateId: string, cId: string, couId: string) => {
    setActionLoading(true);
    try {
      await onAssignDelegate(delegateId, cId || null, couId || null);
      showToast('success', 'Asignación actualizada con éxito.');
    } catch (err: any) {
      showToast('error', err.message || 'Error al guardar asignación.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatusOverride = async (id: string, s: 'selected' | 'pending' | 'rejected') => {
    setActionLoading(true);
    try {
      await onUpdateDelegateStatus(id, s);
      showToast('success', 'Estatus del delegado actualizado de manera forzada.');
    } catch (err: any) {
      showToast('error', err.message || 'Error al forzar estatus.');
    } finally {
      setActionLoading(false);
    }
  };

  // Actions - Add Payment
  const handleAddPaymentClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payStudentId) {
      showToast('error', 'Debe seleccionar un alumno para aplicar el pago.');
      return;
    }

    setActionLoading(true);
    try {
      await onAddPayment({
        studentId: payStudentId,
        amount: Number(payAmount),
        paymentIndex: Number(payIndex),
        notes: payNotes.trim()
      });

      showToast('success', 'Pago asentado correctamente. Recibo listo para impresión.');
      
      // Auto open print modal for the newly registered payment!
      // Find the last added payment in DB to print
      const updatedPayments = payments; // state is updated in props, wait we can query by newly created
      // Since it's reactive, let's open the most recent payment for this student
      // We will trigger a timeout or find the item
      const newlyAdded = [...payments]
        .filter(p => p.studentId === payStudentId)
        .sort((a, b) => b.folio - a.folio)[0];
      
      if (newlyAdded) {
        setSelectedReceiptPayment(newlyAdded);
      } else {
        // Fallback: search generally
        setTimeout(() => {
          const fresh = payments.filter(p => p.studentId === payStudentId).sort((a, b) => b.folio - a.folio)[0];
          if (fresh) setSelectedReceiptPayment(fresh);
        }, 300);
      }

      // Clear Form
      setPayStudentId("");
      setPayNotes("");
      setSearchPayStudentQuery("");
    } catch (err: any) {
      showToast('error', err.message || 'Error al registrar pago.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePaymentClick = async (id: string) => {
    if (!window.confirm("¿Deseas anular y eliminar permanentemente este registro de pago?")) return;
    setActionLoading(true);
    try {
      await onDeletePayment(id);
      showToast('success', 'Pago anulado y folio cancelado.');
    } catch (err: any) {
      showToast('error', err.message || 'Error al eliminar pago.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintBatchReceipts = (batchPaymentsList: Payment[]) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Recibos de Pago por Lote - MUN 2026</title>
          <style>
            @media print {
              .receipt-page {
                page-break-after: always;
                border-bottom: none !important;
                padding-bottom: 0 !important;
              }
            }
            body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; background-color: white; color: #1e293b; }
            .receipt-card { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto; }
            .receipt-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
            .receipt-title { font-size: 18px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin: 0; }
            .receipt-meta { font-size: 11px; color: #64748b; font-family: monospace; text-align: right; }
            .receipt-body { font-size: 13px; line-height: 1.6; }
            .receipt-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .receipt-label { font-weight: 600; color: #475569; }
            .receipt-value { font-weight: 700; color: #0f172a; text-align: right; }
            .receipt-footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; text-align: center; color: #64748b; }
          </style>
        </head>
        <body>
          ${batchPaymentsList.map(p => {
            const student = delegates.find(d => d.id === p.studentId);
            const school = schools.find(s => s.id === student?.schoolId);
            return `
              <div class="receipt-page">
                <div class="receipt-card">
                  <div class="receipt-header">
                    <div>
                      <h2 class="receipt-title">Modelo de Naciones Unidas</h2>
                      <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: 600; color: #6366f1;">RECIBO OFICIAL DE PAGO</p>
                    </div>
                    <div class="receipt-meta">
                      <p style="margin: 0;">FOLIO: <b>#${p.folio}</b></p>
                      <p style="margin: 2px 0 0 0;">FECHA: ${new Date(p.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div class="receipt-body">
                    <div class="receipt-row">
                      <span class="receipt-label">Recibimos de:</span>
                      <span class="receipt-value" style="font-size: 14px;">${student ? `${student.names} ${student.lastNames}` : 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                      <span class="receipt-label">Institución:</span>
                      <span class="receipt-value">${school ? school.name : 'N/A'}</span>
                    </div>
                    <div class="receipt-row">
                      <span class="receipt-label">Concepto de Pago:</span>
                      <span class="receipt-value">Abono #${p.paymentIndex} de ${config.numPaymentsRequired}</span>
                    </div>
                    ${p.notes ? `
                      <div class="receipt-row">
                        <span class="receipt-label">Notas / Método:</span>
                        <span class="receipt-value" style="font-style: italic;">${p.notes}</span>
                      </div>
                    ` : ''}
                    <div class="receipt-row" style="margin-top: 16px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
                      <span class="receipt-label" style="font-size: 14px; color: #0f172a;">CANTIDAD RECIBIDA:</span>
                      <span class="receipt-value" style="font-size: 18px; color: #4f46e5;">$${p.amount}.00 MXN</span>
                    </div>
                  </div>
                  <div class="receipt-footer">
                    <p style="margin: 0; font-weight: bold;">MUN 2026 - SISTEMA DE CONTROL DE CAJA</p>
                    <p style="margin: 4px 0 0 0;">Comprobante válido como pago de participación oficial.</p>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // --- FILTERS AND REPORT GENERATION ---
  const filteredDelegates = delegates.filter(d => {
    const matchSchool = filterSchool ? d.schoolId === filterSchool : true;
    const matchStatus = filterStatus ? d.status === filterStatus : true;
    
    let matchAssignment = true;
    if (filterAssignment === "assigned") {
      matchAssignment = !!d.assignedCommitteeId && !!d.assignedCountryId;
    } else if (filterAssignment === "unassigned") {
      matchAssignment = !d.assignedCommitteeId || !d.assignedCountryId;
    } else if (filterAssignment === "no-committee") {
      matchAssignment = !d.assignedCommitteeId;
    } else if (filterAssignment === "no-country") {
      matchAssignment = !d.assignedCountryId;
    }

    const fullName = `${d.names} ${d.lastNames}`.toLowerCase();
    const query = searchDelegateQuery.toLowerCase().trim();
    const matchSearch = query ? (fullName.includes(query) || d.email.toLowerCase().includes(query) || d.phone.includes(query)) : true;

    return matchSchool && matchStatus && matchAssignment && matchSearch;
  });

  // Export Delegates CSV
  const handleExportDelegatesCSV = () => {
    const report = filteredDelegates.map((d, i) => {
      const sum = getStudentPaymentsSum(d.id);
      return {
        "Nº": i + 1,
        "Nombres": d.names,
        "Apellidos": d.lastNames,
        "Celular": d.phone,
        "Correo Institucional": d.email,
        "Escuela": getSchoolName(d.schoolId),
        "Estatus": d.status === "selected" ? "Participante" : (d.status === "rejected" ? "No Complementado" : "Pendiente"),
        "Comité Asignado": getCommitteeName(d.assignedCommitteeId),
        "País Asignado": getCountryName(d.assignedCountryId),
        "Preferencia 1": getCommitteeName(d.choices[0]),
        "Preferencia 2": getCommitteeName(d.choices[1]),
        "Preferencia 3": getCommitteeName(d.choices[2]),
        "Total Pagado": `$${sum}.00`
      };
    });
    exportToCSV(report, "MUN_Reporte_General_Delegados");
  };

  // Export Financial Reports CSV
  const handleExportFinancesCSV = () => {
    const report = payments.map((p, i) => {
      const student = delegates.find(d => d.id === p.studentId);
      return {
        "Nº": i + 1,
        "Folio Recibo": p.folio,
        "Fecha Pago": p.date,
        "Alumno": student ? `${student.names} ${student.lastNames}` : "Alumno Desconocido",
        "Escuela": student ? getSchoolName(student.schoolId) : "N/A",
        "Número de Pago": `Pago ${p.paymentIndex} de ${config.numPaymentsRequired}`,
        "Monto Recibido": `$${p.amount}.00`,
        "Notas / Observaciones": p.notes || ""
      };
    });
    exportToCSV(report, "MUN_Reporte_Finanzas_Pagos");
  };

  // Print Admin Rooms Report for all schools
  const handlePrintAdminRoomsReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const schoolsHTML = schools.map(s => {
      const activeDelegates = delegates.filter(d => d.schoolId === s.id && d.status === "selected");
      
      const maleRoomsHTML = Array.from({ length: s.roomsMale || 0 }, (_, i) => i + 1).map((roomNum) => {
        const occupants = activeDelegates.filter(d => d.sex === "Hombre" && d.roomNumber === roomNum);
        const realNumber = s.roomNumbersMale?.[roomNum - 1];
        return `
          <div class="mb-3 border border-blue-100 p-2.5 rounded bg-blue-50/20 break-inside-avoid">
            <h4 class="text-[11px] font-bold text-blue-800 uppercase flex justify-between border-b border-blue-100 pb-1 mb-1.5">
              <span>Cuarto #${roomNum} ${realNumber ? `(Habitación: ${realNumber})` : '(Sin número)'}</span>
              <span class="text-[9px] text-blue-600 font-medium">${occupants.length} Hospedados</span>
            </h4>
            ${occupants.length === 0 ? `
              <p class="text-[10px] text-gray-400 italic">Habitación Vacía</p>
            ` : `
              <ol class="list-decimal pl-4 text-[10px] space-y-0.5 text-gray-700">
                ${occupants.map(o => `
                  <li>
                    <span class="font-semibold text-gray-800">${o.names} ${o.lastNames}</span> 
                    <span class="text-[9px] text-gray-400">(${o.email})</span>
                  </li>
                `).join("")}
              </ol>
            `}
          </div>
        `;
      }).join("");

      const femaleRoomsHTML = Array.from({ length: s.roomsFemale || 0 }, (_, i) => i + 1).map((roomNum) => {
        const occupants = activeDelegates.filter(d => d.sex === "Mujer" && d.roomNumber === roomNum);
        const realNumber = s.roomNumbersFemale?.[roomNum - 1];
        return `
          <div class="mb-3 border border-pink-100 p-2.5 rounded bg-pink-50/20 break-inside-avoid">
            <h4 class="text-[11px] font-bold text-pink-800 uppercase flex justify-between border-b border-pink-100 pb-1 mb-1.5">
              <span>Cuarto #${roomNum} ${realNumber ? `(Habitación: ${realNumber})` : '(Sin número)'}</span>
              <span class="text-[9px] text-pink-600 font-medium">${occupants.length} Hospedadas</span>
            </h4>
            ${occupants.length === 0 ? `
              <p class="text-[10px] text-gray-400 italic">Habitación Vacía</p>
            ` : `
              <ol class="list-decimal pl-4 text-[10px] space-y-0.5 text-gray-700">
                ${occupants.map(o => `
                  <li>
                    <span class="font-semibold text-gray-800">${o.names} ${o.lastNames}</span> 
                    <span class="text-[9px] text-gray-400">(${o.email})</span>
                  </li>
                `).join("")}
              </ol>
            `}
          </div>
        `;
      }).join("");

      const unassignedStudents = activeDelegates.filter(d => !d.roomNumber);

      return `
        <div class="mb-8 border border-gray-200 rounded-xl p-5 bg-white break-inside-avoid shadow-xs">
          <div class="flex justify-between items-start border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 class="text-base font-bold text-gray-900">${s.name}</h3>
              <p class="text-xs text-gray-500 mt-0.5">Usuario: <span class="font-mono bg-gray-100 px-1 py-0.5 rounded text-gray-700">${s.username}</span></p>
            </div>
            <div class="text-right text-[10px] text-gray-500 font-semibold space-y-0.5">
              <p class="text-indigo-700 font-bold">Cupo: ${activeDelegates.length} / ${s.maxQuota}</p>
              <p class="text-blue-600">Habitaciones H: ${s.roomsMale || 0}</p>
              <p class="text-pink-600">Habitaciones M: ${s.roomsFemale || 0}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Male section -->
            <div>
              <h4 class="text-xs font-extrabold text-blue-700 uppercase mb-2 pb-1 border-b border-blue-200">Sección Hombres</h4>
              ${(s.roomsMale || 0) === 0 ? `
                <p class="text-[10px] text-gray-400 italic">Sin habitaciones asignadas para hombres.</p>
              ` : maleRoomsHTML}
            </div>

            <!-- Female section -->
            <div>
              <h4 class="text-xs font-extrabold text-pink-700 uppercase mb-2 pb-1 border-b border-pink-200">Sección Mujeres</h4>
              ${(s.roomsFemale || 0) === 0 ? `
                <p class="text-[10px] text-gray-400 italic">Sin habitaciones asignadas para mujeres.</p>
              ` : femaleRoomsHTML}
            </div>
          </div>

          ${unassignedStudents.length > 0 ? `
            <div class="mt-4 border-t border-amber-100 pt-3">
              <h4 class="text-[10px] font-extrabold text-amber-700 uppercase mb-1">Alumnos Activos Sin Cuarto Asignado (${unassignedStudents.length})</h4>
              <div class="bg-amber-50/50 p-2 rounded border border-amber-100 text-[10px] text-amber-900 flex flex-wrap gap-2">
                ${unassignedStudents.map(u => `<span>${u.names} ${u.lastNames} (${u.sex})</span>`).join(" • ")}
              </div>
            </div>
          ` : ""}
        </div>
      `;
    }).join("");

    const htmlContent = `
      <html>
        <head>
          <title>Reporte General de Habitaciones por Escuela - MUN 2026</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; background-color: #f8fafc; }
            @media print { 
              body { background-color: #ffffff; padding: 20px; }
              .no-print { display: none; } 
              .break-inside-avoid { break-inside: avoid; }
            }
          </style>
        </head>
        <body onload="window.print();">
          <div class="max-w-5xl mx-auto">
            <div class="text-center border-b pb-6 mb-8 bg-white p-6 rounded-xl border border-gray-200">
              <h1 class="text-2xl font-bold uppercase tracking-tight text-gray-900">Reporte General de Distribución de Cuartos</h1>
              <p class="text-sm text-indigo-700 font-semibold mt-1">Hospedaje de Escuelas Participantes • MUN 2026</p>
              <p class="text-xs text-gray-400 mt-1">Generado el ${new Date().toLocaleDateString("es-MX")} • Rol Organizador</p>
            </div>

            ${schools.length === 0 ? `
              <div class="bg-white border p-12 text-center text-gray-400 rounded-xl">
                No hay escuelas registradas en el sistema.
              </div>
            ` : schoolsHTML}

            <div class="mt-12 pt-8 border-t flex justify-between text-xs text-gray-400 font-medium break-inside-avoid">
              <span>Comité Organizador MUN 2026</span>
              <span>Control Escolar de Hospedaje</span>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // General printable list
  const handlePrintGeneralReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Reporte General MUN 2026</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 45px; }
          </style>
        </head>
        <body onload="window.print();">
          <div class="max-w-4xl mx-auto">
            <div class="text-center border-b pb-4 mb-8">
              <h1 class="text-2xl font-bold uppercase tracking-tight">Reporte General de Delegados</h1>
              <p class="text-sm text-gray-500 mt-1">Modelo de las Naciones Unidas (MUN 2026)</p>
              <p class="text-[10px] text-gray-400 mt-0.5">Generado el ${new Date().toLocaleDateString("es-MX")} | Rol Organizador</p>
            </div>

            <div class="grid grid-cols-4 gap-4 mb-6 text-xs font-semibold">
              <div class="bg-gray-50 p-3 rounded border">
                <p class="text-gray-400 uppercase text-[9px]">Total Registros</p>
                <p class="text-lg font-bold text-gray-800 mt-0.5">${delegates.length}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded border">
                <p class="text-gray-400 uppercase text-[9px]">Participantes Activos</p>
                <p class="text-lg font-bold text-green-600 mt-0.5">${delegates.filter(d => d.status === 'selected').length}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded border">
                <p class="text-gray-400 uppercase text-[9px]">Escuelas Registradas</p>
                <p class="text-lg font-bold text-indigo-600 mt-0.5">${schools.length}</p>
              </div>
              <div class="bg-gray-50 p-3 rounded border">
                <p class="text-gray-400 uppercase text-[9px]">Total Recaudado</p>
                <p class="text-lg font-bold text-slate-900 mt-0.5">$${payments.reduce((s, p) => s + p.amount, 0).toLocaleString("es-MX")}.00</p>
              </div>
            </div>

            <table class="w-full text-left text-xs border-collapse border">
              <thead>
                <tr class="bg-gray-100 text-gray-600 font-bold border-b text-[10px] uppercase">
                  <th class="py-2.5 px-2 border">Delegado</th>
                  <th class="py-2.5 px-2 border">Escuela</th>
                  <th class="py-2.5 px-2 border">Asignación</th>
                  <th class="py-2.5 px-2 border">Estatus</th>
                  <th class="py-2.5 px-2 border text-right">Pagos</th>
                </tr>
              </thead>
              <tbody>
                ${filteredDelegates.map(d => `
                  <tr class="border-b text-gray-700 text-[11px] hover:bg-gray-50">
                    <td class="py-2.5 px-2 border font-medium">
                      <p class="font-bold text-gray-900">${d.names} ${d.lastNames}</p>
                      <p class="text-[9px] text-gray-500 mt-0.5">${d.email}</p>
                    </td>
                    <td class="py-2.5 px-2 border text-gray-600">${getSchoolName(d.schoolId)}</td>
                    <td class="py-2.5 px-2 border">
                      <p class="font-semibold text-indigo-700">${getCommitteeName(d.assignedCommitteeId)}</p>
                      <p class="text-emerald-700 font-medium">${getCountryName(d.assignedCountryId)}</p>
                    </td>
                    <td class="py-2.5 px-2 border">
                      <span class="px-1.5 py-0.5 text-[8px] font-bold rounded-full ${
                        d.status === 'selected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }">
                        ${d.status === 'selected' ? 'ACTIVO' : 'ESPERA'}
                      </span>
                    </td>
                    <td class="py-2.5 px-2 border text-right font-mono font-bold">$${getStudentPaymentsSum(d.id)}.00</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Searching students to pay
  const searchableStudentsForPayment = delegates.filter(d => {
    const fullName = `${d.names} ${d.lastNames}`.toLowerCase();
    const query = searchPayStudentQuery.toLowerCase().trim();
    return query ? (fullName.includes(query) || d.email.toLowerCase().includes(query)) : false;
  });

  if (!loggedInAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white border border-slate-100 rounded-3xl p-8 shadow-xs animate-fade-in w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-50 rounded-2xl mb-3 text-indigo-600">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-950">Acceso Administrativo</h3>
          <p className="text-xs text-slate-500 mt-1">Ingresa las credenciales del comité organizador de MUN 2026</p>
        </div>

        {adminLoginError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{adminLoginError}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <label htmlFor="admin-user-input" className="block text-xs font-medium text-slate-700 mb-1">Usuario</label>
            <input
              id="admin-user-input"
              type="text"
              required
              placeholder="Ej. superadmin"
              value={adminLoginUser}
              onChange={(e) => setAdminLoginUser(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
            />
          </div>

          <div>
            <label htmlFor="admin-pass-input" className="block text-xs font-medium text-slate-700 mb-1">Contraseña</label>
            <input
              id="admin-pass-input"
              type="password"
              required
              placeholder="••••••••"
              value={adminLoginPass}
              onChange={(e) => setAdminLoginPass(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Unlock className="w-4 h-4" />
            Iniciar Sesión
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center leading-normal">
          <p>Los usuarios de acceso por rol vienen pre-cargados por defecto.</p>
          <p className="mt-1">Roles disponibles: <span className="font-semibold text-indigo-600">superadmin</span> (Super Administrador), <span className="font-semibold text-indigo-600">coordinador</span> (Coordinador) y <span className="font-semibold text-indigo-600">finanzas</span> (Control de Pagos).</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar Navigation */}
      <div className="md:col-span-1 bg-white border border-slate-100 rounded-2xl p-5 space-y-2 h-fit shadow-xs">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">Administración</h3>
        
        <button
          id="tab-btn-general"
          onClick={() => setActiveTab('general')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'general' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4" />
          Control General
        </button>

        <button
          id="tab-btn-schools"
          onClick={() => setActiveTab('schools')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'schools' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <SchoolIcon className="w-4 h-4" />
          Escuelas
        </button>

        <button
          id="tab-btn-committees"
          onClick={() => {
            setActiveTab('committees');
            setEditingCommittee(false);
            setEditingCountry(false);
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'committees' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Globe className="w-4 h-4" />
          Comités y Países
        </button>

        <button
          id="tab-btn-delegates"
          onClick={() => setActiveTab('delegates')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'delegates' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          Asignación Delegados
        </button>

        <button
          id="tab-btn-finances"
          onClick={() => setActiveTab('finances')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'finances' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Finanzas y Recibos
        </button>

        <button
          id="tab-btn-reports"
          onClick={() => setActiveTab('reports')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'reports' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Reportes y Estadísticas
        </button>

        <button
          id="tab-btn-admins"
          onClick={() => setActiveTab('admins')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            activeTab === 'admins' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Usuarios Admin
        </button>

        <div className="pt-4 border-t border-slate-100 mt-2">
          <div className="px-3 py-1.5 bg-slate-50 rounded-xl mb-2 flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Sesión activa</span>
            <span className="text-xs font-bold text-slate-700 truncate">{loggedInAdmin?.name}</span>
            <span className="text-[9px] text-indigo-600 font-semibold capitalize font-mono mt-0.5">{loggedInAdmin?.role}</span>
          </div>

          <button
            onClick={handleAdminLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            Cerrar Sesión Admin
          </button>
        </div>
      </div>

      {/* Main Workspace Column */}
      <div className="md:col-span-3 space-y-6">
        {/* Status Alerts Block */}
        {(errorMsg || successMsg) && (
          <div className="space-y-2">
            {errorMsg && (
              <div id="admin-toast-error" className="p-4 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div id="admin-toast-success" className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* SECTION 1: GENERAL SYSTEM & PAYMENTS CONFIG */}
        {activeTab === 'general' && (
          <div id="section-general" className="space-y-6 animate-fade-in">
            {/* Quick stats board */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inscripciones</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`w-2.5 h-2.5 rounded-full ${config.registrationEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                  <p className="text-base font-bold text-slate-800">{config.registrationEnabled ? 'Habilitadas' : 'Deshabilitadas'}</p>
                </div>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Delegados Totales</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{delegates.length}</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Escuelas</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{schools.length}</p>
              </div>
            </div>

            {/* Registration toggle panel */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Configuración del Registro Público</h4>
                <p className="text-xs text-slate-500 mt-0.5">Controla la disponibilidad del formulario de registro para alumnos</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    {config.registrationEnabled ? "El formulario de inscripción está ACTIVO" : "El formulario de inscripción está DESACTIVADO"}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {config.registrationEnabled ? "Los alumnos pueden auto-registrarse de manera autónoma." : "Los alumnos recibirán un aviso indicando que las inscripciones están cerradas."}
                  </p>
                </div>

                <button
                  id="toggle-reg-status-btn"
                  onClick={handleToggleRegistration}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer ${
                    config.registrationEnabled
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-100'
                  }`}
                >
                  {config.registrationEnabled ? "Deshabilitar Registro" : "Habilitar Registro"}
                </button>
              </div>
            </div>

            {/* General financial configuration */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Estructura Financiera (Pagos Requeridos)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Define la cantidad total de la inscripción y los montos de abonos sugeridos.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="config-total-amount" className="block text-xs font-medium text-slate-700 mb-1">Cantidad Total a Pagar ($ MXN)</label>
                  <input
                    id="config-total-amount"
                    type="number"
                    min="10"
                    value={configTotalAmount}
                    onChange={(e) => setConfigTotalAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800 bg-white"
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">El costo de la inscripción completa por alumno.</span>
                </div>

                <div>
                  <label htmlFor="config-num-payments" className="block text-xs font-medium text-slate-700 mb-1">Número de Pagos Estimados</label>
                  <input
                    id="config-num-payments"
                    type="number"
                    min="1"
                    max="6"
                    value={configPayments}
                    onChange={(e) => setConfigPayments(Number(e.target.value))}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800 bg-white"
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">Ej. 2 abonos sugeridos para liquidar.</span>
                </div>

                <div>
                  <label htmlFor="config-payment-amount" className="block text-xs font-medium text-slate-700 mb-1">Monto de Abono Sugerido ($ MXN)</label>
                  <input
                    id="config-payment-amount"
                    type="number"
                    min="10"
                    value={configAmount}
                    onChange={(e) => setConfigAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800 bg-white"
                  />
                  <span className="text-[9px] text-slate-400 mt-1 block">Monto unitario de cada abono o pago parcial.</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-500 font-semibold">
                  Monto Total Definido: <span className="text-indigo-600 font-bold font-mono">{formatCurrency(configTotalAmount)}</span>
                </div>

                <button
                  id="save-finances-config-btn"
                  onClick={handleSaveConfig}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all rounded-xl shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  Guardar Estructura
                </button>
              </div>
            </div>

            {/* Cycle management panel */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Ciclos Escolares (Gestión del Sistema)</h4>
                <p className="text-xs text-slate-500 mt-0.5">Crea ciclos escolares y selecciona el ciclo activo. Cada ciclo escolar maneja su propia base de datos independiente (escuelas, comités, alumnos, pagos, configuraciones).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Active selection */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3">
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Seleccionar Ciclo Activo</h5>
                  <div className="space-y-2">
                    {cycles.map(c => (
                      <label key={c.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${c.id === activeCycleId ? 'bg-indigo-50/55 border-indigo-200 text-indigo-900 font-semibold' : 'bg-white border-slate-200 hover:bg-slate-50/50'}`}>
                        <div className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="active-cycle-radio"
                            checked={c.id === activeCycleId}
                            onChange={() => handleSelectCycle(c.id)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          />
                          <span className="text-xs">{c.name}</span>
                        </div>
                        {c.id === activeCycleId && (
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold uppercase">Activo</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Create new cycle */}
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3 flex flex-col justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Dar de alta nuevo ciclo</h5>
                    <p className="text-[10px] text-slate-500 mt-1">Al crear un nuevo ciclo, se empezará de 0 para dicho ciclo con comités, escuelas, alumnos y finanzas limpios.</p>
                  </div>
                  <form onSubmit={handleCreateNewCycle} className="space-y-3 mt-2">
                    <div>
                      <label htmlFor="new-cycle-name" className="block text-[10px] font-bold text-slate-600 mb-1">Nombre del Ciclo Escolar</label>
                      <input
                        id="new-cycle-name"
                        type="text"
                        required
                        placeholder="Ej. Ciclo Escolar 2026-2027"
                        value={newCycleInputName}
                        onChange={(e) => setNewCycleInputName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800 bg-white"
                      />
                    </div>
                    <button
                      id="create-cycle-btn"
                      type="submit"
                      disabled={actionLoading || !newCycleInputName.trim()}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all rounded-xl shadow-xs cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Crear y Empezar de 0
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: SCHOOLS MANAGEMENT */}
        {activeTab === 'schools' && (
          <div id="section-schools" className="space-y-6 animate-fade-in">
            {/* School registration form */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-900 mb-4">
                {editingSchool ? "Editar Escuela Participante" : "Dar de Alta Nueva Escuela"}
              </h4>

              <form onSubmit={handleSaveSchool} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-school-name" className="block text-xs font-medium text-slate-700 mb-1">Nombre Completo de la Escuela</label>
                  <input
                    id="input-school-name"
                    type="text"
                    required
                    placeholder="Ej. Colegio de Bachilleres Plantel Villa de Seris"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label htmlFor="input-school-quota" className="block text-xs font-medium text-slate-700 mb-1">Cupo Máximo de Alumnos (Límite)</label>
                  <input
                    id="input-school-quota"
                    type="number"
                    required
                    min="1"
                    placeholder="Ej. 10"
                    value={schoolQuota}
                    onChange={(e) => setSchoolQuota(Number(e.target.value))}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label htmlFor="input-school-rooms-male" className="block text-xs font-medium text-slate-700 mb-1">Habitaciones para Hombres (Cuartos)</label>
                  <input
                    id="input-school-rooms-male"
                    type="number"
                    required
                    min="0"
                    placeholder="Ej. 3"
                    value={schoolRoomsMale}
                    onChange={(e) => {
                      const newCount = Math.max(0, Number(e.target.value));
                      setSchoolRoomsMale(newCount);
                      setSchoolRoomNumbersMale(prev => {
                        const next = [...prev];
                        if (next.length < newCount) {
                          while (next.length < newCount) next.push("");
                        } else if (next.length > newCount) {
                          next.splice(newCount);
                        }
                        return next;
                      });
                    }}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label htmlFor="input-school-rooms-female" className="block text-xs font-medium text-slate-700 mb-1">Habitaciones para Mujeres (Cuartos)</label>
                  <input
                    id="input-school-rooms-female"
                    type="number"
                    required
                    min="0"
                    placeholder="Ej. 3"
                    value={schoolRoomsFemale}
                    onChange={(e) => {
                      const newCount = Math.max(0, Number(e.target.value));
                      setSchoolRoomsFemale(newCount);
                      setSchoolRoomNumbersFemale(prev => {
                        const next = [...prev];
                        if (next.length < newCount) {
                          while (next.length < newCount) next.push("");
                        } else if (next.length > newCount) {
                          next.splice(newCount);
                        }
                        return next;
                      });
                    }}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                  />
                </div>

                {schoolRoomsMale > 0 && (
                  <div className="sm:col-span-2 bg-blue-50/50 border border-blue-100 rounded-xl p-4 space-y-3">
                    <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wide">Números de Habitación - Hombres</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Array.from({ length: schoolRoomsMale }).map((_, idx) => (
                        <div key={`input-male-room-${idx}`}>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Cuarto #{idx + 1}</label>
                          <input
                            type="text"
                            placeholder={`Ej. 10${idx + 1}`}
                            value={schoolRoomNumbersMale[idx] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSchoolRoomNumbersMale(prev => {
                                const next = [...prev];
                                next[idx] = val;
                                return next;
                              });
                            }}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-hidden text-slate-800 bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {schoolRoomsFemale > 0 && (
                  <div className="sm:col-span-2 bg-pink-50/50 border border-pink-100 rounded-xl p-4 space-y-3">
                    <h5 className="text-xs font-bold text-pink-800 uppercase tracking-wide">Números de Habitación - Mujeres</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {Array.from({ length: schoolRoomsFemale }).map((_, idx) => (
                        <div key={`input-female-room-${idx}`}>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Cuarto #{idx + 1}</label>
                          <input
                            type="text"
                            placeholder={`Ej. 20${idx + 1}`}
                            value={schoolRoomNumbersFemale[idx] || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSchoolRoomNumbersFemale(prev => {
                                const next = [...prev];
                                next[idx] = val;
                                return next;
                              });
                            }}
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-pink-600 focus:border-transparent outline-hidden text-slate-800 bg-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="input-school-user" className="block text-xs font-medium text-slate-700 mb-1">Usuario de Acceso Escolar</label>
                  <input
                    id="input-school-user"
                    type="text"
                    required
                    placeholder="Ej. villa_de_seris"
                    value={schoolUsername}
                    onChange={(e) => setSchoolUsername(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label htmlFor="input-school-pass" className="block text-xs font-medium text-slate-700 mb-1">Contraseña de Acceso Escolar</label>
                  <input
                    id="input-school-pass"
                    type="text"
                    required
                    placeholder="Ej. munevento2026"
                    value={schoolPassword}
                    onChange={(e) => setSchoolPassword(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  {editingSchool && (
                    <button
                      id="cancel-school-edit"
                      type="button"
                      onClick={() => {
                        setSchoolId("");
                        setSchoolName("");
                        setSchoolUsername("");
                        setSchoolPassword("");
                        setSchoolQuota(10);
                        setSchoolRoomsMale(0);
                        setSchoolRoomsFemale(0);
                        setEditingSchool(false);
                      }}
                      className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      Cancelar Edición
                    </button>
                  )}
                  <button
                    id="save-school-btn"
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all rounded-xl shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {editingSchool ? "Guardar Cambios" : "Agregar Escuela"}
                  </button>
                </div>
              </form>
            </div>

            {/* List of Schools */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Escuelas Participantes Registradas ({schools.length})</h4>
                {schools.length > 0 && (
                  <button
                    id="print-admin-rooms-report-btn"
                    onClick={handlePrintAdminRoomsReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all rounded-lg shadow-xs cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Reporte General de Habitaciones
                  </button>
                )}
              </div>

              {schools.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No hay escuelas dadas de alta aún.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b text-[10px] text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-6">Nombre de la Escuela</th>
                        <th className="py-3 px-6">Credenciales de Acceso</th>
                        <th className="py-3 px-6 text-center">Cupo Alumnos (Ocupado / Máx)</th>
                        <th className="py-3 px-6 text-center">Habitaciones Asignadas (H / M)</th>
                        <th className="py-3 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schools.map(s => {
                        // Calc quota utilization
                        const schoolDelegates = delegates.filter(d => d.schoolId === s.id && d.status === "selected");
                        const countSelected = schoolDelegates.length;

                        return (
                          <tr key={s.id} className="border-b hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 font-bold text-slate-900 text-sm">
                              {s.name}
                            </td>
                            <td className="py-4 px-6 font-mono text-[11px] text-slate-600">
                              <p><span className="text-slate-400 font-sans font-medium">U:</span> {s.username}</p>
                              <p><span className="text-slate-400 font-sans font-medium">P:</span> {s.passwordHash}</p>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                                {countSelected} / {s.maxQuota}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="font-semibold text-slate-800">
                                <span className="text-blue-600">H: {s.roomsMale || 0}</span> • <span className="text-pink-600">M: {s.roomsFemale || 0}</span>
                              </div>
                              {((s.roomNumbersMale && s.roomNumbersMale.some(n => n)) || (s.roomNumbersFemale && s.roomNumbersFemale.some(n => n))) ? (
                                <div className="text-[9px] text-slate-500 max-w-[180px] mx-auto mt-1 space-y-0.5">
                                  {s.roomNumbersMale && s.roomNumbersMale.filter(Boolean).length > 0 && (
                                    <div className="text-blue-600 truncate" title={`Hombres: ${s.roomNumbersMale.filter(Boolean).join(", ")}`}>
                                      H: {s.roomNumbersMale.filter(Boolean).join(", ")}
                                    </div>
                                  )}
                                  {s.roomNumbersFemale && s.roomNumbersFemale.filter(Boolean).length > 0 && (
                                    <div className="text-pink-600 truncate" title={`Mujeres: ${s.roomNumbersFemale.filter(Boolean).join(", ")}`}>
                                      M: {s.roomNumbersFemale.filter(Boolean).join(", ")}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400">Sin nums. hab.</span>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  id={`edit-school-btn-${s.id}`}
                                  onClick={() => handleEditSchoolClick(s)}
                                  className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                                  title="Editar"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  id={`delete-school-btn-${s.id}`}
                                  onClick={() => handleDeleteSchoolClick(s.id)}
                                  className="p-1.5 hover:bg-rose-50 text-rose-500 rounded-lg transition-colors cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 3: COMMITTEES AND COUNTRIES */}
        {activeTab === 'committees' && (
          <div id="section-committees" className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
            {/* Committees management */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6">
                <h4 className="text-sm font-bold text-slate-900 mb-4">
                  {editingCommittee ? "Editar Comité" : "Dar de Alta Comité"}
                </h4>

                <form onSubmit={handleSaveCommittee} className="space-y-4">
                  <div>
                    <label htmlFor="input-committee-name" className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Comité</label>
                    <input
                      id="input-committee-name"
                      type="text"
                      required
                      placeholder="Ej. UNSC (Consejo de Seguridad)"
                      value={committeeName}
                      onChange={(e) => setCommitteeName(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                    />
                  </div>

                  {/* Double Delegation toggle */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <input
                      id="input-committee-double"
                      type="checkbox"
                      checked={committeeDoubleDelegation}
                      onChange={(e) => setCommitteeDoubleDelegation(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="input-committee-double" className="text-xs font-semibold text-slate-800 cursor-pointer">
                      Comité en Pareja (Permite 2 delegados por país)
                    </label>
                  </div>

                  {/* Linked Countries checklist */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-slate-700">Países asignados a este comité ({committeeCountries.length})</label>
                      <div className="flex gap-2 text-[10px] text-indigo-600">
                        <button
                          type="button"
                          onClick={() => setCommitteeCountries(countries.map(c => c.id))}
                          className="hover:underline cursor-pointer"
                        >
                          Seleccionar Todos
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => setCommitteeCountries([])}
                          className="hover:underline cursor-pointer"
                        >
                          Desmarcar Todos
                        </button>
                      </div>
                    </div>

                    <div className="border border-slate-100 rounded-xl p-3 max-h-[160px] overflow-y-auto grid grid-cols-2 gap-2 bg-slate-50/50">
                      {countries.length === 0 ? (
                        <p className="text-[10px] text-slate-400 col-span-2 text-center py-2">Registra países primero en la columna derecha para poder vincularlos.</p>
                      ) : (
                        countries.map(c => {
                          const isChecked = committeeCountries.includes(c.id);
                          return (
                            <label key={c.id} className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 cursor-pointer text-xs">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setCommitteeCountries(committeeCountries.filter(id => id !== c.id));
                                  } else {
                                    setCommitteeCountries([...committeeCountries, c.id]);
                                  }
                                }}
                                className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                              />
                              <span className="truncate text-slate-700 font-medium">{c.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    {editingCommittee && (
                      <button
                        type="button"
                        onClick={() => {
                          setCommitteeId("");
                          setCommitteeName("");
                          setCommitteeDoubleDelegation(false);
                          setCommitteeCountries([]);
                          setEditingCommittee(false);
                        }}
                        className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                      >
                        Cancelar
                      </button>
                    )}
                    <button
                      id="save-committee-btn"
                      type="submit"
                      disabled={actionLoading}
                      className="px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {editingCommittee ? "Guardar Cambios" : "Agregar Comité"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white border border-slate-100 shadow-xs rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Comités Habilitados ({committees.length})</h4>
                </div>

                <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                  {committees.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-800 block">{c.name}</span>
                        <div className="flex gap-2 items-center text-[10px]">
                          <span className={`px-1.5 py-0.2 rounded font-semibold ${c.doubleDelegation ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-600'}`}>
                            {c.doubleDelegation ? "Pareja" : "Individual"}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-medium">{(c.countries || []).length} países asignados</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          id={`edit-com-btn-${c.id}`}
                          onClick={() => {
                            setCommitteeId(c.id);
                            setCommitteeName(c.name);
                            setCommitteeDoubleDelegation(!!c.doubleDelegation);
                            setCommitteeCountries(c.countries || []);
                            setEditingCommittee(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-com-btn-${c.id}`}
                          onClick={() => handleDeleteCommitteeClick(c.id)}
                          className="p-1 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Countries management */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6">
                <h4 className="text-sm font-bold text-slate-900 mb-4">
                  {editingCountry ? "Editar Nombre del País" : "Habilitar País para el Evento"}
                </h4>

                <form onSubmit={handleSaveCountry} className="flex gap-2.5">
                  <input
                    id="input-country-name"
                    type="text"
                    required
                    placeholder="Ej. Estados Unidos"
                    value={countryName}
                    onChange={(e) => setCountryName(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                  />
                  <button
                    id="save-country-btn"
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {editingCountry ? "Guardar" : "Agregar"}
                  </button>
                </form>
              </div>

              <div className="bg-white border border-slate-100 shadow-xs rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Países Habilitados ({countries.length})</h4>
                </div>

                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                  {countries.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                      <span className="text-xs font-semibold text-slate-800">{c.name}</span>
                      <div className="flex gap-1.5">
                        <button
                          id={`edit-cou-btn-${c.id}`}
                          onClick={() => {
                            setCountryId(c.id);
                            setCountryName(c.name);
                            setEditingCountry(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`delete-cou-btn-${c.id}`}
                          onClick={() => handleDeleteCountryClick(c.id)}
                          className="p-1 text-rose-400 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: DELEGATES AND COUNTRY/COMMITTEE ASSIGNMENT */}
        {activeTab === 'delegates' && (
          <div id="section-delegates" className="space-y-6 animate-fade-in">
            {/* Filters bar */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-5 space-y-4">
              {/* Quick Status and Assignment Tabs */}
              <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
                  <button
                    id="tab-status-all"
                    type="button"
                    onClick={() => setFilterStatus("")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      filterStatus === ""
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    Todos ({delegates.length})
                  </button>
                  <button
                    id="tab-status-selected"
                    type="button"
                    onClick={() => setFilterStatus("selected")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      filterStatus === "selected"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-100"
                    }`}
                  >
                    Participantes ({delegates.filter(d => d.status === "selected").length})
                  </button>
                  <button
                    id="tab-status-pending"
                    type="button"
                    onClick={() => setFilterStatus("pending")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      filterStatus === "pending"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white text-amber-700 hover:bg-amber-50 border border-amber-100"
                    }`}
                  >
                    Aspirantes ({delegates.filter(d => d.status === "pending").length})
                  </button>
                  <button
                    id="tab-status-rejected"
                    type="button"
                    onClick={() => setFilterStatus("rejected")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                      filterStatus === "rejected"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-white text-rose-700 hover:bg-rose-50 border border-rose-100"
                    }`}
                  >
                    Rechazados ({delegates.filter(d => d.status === "rejected").length})
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mr-1">Filtrar Asignación:</span>
                  <button
                    id="tab-assign-all"
                    type="button"
                    onClick={() => setFilterAssignment("all")}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                      filterAssignment === "all"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    Cualquiera
                  </button>
                  <button
                    id="tab-assign-unassigned"
                    type="button"
                    onClick={() => setFilterAssignment("unassigned")}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                      filterAssignment === "unassigned"
                        ? "bg-amber-500 text-white"
                        : "bg-white text-amber-600 hover:bg-amber-50 border border-amber-200"
                    }`}
                    title="No tiene Comité o País asignado"
                  >
                    Sin Asignar ({delegates.filter(d => d.status === "selected" && (!d.assignedCommitteeId || !d.assignedCountryId)).length})
                  </button>
                  <button
                    id="tab-assign-assigned"
                    type="button"
                    onClick={() => setFilterAssignment("assigned")}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                      filterAssignment === "assigned"
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-emerald-600 hover:bg-emerald-50 border border-emerald-200"
                    }`}
                    title="Tiene Comité y País asignado"
                  >
                    Asignados ({delegates.filter(d => d.status === "selected" && d.assignedCommitteeId && d.assignedCountryId).length})
                  </button>
                </div>
              </div>

              {/* Search and School filter row */}
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="delegate-search-bar"
                    type="text"
                    placeholder="Buscar por nombre, correo, teléfono..."
                    value={searchDelegateQuery}
                    onChange={(e) => setSearchDelegateQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800 bg-white"
                  />
                </div>

                <select
                  id="filter-delegate-school"
                  value={filterSchool}
                  onChange={(e) => setFilterSchool(e.target.value)}
                  className="w-full sm:w-56 px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white outline-hidden text-slate-800"
                >
                  <option value="">Todas las Escuelas</option>
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Table of assignments */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Delegados Encontrados ({filteredDelegates.length})
                </h4>

                <div className="flex gap-2">
                  <button
                    id="print-general-delegates-btn"
                    onClick={handlePrintGeneralReport}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir Reporte (PDF)
                  </button>
                  <button
                    id="export-general-delegates-csv"
                    onClick={handleExportDelegatesCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Excel (CSV)
                  </button>
                </div>
              </div>

              {filteredDelegates.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  No se encontraron delegados con los filtros indicados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b text-[10px] text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-6">Delegado / Datos</th>
                        <th className="py-3 px-6">Escuela y Estatus</th>
                        <th className="py-3 px-6">Preferencias Solicitadas</th>
                        <th className="py-3 px-6">Asignación Oficial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDelegates.map(d => {
                        return (
                          <tr key={d.id} className="border-b hover:bg-slate-50/50 transition-colors">
                            {/* Delegate Bio */}
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-900 text-sm">{d.names} {d.lastNames}</p>
                                <button
                                  id={`edit-delegate-btn-${d.id}`}
                                  onClick={() => startEditDelegate(d)}
                                  title="Editar datos del estudiante"
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-all cursor-pointer inline-flex items-center"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">{d.email}</p>
                              <p className="text-[10px] font-mono text-slate-400">{d.phone}</p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                <span className="bg-slate-100 text-slate-600 text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase">{d.sex || 'Hombre'}</span>
                                <span className="bg-slate-100 text-slate-600 text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase">Talla: {d.shirtSize || 'M'}</span>
                                <span className="bg-slate-100 text-slate-600 text-[8px] font-semibold px-1.5 py-0.5 rounded uppercase">{d.language || 'Español'}</span>
                              </div>
                            </td>

                            {/* School and Status */}
                            <td className="py-4 px-6">
                              <p className="font-semibold text-slate-800">{getSchoolName(d.schoolId)}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                  d.status === "selected" ? "bg-emerald-50 text-emerald-800 border border-emerald-100" : "bg-amber-50 text-amber-800 border border-amber-100"
                                }`}>
                                  {d.status === "selected" ? "PARTICIPANTE" : "ASPIRANTE"}
                                </span>

                                {/* Override option */}
                                <button
                                  id={`override-status-${d.id}`}
                                  onClick={() => handleUpdateStatusOverride(d.id, d.status === "selected" ? "pending" : "selected")}
                                  className="text-[9px] text-indigo-600 hover:underline cursor-pointer"
                                >
                                  Forzar {d.status === "selected" ? "Aspirante" : "Seleccionar"}
                                </button>
                              </div>
                            </td>

                            {/* Options choices */}
                            <td className="py-4 px-6">
                              <ol className="list-decimal list-inside text-[10px] text-slate-700 space-y-1 font-medium">
                                {d.choices.map((chId, idx) => {
                                  const com = committees.find(c => c.id === chId);
                                  if (!com) return <li key={idx} className="text-slate-400">Sin opción registrada</li>;
                                  const availCount = getAvailableCountriesForCommittee(d, com.id).length;
                                  const isAssigned = d.assignedCommitteeId === com.id;
                                  return (
                                    <li key={chId} className={`${isAssigned ? "text-slate-950 font-bold" : "text-slate-600"}`}>
                                      <span>{com.name}</span>
                                      <span className={`ml-1 text-[9px] px-1 py-0.2 rounded font-mono ${
                                        availCount > 0 ? "bg-slate-100 text-slate-700 font-semibold" : "bg-rose-50 text-rose-700"
                                      }`}>
                                        ({availCount} {availCount === 1 ? 'país disp.' : 'países disp.'})
                                      </span>
                                      {isAssigned && (
                                        <span className="ml-1 text-[8px] bg-slate-900 text-white font-bold px-1.5 py-0.2 rounded uppercase">
                                          Asignado
                                        </span>
                                      )}
                                    </li>
                                  );
                                })}
                              </ol>
                            </td>

                            {/* Direct Assignment Inputs */}
                            <td className="py-4 px-6">
                              {d.status !== "selected" ? (
                                <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2 font-medium">
                                  ⚠️ Solo participantes pueden recibir asignación. Cambia su estatus para habilitar.
                                </div>
                              ) : (() => {
                                // 1. Gather all choices and calculate availability
                                const chosenCommittees = d.choices
                                  .map((choiceId, idx) => {
                                    const com = committees.find(c => c.id === choiceId);
                                    if (!com) return null;
                                    const availCount = getAvailableCountriesForCommittee(d, com.id).length;
                                    return {
                                      committee: com,
                                      choiceIndex: idx + 1,
                                      availCount,
                                      hasAvailability: availCount > 0,
                                      isCurrentlyAssigned: d.assignedCommitteeId === com.id
                                    };
                                  })
                                  .filter((item): item is NonNullable<typeof item> => item !== null);

                                const chosenIds = chosenCommittees.map(item => item.committee.id);

                                // 2. All other committees with availability (or currently assigned)
                                const otherCommitteesWithAvailability = committees
                                  .filter(c => !chosenIds.includes(c.id))
                                  .map(com => {
                                    const availCount = getAvailableCountriesForCommittee(d, com.id).length;
                                    return {
                                      committee: com,
                                      availCount,
                                      hasAvailability: availCount > 0,
                                      isCurrentlyAssigned: d.assignedCommitteeId === com.id
                                    };
                                  })
                                  .filter(item => item.hasAvailability || item.isCurrentlyAssigned);

                                // 3. Available countries for currently assigned committee (strictly excluding countries assigned to other students)
                                const availableCountriesForAssigned = getAvailableCountriesForCommittee(d, d.assignedCommitteeId);
                                const isCurrentCommitteeAChosenPreference = !!(d.assignedCommitteeId && d.choices.includes(d.assignedCommitteeId));

                                return (
                                  <div className="space-y-2 max-w-[240px]">
                                    {/* COMMITTEE SELECT */}
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-slate-400 font-semibold uppercase">Comité</span>
                                        {isCurrentCommitteeAChosenPreference && (
                                          <span className="text-[8px] bg-black text-white font-extrabold px-1.5 py-0.2 rounded uppercase">
                                            ★ Preferencia elegida
                                          </span>
                                        )}
                                      </div>
                                      <select
                                        id={`assign-com-${d.id}`}
                                        value={d.assignedCommitteeId || ""}
                                        onChange={(e) => handleAssignClick(d.id, e.target.value, "")} // Reset country when changing committee
                                        className={`w-full px-2 py-1.5 text-[11px] border rounded-md bg-white outline-hidden transition-all ${
                                          isCurrentCommitteeAChosenPreference
                                            ? "border-black text-black font-extrabold ring-1 ring-black/20"
                                            : "border-slate-200 text-slate-800 font-medium"
                                        }`}
                                      >
                                        <option value="">-- Sin Comité Asignado --</option>

                                        {/* PREFERENCIAS ELEGIDAS POR EL ALUMNO (RESALTADAS EN NEGRO) */}
                                        {chosenCommittees.length > 0 && (
                                          <optgroup label="★ PREFERENCIAS ELEGIDAS POR EL ALUMNO (RESALTADAS)">
                                            {chosenCommittees.map(({ committee: c, choiceIndex, availCount, hasAvailability }) => (
                                              <option
                                                key={c.id}
                                                value={c.id}
                                                disabled={!hasAvailability && d.assignedCommitteeId !== c.id}
                                                className="font-black text-black bg-slate-100"
                                                style={{ fontWeight: "900", color: "#000000", backgroundColor: "#f1f5f9" }}
                                              >
                                                ★ [Opción {choiceIndex} del alumno] {c.name} ({availCount} {availCount === 1 ? 'país disponible' : 'países disponibles'}{!hasAvailability ? ' - Lleno' : ''})
                                              </option>
                                            ))}
                                          </optgroup>
                                        )}

                                        {/* OTROS COMITÉS CON PAÍSES DISPONIBLES */}
                                        {otherCommitteesWithAvailability.length > 0 && (
                                          <optgroup label="OTROS COMITÉS CON PAÍSES DISPONIBLES">
                                            {otherCommitteesWithAvailability.map(({ committee: c, availCount }) => (
                                              <option
                                                key={c.id}
                                                value={c.id}
                                                className="font-normal text-slate-700"
                                                style={{ fontWeight: "normal", color: "#334155" }}
                                              >
                                                {c.name} ({availCount} {availCount === 1 ? 'país disponible' : 'países disponibles'}) {c.doubleDelegation ? '(Pareja)' : '(Individual)'}
                                              </option>
                                            ))}
                                          </optgroup>
                                        )}
                                      </select>

                                      {/* Quick-assign buttons for the student's chosen preferences (resaltadas en negro) */}
                                      {chosenCommittees.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {chosenCommittees.map(({ committee: c, choiceIndex, availCount, hasAvailability }) => {
                                            const isSelected = d.assignedCommitteeId === c.id;
                                            return (
                                              <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => handleAssignClick(d.id, c.id, "")}
                                                disabled={!hasAvailability && !isSelected}
                                                title={`Opción ${choiceIndex}: ${c.name} (${availCount} países disponibles)`}
                                                className={`px-1.5 py-0.5 text-[9px] rounded font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                                                  isSelected
                                                    ? "bg-black text-white shadow-xs"
                                                    : hasAvailability
                                                    ? "bg-slate-100 hover:bg-slate-200 text-black border border-slate-300"
                                                    : "bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed"
                                                }`}
                                              >
                                                <span className="text-amber-500 font-bold">★</span>
                                                <span>Opc {choiceIndex}:</span>
                                                <span className="truncate max-w-[80px]">{c.name.split(" ")[0]}</span>
                                                <span className={`text-[8px] px-1 py-0.2 rounded font-mono ${
                                                  isSelected ? "bg-white/20 text-white" : availCount > 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
                                                }`}>
                                                  {availCount}
                                                </span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>

                                    {/* COUNTRY SELECT (NO muestra países ya asignados a otro estudiante) */}
                                    <div className="flex flex-col gap-0.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[9px] text-slate-400 font-semibold uppercase">País asignado</span>
                                        {d.assignedCommitteeId && (
                                          <span className={`text-[9px] font-semibold ${availableCountriesForAssigned.length > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                            {availableCountriesForAssigned.length} disponibles
                                          </span>
                                        )}
                                      </div>
                                      <select
                                        id={`assign-cou-${d.id}`}
                                        value={d.assignedCountryId || ""}
                                        disabled={!d.assignedCommitteeId}
                                        onChange={(e) => handleAssignClick(d.id, d.assignedCommitteeId || "", e.target.value)}
                                        className="w-full px-2 py-1.5 text-[11px] border border-slate-200 rounded-md bg-white text-slate-800 outline-hidden disabled:bg-slate-50 disabled:text-slate-400"
                                      >
                                        <option value="">
                                          {!d.assignedCommitteeId
                                            ? "Selecciona un comité primero"
                                            : availableCountriesForAssigned.length === 0
                                            ? "⚠️ Sin países disponibles en este comité"
                                            : "-- Sin País asignado --"}
                                        </option>
                                        {availableCountriesForAssigned.map(c => {
                                          const committeeObj = committees.find(com => com.id === d.assignedCommitteeId);
                                          const isCurrent = d.assignedCountryId === c.id;
                                          const otherPartner = committeeObj?.doubleDelegation
                                            ? delegates.find(
                                                del => del.id !== d.id &&
                                                       del.status === "selected" &&
                                                       del.assignedCommitteeId === d.assignedCommitteeId &&
                                                       del.assignedCountryId === c.id
                                              )
                                            : null;

                                          let label = c.name;
                                          if (isCurrent) {
                                            label = `${c.name} ★ (Asignación actual)`;
                                          } else if (otherPartner) {
                                            label = `${c.name} (1 lugar disponible - Pareja con ${otherPartner.names} ${otherPartner.lastNames})`;
                                          }

                                          return (
                                            <option key={c.id} value={c.id}>
                                              {label}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </div>
                                  </div>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 5: FINANCES & FOLIO CASH RECEIPTS */}
        {activeTab === 'finances' && (
          <div id="section-finances" className="space-y-6 animate-fade-in">
            {/* Financial Metrics Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Recaudado</p>
                <p className="text-xl font-extrabold text-indigo-600 mt-1 font-mono">
                  {formatCurrency(payments.reduce((acc, p) => acc + p.amount, 0))}
                </p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Folios Emitidos</p>
                <p className="text-xl font-extrabold text-slate-800 mt-1 font-mono">
                  {payments.length} recibos
                </p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Participantes Pagados</p>
                <p className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">
                  {delegates.filter(d => {
                    const paid = getStudentPaymentsSum(d.id);
                    const totalRequired = config.totalAmountToPay ?? (config.paymentAmount * config.numPaymentsRequired);
                    return d.status === "selected" && paid >= totalRequired;
                  }).length} delegados
                </p>
              </div>
              <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Próximo Folio</p>
                <p className="text-xl font-extrabold text-slate-500 mt-1 font-mono">
                  #{config.currentReceiptFolio}
                </p>
              </div>
            </div>

            {/* Toggle sub-tabs for Finances */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
              <button
                type="button"
                id="finances-subtab-individual"
                onClick={() => setFinancesSubTab('individual')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  financesSubTab === 'individual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cobro Individual
              </button>
              <button
                type="button"
                id="finances-subtab-batch"
                onClick={() => setFinancesSubTab('batch')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  financesSubTab === 'batch' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Cobro Grupal (Lote por Escuela)
              </button>
            </div>

            {financesSubTab === 'individual' ? (
              /* Add payment form (Creates receipt) */
              <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Registrar Nuevo Cobro (Generar Recibo con Folio)</h4>

                <form onSubmit={handleAddPaymentClick} className="space-y-4">
                  {/* Search / Select Student */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 relative">
                      <label htmlFor="search-pay-student" className="block text-xs font-medium text-slate-700 mb-1">Buscar Alumno / Delegado *</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="search-pay-student"
                          type="text"
                          placeholder="Escribe el nombre del delegado..."
                          value={searchPayStudentQuery}
                          onChange={(e) => {
                            setSearchPayStudentQuery(e.target.value);
                            if (!e.target.value) setPayStudentId("");
                          }}
                          className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                        />
                      </div>
                      {/* Search results popover */}
                      {searchPayStudentQuery && !payStudentId && searchableStudentsForPayment.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl max-h-40 overflow-y-auto z-10 shadow-lg divide-y divide-slate-100">
                          {searchableStudentsForPayment.map(s => {
                            const paidSum = getStudentPaymentsSum(s.id);
                            const totalRequired = config.totalAmountToPay ?? (config.paymentAmount * config.numPaymentsRequired);
                            const isFinished = paidSum >= totalRequired;

                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => {
                                  setPayStudentId(s.id);
                                  setSearchPayStudentQuery(`${s.names} ${s.lastNames} (${getSchoolName(s.schoolId)})`);
                                  // Auto suggest payment index
                                  const currentPaymentsCount = getStudentPaymentsCount(s.id);
                                  setPayIndex(Math.min(config.numPaymentsRequired, currentPaymentsCount + 1));
                                  // Auto suggest remaining debt capped at standard payment amount
                                  const totalRequired = config.totalAmountToPay ?? (config.numPaymentsRequired * config.paymentAmount);
                                  const remainingDebt = Math.max(0, totalRequired - paidSum);
                                  setPayAmount(remainingDebt > 0 ? Math.min(config.paymentAmount, remainingDebt) : 0);
                                }}
                                className="w-full text-left p-2 text-xs hover:bg-slate-50 transition-colors flex justify-between items-center"
                              >
                                <div>
                                  <p className="font-bold text-slate-800">{s.names} {s.lastNames}</p>
                                  <p className="text-[10px] text-slate-500">{getSchoolName(s.schoolId)}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isFinished ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>
                                    Total: {formatCurrency(paidSum)}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {payStudentId && (
                      <div className="sm:col-span-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            Estado de Cuenta de {delegates.find(d => d.id === payStudentId)?.names} {delegates.find(d => d.id === payStudentId)?.lastNames}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
                            Escuela: {getSchoolName(delegates.find(d => d.id === payStudentId)?.schoolId || "")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs w-full md:w-auto">
                          <div className="text-left md:text-right flex-1 md:flex-initial">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Monto Total</p>
                            <p className="font-bold text-slate-700 font-mono mt-0.5">
                              {formatCurrency(config.totalAmountToPay ?? (config.numPaymentsRequired * config.paymentAmount))}
                            </p>
                          </div>
                          <div className="text-left md:text-right flex-1 md:flex-initial">
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Abonado Acumulado</p>
                            <p className="font-bold text-emerald-600 font-mono mt-0.5">
                              {formatCurrency(payments.filter(p => p.studentId === payStudentId).reduce((sum, p) => sum + p.amount, 0))}
                            </p>
                          </div>
                          <div className="text-left md:text-right bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl flex-1 md:flex-initial">
                            <p className="text-[9px] text-rose-500 font-extrabold uppercase tracking-wider">Adeudo Restante</p>
                            <p className="font-black text-rose-700 font-mono text-sm mt-0.5">
                              {formatCurrency(Math.max(0, (config.totalAmountToPay ?? (config.numPaymentsRequired * config.paymentAmount)) - payments.filter(p => p.studentId === payStudentId).reduce((sum, p) => sum + p.amount, 0)))}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="pay-select-index" className="block text-xs font-medium text-slate-700 mb-1">Concepto o Número de Pago *</label>
                      <select
                        id="pay-select-index"
                        value={payIndex}
                        onChange={(e) => setPayIndex(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 outline-hidden"
                      >
                        {Array.from({ length: config.numPaymentsRequired }, (_, i) => i + 1).map(n => (
                          <option key={n} value={n}>Pago #{n} de {config.numPaymentsRequired}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="pay-amount-input" className="block text-xs font-medium text-slate-700 mb-1">Monto Cobrado ($ MXN) *</label>
                      <input
                        id="pay-amount-input"
                        type="number"
                        required
                        min="1"
                        value={payAmount}
                        onChange={(e) => setPayAmount(Number(e.target.value))}
                        className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                      />
                    </div>

                    <div>
                      <label htmlFor="pay-notes-input" className="block text-xs font-medium text-slate-700 mb-1">Notas / Observaciones del Recibo</label>
                      <input
                        id="pay-notes-input"
                        type="text"
                        placeholder="Ej. Transferencia Bancomer, pago en efectivo..."
                        value={payNotes}
                        onChange={(e) => setPayNotes(e.target.value)}
                        className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      id="submit-payment-btn"
                      type="submit"
                      disabled={actionLoading || !payStudentId}
                      className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl transition-all shadow-xs cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Asentar Pago y Generar Folio
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Batch Payments Section */
              <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Registrar Cobro Grupal (Pago en Lote)</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Asienta múltiples abonos de alumnos de una misma escuela en una sola transacción, y genera todos sus recibos juntos.</p>
                </div>

                {lastBatchGeneratedPayments.length > 0 && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <p className="text-xs font-bold text-emerald-800">🎉 ¡Cobro grupal procesado con éxito!</p>
                      <p className="text-[10px] text-emerald-600">Se generaron {lastBatchGeneratedPayments.length} recibos con folio en esta transacción.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handlePrintBatchReceipts(lastBatchGeneratedPayments)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-xs cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimir Todos los Recibos (${lastBatchGeneratedPayments.reduce((acc, p) => acc + p.amount, 0)}.00)
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Select school */}
                  <div>
                    <label htmlFor="batch-school-select" className="block text-xs font-semibold text-slate-700 mb-1">Seleccionar Escuela Participante</label>
                    <select
                      id="batch-school-select"
                      value={batchSelectedSchoolId}
                      onChange={(e) => {
                        setBatchSelectedSchoolId(e.target.value);
                        setLastBatchGeneratedPayments([]);
                        setBatchPaymentAmounts({});
                        setBatchPaymentNotes({});
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 outline-hidden"
                    >
                      <option value="">-- Selecciona una escuela para listar sus alumnos --</option>
                      {schools.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {batchSelectedSchoolId && (
                    <div className="space-y-4 pt-2 border-t border-slate-100 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Listado de Alumnos (Sólo Participantes)</span>
                        <button
                          type="button"
                          onClick={() => {
                            const suggested: Record<string, number> = {};
                            const activeStudents = delegates.filter(d => d.schoolId === batchSelectedSchoolId && d.status === 'selected');
                            activeStudents.forEach(st => {
                              const sugg = getStudentSuggestedPayment(st.id);
                              if (sugg > 0) suggested[st.id] = sugg;
                            });
                            setBatchPaymentAmounts(suggested);
                          }}
                          className="text-[10px] text-indigo-600 hover:underline cursor-pointer font-semibold"
                        >
                          Llenar todos con sugerido
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-slate-100 rounded-xl bg-slate-50/50">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b bg-slate-100/50 font-bold text-[10px] text-slate-500 uppercase">
                              <th className="py-2.5 px-4">Delegado</th>
                              <th className="py-2.5 px-4 text-center">Progreso Pagos</th>
                              <th className="py-2.5 px-4">Monto a Cobrar ($)</th>
                              <th className="py-2.5 px-4">Notas / Observación del Recibo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {delegates.filter(d => d.schoolId === batchSelectedSchoolId && d.status === 'selected').length === 0 ? (
                              <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">
                                  No hay alumnos registrados con estatus de PARTICIPANTE para esta escuela.
                                </td>
                              </tr>
                            ) : (
                              delegates.filter(d => d.schoolId === batchSelectedSchoolId && d.status === 'selected').map(st => {
                                const totalPaid = getStudentPaymentsSum(st.id);
                                const totalRequired = config.totalAmountToPay ?? (config.paymentAmount * config.numPaymentsRequired);
                                const isFinished = totalPaid >= totalRequired;
                                const suggested = getStudentSuggestedPayment(st.id);

                                return (
                                  <tr key={st.id} className="border-b hover:bg-white transition-colors">
                                    <td className="py-3 px-4">
                                      <p className="font-bold text-slate-800">{st.names} {st.lastNames}</p>
                                      <p className="text-[10px] text-slate-500">{st.email}</p>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                        isFinished ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                                      }`}>
                                        {formatCurrency(totalPaid)} de {formatCurrency(totalRequired)}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="number"
                                          placeholder="0"
                                          min="0"
                                          value={batchPaymentAmounts[st.id] !== undefined && batchPaymentAmounts[st.id] !== 0 ? batchPaymentAmounts[st.id] : ""}
                                          onChange={(e) => {
                                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                                            setBatchPaymentAmounts({
                                              ...batchPaymentAmounts,
                                              [st.id]: val
                                            });
                                          }}
                                          disabled={isFinished}
                                          className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                        {!isFinished && suggested > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => setBatchPaymentAmounts({
                                              ...batchPaymentAmounts,
                                              [st.id]: suggested
                                            })}
                                            className="text-[9px] text-indigo-600 hover:bg-indigo-50 px-1.5 py-1 rounded border border-indigo-100"
                                            title={`Sugerido: ${formatCurrency(suggested)}`}
                                          >
                                            Sug: ${suggested}
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <input
                                        type="text"
                                        placeholder="Ej. Transferencia"
                                        value={batchPaymentNotes[st.id] || ""}
                                        onChange={(e) => setBatchPaymentNotes({
                                          ...batchPaymentNotes,
                                          [st.id]: e.target.value
                                        })}
                                        disabled={isFinished}
                                        className="w-full max-w-[200px] px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500 outline-hidden disabled:bg-slate-100"
                                      />
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Transaction Summary */}
                      {Object.keys(batchPaymentAmounts).filter(id => batchPaymentAmounts[id] > 0).length > 0 && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                          <div className="text-center sm:text-left">
                            <p className="text-xs font-semibold text-indigo-800">Resumen de Pago por Lote</p>
                            <p className="text-[11px] text-indigo-600 mt-0.5">
                              Se registrarán abonos para <span className="font-bold">{Object.keys(batchPaymentAmounts).filter(id => batchPaymentAmounts[id] > 0).length} alumnos</span>.
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block font-bold uppercase">Monto Total</span>
                              <span className="text-lg font-extrabold text-slate-950 font-mono">
                                {formatCurrency((Object.values(batchPaymentAmounts) as number[]).reduce((sum: number, a: number) => sum + a, 0))}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleProcessBatchPayments}
                              disabled={actionLoading}
                              className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                              Procesar Transacción Grupal
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* List of Payments with receipt reprint */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Historial de Pagos y Recibos Emitidos</h4>
                
                <button
                  id="export-finances-csv-btn"
                  onClick={handleExportFinancesCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-100 rounded-lg transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Exportar Finanzas (Excel)
                </button>
              </div>

              {payments.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Aún no hay ningún pago registrado en el sistema.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 font-bold border-b text-[10px] text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-6">Folio / Fecha</th>
                        <th className="py-3 px-6">Alumno / Delegado</th>
                        <th className="py-3 px-6">Concepto</th>
                        <th className="py-3 px-6 text-right">Monto</th>
                        <th className="py-3 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...payments].reverse().map(p => {
                        const student = delegates.find(d => d.id === p.studentId);
                        
                        return (
                          <tr key={p.id} className="border-b hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <p className="font-bold text-indigo-600 font-mono">#{p.folio}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{formatDateShort(p.date)}</p>
                            </td>
                            <td className="py-4 px-6">
                              {student ? (
                                <div>
                                  <p className="font-bold text-slate-900">{student.names} {student.lastNames}</p>
                                  <p className="text-[10px] text-slate-400">{getSchoolName(student.schoolId)}</p>
                                </div>
                              ) : (
                                <p className="text-rose-500 font-semibold italic">Alumno Eliminado</p>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <p className="font-medium text-slate-700">Pago #{p.paymentIndex} de {config.numPaymentsRequired}</p>
                              {p.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">Nota: {p.notes}</p>}
                            </td>
                            <td className="py-4 px-6 text-right font-bold font-mono text-slate-900 text-sm">
                              {formatCurrency(p.amount)}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  id={`print-receipt-modal-btn-${p.id}`}
                                  onClick={() => setSelectedReceiptPayment(p)}
                                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-100 rounded-md transition-all cursor-pointer"
                                  title="Imprimir o Reimprimir Recibo"
                                >
                                  <Printer className="w-3 h-3" />
                                  Reimprimir
                                </button>
                                <button
                                  id={`void-payment-btn-${p.id}`}
                                  onClick={() => handleDeletePaymentClick(p.id)}
                                  className="p-1 hover:bg-rose-50 text-rose-500 rounded-md transition-all cursor-pointer"
                                  title="Anular Pago"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 6: ADMIN USER MANAGEMENT */}
        {activeTab === 'admins' && (
          <div id="section-admins" className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
            {/* Form Column */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6 h-fit">
              <h4 className="text-sm font-bold text-slate-900 mb-4">
                {editingAdmin ? 'Editar Usuario Admin' : 'Registrar Nuevo Administrador'}
              </h4>

              <form onSubmit={handleSaveAdmin} className="space-y-4">
                <div>
                  <label htmlFor="admin-name" className="block text-xs font-medium text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    id="admin-name"
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={adminUserName}
                    onChange={(e) => setAdminUserName(e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label htmlFor="admin-username" className="block text-xs font-medium text-slate-700 mb-1">Nombre de Usuario (Login) *</label>
                  <input
                    id="admin-username"
                    type="text"
                    required
                    placeholder="Ej. jperez"
                    value={adminUserUsername}
                    onChange={(e) => setAdminUserUsername(e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label htmlFor="admin-pass" className="block text-xs font-medium text-slate-700 mb-1">Contraseña *</label>
                  <input
                    id="admin-pass"
                    type="password"
                    required
                    placeholder="Escribe la contraseña..."
                    value={adminUserPassword}
                    onChange={(e) => setAdminUserPassword(e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800"
                  />
                </div>

                <div>
                  <label htmlFor="admin-role" className="block text-xs font-medium text-slate-700 mb-1">Rol / Permisos *</label>
                  <select
                    id="admin-role"
                    value={adminUserRole}
                    onChange={(e) => setAdminUserRole(e.target.value as 'superadmin' | 'finance' | 'coordinator')}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 outline-hidden"
                  >
                    <option value="coordinator">Coordinador (Gestión de alumnos, escuelas, países y comités)</option>
                    <option value="finance">Finanzas (Cobros, recibos por lote y caja general)</option>
                    <option value="superadmin">Superadmin (Acceso total, gestión de usuarios)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  {editingAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminUserId("");
                        setAdminUserName("");
                        setAdminUserUsername("");
                        setAdminUserPassword("");
                        setAdminUserRole("coordinator");
                        setEditingAdmin(false);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:bg-indigo-300"
                  >
                    {editingAdmin ? 'Guardar Cambios' : 'Registrar Administrador'}
                  </button>
                </div>
              </form>
            </div>

            {/* List Column */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl overflow-hidden lg:col-span-2">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Usuarios Administradores</h4>
                <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                  {adminUsers.length} total
                </span>
              </div>

              {adminUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No hay usuarios administradores registrados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-100/50 font-bold text-[10px] text-slate-500 uppercase">
                        <th className="py-2.5 px-6">Nombre</th>
                        <th className="py-2.5 px-6">Usuario</th>
                        <th className="py-2.5 px-6">Rol</th>
                        <th className="py-2.5 px-6 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map(user => (
                        <tr key={user.id} className="border-b hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-800">
                            {user.name}
                            {loggedInAdmin?.id === user.id && (
                              <span className="ml-2 text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-medium">Tú</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-slate-600 font-mono">
                            {user.username}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                              user.role === 'superadmin' ? 'bg-indigo-100 text-indigo-800' :
                              user.role === 'finance' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {user.role === 'superadmin' ? 'Superadmin' :
                               user.role === 'finance' ? 'Finanzas' :
                               'Coordinador'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => {
                                  setAdminUserId(user.id);
                                  setAdminUserName(user.name);
                                  setAdminUserUsername(user.username);
                                  setAdminUserPassword(user.passwordHash);
                                  setAdminUserRole(user.role);
                                  setEditingAdmin(true);
                                }}
                                className="p-1 hover:bg-indigo-50 text-indigo-600 rounded-md transition-all cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAdminClick(user.id)}
                                disabled={loggedInAdmin?.id === user.id}
                                className="p-1 hover:bg-rose-50 text-rose-500 rounded-md transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Eliminar"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 7: SYSTEM REPORTS PANEL */}
        {activeTab === 'reports' && (
          <div id="section-reports" className="space-y-6 animate-fade-in">
            {/* Header Description */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    Centro de Reportes y Estadísticas
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Accede y exporta reportes detallados en formato CSV para Excel o genera reportes imprimibles en formato PDF listos para uso del comité organizador.
                  </p>
                </div>
                <div className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl">
                  Ciclo Activo: {activeCycleId || "cycle-2000"}
                </div>
              </div>
            </div>

            {/* Quick Actions - Centralized existing reports */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-5 hover:border-slate-200 transition-all">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 mb-3">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Listado de Delegados (Excel)</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed min-h-[44px]">
                  Todos los registros con estatus, comités y países asignados, datos de contacto y total pagado.
                </p>
                <button
                  id="reports-export-delegates"
                  onClick={handleExportDelegatesCSV}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
              </div>

              <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-5 hover:border-slate-200 transition-all">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 mb-3">
                  <DollarSign className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Historial Financiero (Excel)</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed min-h-[44px]">
                  Detalle de todos los folios y recibos de pago capturados en el sistema con observaciones.
                </p>
                <button
                  id="reports-export-finances"
                  onClick={handleExportFinancesCSV}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-all cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
              </div>

              <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-5 hover:border-slate-200 transition-all">
                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-3">
                  <Printer className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Distribución de Cuartos (PDF)</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed min-h-[44px]">
                  Reporte oficial de habitaciones asignadas (Hombres/Mujeres) por cada escuela con cupos.
                </p>
                <button
                  id="reports-print-rooms"
                  onClick={handlePrintAdminRoomsReport}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir PDF
                </button>
              </div>

              <div className="bg-white border border-slate-100 shadow-xs rounded-2xl p-5 hover:border-slate-200 transition-all">
                <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 mb-3">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Lista General de Alumnos (PDF)</h4>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed min-h-[44px]">
                  Vista de impresión oficial con estadísticas generales de participación y cobros consolidados.
                </p>
                <button
                  id="reports-print-general"
                  onClick={handlePrintGeneralReport}
                  className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir PDF
                </button>
              </div>
            </div>

            {/* Dynamic Report Creator & Visualizer Section */}
            <div className="bg-white border border-slate-100 shadow-xs rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Visualizador de Reportes en Tiempo Real</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Analiza métricas específicas en pantalla y expórtalas al instante</p>
                </div>
                
                {/* Sub-tabs Selector */}
                <div className="flex bg-slate-200/60 p-1 rounded-xl w-full sm:w-auto">
                  <button
                    id="sub-tab-shirts"
                    onClick={() => setActiveReportSubTab('shirts')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeReportSubTab === 'shirts' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👕 Tallas de Playera
                  </button>
                  <button
                    id="sub-tab-committees"
                    onClick={() => setActiveReportSubTab('committees')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeReportSubTab === 'committees' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🏛️ Comités y Vacantes
                  </button>
                  <button
                    id="sub-tab-balances"
                    onClick={() => setActiveReportSubTab('balances')}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      activeReportSubTab === 'balances' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    💳 Saldos y Deudas
                  </button>
                </div>
              </div>

              {/* REPORT 1: SHIRT SIZES COUNT */}
              {activeReportSubTab === 'shirts' && (() => {
                const activeDels = delegates.filter(d => d.status === 'selected');
                const sizesList: ('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
                
                const exportShirtSizesToCSV = () => {
                  const data: any[] = sizesList.map(sz => {
                    const maleCount = activeDels.filter(d => d.shirtSize === sz && d.sex === 'Hombre').length;
                    const femaleCount = activeDels.filter(d => d.shirtSize === sz && d.sex === 'Mujer').length;
                    return {
                      "Talla": sz,
                      "Hombres": maleCount,
                      "Mujeres": femaleCount,
                      "Total": maleCount + femaleCount
                    };
                  });
                  // Add total row
                  const totalMale = activeDels.filter(d => d.sex === 'Hombre').length;
                  const totalFemale = activeDels.filter(d => d.sex === 'Mujer').length;
                  data.push({
                    "Talla": "TOTAL GENERAL",
                    "Hombres": totalMale,
                    "Mujeres": totalFemale,
                    "Total": totalMale + totalFemale
                  });
                  exportToCSV(data, "MUN_Reporte_Tallas_Playera");
                };

                return (
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">Resumen Oficial de Tallas (Alumnos Seleccionados)</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Muestra la cantidad de playeras requeridas por cada sexo para compras</p>
                      </div>
                      <button
                        id="export-shirts-csv"
                        onClick={exportShirtSizesToCSV}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Exportar Resumen
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b bg-slate-50 font-bold text-slate-500 text-[10px] uppercase">
                            <th className="py-3 px-6">Talla</th>
                            <th className="py-3 px-6 text-blue-600">Hombres</th>
                            <th className="py-3 px-6 text-pink-600">Mujeres</th>
                            <th className="py-3 px-6 text-slate-800">Total Playeras</th>
                            <th className="py-3 px-6">Progreso Visual</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {sizesList.map(sz => {
                            const maleCount = activeDels.filter(d => d.shirtSize === sz && d.sex === 'Hombre').length;
                            const femaleCount = activeDels.filter(d => d.shirtSize === sz && d.sex === 'Mujer').length;
                            const totalSz = maleCount + femaleCount;
                            const maxCount = Math.max(...sizesList.map(s => activeDels.filter(d => d.shirtSize === s).length), 1);
                            const percentage = (totalSz / maxCount) * 100;

                            return (
                              <tr key={sz} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-3 px-6 font-extrabold text-slate-900 text-sm">{sz}</td>
                                <td className="py-3 px-6 font-semibold text-blue-600">{maleCount}</td>
                                <td className="py-3 px-6 font-semibold text-pink-600">{femaleCount}</td>
                                <td className="py-3 px-6 font-bold text-slate-900">{totalSz}</td>
                                <td className="py-3 px-6 w-1/3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                      <div
                                        className="bg-indigo-600 h-2 rounded-full"
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">{totalSz > 0 ? `${Math.round((totalSz / activeDels.length) * 100)}%` : '0%'}</span>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                            <td className="py-3 px-6 text-slate-900 uppercase">Totales</td>
                            <td className="py-3 px-6 text-blue-700 font-extrabold">{activeDels.filter(d => d.sex === 'Hombre').length}</td>
                            <td className="py-3 px-6 text-pink-700 font-extrabold">{activeDels.filter(d => d.sex === 'Mujer').length}</td>
                            <td className="py-3 px-6 text-slate-900 font-extrabold">{activeDels.length}</td>
                            <td className="py-3 px-6">
                              <span className="text-[10px] text-slate-500">100% de Alumnos Seleccionados</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* REPORT 2: COMMITTEES AND COUNTRIES VACANCIES */}
              {activeReportSubTab === 'committees' && (() => {
                const activeDels = delegates.filter(d => d.status === 'selected');
                
                const exportCommitteesToCSV = () => {
                  const data: any[] = committees.map((c, i) => {
                    const assigned = activeDels.filter(d => d.assignedCommitteeId === c.id);
                    return {
                      "Nº": i + 1,
                      "Comité": c.name,
                      "Modalidad": c.doubleDelegation ? "Pareja" : "Individual",
                      "Idioma": c.language || "Español",
                      "Delegados Asignados": assigned.length
                    };
                  });
                  exportToCSV(data, "MUN_Reporte_Comites_Asignaciones");
                };

                return (
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">Ocupación y Asignación de Comités</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Analiza el número de delegados asignados a cada comité en el ciclo escolar activo</p>
                      </div>
                      <button
                        id="export-committees-csv"
                        onClick={exportCommitteesToCSV}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Exportar Asignaciones
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b bg-slate-50 font-bold text-slate-500 text-[10px] uppercase">
                            <th className="py-3 px-6">Comité</th>
                            <th className="py-3 px-6">Modalidad</th>
                            <th className="py-3 px-6">Idioma</th>
                            <th className="py-3 px-6">Delegados Asignados</th>
                            <th className="py-3 px-6">Porcentaje de Ocupación</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {committees.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">No hay comités registrados.</td>
                            </tr>
                          ) : (
                            committees.map(c => {
                              const assigned = activeDels.filter(d => d.assignedCommitteeId === c.id);
                              const totalAssignedCount = activeDels.filter(d => d.assignedCommitteeId).length || 1;
                              const pctOfTotal = (assigned.length / totalAssignedCount) * 100;

                              return (
                                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-3 px-6 font-bold text-slate-900">{c.name}</td>
                                  <td className="py-3 px-6 font-mono text-xs text-slate-500 font-semibold">{c.doubleDelegation ? "Pareja" : "Individual"}</td>
                                  <td className="py-3 px-6">
                                    <span className="bg-slate-100 text-slate-600 text-[9px] font-semibold px-2 py-0.5 rounded uppercase">
                                      {c.language || "Español"}
                                    </span>
                                  </td>
                                  <td className="py-3 px-6 font-bold text-slate-900 text-sm">{assigned.length}</td>
                                  <td className="py-3 px-6 w-1/3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div
                                          className="bg-indigo-600 h-2 rounded-full"
                                          style={{ width: `${Math.min(pctOfTotal, 100)}%` }}
                                        ></div>
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-400">{assigned.length > 0 ? `${Math.round(pctOfTotal)}%` : '0%'}</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* REPORT 3: DEBTS AND BALANCES PER SCHOOL */}
              {activeReportSubTab === 'balances' && (() => {
                const totalRequired = config.totalAmountToPay ?? (config.paymentAmount * config.numPaymentsRequired);
                
                const exportSchoolBalancesToCSV = () => {
                  const data: any[] = schools.map((s, i) => {
                    const activeInSchool = delegates.filter(d => d.schoolId === s.id && d.status === 'selected');
                    const totalPaid = activeInSchool.reduce((sum, d) => sum + getStudentPaymentsSum(d.id), 0);
                    const expected = activeInSchool.length * totalRequired;
                    const pending = Math.max(0, expected - totalPaid);
                    return {
                      "Nº": i + 1,
                      "Escuela": s.name,
                      "Delegados Seleccionados": activeInSchool.length,
                      "Monto Unitario": totalRequired,
                      "Total Esperado": expected,
                      "Total Pagado": totalPaid,
                      "Saldo Pendiente (Deuda)": pending
                    };
                  });

                  const totalDelegates = schools.reduce((sum, s) => sum + delegates.filter(d => d.schoolId === s.id && d.status === 'selected').length, 0);
                  const totalExpected = schools.reduce((sum, s) => {
                    const activeInSchool = delegates.filter(d => d.schoolId === s.id && d.status === 'selected');
                    return sum + (activeInSchool.length * totalRequired);
                  }, 0);
                  const totalPaidAll = schools.reduce((sum, s) => {
                    const activeInSchool = delegates.filter(d => d.schoolId === s.id && d.status === 'selected');
                    return sum + activeInSchool.reduce((sSum, d) => sSum + getStudentPaymentsSum(d.id), 0);
                  }, 0);
                  const totalPendingAll = Math.max(0, totalExpected - totalPaidAll);

                  data.push({
                    "Nº": "TOTALES",
                    "Escuela": "Resumen General",
                    "Delegados Seleccionados": totalDelegates,
                    "Monto Unitario": "",
                    "Total Esperado": totalExpected,
                    "Total Pagado": totalPaidAll,
                    "Saldo Pendiente (Deuda)": totalPendingAll
                  });
                  exportToCSV(data, "MUN_Reporte_Saldos_Escuelas");
                };

                return (
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="text-xs font-bold text-slate-800">Estado de Cuenta de Escuelas</h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">Compara lo que cada escuela debe abonar según sus alumnos seleccionados contra lo pagado</p>
                      </div>
                      <button
                        id="export-balances-csv"
                        onClick={exportSchoolBalancesToCSV}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Exportar Saldos
                      </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b bg-slate-50 font-bold text-slate-500 text-[10px] uppercase">
                            <th className="py-3 px-6">Escuela</th>
                            <th className="py-3 px-6">Delegados Seleccionados</th>
                            <th className="py-3 px-6">Esperado Total</th>
                            <th className="py-3 px-6">Total Abonado</th>
                            <th className="py-3 px-6">Saldo Pendiente</th>
                            <th className="py-3 px-6">Estatus de Liquidación</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {schools.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">No hay escuelas registradas.</td>
                            </tr>
                          ) : (
                            schools.map(s => {
                              const activeInSchool = delegates.filter(d => d.schoolId === s.id && d.status === 'selected');
                              const totalPaid = activeInSchool.reduce((sum, d) => sum + getStudentPaymentsSum(d.id), 0);
                              const expected = activeInSchool.length * totalRequired;
                              const pending = Math.max(0, expected - totalPaid);
                              const isLiquidated = expected > 0 && pending === 0;

                              return (
                                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="py-3 px-6 font-bold text-slate-900">{s.name}</td>
                                  <td className="py-3 px-6 text-slate-600 font-semibold">{activeInSchool.length} alumnos</td>
                                  <td className="py-3 px-6 font-semibold text-slate-700">${expected.toLocaleString("es-MX")}.00</td>
                                  <td className="py-3 px-6 font-bold text-emerald-600">${totalPaid.toLocaleString("es-MX")}.00</td>
                                  <td className="py-3 px-6 font-bold text-rose-600">
                                    {pending > 0 ? `$${pending.toLocaleString("es-MX")}.00` : '$0.00'}
                                  </td>
                                  <td className="py-3 px-6">
                                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${
                                      expected === 0 ? 'bg-slate-100 text-slate-400' :
                                      isLiquidated ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                      {expected === 0 ? 'SIN ALUMNOS' :
                                       isLiquidated ? 'LIQUIDADO' : 'CON ADEUDO'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                          <tr className="bg-slate-50/50 font-bold border-t border-slate-200">
                            <td className="py-3 px-6 text-slate-900 uppercase">Totales Consolidados</td>
                            <td className="py-3 px-6 text-slate-900">
                              {schools.reduce((sum, s) => sum + delegates.filter(d => d.schoolId === s.id && d.status === 'selected').length, 0)} alumnos
                            </td>
                            <td className="py-3 px-6 text-slate-700">
                              ${schools.reduce((sum, s) => sum + (delegates.filter(d => d.schoolId === s.id && d.status === 'selected').length * totalRequired), 0).toLocaleString("es-MX")}.00
                            </td>
                            <td className="py-3 px-6 text-emerald-700">
                              ${schools.reduce((sum, s) => {
                                const activeInSchool = delegates.filter(d => d.schoolId === s.id && d.status === 'selected');
                                return sum + activeInSchool.reduce((sSum, d) => sSum + getStudentPaymentsSum(d.id), 0);
                              }, 0).toLocaleString("es-MX")}.00
                            </td>
                            <td className="py-3 px-6 text-rose-700">
                              ${Math.max(0, 
                                schools.reduce((sum, s) => sum + (delegates.filter(d => d.schoolId === s.id && d.status === 'selected').length * totalRequired), 0) -
                                schools.reduce((sum, s) => {
                                  const activeInSchool = delegates.filter(d => d.schoolId === s.id && d.status === 'selected');
                                  return sum + activeInSchool.reduce((sSum, d) => sSum + getStudentPaymentsSum(d.id), 0);
                                }, 0)
                              ).toLocaleString("es-MX")}.00
                            </td>
                            <td className="py-3 px-6">
                              <span className="text-[10px] text-slate-500">Caja General Activa</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* RENDER DYNAMIC RECIEPT PRINT MODAL OVERLAY */}
      {selectedReceiptPayment && (
        <ReceiptPrint
          payment={selectedReceiptPayment}
          student={delegates.find(d => d.id === selectedReceiptPayment.studentId)!}
          school={schools.find(s => s.id === delegates.find(d => d.id === selectedReceiptPayment.studentId)?.schoolId)}
          config={config}
          payments={payments}
          onClose={() => setSelectedReceiptPayment(null)}
        />
      )}

      {/* EDIT STUDENT/DELEGATE MODAL OVERLAY */}
      {editingDelegate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" />
                Modificar Datos del Estudiante
              </h3>
              <button
                id="close-edit-delegate-modal"
                onClick={() => setEditingDelegate(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDelegateEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-del-names" className="block text-xs font-semibold text-slate-700 mb-1">Nombres *</label>
                  <input
                    id="edit-del-names"
                    type="text"
                    required
                    value={editDelNames}
                    onChange={(e) => setEditDelNames(e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="edit-del-lastnames" className="block text-xs font-semibold text-slate-700 mb-1">Apellidos *</label>
                  <input
                    id="edit-del-lastnames"
                    type="text"
                    required
                    value={editDelLastNames}
                    onChange={(e) => setEditDelLastNames(e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="edit-del-email" className="block text-xs font-semibold text-slate-700 mb-1">Correo Institucional / Personal *</label>
                  <input
                    id="edit-del-email"
                    type="email"
                    required
                    value={editDelEmail}
                    onChange={(e) => setEditDelEmail(e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="edit-del-phone" className="block text-xs font-semibold text-slate-700 mb-1">Teléfono de Contacto</label>
                  <input
                    id="edit-del-phone"
                    type="text"
                    value={editDelPhone}
                    onChange={(e) => setEditDelPhone(e.target.value)}
                    className="w-full px-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-hidden text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="edit-del-sex" className="block text-xs font-semibold text-slate-700 mb-1">Sexo *</label>
                  <select
                    id="edit-del-sex"
                    value={editDelSex}
                    onChange={(e) => setEditDelSex(e.target.value as 'Hombre' | 'Mujer')}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 outline-hidden"
                  >
                    <option value="Hombre">Hombre</option>
                    <option value="Mujer">Mujer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-del-shirtsize" className="block text-xs font-semibold text-slate-700 mb-1">Talla de Playera *</label>
                  <select
                    id="edit-del-shirtsize"
                    value={editDelShirtSize}
                    onChange={(e) => setEditDelShirtSize(e.target.value as 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 outline-hidden"
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-del-language" className="block text-xs font-semibold text-slate-700 mb-1">Idioma de Participación *</label>
                  <select
                    id="edit-del-language"
                    value={editDelLanguage}
                    onChange={(e) => setEditDelLanguage(e.target.value as 'Español' | 'Inglés' | 'Bilingüe')}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 outline-hidden"
                  >
                    <option value="Español">Español</option>
                    <option value="Inglés">Inglés</option>
                    <option value="Bilingüe">Bilingüe (Español / Inglés)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-del-school" className="block text-xs font-semibold text-slate-700 mb-1">Escuela Asociada *</label>
                  <select
                    id="edit-del-school"
                    required
                    value={editDelSchoolId}
                    onChange={(e) => setEditDelSchoolId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 outline-hidden"
                  >
                    <option value="">Seleccione una escuela</option>
                    {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Committee Preferences */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Preferencia de Comités</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index}>
                      <label htmlFor={`edit-del-choice-${index}`} className="block text-[10px] font-semibold text-slate-500 mb-1">Opción {index + 1}</label>
                      <select
                        id={`edit-del-choice-${index}`}
                        value={editDelChoices[index]}
                        onChange={(e) => {
                          const updated = [...editDelChoices];
                          updated[index] = e.target.value;
                          setEditDelChoices(updated);
                        }}
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white text-slate-800 outline-hidden"
                      >
                        <option value="">Sin Selección</option>
                        {committees.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  id="cancel-edit-delegate-btn"
                  type="button"
                  onClick={() => setEditingDelegate(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="submit-edit-delegate-btn"
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:bg-indigo-300"
                >
                  {actionLoading ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
