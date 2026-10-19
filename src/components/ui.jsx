export function Alert({ kind = 'err', children }) {
  return children ? <div className={`alert ${kind}`} role={kind === 'err' ? 'alert' : undefined}>{children}</div> : null;
}

const STATUS = {
  PENDING: ['Pendiente de aprobación', 'pending', '⏳'],
  PENDING_APPROVAL: ['Pendiente de aprobación', 'pending', '⏳'],
  DRAFT: ['Borrador', 'draft', '✎'],
  APPROVED: ['Aprobado', 'ok', '✓'],
  PUBLISHED: ['Publicado', 'ok', '✓'],
  REJECTED: ['Rechazado', 'pending', '✕'],
  FAILED: ['Falló al publicar', 'pending', '!']
};
// El estado siempre lleva texto e ícono: el color no es el único indicador (manual, sección 12).
export function Tag({ s }) {
  const [label, cls, icon] = STATUS[s] || [s, '', ''];
  return <span className={`tag ${cls}`}><span aria-hidden="true">{icon}</span>{label}</span>;
}

export const PLATFORM = { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn' };
export const fmt = (d) => (d ? new Date(d).toLocaleString('es-MX') : '');
