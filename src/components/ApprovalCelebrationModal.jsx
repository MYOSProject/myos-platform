import React from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Download,
  ListFilter,
  X,
  ShieldCheck,
  Calendar,
  UserCheck
} from 'lucide-react';

export default function ApprovalCelebrationModal({
  isOpen,
  onClose,
  siteTitle,
  approverName,
  approverEmail,
  approvedAt,
  onOpenInNewTab,
  onGoToApprovedSection,
  onDownloadHtml
}) {
  if (!isOpen) return null;

  const formattedDate = approvedAt
    ? new Date(approvedAt).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleDateString('es-MX');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl p-6 sm:p-8 space-y-6 text-center relative overflow-hidden">
        {/* Glow de fondo */}
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/20 blur-[80px] rounded-full pointer-events-none"></div>

        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icono de Aprobado */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        {/* Título & Mensaje */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Firma Humana Certificada</span>
          </div>
          <h3 className="text-2xl font-black text-white font-heading">
            ¡Página Web Aprobada con Éxito!
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            Has validado y autorizado la publicación de <strong className="text-white">"{siteTitle}"</strong>. El registro quedó guardado con tu firma en el sistema de auditoría.
          </p>
        </div>

        {/* Ficha de Trazabilidad */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">Estado de Publicación:</span>
            <span className="font-extrabold text-emerald-400 uppercase tracking-wider">APPROVED ✓</span>
          </div>

          <div className="flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">Aprobado por:</span>
              <strong className="text-white block">{approverName}</strong>
              <span className="text-slate-400 font-mono text-[11px] block">{approverEmail}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 pt-1 text-slate-400">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="space-y-2.5 pt-1">
          {/* BOTÓN 1: ABRIR EN OTRA PESTAÑA (Requerimiento Principal) */}
          <button
            onClick={() => {
              onOpenInNewTab();
              onClose();
            }}
            className="w-full py-3.5 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:opacity-95 transition shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir Página en Otra Pestaña</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onGoToApprovedSection();
                onClose();
              }}
              className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ListFilter className="w-3.5 h-3.5 text-[#98dae9]" />
              <span>Ver Sitios Aprobados</span>
            </button>

            <button
              onClick={() => {
                onDownloadHtml();
              }}
              className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Descargar HTML</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
