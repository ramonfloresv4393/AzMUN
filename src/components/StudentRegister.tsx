import React, { useState } from "react";
import { School, Committee } from "../types";
import { CheckCircle2, AlertTriangle, Send, Loader2 } from "lucide-react";

interface StudentRegisterProps {
  schools: School[];
  committees: Committee[];
  registrationEnabled: boolean;
  onSuccess: () => void;
}

export default function StudentRegister({ schools, committees, registrationEnabled, onSuccess }: StudentRegisterProps) {
  const [names, setNames] = useState("");
  const [lastNames, setLastNames] = useState("");
  const [phone, setPhone] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [email, setEmail] = useState("");
  const [choice1, setChoice1] = useState("");
  const [choice2, setChoice2] = useState("");
  const [choice3, setChoice3] = useState("");
  const [language, setLanguage] = useState("Español");
  const [sex, setSex] = useState("");
  const [shirtSize, setShirtSize] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!names.trim() || !lastNames.trim() || !phone.trim() || !schoolId || !email.trim() || !sex || !shirtSize || !language) {
      setError("Por favor, completa todos los campos obligatorios, incluyendo sexo, talla de playera e idioma de participación.");
      return;
    }

    if (!choice1 || !choice2 || !choice3) {
      setError("Debes seleccionar tus tres opciones de comité en orden de preferencia.");
      return;
    }

    if (choice1 === choice2 || choice1 === choice3 || choice2 === choice3) {
      setError("No puedes elegir el mismo comité en múltiples opciones. Selecciona 3 comités distintos.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor, introduce un correo electrónico válido.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/register-delegate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          names: names.trim(),
          lastNames: lastNames.trim(),
          phone: phone.trim(),
          schoolId,
          email: email.trim().toLowerCase(),
          choices: [choice1, choice2, choice3],
          language,
          sex,
          shirtSize,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || "Error al procesar el registro");
      }

      setRegistered(true);
      // Reset form
      setNames("");
      setLastNames("");
      setPhone("");
      setEmail("");
      setSchoolId("");
      setChoice1("");
      setChoice2("");
      setChoice3("");
      setSex("");
      setShirtSize("");
      setLanguage("Español");
      onSuccess(); // Refresh state in parent
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado al enviar el registro.");
    } finally {
      setLoading(false);
    }
  };

  if (!registrationEnabled) {
    return (
      <div id="register-closed" className="bg-slate-50 border border-slate-200 rounded-2xl p-8 max-w-xl mx-auto text-center">
        <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 border border-amber-100">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h3 id="closed-title" className="text-xl font-bold text-slate-900 mb-2">Inscripciones Cerradas</h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          El proceso de autotransferencia o inscripción de alumnos para la edición MUN 2026 está deshabilitado temporalmente por el administrador del evento. Por favor, comunícate con el asesor de tu escuela.
        </p>
      </div>
    );
  }

  if (registered) {
    return (
      <div id="register-success" className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-8 max-w-xl mx-auto text-center shadow-xs">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 id="success-title" className="text-2xl font-bold text-slate-900 mb-2">¡Registro Completado con Éxito!</h3>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          Tus datos han sido enviados correctamente. Tu escuela asociada validará tu solicitud dentro de su cupo máximo asignado. Posteriormente, el comité organizador te asignará un comité y país.
        </p>
        <button
          id="register-another-btn"
          onClick={() => setRegistered(false)}
          className="px-6 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors rounded-xl"
        >
          Registrar otro delegado
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-slate-200 shadow-sm rounded">
      <div className="px-5 py-3.5 bg-[#0f172a] text-white">
        <h2 id="form-header-title" className="text-sm font-bold tracking-tight uppercase">Formulario de Inscripción Alumnos</h2>
        <p className="text-[10px] text-slate-400 mt-0.5">Completa el formulario para participar en MUN 2026</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div id="form-error-alert" className="p-2.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium rounded flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Personal Details */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Datos Personales</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="names-input" className="block text-[11px] font-bold text-slate-600 mb-1">Nombres *</label>
              <input
                id="names-input"
                type="text"
                required
                placeholder="Ej. Sofía"
                value={names}
                onChange={(e) => setNames(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
              />
            </div>
            <div>
              <label htmlFor="lastnames-input" className="block text-[11px] font-bold text-slate-600 mb-1">Apellidos *</label>
              <input
                id="lastnames-input"
                type="text"
                required
                placeholder="Ej. López Gaxiola"
                value={lastNames}
                onChange={(e) => setLastNames(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone-input" className="block text-[11px] font-bold text-slate-600 mb-1">Celular de Contacto *</label>
            <input
              id="phone-input"
              type="tel"
              required
              placeholder="Ej. 6621234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
            />
          </div>

          <div>
            <label htmlFor="email-input" className="block text-[11px] font-bold text-slate-600 mb-1">Correo Electrónico Institucional *</label>
            <input
              id="email-input"
              type="email"
              required
              placeholder="Ej. tu.nombre@bachilleresdesonora.edu.mx"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Utilizado para validar tu identidad académica.</span>
          </div>

          <div>
            <label htmlFor="school-select" className="block text-[11px] font-bold text-slate-600 mb-1">Escuela Participante *</label>
            <select
              id="school-select"
              required
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
            >
              <option value="">-- Selecciona tu Escuela --</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="sex-select" className="block text-[11px] font-bold text-slate-600 mb-1">Sexo *</label>
              <select
                id="sex-select"
                required
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
              >
                <option value="">-- Selecciona --</option>
                <option value="Hombre">Hombre</option>
                <option value="Mujer">Mujer</option>
              </select>
            </div>
            <div>
              <label htmlFor="shirt-select" className="block text-[11px] font-bold text-slate-600 mb-1">Talla de Playera *</label>
              <select
                id="shirt-select"
                required
                value={shirtSize}
                onChange={(e) => setShirtSize(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
              >
                <option value="">-- Talla --</option>
                <option value="XS">XS</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="language-select" className="block text-[11px] font-bold text-slate-600 mb-1">Idioma de Participación *</label>
            <select
              id="language-select"
              required
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
            >
              <option value="Español">Español</option>
              <option value="Inglés">Inglés</option>
              <option value="Bilingüe">Bilingüe</option>
            </select>
          </div>
        </div>
 
        {/* Committee Interests */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Intereses de Comités (3 opciones distintas)</h3>
          
          <div className="space-y-2.5">
            <div>
              <label htmlFor="choice1-select" className="block text-[11px] font-bold text-slate-600 mb-1">Opción 1 (Preferencia Principal) *</label>
              <select
                id="choice1-select"
                required
                value={choice1}
                onChange={(e) => setChoice1(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
              >
                <option value="">-- Selecciona Comité Opción 1 --</option>
                {committees.map((com) => (
                  <option key={com.id} value={com.id} disabled={com.id === choice2 || com.id === choice3}>
                    {com.name} ({com.language || "Español"})
                  </option>
                ))}
              </select>
            </div>
 
            <div>
              <label htmlFor="choice2-select" className="block text-[11px] font-bold text-slate-600 mb-1">Opción 2 *</label>
              <select
                id="choice2-select"
                required
                value={choice2}
                onChange={(e) => setChoice2(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
              >
                <option value="">-- Selecciona Comité Opción 2 --</option>
                {committees.map((com) => (
                  <option key={com.id} value={com.id} disabled={com.id === choice1 || com.id === choice3}>
                    {com.name} ({com.language || "Español"})
                  </option>
                ))}
              </select>
            </div>
 
            <div>
              <label htmlFor="choice3-select" className="block text-[11px] font-bold text-slate-600 mb-1">Opción 3 *</label>
              <select
                id="choice3-select"
                required
                value={choice3}
                onChange={(e) => setChoice3(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all outline-hidden text-slate-900 bg-white"
              >
                <option value="">-- Selecciona Comité Opción 3 --</option>
                {committees.map((com) => (
                  <option key={com.id} value={com.id} disabled={com.id === choice1 || com.id === choice2}>
                    {com.name} ({com.language || "Español"})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          id="submit-register-btn"
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors rounded shadow-sm cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Procesando registro...
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              Enviar mi Inscripción
            </>
          )}
        </button>
      </form>
    </div>
  );
}
