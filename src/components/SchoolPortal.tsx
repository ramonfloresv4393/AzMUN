import React, { useState } from "react";
import { School, Delegate, Committee, Country, Payment, SystemConfig } from "../types";
import { exportToCSV, formatCurrency } from "../utils";
import { Lock, Unlock, Users, CheckSquare, Square, Download, Printer, LogOut, CheckCircle2, AlertTriangle, FileText, FileSpreadsheet, Bed, Plus, Trash2, Home } from "lucide-react";

interface SchoolPortalProps {
  schools: School[];
  delegates: Delegate[];
  committees: Committee[];
  countries: Country[];
  payments: Payment[];
  config: SystemConfig;
  onUpdateDelegateStatus: (delegateId: string, status: 'pending' | 'selected' | 'rejected') => Promise<void>;
  onAssignRoom: (delegateId: string, roomNumber: number | null, schoolId: string) => Promise<void>;
}

export default function SchoolPortal({
  schools,
  delegates,
  committees,
  countries,
  payments,
  config,
  onUpdateDelegateStatus,
  onAssignRoom
}: SchoolPortalProps) {
  // Authentication State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loggedInSchool, setLoggedInSchool] = useState<School | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<"students" | "rooms">("students");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const school = schools.find(
      s => s.username.toLowerCase() === username.trim().toLowerCase() && s.passwordHash === password.trim()
    );

    if (school) {
      setLoggedInSchool(school);
      setUsername("");
      setPassword("");
    } else {
      setLoginError("Usuario o contraseña incorrectos. Por favor, verifica con el administrador.");
    }
  };

  const handleLogout = () => {
    setLoggedInSchool(null);
    setErrorMessage(null);
  };

  // If not logged in, render Login Form
  if (!loggedInSchool) {
    return (
      <div className="max-w-xs mx-auto bg-white border border-slate-200 rounded shadow-sm overflow-hidden mt-6">
        <div className="px-4 py-3 bg-[#0f172a] text-white text-center">
          <h2 id="school-login-title" className="text-xs font-bold uppercase tracking-wider">Acceso Portal de Escuelas</h2>
          <p className="text-[10px] text-slate-300 mt-0.5">Ingresa las credenciales asignadas por el administrador MUN</p>
        </div>

        <form onSubmit={handleLogin} className="p-4 space-y-3">
          {loginError && (
            <div id="login-error-alert" className="p-2 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] rounded flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-500 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <div>
            <label htmlFor="school-username" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Nombre de Usuario</label>
            <input
              id="school-username"
              type="text"
              required
              placeholder="Ej. villa_de_seris"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden text-slate-950 bg-white"
            />
          </div>

          <div>
            <label htmlFor="school-password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contraseña</label>
            <input
              id="school-password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-hidden text-slate-950 bg-white"
            />
          </div>

          <button
            id="school-login-btn"
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors rounded cursor-pointer mt-2"
          >
            <Unlock className="w-3.5 h-3.5" />
            Iniciar Sesión
          </button>
        </form>
      </div>
    );
  }

  // School is logged in
  const schoolStudents = delegates.filter(d => d.schoolId === loggedInSchool.id);
  const selectedStudents = schoolStudents.filter(d => d.status === "selected");
  const pendingStudents = schoolStudents.filter(d => d.status === "pending");

  const selectionCount = selectedStudents.length;
  const maxQuota = loggedInSchool.maxQuota;
  const quotaPercentage = Math.min(100, (selectionCount / maxQuota) * 100);

  const getCommitteeName = (id: string | null) => {
    if (!id) return "Sin asignar";
    return committees.find(c => c.id === id)?.name || "Sin asignar";
  };

  const getCountryName = (id: string | null) => {
    if (!id) return "Sin asignar";
    return countries.find(c => c.id === id)?.name || "Sin asignar";
  };

  const getPaymentsSumForStudent = (studentId: string) => {
    return payments.filter(p => p.studentId === studentId).reduce((sum, p) => sum + p.amount, 0);
  };

  const toggleStudentStatus = async (student: Delegate) => {
    setErrorMessage(null);
    const newStatus = student.status === "selected" ? "pending" : "selected";
    
    if (newStatus === "selected" && selectionCount >= maxQuota) {
      setErrorMessage(`No puedes seleccionar más de ${maxQuota} alumnos. Has agotado tu cupo máximo de participantes.`);
      return;
    }

    setLoadingAction(student.id);
    try {
      await onUpdateDelegateStatus(student.id, newStatus);
    } catch (err: any) {
      setErrorMessage(err.message || "Error al actualizar el estado del delegado.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRoomChange = async (delegateId: string, roomNum: number | null) => {
    if (!loggedInSchool) return;
    setErrorMessage(null);
    setLoadingAction(delegateId);
    try {
      await onAssignRoom(delegateId, roomNum, loggedInSchool.id);
    } catch (err: any) {
      setErrorMessage(err.message || "Error al asignar la habitación.");
    } finally {
      setLoadingAction(null);
    }
  };

  // Export to Excel / CSV
  const handleExportCSV = () => {
    const exportData = schoolStudents.map((d, index) => {
      const studentPayments = payments.filter(p => p.studentId === d.id);
      const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
      const totalRequired = config.totalAmountToPay ?? (config.paymentAmount * config.numPaymentsRequired);
      const pendingPay = totalRequired - totalPaid;
      
      return {
        "Nº": index + 1,
        "Nombres": d.names,
        "Apellidos": d.lastNames,
        "Celular": d.phone,
        "Correo Institucional": d.email,
        "Estatus Selección": d.status === "selected" ? "PARTICIPANTE (Seleccionado)" : "ASPIRANTE (Pendiente)",
        "Comité Asignado": getCommitteeName(d.assignedCommitteeId),
        "País Asignado": getCountryName(d.assignedCountryId),
        "Total Pagado": `$${totalPaid}.00`,
        "Monto Pendiente": `$${pendingPay}.00`,
        "Estado Pagos": totalPaid >= totalRequired ? "LIQUIDADO" : (totalPaid > 0 ? "PARCIAL" : "SIN PAGO")
      };
    });

    exportToCSV(exportData, `Reporte_Delegados_${loggedInSchool.name.replace(/\s+/g, "_")}`);
  };

  // Formal Print report
  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Reporte de Delegados - ${loggedInSchool.name}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body onload="window.print();">
          <div class="max-w-4xl mx-auto">
            <div class="text-center border-b pb-6 mb-8">
              <h1 class="text-2xl font-bold uppercase">Reporte de Delegados Inscritos</h1>
              <h2 class="text-lg text-indigo-700 font-semibold mt-1">${loggedInSchool.name}</h2>
              <p class="text-xs text-gray-500 mt-1">MUN 2026 • Generado el ${new Date().toLocaleDateString("es-MX")}</p>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-6 text-sm">
              <div class="bg-gray-50 p-3 rounded">
                <p class="text-xs text-gray-400 font-bold uppercase">Cupo Asignado</p>
                <p class="font-bold text-gray-800 text-base mt-0.5">${maxQuota} Alumnos</p>
              </div>
              <div class="bg-gray-50 p-3 rounded">
                <p class="text-xs text-gray-400 font-bold uppercase">Seleccionados (Participantes)</p>
                <p class="font-bold text-emerald-600 text-base mt-0.5">${selectionCount} Alumnos</p>
              </div>
              <div class="bg-gray-50 p-3 rounded">
                <p class="text-xs text-gray-400 font-bold uppercase">Aspirantes en Espera</p>
                <p class="font-bold text-amber-600 text-base mt-0.5">${pendingStudents.length} Alumnos</p>
              </div>
            </div>

            <table class="w-full text-left text-xs border-collapse">
              <thead>
                <tr class="bg-gray-100 text-gray-600 uppercase font-bold border-b">
                  <th class="py-3 px-2 border">Alumno / Delegado</th>
                  <th class="py-3 px-2 border">Estatus</th>
                  <th class="py-3 px-2 border">Comité Asignado</th>
                  <th class="py-3 px-2 border">País Asignado</th>
                  <th class="py-3 px-2 border text-right">Monto Pagado</th>
                </tr>
              </thead>
              <tbody>
                ${schoolStudents.map(student => `
                  <tr class="border-b hover:bg-gray-50">
                    <td class="py-3 px-2 border">
                      <p class="font-bold text-gray-800">${student.names} ${student.lastNames}</p>
                      <p class="text-[10px] text-gray-500 mt-0.5">${student.email} • Tel: ${student.phone}</p>
                    </td>
                    <td class="py-3 px-2 border">
                      <span class="px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        student.status === "selected" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }">
                        ${student.status === "selected" ? "PARTICIPANTE" : "ASPIRANTE"}
                      </span>
                    </td>
                    <td class="py-3 px-2 border">${getCommitteeName(student.assignedCommitteeId)}</td>
                    <td class="py-3 px-2 border">${getCountryName(student.assignedCountryId)}</td>
                    <td class="py-3 px-2 border text-right font-mono font-bold">$${getPaymentsSumForStudent(student.id)}.00</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="mt-12 pt-8 border-t flex justify-between text-xs text-gray-400 font-medium">
              <span>Firma y Sello de la Escuela</span>
              <span>Comité Organizador MUN 2026</span>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Print Rooms and Room Numbers Report
  const handlePrintRoomsReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    // Get all male rooms with occupants
    const maleRoomsHTML = Array.from({ length: loggedInSchool.roomsMale || 0 }, (_, i) => i + 1).map((roomNum) => {
      const occupants = selectedStudents.filter(s => s.sex === "Hombre" && s.roomNumber === roomNum);
      const realNumber = loggedInSchool.roomNumbersMale?.[roomNum - 1];
      return `
        <div class="mb-4 border p-3 rounded bg-gray-50/50 break-inside-avoid">
          <h3 class="text-xs font-bold text-blue-800 uppercase flex justify-between border-b pb-1 mb-2">
            <span>Cuarto #${roomNum} ${realNumber ? `(Habitación: ${realNumber})` : '(Sin número)'}</span>
            <span class="text-[10px] text-gray-500">${occupants.length} Hospedados</span>
          </h3>
          ${occupants.length === 0 ? `
            <p class="text-xs text-gray-400 italic">Habitación Vacía</p>
          ` : `
            <ol class="list-decimal pl-4 text-xs space-y-1">
              ${occupants.map(o => `
                <li class="font-semibold text-gray-800">
                  ${o.names} ${o.lastNames} <span class="text-[10px] font-normal text-gray-400">(${o.email})</span>
                </li>
              `).join("")}
            </ol>
          `}
        </div>
      `;
    }).join("");

    // Get all female rooms with occupants
    const femaleRoomsHTML = Array.from({ length: loggedInSchool.roomsFemale || 0 }, (_, i) => i + 1).map((roomNum) => {
      const occupants = selectedStudents.filter(s => s.sex === "Mujer" && s.roomNumber === roomNum);
      const realNumber = loggedInSchool.roomNumbersFemale?.[roomNum - 1];
      return `
        <div class="mb-4 border p-3 rounded bg-gray-50/50 break-inside-avoid">
          <h3 class="text-xs font-bold text-pink-800 uppercase flex justify-between border-b pb-1 mb-2">
            <span>Cuarto #${roomNum} ${realNumber ? `(Habitación: ${realNumber})` : '(Sin número)'}</span>
            <span class="text-[10px] text-gray-500">${occupants.length} Hospedadas</span>
          </h3>
          ${occupants.length === 0 ? `
            <p class="text-xs text-gray-400 italic">Habitación Vacía</p>
          ` : `
            <ol class="list-decimal pl-4 text-xs space-y-1">
              ${occupants.map(o => `
                <li class="font-semibold text-gray-800">
                  ${o.names} ${o.lastNames} <span class="text-[10px] font-normal text-gray-400">(${o.email})</span>
                </li>
              `).join("")}
            </ol>
          `}
        </div>
      `;
    }).join("");

    // Get students with no rooms
    const unassignedStudents = selectedStudents.filter(s => !s.roomNumber);

    const htmlContent = `
      <html>
        <head>
          <title>Reporte de Distribución de Cuartos - ${loggedInSchool.name}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 40px; }
            @media print { 
              .no-print { display: none; } 
              .break-inside-avoid { break-inside: avoid; }
            }
          </style>
        </head>
        <body onload="window.print();">
          <div class="max-w-4xl mx-auto">
            <div class="text-center border-b pb-6 mb-8">
              <h1 class="text-2xl font-bold uppercase font-sans">Reporte de Alumnos en Cuartos</h1>
              <h2 class="text-lg text-indigo-700 font-semibold mt-1">${loggedInSchool.name}</h2>
              <p class="text-xs text-gray-500 mt-1">Hospedaje MUN 2026 • Generado el ${new Date().toLocaleDateString("es-MX")}</p>
            </div>

            <div class="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div class="bg-blue-50 p-3 rounded border border-blue-100">
                <p class="text-xs text-blue-700 font-bold uppercase">Habitaciones de Hombres</p>
                <p class="font-bold text-blue-900 text-lg mt-0.5">${loggedInSchool.roomsMale || 0} Habitaciones Autorizadas</p>
              </div>
              <div class="bg-pink-50 p-3 rounded border border-pink-100">
                <p class="text-xs text-pink-700 font-bold uppercase">Habitaciones de Mujeres</p>
                <p class="font-bold text-pink-900 text-lg mt-0.5">${loggedInSchool.roomsFemale || 0} Habitaciones Autorizadas</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-6">
              <!-- Hombres Column -->
              <div>
                <h2 class="text-sm font-extrabold text-blue-700 border-b border-blue-200 pb-2 mb-4 uppercase">Sección Hombres</h2>
                ${(loggedInSchool.roomsMale || 0) === 0 ? `
                  <p class="text-xs text-gray-400 italic">No hay habitaciones asignadas para hombres.</p>
                ` : maleRoomsHTML}
              </div>

              <!-- Mujeres Column -->
              <div>
                <h2 class="text-sm font-extrabold text-pink-700 border-b border-pink-200 pb-2 mb-4 uppercase">Sección Mujeres</h2>
                ${(loggedInSchool.roomsFemale || 0) === 0 ? `
                  <p class="text-xs text-gray-400 italic">No hay habitaciones asignadas para mujeres.</p>
                ` : femaleRoomsHTML}
              </div>
            </div>

            ${unassignedStudents.length > 0 ? `
              <div class="mt-8 border-t pt-4 break-inside-avoid">
                <h2 class="text-xs font-extrabold text-amber-700 mb-2 uppercase">Alumnos Seleccionados Sin Cuarto Asignado (${unassignedStudents.length})</h2>
                <div class="bg-amber-50 p-3 rounded border border-amber-100 grid grid-cols-2 gap-2">
                  ${unassignedStudents.map(u => `
                    <p class="text-xs text-amber-900 font-medium">${u.names} ${u.lastNames} (${u.sex})</p>
                  `).join("")}
                </div>
              </div>
            ` : ""}

            <div class="mt-12 pt-8 border-t flex justify-between text-xs text-gray-400 font-medium break-inside-avoid">
              <span>Firma y Sello del Encargado Escolar</span>
              <span>Comité de Hospedaje MUN 2026</span>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      {/* School Info Header */}
      <div id="school-info-header" className="bg-white border border-slate-200 rounded p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Escuela Conectada</span>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">{loggedInSchool.name}</h2>
          <p className="text-[11px] text-slate-500 mt-0.5">Saca provecho de tu cupo y administra los alumnos participantes</p>
        </div>

        <button
          id="school-logout-btn"
          onClick={handleLogout}
          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 rounded transition-all cursor-pointer"
        >
          <LogOut className="w-3 h-3" />
          Salir del Portal
        </button>
      </div>

      {/* Quota Management Bar */}
      <div className="bg-white border border-slate-200 rounded p-3 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs font-bold text-slate-950 flex items-center gap-1.5 uppercase tracking-wide">
              <Users className="w-4 h-4 text-blue-600" />
              Gestión de Cupo Escolar
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Elige cuáles de tus aspirantes serán los participantes definitivos</p>
          </div>

          <div className="text-right">
            <span className="text-xs font-extrabold text-slate-900">
              {selectionCount} <span className="text-slate-400">/</span> {maxQuota}
            </span>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Alumnos Seleccionados</p>
          </div>
        </div>

        {/* Bar */}
        <div className="bg-slate-100 h-1.5 rounded overflow-hidden">
          <div
            className={`h-full rounded transition-all duration-500 ${
              quotaPercentage === 100 ? 'bg-emerald-600' : quotaPercentage > 75 ? 'bg-blue-600' : 'bg-blue-500'
            }`}
            style={{ width: `${quotaPercentage}%` }}
          ></div>
        </div>

        {errorMessage && (
          <div id="school-quota-error" className="p-2 bg-rose-50 border border-rose-100 text-rose-700 text-[11px] rounded flex items-start gap-1.5 animate-pulse">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Sub tabs switcher */}
      <div className="flex border border-slate-200 bg-white rounded p-1 shadow-xs">
        <button
          id="school-tab-students"
          onClick={() => setActiveTab("students")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded transition-all cursor-pointer ${
            activeTab === "students"
              ? "bg-[#0f172a] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Alumnos y Selección ({schoolStudents.length})
        </button>
        <button
          id="school-tab-rooms"
          onClick={() => setActiveTab("rooms")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded transition-all cursor-pointer ${
            activeTab === "rooms"
              ? "bg-[#0f172a] text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Bed className="w-3.5 h-3.5" />
          Habitaciones y Cuartos (M: {loggedInSchool.roomsMale || 0}, F: {loggedInSchool.roomsFemale || 0})
        </button>
      </div>

      {/* Tab 1: Students and Selection */}
      {activeTab === "students" && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          {/* Table Toolbar Header */}
          <div className="px-3 py-2 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Lista de Alumnos Registrados ({schoolStudents.length})</h4>
            
            <div className="flex gap-1.5 w-full sm:w-auto">
              <button
                id="school-print-report-btn"
                onClick={handlePrintReport}
                disabled={schoolStudents.length === 0}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded transition-colors cursor-pointer disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
              >
                <Printer className="w-3 h-3" />
                Imprimir (PDF)
              </button>
              <button
                id="school-export-csv-btn"
                onClick={handleExportCSV}
                disabled={schoolStudents.length === 0}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded transition-colors cursor-pointer disabled:bg-slate-50 disabled:text-slate-300 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-3 h-3" />
                Exportar CSV
              </button>
            </div>
          </div>

          {schoolStudents.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-600">No hay alumnos registrados con tu escuela</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Los alumnos deben auto-registrarse en la sección principal seleccionando esta institución.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[9px] tracking-wider">
                    <th className="py-2 px-3">Selección</th>
                    <th className="py-2 px-3">Delegado / Alumno</th>
                    <th className="py-2 px-3">Datos</th>
                    <th className="py-2 px-3">Comité / País</th>
                    <th className="py-2 px-3">Habitación</th>
                    <th className="py-2 px-3 text-right">Total Pagado</th>
                  </tr>
                </thead>
                <tbody>
                  {schoolStudents.map((student) => {
                    const isSelected = student.status === "selected";
                    const paid = getPaymentsSumForStudent(student.id);
                    const totalRequired = config.totalAmountToPay ?? (config.paymentAmount * config.numPaymentsRequired);
                    const isFullyPaid = paid >= totalRequired;

                    return (
                      <tr
                        key={student.id}
                        className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${
                          isSelected ? "bg-emerald-50/20" : ""
                        }`}
                      >
                        {/* Checkbox to participate */}
                        <td className="py-1.5 px-3">
                          <button
                            id={`toggle-status-${student.id}`}
                            onClick={() => toggleStudentStatus(student)}
                            disabled={loadingAction === student.id}
                            className="flex items-center gap-1.5 p-0.5 rounded hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300" />
                            )}
                            <span className={`font-bold uppercase text-[9px] ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`}>
                              {isSelected ? "Participará" : "En Espera"}
                            </span>
                          </button>
                        </td>

                        {/* Student Info */}
                        <td className="py-1.5 px-3">
                          <div className="font-bold text-slate-900 text-xs">
                            {student.names} {student.lastNames}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex gap-2">
                            <span>{student.email}</span>
                            <span>•</span>
                            <span>{student.phone}</span>
                          </div>
                        </td>

                        {/* Personal Details Metadata */}
                        <td className="py-1.5 px-3">
                          <div className="text-xs font-semibold text-slate-800">
                            {student.sex || "No registrado"} • {student.shirtSize || "S/T"}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {student.language || "Español"}
                          </div>
                        </td>

                        {/* Committee & Country */}
                        <td className="py-1.5 px-3 text-xs text-slate-800">
                          <div className="font-semibold text-slate-800">
                            {getCommitteeName(student.assignedCommitteeId)}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {getCountryName(student.assignedCountryId)}
                          </div>
                        </td>

                        {/* Room Assignment Select */}
                        <td className="py-1.5 px-3">
                          {isSelected ? (
                            (() => {
                              const maxRooms = student.sex === "Hombre" ? (loggedInSchool.roomsMale || 0) : (loggedInSchool.roomsFemale || 0);
                              if (maxRooms === 0) {
                                return <span className="text-[10px] text-slate-400 italic">Sin cuartos asignados</span>;
                              }
                              return (
                                <select
                                  id={`room-select-${student.id}`}
                                  value={student.roomNumber || ""}
                                  disabled={loadingAction === student.id}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    handleRoomChange(student.id, val ? Number(val) : null);
                                  }}
                                  className="px-2 py-1 text-[11px] border border-slate-200 rounded text-slate-900 bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">-- Sin Cuarto --</option>
                                  {Array.from({ length: maxRooms }, (_, i) => i + 1).map((rNum) => {
                                    const realNumber = student.sex === "Hombre"
                                      ? loggedInSchool.roomNumbersMale?.[rNum - 1]
                                      : loggedInSchool.roomNumbersFemale?.[rNum - 1];
                                    return (
                                      <option key={rNum} value={rNum}>
                                        Cuarto #{rNum} {realNumber ? `(Hab. ${realNumber})` : ""}
                                      </option>
                                    );
                                  })}
                                </select>
                              );
                            })()
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No participante</span>
                          )}
                        </td>

                        {/* Payment */}
                        <td className="py-1.5 px-3 text-right">
                          <span className="font-bold font-mono text-slate-900 text-xs">
                            {formatCurrency(paid)}
                          </span>
                          <span className={`inline-block ml-1.5 text-[9px] font-bold uppercase ${isFullyPaid ? 'text-emerald-600' : paid > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                            {isFullyPaid ? "Liquidado" : paid > 0 ? "Parcial" : "Sin pagos"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Room Distribution Board */}
      {activeTab === "rooms" && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Distribución de Habitaciones de la Escuela</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Asigna a tus estudiantes del mismo sexo en los cuartos autorizados por el administrador.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {((loggedInSchool.roomsMale || 0) > 0 || (loggedInSchool.roomsFemale || 0) > 0) && (
                <button
                  id="print-rooms-report-btn"
                  onClick={handlePrintRoomsReport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 transition-all rounded shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Reporte Cuartos
                </button>
              )}
              <div className="flex gap-3 text-xs bg-slate-50 border border-slate-100 rounded px-3 py-1.5 font-semibold">
                <div className="text-blue-700">Hombres: {loggedInSchool.roomsMale || 0} cuartos</div>
                <div className="border-l border-slate-200"></div>
                <div className="text-pink-700">Mujeres: {loggedInSchool.roomsFemale || 0} cuartos</div>
              </div>
            </div>
          </div>

          {(loggedInSchool.roomsMale || 0) === 0 && (loggedInSchool.roomsFemale || 0) === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <Bed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No tienes habitaciones asignadas todavía</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                El administrador principal del MUN aún no ha asignado habitaciones para hombres o mujeres a <strong>{loggedInSchool.name}</strong>. Ponte en contacto con el administrador para que asigne cuartos a tu escuela.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* HOMBRES CARD */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-bold text-blue-700 uppercase tracking-wider border-b border-blue-100 pb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Habitaciones para Hombres ({loggedInSchool.roomsMale || 0} cuartos autorizados)
                </h5>

                {(loggedInSchool.roomsMale || 0) === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No tienes habitaciones de hombres asignadas.</p>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: loggedInSchool.roomsMale || 0 }, (_, i) => i + 1).map((roomNum) => {
                      const occupants = selectedStudents.filter(s => s.sex === "Hombre" && s.roomNumber === roomNum);
                      const unassignedMales = selectedStudents.filter(s => s.sex === "Hombre" && !s.roomNumber);
                      const realNumber = loggedInSchool.roomNumbersMale?.[roomNum - 1];

                      return (
                        <div key={`male-room-${roomNum}`} className="border border-slate-200 rounded p-3 bg-white hover:border-slate-300 transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                              <Home className="w-3.5 h-3.5 text-blue-600" />
                              Cuarto #{roomNum} (Hombres) {realNumber ? `• Hab. ${realNumber}` : ''}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {occupants.length} {occupants.length === 1 ? "alumno" : "alumnos"}
                            </span>
                          </div>

                          {/* Occupants list */}
                          {occupants.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic py-1">Habitación vacía</p>
                          ) : (
                            <div className="space-y-1">
                              {occupants.map(student => (
                                <div key={student.id} className="flex justify-between items-center text-[11px] bg-slate-50 border border-slate-100 rounded px-2 py-1">
                                  <span className="font-semibold text-slate-700">{student.names} {student.lastNames}</span>
                                  <button
                                    id={`remove-male-room-${student.id}`}
                                    onClick={() => handleRoomChange(student.id, null)}
                                    disabled={loadingAction === student.id}
                                    className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded transition-all cursor-pointer border border-rose-100"
                                  >
                                    Sacar
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add student drop-down */}
                          {unassignedMales.length > 0 ? (
                            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                              <select
                                id={`add-male-to-room-${roomNum}`}
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleRoomChange(e.target.value, roomNum);
                                    e.target.value = "";
                                  }
                                }}
                                className="flex-1 px-2 py-1 text-[11px] border border-slate-200 rounded text-slate-900 bg-white"
                              >
                                <option value="">-- Hospedar Alumno --</option>
                                {unassignedMales.map(m => (
                                  <option key={m.id} value={m.id}>
                                    {m.names} {m.lastNames}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : occupants.length === 0 ? (
                            <p className="text-[10px] text-slate-400">No hay alumnos hombres sin habitación para asignar.</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* MUJERES CARD */}
              <div className="space-y-3">
                <h5 className="text-[11px] font-bold text-pink-700 uppercase tracking-wider border-b border-pink-100 pb-1.5 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                  Habitaciones para Mujeres ({loggedInSchool.roomsFemale || 0} cuartos autorizados)
                </h5>

                {(loggedInSchool.roomsFemale || 0) === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">No tienes habitaciones de mujeres asignadas.</p>
                ) : (
                  <div className="space-y-3">
                    {Array.from({ length: loggedInSchool.roomsFemale || 0 }, (_, i) => i + 1).map((roomNum) => {
                      const occupants = selectedStudents.filter(s => s.sex === "Mujer" && s.roomNumber === roomNum);
                      const unassignedFemales = selectedStudents.filter(s => s.sex === "Mujer" && !s.roomNumber);
                      const realNumber = loggedInSchool.roomNumbersFemale?.[roomNum - 1];

                      return (
                        <div key={`female-room-${roomNum}`} className="border border-slate-200 rounded p-3 bg-white hover:border-slate-300 transition-colors space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1">
                              <Home className="w-3.5 h-3.5 text-pink-600" />
                              Cuarto #{roomNum} (Mujeres) {realNumber ? `• Hab. ${realNumber}` : ''}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {occupants.length} {occupants.length === 1 ? "alumna" : "alumnas"}
                            </span>
                          </div>

                          {/* Occupants list */}
                          {occupants.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic py-1">Habitación vacía</p>
                          ) : (
                            <div className="space-y-1">
                              {occupants.map(student => (
                                <div key={student.id} className="flex justify-between items-center text-[11px] bg-slate-50 border border-slate-100 rounded px-2 py-1">
                                  <span className="font-semibold text-slate-700">{student.names} {student.lastNames}</span>
                                  <button
                                    id={`remove-female-room-${student.id}`}
                                    onClick={() => handleRoomChange(student.id, null)}
                                    disabled={loadingAction === student.id}
                                    className="text-[10px] font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-1.5 py-0.5 rounded transition-all cursor-pointer border border-rose-100"
                                  >
                                    Sacar
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add student drop-down */}
                          {unassignedFemales.length > 0 ? (
                            <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                              <select
                                id={`add-female-to-room-${roomNum}`}
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleRoomChange(e.target.value, roomNum);
                                    e.target.value = "";
                                  }
                                }}
                                className="flex-1 px-2 py-1 text-[11px] border border-slate-200 rounded text-slate-900 bg-white"
                              >
                                <option value="">-- Hospedar Alumna --</option>
                                {unassignedFemales.map(f => (
                                  <option key={f.id} value={f.id}>
                                    {f.names} {f.lastNames}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : occupants.length === 0 ? (
                            <p className="text-[10px] text-slate-400">No hay alumnas mujeres sin habitación para asignar.</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
