import { useState } from 'react';
import { Folder, FileText, CheckCircle2, Clock, Palette, Globe, Share2, Calendar, ChevronRight } from 'lucide-react';

export default function DriveExplorer({ publishedCount = 0, pendingCount = 0 }) {
  const [selectedFolder, setSelectedFolder] = useState('/Redes_Sociales/Para_Publicar');

  const driveStructure = [
    {
      id: '/Marca',
      name: '📁 /Marca',
      description: 'Logotipos oficiales, colores Pantone (640C, Process Black), tipografías Open Sans y manual corporativo.',
      icon: Palette,
      badge: 'Manual v1.0',
      files: [
        { name: 'logo_iot_technologies_vector.svg', size: '42 KB', type: 'Vectorial' },
        { name: 'manual_corporativo_iot_technologies.pdf', size: '2.4 MB', type: 'Documento' },
        { name: 'paleta_colores_pantone.json', size: '3.1 KB', type: 'Guía de Color' },
        { name: 'tipografia_open_sans_roboto.ttf', size: '1.2 MB', type: 'Fuente' }
      ]
    },
    {
      id: '/Sitio_Web/Paginas',
      name: '📁 /Sitio_Web/Paginas',
      description: 'Textos y componentes para Landing Page, Servicios y secciones de conversión React.',
      icon: Globe,
      badge: 'Headless CMS',
      files: [
        { name: 'inicio_hero_propuesta.json', size: '5.2 KB', type: 'Config React' },
        { name: 'servicios_cinco_capacidades.json', size: '8.4 KB', type: 'Datos Corporativos' },
        { name: 'contacto_directorio_sedes.json', size: '2.1 KB', type: 'Directorio' }
      ]
    },
    {
      id: '/Sitio_Web/Blog',
      name: '📁 /Sitio_Web/Blog',
      description: 'Entradas del blog en Markdown y Google Docs sincronizadas con la plataforma.',
      icon: FileText,
      badge: 'Artículos',
      files: [
        { name: 'transformacion_digital_pymes_iot.md', size: '14 KB', type: 'Markdown' },
        { name: 'business_intelligence_toma_decisiones.md', size: '18 KB', type: 'Markdown' },
        { name: 'beneficios_kioskos_interactivos.md', size: '12 KB', type: 'Markdown' }
      ]
    },
    {
      id: '/Redes_Sociales/Para_Publicar',
      name: '📁 /Redes_Sociales/Para_Publicar',
      description: 'Material generado por el Cerebro Digital en estado PENDING a la espera de aprobación humana obligatoria.',
      icon: Clock,
      badge: `${pendingCount} Pendientes`,
      highlight: true,
      files: [
        { name: 'brief_propuestas_ia_pendientes.json', size: '9.6 KB', type: 'Estado: PENDING' },
        { name: 'prompts_arte_dalle_midjourney.txt', size: '3.8 KB', type: 'Arte IA' },
        { name: 'copies_instagram_facebook_drafts.json', size: '15.2 KB', type: 'Borrador Redes' }
      ]
    },
    {
      id: '/Redes_Sociales/Publicado',
      name: '📁 /Redes_Sociales/Publicado',
      description: 'Histórico de publicaciones aprobadas con sello y auditoría del usuario que validó la salida.',
      icon: CheckCircle2,
      badge: `${publishedCount} Aprobados`,
      files: [
        { name: 'historico_aprobados_auditoria_2026.json', size: '32 KB', type: 'Audit Trail' },
        { name: 'registro_aprobador_carlos_torres.log', size: '4.8 KB', type: 'Firma Humana' }
      ]
    },
    {
      id: '/Calendario',
      name: '📁 /Calendario',
      description: 'Programación editorial, calendario mensual de lanzamientos y métricas de conversión.',
      icon: Calendar,
      badge: 'Q4 2026',
      files: [
        { name: 'cronograma_editorial_octubre_2026.json', size: '11 KB', type: 'Calendario' },
        { name: 'metricas_conversion_high_growth.csv', size: '6.4 KB', type: 'KPIs' }
      ]
    }
  ];

  const currentFolder = driveStructure.find(f => f.id === selectedFolder) || driveStructure[3];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-[#98dae9] uppercase tracking-wider mb-1">
            <Share2 className="w-4 h-4 text-[#1d7eae]" />
            Fuente Central de Datos (CMS Headless)
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Estructura de Google Drive — Especificación de Carlos (Merkatics)
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Conexión arquitectónica del proyecto 2026-544-11 (MYOS). Archivos clasificados por flujo de aprobación.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full bg-[#1d7eae]/20 border border-[#1d7eae]/40 text-[#98dae9] text-xs font-semibold">
          Regla: 0% Auto-Publicación
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lista de Carpetas de Drive */}
        <div className="space-y-2 lg:col-span-1">
          {driveStructure.map((folder) => {
            const Icon = folder.icon;
            const isSelected = selectedFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between group ${
                  isSelected
                    ? 'bg-[#1d7eae]/20 border-[#1d7eae] text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#1d7eae] text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold block">{folder.name}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{folder.badge}</span>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition ${isSelected ? 'text-[#98dae9] translate-x-1' : 'text-slate-600'}`} />
              </button>
            );
          })}
        </div>

        {/* Detalle de Carpeta y Archivos */}
        <div className="lg:col-span-2 bg-slate-950/80 rounded-2xl border border-slate-800/90 p-5 space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#1d7eae]" />
              {currentFolder.id}
            </h4>
            <p className="text-xs text-slate-400 mt-1">{currentFolder.description}</p>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Archivos Sincronizados en esta Carpeta:
            </span>
            <div className="divide-y divide-slate-800/80">
              {currentFolder.files.map((file, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-[#98dae9]" />
                    <span className="font-mono text-slate-200">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {file.size}
                    </span>
                    <span className="text-[10px] font-semibold text-[#1d7eae] bg-[#1d7eae]/10 px-2 py-0.5 rounded border border-[#1d7eae]/30">
                      {file.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
