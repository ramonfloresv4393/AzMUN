import { Delegate, Payment, School, SystemConfig } from "../types";
import { formatCurrency, formatDate } from "../utils";
import { Printer, X, CheckCircle } from "lucide-react";

interface ReceiptPrintProps {
  payment: Payment;
  student: Delegate;
  school: School | undefined;
  config: SystemConfig;
  payments?: Payment[];
  onClose: () => void;
}

export default function ReceiptPrint({ payment, student, school, config, payments = [], onClose }: ReceiptPrintProps) {
  const handlePrint = () => {
    const printContent = document.getElementById("receipt-print-area");
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      // Fallback: print directly
      window.print();
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo de Pago - Folio ${payment.folio}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              padding: 40px;
              background: #fff;
              color: #000;
            }
            .mono {
              font-family: 'JetBrains Mono', monospace;
            }
            @media print {
              .no-print { display: none; }
              body { padding: 0; margin: 0; }
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Calculations for total required, accumulated, and remaining debt
  const studentPayments = payments.length > 0 ? payments.filter(p => p.studentId === student.id) : [payment];
  const paymentsPriorAndIncluding = studentPayments.filter(p => p.folio <= payment.folio);
  const totalPaidByStudent = paymentsPriorAndIncluding.reduce((sum, p) => sum + p.amount, 0);
  const totalRequired = config.totalAmountToPay ?? (config.numPaymentsRequired * config.paymentAmount);
  const remainingDebt = Math.max(0, totalRequired - totalPaidByStudent);
  const isFullyPaid = totalPaidByStudent >= totalRequired;

  return (
    <div id="receipt-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded shadow-lg border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
          <h3 id="receipt-title" className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-blue-600" />
            Recibo de Pago Generado
          </h3>
          <button
            id="close-receipt-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200/50 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Area Wrapper */}
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          <div
            id="receipt-print-area"
            className="bg-white border border-dashed border-slate-300 rounded p-4 max-w-sm mx-auto relative overflow-hidden"
          >
            {/* Watermark/Stamp overlay */}
            <div className="absolute right-3 top-3 rotate-12 opacity-10 pointer-events-none">
              <div className="border-2 border-emerald-600 text-emerald-600 font-bold uppercase rounded px-2 py-0.5 text-xl tracking-widest font-mono">
                PAGADO
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-4">
              <h2 className="text-sm font-bold tracking-tight text-slate-950 uppercase">Comité Mexicano AzMUN</h2>
              <p className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">Modelo de las Naciones Unidas</p>
              <div className="w-8 h-0.5 bg-slate-900 mx-auto mt-1.5 rounded"></div>
            </div>

            {/* Info Row */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-2.5 mb-2.5 text-xs">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Emisor</p>
                <p className="font-bold text-slate-800">Comité Organizador AzMUN</p>
                <p className="text-[10px] text-slate-500">Finanzas & Registro</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Folio Recibo</p>
                <p className="font-bold font-mono text-blue-600">#{payment.folio}</p>
                <p className="text-[9px] text-slate-500">{formatDate(payment.date).split(" a las")[0]}</p>
              </div>
            </div>

            {/* Student details */}
            <div className="mb-4 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Delegado / Alumno</p>
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {student.names} {student.lastNames}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  <span className="font-medium text-slate-400">Escuela:</span> {school?.name || "Sin Escuela Asociada"}
                </p>
                <p className="text-xs text-slate-500">
                  <span className="font-medium text-slate-400">Correo:</span> {student.email}
                </p>
              </div>
            </div>

            {/* Payment Details Table */}
            <div className="border-t border-b border-slate-200 py-2 mb-4">
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Concepto de Pago</span>
                <span className="text-right">Importe</span>
              </div>
              <div className="flex justify-between items-center text-xs py-1">
                <div className="text-slate-800">
                  <p className="font-bold">Inscripción AzMUN</p>
                  <p className="text-[10px] text-slate-500">
                    Abono parcial {payment.notes ? `(${payment.notes})` : ""}
                  </p>
                </div>
                <div className="text-right font-mono font-bold text-slate-900">
                  {formatCurrency(payment.amount)}
                </div>
              </div>
            </div>

            {/* Total Section */}
            <div className="space-y-1 border-b border-slate-100 pb-2.5 mb-4 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Cantidad Total a Pagar:</span>
                <span className="font-mono">{formatCurrency(totalRequired)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Total Acumulado Pagado:</span>
                <span className="font-mono">{formatCurrency(totalPaidByStudent)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-semibold">
                <span>Adeudo Restante:</span>
                <span className="font-mono">{formatCurrency(remainingDebt)}</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 mt-1.5 text-slate-900">
                <span className="font-bold">Monto de este Recibo:</span>
                <span className="text-sm font-bold font-mono text-slate-950">{formatCurrency(payment.amount)}</span>
              </div>
            </div>

            {/* Status Footer */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle className={`w-4 h-4 ${isFullyPaid ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span className={`text-[10px] font-bold uppercase ${isFullyPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isFullyPaid ? "LIQUIDADO" : "PAGO PARCIAL"}
                </span>
              </div>
              <span className="text-[9px] text-slate-400 font-mono italic">
                Operador: Sistema Autogenerado
              </span>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-4 pt-5 border-t border-slate-100">
              <div className="text-center">
                <div className="h-8 border-b border-slate-300 mx-auto w-3/4"></div>
                <p className="text-[9px] text-slate-500 uppercase mt-1 font-bold">Firma del que realiza el pago</p>
              </div>
              <div className="text-center">
                <div className="h-8 border-b border-slate-300 mx-auto w-3/4"></div>
                <p className="text-[9px] text-slate-500 uppercase mt-1 font-bold">Firma del Comité</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-slate-200 bg-slate-50">
          <button
            id="close-receipt-secondary"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            id="print-receipt-btn"
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors rounded shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Recibo
          </button>
        </div>
      </div>
    </div>
  );
}
