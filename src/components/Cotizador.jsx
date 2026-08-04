import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Cotizador() {
  const [clientes, setClientes] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Datos principales de la Cotización
  const [cotizacion, setCotizacion] = useState({
    cliente_id: '',
    fecha_evento: '',
    lugar_evento: '',
    tematica: '',
    descuento: 0,
    notas: ''
  });

  // Ítems seleccionados en la cotización
  const [itemsCotizacion, setItemsCotizacion] = useState([]);

  // Formulario para ítem personalizado (fuera del inventario)
  const [customItem, setCustomItem] = useState({
    descripcion: '',
    cantidad: 1,
    precio: 0
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resClientes, resInventario] = await Promise.all([
        supabase.from('clientes').select('*').order('nombre'),
        supabase.from('inventario').select('*').eq('activo', true).order('nombre')
      ]);

      if (resClientes.error) throw resClientes.error;
      if (resInventario.error) throw resInventario.error;

      setClientes(resClientes.data || []);
      setInventario(resInventario.data || []);
    } catch (err) {
      console.error('Error al cargar datos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA DE AGREGAR / EDITAR ÍTEMS ---
  const agregarDesdeInventario = (itemInv) => {
    const existe = itemsCotizacion.find(i => i.inventario_id === itemInv.id);

    if (existe) {
      setItemsCotizacion(itemsCotizacion.map(i =>
        i.inventario_id === itemInv.id
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio_unitario }
          : i
      ));
    } else {
      setItemsCotizacion([
        ...itemsCotizacion,
        {
          inventario_id: itemInv.id,
          descripcion: itemInv.nombre,
          cantidad: 1,
          precio_unitario: parseFloat(itemInv.precio_alquiler),
          subtotal: parseFloat(itemInv.precio_alquiler),
          es_custom: false
        }
      ]);
    }
  };

  const agregarItemCustom = (e) => {
    e.preventDefault();
    if (!customItem.descripcion || customItem.precio <= 0) return;

    setItemsCotizacion([
      ...itemsCotizacion,
      {
        inventario_id: null,
        descripcion: customItem.descripcion,
        cantidad: parseInt(customItem.cantidad, 10),
        precio_unitario: parseFloat(customItem.precio),
        subtotal: parseInt(customItem.cantidad, 10) * parseFloat(customItem.precio),
        es_custom: true
      }
    ]);

    setCustomItem({ descripcion: '', cantidad: 1, precio: 0 });
  };

  const actualizarCantidad = (index, nuevaCantidad) => {
    const cant = Math.max(1, parseInt(nuevaCantidad, 10) || 1);
    setItemsCotizacion(itemsCotizacion.map((item, i) => {
      if (i === index) {
        return { ...item, cantidad: cant, subtotal: cant * item.precio_unitario };
      }
      return item;
    }));
  };

  const eliminarItem = (index) => {
    setItemsCotizacion(itemsCotizacion.filter((_, i) => i !== index));
  };

  // --- CÁLCULOS DE TOTALES ---
  const subtotal = itemsCotizacion.reduce((acc, item) => acc + item.subtotal, 0);
  const descuentoAplicado = parseFloat(cotizacion.descuento) || 0;
  const total = Math.max(0, subtotal - descuentoAplicado);

  // --- GUARDAR COTIZACIÓN EN SUPABASE ---
  const handleGuardarCotizacion = async (e) => {
    e.preventDefault();
    if (!cotizacion.cliente_id) {
      setMensaje({ tipo: 'error', texto: 'Por favor selecciona un cliente.' });
      return;
    }
    if (itemsCotizacion.length === 0) {
      setMensaje({ tipo: 'error', texto: 'Agrega al menos un artículo a la cotización.' });
      return;
    }

    try {
      setGuardando(true);
      setMensaje({ tipo: '', texto: '' });

      // 1. Insertar Cotización principal
      const { data: cotData, error: cotError } = await supabase
        .from('cotizaciones')
        .insert([
          {
            cliente_id: cotizacion.cliente_id,
            fecha_evento: cotizacion.fecha_evento,
            lugar_evento: cotizacion.lugar_evento,
            tematica: cotizacion.tematica,
            estado: 'borrador',
            subtotal: subtotal,
            descuento: descuentoAplicado,
            total: total,
            notas: cotizacion.notas
          }
        ])
        .select()
        .single();

      if (cotError) throw cotError;

      // 2. Insertar Detalles de Cotización
      const detallesPayload = itemsCotizacion.map(item => ({
        cotizacion_id: cotData.id,
        inventario_id: item.inventario_id,
        descripcion_custom: item.es_custom ? item.descripcion : null,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario
      }));

      const { error: detError } = await supabase
        .from('detalles_cotizacion')
        .insert(detallesPayload);

      if (detError) throw detError;

      // 3. Crear registro automático en la Agenda si hay fecha
      if (cotizacion.fecha_evento) {
        const clienteNom = clientes.find(c => c.id === cotizacion.cliente_id)?.nombre || '';
        await supabase.from('agenda').insert([
          {
            cotizacion_id: cotData.id,
            cliente_id: cotizacion.cliente_id,
            titulo: `Evento: ${cotizacion.tematica || 'Fiesta'} - ${clienteNom}`,
            tipo: 'evento',
            fecha_inicio: cotizacion.fecha_evento,
            fecha_fin: cotizacion.fecha_evento,
            lugar: cotizacion.lugar_evento
          }
        ]);
      }

      setMensaje({ tipo: 'exito', texto: `¡Cotización Folio #${cotData.folio || ''} guardada exitosamente!` });

      // Limpiar Formulario
      setCotizacion({ cliente_id: '', fecha_evento: '', lugar_evento: '', tematica: '', descuento: 0, notas: '' });
      setItemsCotizacion([]);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: `Error al guardar: ${err.message}` });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '24px' }}>
        📝 Generador de Cotizaciones
      </h1>

      {mensaje.texto && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
          color: mensaje.tipo === 'exito' ? '#166534' : '#991b1b',
          fontWeight: '600'
        }}>
          {mensaje.texto}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
        
        {/* PANEL IZQUIERDO: DETALLES DEL EVENTO Y CATÁLOGO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* DATOS DEL CLIENTE Y EVENTO */}
          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#0f172a' }}>1. Datos del Cliente y Evento</h2>
            
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Cliente *</label>
              <select
                value={cotizacion.cliente_id}
                onChange={e => setCotizacion({ ...cotizacion, cliente_id: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.telefono || 'Sin tel'})</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Temática / Concepto</label>
                <input
                  type="text"
                  placeholder="Ej. Paw Patrol, XV Años Gold"
                  value={cotizacion.tematica}
                  onChange={e => setCotizacion({ ...cotizacion, tematica: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Fecha y Hora Evento</label>
                <input
                  type="datetime-local"
                  value={cotizacion.fecha_evento}
                  onChange={e => setCotizacion({ ...cotizacion, fecha_evento: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Lugar del Evento</label>
              <input
                type="text"
                placeholder="Dirección o nombre del salón"
                value={cotizacion.lugar_evento}
                onChange={e => setCotizacion({ ...cotizacion, lugar_evento: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
          </div>

          {/* SELECCIONAR DEL INVENTARIO */}
          <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#0f172a' }}>2. Agregar del Inventario</h2>
            
            {loading ? (
              <p>Cargando inventario...</p>
            ) : (
              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inventario.map(item => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    border: '1px solid #f1f5f9',
                    borderRadius: '8px',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {item.foto_url && (
                        <img src={item.foto_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} />
                      )}
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{item.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>${parseFloat(item.precio_alquiler).toFixed(2)}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => agregarDesdeInventario(item)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Agregar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AGREGAR ÍTEM CUSTOM / SERVICIO */}
          <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '10px', color: '#0f172a' }}>3. Ítem Personalizado o Servicio</h2>
            <form onSubmit={agregarItemCustom} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Descripción</label>
                <input
                  type="text"
                  placeholder="Ej. Lona Paw Patrol"
                  value={customItem.descripcion}
                  onChange={e => setCustomItem({ ...customItem, descripcion: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Cant.</label>
                <input
                  type="number"
                  min="1"
                  value={customItem.cantidad}
                  onChange={e => setCustomItem({ ...customItem, cantidad: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Precio ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customItem.precio}
                  onChange={e => setCustomItem({ ...customItem, precio: e.target.value })}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>
              <button
                type="submit"
                style={{ padding: '7px 12px', backgroundColor: '#059669', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                + Añadir
              </button>
            </form>
          </div>

        </div>

        {/* PANEL DERECHO: VISTA PREVIA Y DESGLOSE */}
        <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#0f172a', borderBottom: '2px solid #f1f5f9', pb: '8px' }}>
            🛒 Desglose de Cotización
          </h2>

          {itemsCotizacion.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px 0' }}>
              No has agregado artículos o servicios a esta propuesta.
            </p>
          ) : (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px' }}>Descripción</th>
                    <th style={{ padding: '8px', width: '70px' }}>Cant.</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Unitario</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Subtotal</th>
                    <th style={{ padding: '8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {itemsCotizacion.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '8px' }}>
                        {item.descripcion}
                        {item.es_custom && <span style={{ fontSize: '0.7rem', color: '#d97706', marginLeft: '6px' }}>(Personalizado)</span>}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={e => actualizarCantidad(index, e.target.value)}
                          style={{ width: '50px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center' }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>${item.precio_unitario.toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>${item.subtotal.toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() => eliminarItem(index)}
                          style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* RESUMEN DE CÁLCULOS */}
              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Subtotal:</span>
                  <span style={{ fontWeight: 'bold' }}>${subtotal.toFixed(2)}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569' }}>Descuento ($):</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cotizacion.descuento}
                    onChange={e => setCotizacion({ ...cotizacion, descuento: e.target.value })}
                    style={{ width: '90px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'right' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '4px' }}>
                  <span>Total Propuesta:</span>
                  <span style={{ color: '#059669' }}>${total.toFixed(2)}</span>
                </div>
              </div>

              {/* NOTAS */}
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '4px', color: '#475569' }}>
                  Notas / Condiciones de Entrega
                </label>
                <textarea
                  rows="2"
                  placeholder="Ej. Se requiere el 50% de anticipo para apartar fecha..."
                  value={cotizacion.notas}
                  onChange={e => setCotizacion({ ...cotizacion, notas: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                />
              </div>

              {/* BOTÓN GUARDAR */}
              <button
                type="button"
                onClick={handleGuardarCotizacion}
                disabled={guardando}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '12px',
                  backgroundColor: guardando ? '#94a3b8' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: guardando ? 'not-allowed' : 'pointer'
                }}
              >
                {guardando ? 'Guardando Cotización...' : '💾 Guardar y Generar Propuesta'}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}