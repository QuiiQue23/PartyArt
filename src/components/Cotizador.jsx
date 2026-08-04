import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Calculator, FileText } from 'lucide-react';

export default function Cotizador() {
  const [clientes, setClientes] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [fechaEvento, setFechaEvento] = useState('');
  const [lineas, setLineas] = useState([]);
  const [descuento, setDescuento] = useState(0);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    const { data: dataClientes } = await supabase.from('clientes').select('*');
    const { data: dataInventario } = await supabase.from('inventario').select('*');
    if (dataClientes) setClientes(dataClientes);
    if (dataInventario) setInventario(dataInventario);
  };

  const agregarLinea = () => {
    setLineas([...lineas, { inventario_id: '', cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
  };

  const actualizarLinea = (index, field, value) => {
    const nuevasLineas = [...lineas];
    nuevasLineas[index][field] = value;

    if (field === 'inventario_id') {
      const item = inventario.find((i) => i.id === value);
      if (item) {
        nuevasLineas[index].precio_unitario = item.precio_renta;
        nuevasLineas[index].subtotal = item.precio_renta * nuevasLineas[index].cantidad;
      }
    }

    if (field === 'cantidad' || field === 'precio_unitario') {
      const cant = field === 'cantidad' ? Number(value) : nuevasLineas[index].cantidad;
      const prec = field === 'precio_unitario' ? Number(value) : nuevasLineas[index].precio_unitario;
      nuevasLineas[index].subtotal = cant * prec;
    }

    setLineas(nuevasLineas);
  };

  const eliminarLinea = (index) => {
    setLineas(lineas.filter((_, i) => i !== index));
  };

  const subtotalGeneral = lineas.reduce((acc, curr) => acc + curr.subtotal, 0);
  const total = subtotalGeneral - Number(descuento);

  const guardarCotizacion = async () => {
    if (!clienteId || lineas.length === 0) {
      alert('Selecciona un cliente y al menos un producto.');
      return;
    }

    const { data: cotizacion, error } = await supabase
      .from('cotizaciones')
      .insert([
        {
          cliente_id: clienteId,
          fecha_evento: fechaEvento,
          subtotal: subtotalGeneral,
          descuento: Number(descuento),
          total: total,
          estado: 'pendiente',
        },
      ])
      .select()
      .single();

    if (error) {
      alert('Error al guardar la cotización: ' + error.message);
      return;
    }

    const detalles = lineas.map((l) => ({
      cotizacion_id: cotizacion.id,
      inventario_id: l.inventario_id,
      cantidad: l.cantidad,
      precio_unitario: l.precio_unitario,
      subtotal: l.subtotal,
    }));

    await supabase.from('detalles_cotizacion').insert(detalles);
    alert('Cotización guardada exitosamente.');
    setLineas([]);
    setClienteId('');
    setFechaEvento('');
    setDescuento(0);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center space-x-2 mb-6">
        <Calculator className="h-6 w-6 text-pink-500" />
        <h2 className="text-xl font-bold text-gray-800">Generar Cotización</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <option value="">-- Seleccionar Cliente --</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} ({c.telefono})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha del Evento</label>
          <input
            type="date"
            value={fechaEvento}
            onChange={(e) => setFechaEvento(e.target.value)}
            className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700">Artículos y Servicios</h3>
          <button
            onClick={agregarLinea}
            className="flex items-center space-x-1 text-sm bg-pink-500 text-white px-3 py-1.5 rounded-lg hover:bg-pink-600 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Elemento</span>
          </button>
        </div>

        <div className="space-y-3">
          {lineas.map((linea, idx) => (
            <div key={idx} className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg">
              <select
                value={linea.inventario_id}
                onChange={(e) => actualizarLinea(idx, 'inventario_id', e.target.value)}
                className="flex-1 border rounded p-2 text-sm bg-white"
              >
                <option value="">Seleccionar del Inventario</option>
                {inventario.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre} - ${item.precio_renta}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={linea.cantidad}
                onChange={(e) => actualizarLinea(idx, 'cantidad', e.target.value)}
                className="w-20 border rounded p-2 text-sm bg-white"
                placeholder="Cant."
              />

              <input
                type="number"
                value={linea.precio_unitario}
                onChange={(e) => actualizarLinea(idx, 'precio_unitario', e.target.value)}
                className="w-28 border rounded p-2 text-sm bg-white"
                placeholder="Precio"
              />

              <span className="w-28 text-right font-semibold text-sm">${linea.subtotal}</span>

              <button
                onClick={() => eliminarLinea(idx)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t pt-4 space-y-2 max-w-xs ml-auto text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal:</span>
          <span>${subtotalGeneral}</span>
        </div>
        <div className="flex justify-between items-center text-gray-600">
          <span>Descuento:</span>
          <input
            type="number"
            value={descuento}
            onChange={(e) => setDescuento(e.target.value)}
            className="w-24 border rounded p-1 text-right text-sm"
          />
        </div>
        <div className="flex justify-between font-bold text-lg text-gray-800 border-t pt-2">
          <span>Total:</span>
          <span>${total}</span>
        </div>
      </div>

      <div className="mt-6 text-right">
        <button
          onClick={guardarCotizacion}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 transition flex items-center space-x-2 ml-auto"
        >
          <FileText className="h-4 w-4" />
          <span>Guardar Cotización</span>
        </button>
      </div>
    </div>
  );
}