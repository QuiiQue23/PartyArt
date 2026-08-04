import React, { useState } from 'react';
import { 
  Users, 
  Package, 
  FileText, 
  Sparkles, 
  Calendar 
} from 'lucide-react';

// Importación con los nombres exactos de tus archivos
import Cotizador from './components/Cotizador';
import AgendaClientes from './components/AgendaClientes';
import InventarioManager from './components/InventarioManager';
import ContratosPagos from './components/ContratosPagos';
import GeneradorIA from './components/GeneradorIA';

export default function App() {
  const [tabActiva, setTabActiva] = useState('cotizador');

  const navegacion = [
    { id: 'cotizador', nombre: 'Cotizador', icono: FileText },
    { id: 'agenda', nombre: 'Agenda y Clientes', icono: Users },
    { id: 'inventario', nombre: 'Inventario', icono: Package },
    { id: 'contratos', nombre: 'Contratos y Pagos', icono: Calendar },
    { id: 'disenador-ia', nombre: 'Diseñador IA', icono: Sparkles },
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar / Navegación Lateral */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between">
        <div>
          {/* Header del Software */}
          <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
            <div className="bg-pink-500 p-2 rounded-lg text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Party Art</h1>
              <span className="text-xs text-slate-400">Gestión de Eventos</span>
            </div>
          </div>

          {/* Menú de pestañas */}
          <nav className="mt-6 px-4 space-y-1">
            {navegacion.map((item) => {
              const Icono = item.icono;
              const esActivo = tabActiva === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTabActiva(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    esActivo 
                      ? 'bg-pink-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icono className="h-5 w-5" />
                  <span>{item.nombre}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 text-center">
          Party Art App v1.0
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {tabActiva === 'cotizador' && <Cotizador />}
          {tabActiva === 'agenda' && <AgendaClientes />}
          {tabActiva === 'inventario' && <InventarioManager />}
          {tabActiva === 'contratos' && <ContratosPagos />}
          {tabActiva === 'disenador-ia' && <GeneradorIA />}
        </div>
      </main>
    </div>
  );
}