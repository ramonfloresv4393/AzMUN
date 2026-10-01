import { useState, FormEvent } from "react";
import { Delegate, Payment, Committee, Country, School, SystemConfig } from "../types";
import { formatCurrency, formatDateShort } from "../utils";
import { Search, Loader2, AlertCircle, CheckCircle2, RefreshCw, Landmark, HelpCircle } from "lucide-react";

interface StudentStatusProps {
  delegates: Delegate[];
  payments: Payment[];
  committees: Committee[];
  countries: Country[];
  schools: School[];
  config: SystemConfig;
}

export default function StudentStatus({ delegates, payments, committees, countries, schools, config }: StudentStatusProps) {
  const [email, setEmail] = useState("");
  const [searchResult, setSearchResult] = useState<Delegate | null>(null);
  const [studentPayments, setStudentPayments] = useState<Payment[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSearched(false);
    setSearchResult(null);
    setStudentPayments([]);

    if (!email.trim()) {
      setError("Por favor, introduce tu correo institucional.");
      return;
    }

    setLoading(true);

    // Simulate search delay for premium feel
    setTimeout(() => {
      const match = delegates.find(d => d.email.toLowerCase() === email.trim().toLowerCase());
      
      if (match) {
        setSearchResult(match);
        // Get payments for this student
        const matchedPayments = payments.filter(p => p.studentId === match.id);
        setStudentPayments(matchedPayments.sort((a, b) => a.paymentIndex - b.paymentIndex));
      } else {
        setError("No se encontró ningún registro con ese correo electrónico institucional.");
      }
      setSearched(true);
      setLoading(false);
    }, 600);
  };

  const getCommitteeName = (id: string | null) => {
    if (!id) return null;
    return committees.find(c => c.id === id)?.name || "Comité Desconocido";
  };

  const getCountryName = (id: string | null) => {
    if (!id) return null;
    return countries.find(c => c.id === id)?.name || "País Desconocido";
  };

  const getSchoolName = (id: string) => {
    return schools.find(s => s.id === id)?.name || "Escuela No Registrada";
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Search Bar Container */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">Consulta el estado de tu participación</h3>
        <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
          Ingresa el correo institucional que utilizaste en tu registro para consultar tu estatus de asignación de país, comité e historial de pagos.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              id="status-search-email"
              type="email"
              required
              placeholder="tu.nombre@bachilleresdesonora.edu.mx"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
            />
          </div>
          <button
            id="status-search-btn"
            type="submit"
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors rounded cursor-pointer disabled:bg-blue-400"
          >
            {loading ? <Loader2 className="w-3 animate-spin" /> : "Consultar"}
          </button>
        </form>

        {error && (
          <div id="status-search-error" className="mt-2.5 p-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded flex items-start gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Search Result Details */}
      {searched && searchResult && (
        <div id="status-search-result-card" className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
          {/* Result Card Header */}
          <div className="px-4 py-2.5 bg-[#0f172a] text-white flex justify-between items-center">
            <div>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Estatus de Participación</p>
              <h4 className="text-sm font-bold mt-0.5">
                {searchResult.names} {searchResult.lastNames}
              </h4>
            </div>
            
            {/* Status pill */}
            <div className="text-right">
              {searchResult.status === "selected" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                  <CheckCircle2 className="w-3 h-3" />
                  PARTICIPANTE
                </span>
              ) : searchResult.status === "rejected" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 text-white">
                  <AlertCircle className="w-3 h-3" />
                  NO COMPLEMENTADO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  ASPIRANTE (PENDIENTE)
                </span>
              )}
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Status Information Explanation */}
            {searchResult.status === "pending" && (
              <div className="p-2.5 bg-amber-50/50 border border-amber-100 rounded text-amber-800 text-[11px] leading-relaxed">
                <span className="font-bold">Información para Aspirantes:</span> Actualmente tu estatus es <strong>Aspirante</strong>. El coordinador de tu escuela (<strong>{getSchoolName(searchResult.schoolId)}</strong>) tiene un límite de cupo y debe seleccionarte formalmente dentro de su panel escolar para que pases a ser un participante activo.
              </div>
            )}

            {/* General Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Escuela Asociada</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{getSchoolName(searchResult.schoolId)}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Celular Registrado</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">{searchResult.phone}</p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sexo y Playera</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {searchResult.sex || "No registrado"} | Talla: {searchResult.shirtSize || "No registrada"}
                </p>
              </div>
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Idioma y Habitación</p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {searchResult.language || "Español"} | Cuarto: {searchResult.roomNumber ? `#${searchResult.roomNumber}` : "Por asignar"}
                </p>
              </div>
            </div>

            {/* Assignments (Comité y País) */}
            <div className="border-t border-slate-100 pt-4 space-y-2.5">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Asignaciones del Comité Organizador</h5>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded p-2.5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Comité Asignado</p>
                  {searchResult.assignedCommitteeId ? (
                    <p className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      {getCommitteeName(searchResult.assignedCommitteeId)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-0.5">Por asignar...</p>
                  )}
                </div>

                <div className="border border-slate-200 rounded p-2.5">
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">País Asignado</p>
                  {searchResult.assignedCountryId ? (
                    <p className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                      {getCountryName(searchResult.assignedCountryId)}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic mt-0.5">Por asignar...</p>
                  )}
                </div>
              </div>

              {!searchResult.assignedCommitteeId && (
                <div className="bg-slate-50 p-2 rounded flex gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="text-[10px] text-slate-500 leading-relaxed">
                    <span className="font-bold">Comités de interés que seleccionaste:</span>
                    <ol className="list-decimal list-inside mt-0.5 font-medium space-y-0.5">
                      <li>{getCommitteeName(searchResult.choices[0])}</li>
                      <li>{getCommitteeName(searchResult.choices[1])}</li>
                      <li>{getCommitteeName(searchResult.choices[2])}</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Financial Status */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              {(() => {
                const totalRequired = config.totalAmountToPay ?? (config.numPaymentsRequired * config.paymentAmount);
                const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
                const remainingDebt = Math.max(0, totalRequired - totalPaid);
                const progressPercent = Math.min(100, (totalPaid / totalRequired) * 100);

                return (
                  <>
                    <div className="flex justify-between items-center">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Control Financiero y Pagos</h5>
                      
                      {/* Total progress */}
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {formatCurrency(totalPaid)} de {formatCurrency(totalRequired)}
                      </span>
                    </div>

                    {/* Status bar */}
                    <div className="bg-slate-100 h-1.5 w-full rounded overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center">
                      {remainingDebt > 0 ? (
                        <p className="text-[10px] text-rose-600 font-extrabold">Adeudo Restante: {formatCurrency(remainingDebt)}</p>
                      ) : (
                        <p className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">¡Inscripción Liquidada!</p>
                      )}
                      <span className="text-[9px] text-slate-400 font-bold uppercase">
                        {studentPayments.length} abonos registrados
                      </span>
                    </div>
                  </>
                );
              })()}

              {/* Payments breakdown */}
              {studentPayments.length === 0 ? (
                <div className="p-3 bg-slate-50 rounded text-center border border-dashed border-slate-200">
                  <Landmark className="w-5 h-5 text-slate-300 mx-auto mb-0.5" />
                  <p className="text-xs font-semibold text-slate-600">No se han registrado pagos aún</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ponte en contacto con el administrador o tesorero para asentar tu pago.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {studentPayments.map((payment) => {
                    return (
                      <div key={payment.id} className="flex justify-between items-center p-2 border border-slate-100 rounded hover:bg-slate-50/50 transition-all">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-800">Pago #{payment.paymentIndex}</span>
                            <span className="text-[9px] font-bold font-mono text-blue-600 bg-blue-50 px-1 py-0.2 rounded">
                              FOLIO: #{payment.folio}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{formatDateShort(payment.date)} {payment.notes ? `| ${payment.notes}` : ""}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold font-mono text-slate-900">{formatCurrency(payment.amount)}</p>
                          <span className="text-[9px] text-emerald-600 font-bold uppercase">Registrado</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary message */}
              <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100 font-semibold text-slate-800">
                <span>Total Pagado:</span>
                <span className="font-mono text-blue-600">
                  {formatCurrency(studentPayments.reduce((acc, p) => acc + p.amount, 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
