import { useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import { useStore } from '../store.jsx';
import { Card, PageHeader, Badge } from '../components/ui.jsx';
import { FormatoModal } from '../components/Formato.jsx';
import { CATALOGO } from '../formatos.jsx';

export default function Formatos() {
  const { db } = useStore();
  const [formato, setFormato] = useState(null);
  const modulos = [...new Set(CATALOGO.map((f) => f.modulo))];
  const [filtro, setFiltro] = useState('Todos');
  const lista = CATALOGO.filter((f) => filtro === 'Todos' || f.modulo === filtro);

  return (
    <>
      <PageHeader title="Formatos" subtitle="Cada registro del sistema genera su formato oficial con código, versión y firmas, listo para presentar a la unidad minera y en auditorías. Abre cualquiera para ver un ejemplo con datos ficticios." />
      <div className="tabs">
        {['Todos', ...modulos].map((m) => <button key={m} className={filtro === m ? 'active' : ''} onClick={() => setFiltro(m)}>{m}</button>)}
      </div>
      <div className="cards fx-cards">
        {lista.map((f) => (
          <Card key={f.codigo}>
            <div className="fx-card">
              <div className="fx-card-icon"><FileText size={22} /></div>
              <div className="grow">
                <code>{f.codigo}</code> <Badge tone="info">{f.modulo}</Badge>
                <strong>{f.titulo}</strong>
                <p className="muted small">{f.uso}</p>
              </div>
            </div>
            <button className="btn btn-sm" onClick={() => setFormato(f.ejemplo(db))}><Eye size={14} /> Ver ejemplo</button>
          </Card>
        ))}
      </div>
      <p className="muted small">Si una unidad exige su propio formato, se configura su plantilla (logo, código y campos) y el sistema llena los mismos datos en ese diseño.</p>
      {formato && <FormatoModal doc={formato} onClose={() => setFormato(null)} />}
    </>
  );
}
