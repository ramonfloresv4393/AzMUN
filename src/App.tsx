import { useState, useEffect } from "react";
import { School, Committee, Country, Delegate, Payment, SystemConfig, MUNData, AdminUser, SchoolCycle } from "./types";
import StudentRegister from "./components/StudentRegister";
import StudentStatus from "./components/StudentStatus";
import SchoolPortal from "./components/SchoolPortal";
import AdminPortal from "./components/AdminPortal";
import { Users, School as SchoolIcon, ShieldAlert, FileText, CheckCircle, HelpCircle, Loader2 } from "lucide-react";

export default function App() {
  // Global DB states
  const [schools, setSchools] = useState<School[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [config, setConfig] = useState<SystemConfig>({
    registrationEnabled: true,
    numPaymentsRequired: 2,
    paymentAmount: 300,
    currentReceiptFolio: 1001
  });
  const [cycles, setCycles] = useState<SchoolCycle[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layout role switcher
  const [currentRole, setCurrentRole] = useState<'public' | 'school' | 'admin'>('public');
  const [publicTab, setPublicTab] = useState<'register' | 'status'>('register');

  // Fetch all data from server API
  const fetchAllData = async () => {
    try {
      const response = await fetch("/api/mun");
      if (!response.ok) {
        throw new Error("No se pudo obtener la información del servidor.");
      }
      const data: MUNData = await response.json();
      setSchools(data.schools);
      setCommittees(data.committees);
      setCountries(data.countries);
      setDelegates(data.delegates);
      setPayments(data.payments);
      setAdminUsers(data.adminUsers || []);
      setConfig(data.config);
      setCycles(data.cycles || []);
      setActiveCycleId(data.activeCycleId || "");
      setError(null);
    } catch (err: any) {
      console.error("Error fetching database:", err);
      setError("No se pudo conectar con el servidor de la base de datos MUN.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- PERSISTENCE HANDLERS ---

  // Cycle Actions
  const handleCreateCycle = async (name: string) => {
    try {
      const response = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al crear ciclo escolar.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const handleChangeActiveCycle = async (cycleId: string) => {
    try {
      const response = await fetch("/api/cycles/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al cambiar de ciclo escolar.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Configuration Update
  const handleUpdateConfig = async (updatedConfig: Partial<SystemConfig>) => {
    try {
      const response = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, ...updatedConfig }),
      });
      if (!response.ok) throw new Error("Error al actualizar la configuración.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // School Actions
  const handleAddSchool = async (schoolData: Omit<School, 'id'> & { id?: string }) => {
    try {
      const response = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schoolData),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al registrar escuela.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteSchool = async (id: string) => {
    try {
      const response = await fetch(`/api/schools/${id}`, { method: "DELETE" });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al eliminar escuela.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Committee Actions
  const handleAddCommittee = async (comData: { id?: string; name: string; doubleDelegation?: boolean; countries?: string[] }) => {
    try {
      const response = await fetch("/api/committees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comData),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al registrar comité.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteCommittee = async (id: string) => {
    try {
      const response = await fetch(`/api/committees/${id}`, { method: "DELETE" });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al eliminar comité.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Country Actions
  const handleAddCountry = async (couData: { id?: string; name: string }) => {
    try {
      const response = await fetch("/api/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(couData),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al registrar país.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteCountry = async (id: string) => {
    try {
      const response = await fetch(`/api/countries/${id}`, { method: "DELETE" });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al eliminar país.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Assign Committee and Country to Delegate
  const handleAssignDelegate = async (delegateId: string, committeeId: string | null, countryId: string | null) => {
    try {
      const response = await fetch("/api/delegates/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delegateId, assignedCommitteeId: committeeId, assignedCountryId: countryId }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al realizar la asignación.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Update Delegate Status (School selection limits applied inside API, Admin acts as override)
  const handleUpdateDelegateStatus = async (delegateId: string, status: 'pending' | 'selected' | 'rejected') => {
    try {
      const actorRole = currentRole === 'admin' ? 'admin' : 'school';
      const delegate = delegates.find(d => d.id === delegateId);
      const schoolId = delegate?.schoolId;

      const response = await fetch("/api/delegates/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delegateId, status, actorRole, schoolId }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al actualizar estatus.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const handleUpdateDelegate = async (delegateData: Partial<Delegate> & { id: string }) => {
    try {
      const response = await fetch("/api/delegates/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(delegateData),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al actualizar datos del delegado.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const handleAssignRoom = async (delegateId: string, roomNumber: number | null, schoolId: string) => {
    try {
      const response = await fetch("/api/delegates/assign-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delegateId, roomNumber, schoolId }),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al asignar habitación.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Payments & receipts
  const handleAddPayment = async (payData: Omit<Payment, 'id' | 'folio' | 'date'>) => {
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payData),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al registrar pago.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const handleDeletePayment = async (id: string) => {
    try {
      const response = await fetch(`/api/payments/${id}`, { method: "DELETE" });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al anular pago.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Admin User Actions
  const handleAddAdmin = async (adminData: Omit<AdminUser, 'id'> & { id?: string }) => {
    try {
      const response = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adminData),
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al registrar administrador.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    try {
      const response = await fetch(`/api/admins/${id}`, { method: "DELETE" });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error || "Error al eliminar administrador.");
      await fetchAllData();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col antialiased text-slate-900 font-sans">
      {/* Dynamic Header */}
      <header className="bg-[#0f172a] text-slate-100 border-b border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-5 py-3 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-center sm:text-left flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm shadow-xs shrink-0">AZ</div>
            <div>
              <h1 className="text-sm font-bold tracking-tight uppercase text-white leading-none">
                Comité Mexicano AzMUN {cycles.find(c => c.id === activeCycleId)?.name ? (cycles.find(c => c.id === activeCycleId)?.name.replace("Ciclo Escolar ", "")) : "2026"}
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium uppercase tracking-wider">Control de Delegados, Escuelas y Finanzas</p>
            </div>
          </div>

          {/* Role selector switches */}
          <nav id="role-navigation-bar" className="flex bg-slate-950/60 border border-slate-800/80 rounded p-1 gap-1 w-full sm:w-auto">
            <button
              id="role-switch-public"
              onClick={() => setCurrentRole('public')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                currentRole === 'public' ? 'bg-[#2563eb]/20 text-blue-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Alumnos
            </button>
            <button
              id="role-switch-school"
              onClick={() => setCurrentRole('school')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                currentRole === 'school' ? 'bg-[#2563eb]/20 text-blue-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <SchoolIcon className="w-3.5 h-3.5" />
              Escuelas
            </button>
            <button
              id="role-switch-admin"
              onClick={() => setCurrentRole('admin')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-[11px] font-bold rounded uppercase tracking-wider transition-all cursor-pointer ${
                currentRole === 'admin' ? 'bg-[#2563eb]/20 text-blue-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Organizador (Admin)
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {loading ? (
          <div id="app-loading-indicator" className="h-[50vh] flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-slate-600" />
            <p className="text-sm font-semibold">Conectando con el servidor...</p>
          </div>
        ) : error ? (
          <div id="app-error-alert" className="max-w-md mx-auto text-center p-8 bg-white border border-slate-100 shadow-sm rounded-2xl">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Error de Conexión</h3>
            <p className="text-sm text-slate-500 mb-4 leading-relaxed">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                fetchAllData();
              }}
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors rounded-xl"
            >
              Reintentar Conexión
            </button>
          </div>
        ) : (
          <div>
            {/* PUBLIC STUDENT ACCESS ROLE PORTAL */}
            {currentRole === 'public' && (
              <div id="portal-students-section" className="space-y-8 animate-fade-in">
                {/* Intro Cards or Selector */}
                <div className="flex justify-center border-b border-slate-200 max-w-sm mx-auto mb-6">
                  <button
                    id="student-tab-register"
                    onClick={() => setPublicTab('register')}
                    className={`flex-1 text-center py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      publicTab === 'register'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Nueva Inscripción
                  </button>
                  <button
                    id="student-tab-status"
                    onClick={() => setPublicTab('status')}
                    className={`flex-1 text-center py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                      publicTab === 'status'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Consultar mi Estado
                  </button>
                </div>

                {publicTab === 'register' ? (
                  <StudentRegister
                    schools={schools}
                    committees={committees}
                    registrationEnabled={config.registrationEnabled}
                    onSuccess={fetchAllData}
                  />
                ) : (
                  <StudentStatus
                    delegates={delegates}
                    payments={payments}
                    committees={committees}
                    countries={countries}
                    schools={schools}
                    config={config}
                  />
                )}
              </div>
            )}

            {/* SCHOOL DELEGATION SELECTOR PORTAL */}
            {currentRole === 'school' && (
              <div id="portal-schools-section" className="animate-fade-in">
                <SchoolPortal
                  schools={schools}
                  delegates={delegates}
                  committees={committees}
                  countries={countries}
                  payments={payments}
                  config={config}
                  onUpdateDelegateStatus={handleUpdateDelegateStatus}
                  onAssignRoom={handleAssignRoom}
                />
              </div>
            )}

            {/* MAIN ADMINISTRATOR MUN ORGANIZER PORTAL */}
            {currentRole === 'admin' && (
              <div id="portal-admin-section" className="animate-fade-in">
                <AdminPortal
                  schools={schools}
                  committees={committees}
                  countries={countries}
                  delegates={delegates}
                  payments={payments}
                  config={config}
                  adminUsers={adminUsers}
                  cycles={cycles}
                  activeCycleId={activeCycleId}
                  onCreateCycle={handleCreateCycle}
                  onChangeActiveCycle={handleChangeActiveCycle}
                  onUpdateConfig={handleUpdateConfig}
                  onAddSchool={handleAddSchool}
                  onDeleteSchool={handleDeleteSchool}
                  onAddCommittee={handleAddCommittee}
                  onDeleteCommittee={handleDeleteCommittee}
                  onAddCountry={handleAddCountry}
                  onDeleteCountry={handleDeleteCountry}
                  onAssignDelegate={handleAssignDelegate}
                  onUpdateDelegateStatus={handleUpdateDelegateStatus}
                  onUpdateDelegate={handleUpdateDelegate}
                  onAddPayment={handleAddPayment}
                  onDeletePayment={handleDeletePayment}
                  onAddAdmin={handleAddAdmin}
                  onDeleteAdmin={handleDeleteAdmin}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 shrink-0">
        <p className="font-semibold">MUN 2026 • Plataforma de Registro de Naciones Unidas</p>
        <p className="mt-1">Diseñado para la gestión transparente de delegaciones escolares, comités e ingresos financieros.</p>
      </footer>
    </div>
  );
}
