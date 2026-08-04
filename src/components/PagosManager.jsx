import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const METODOS_PAGO = [
  { value: 'efectivo', label: '💵 Efectivo' },
  { value: 'transferencia', label: '🏦 Transferencia / Depósito' },
  { value: 'tarjeta', label: '💳 Tarjeta de Débito/Crédito' },
  { value: 'otro', label: '📲 Otro' },
];

export default function PagosManager() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [historialPagos, setHistorialPagos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [guardandoPago, setGuardandoPago] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Formulario de Abono
  const [formPago, setFormPago] = useState({
    monto: '',
    metodo: 'transferencia',
    referencia: '',
    notas: ''
  });

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*, clientes(nombre, telefono)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCotizaciones(data || []);
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarCotizacion = async (cot) => {
    setCotizacionSeleccionada(cot);
    setMensaje({ tipo: '', texto: '' });
    fetchHistorialPagos(cot.id);
  };

  const fetchHistorialPagos = async (cotizacionId) => {
    try {
      const { data, error } = await supabase
        .from('pagos')
        .select('*')
        .eq('cotizacion_id', cotizacionId)
        .order('fecha_pago', { ascending: false });

      if (error) throw error;
      setHistorialPagos(data || []);
    } catch (err) {
      console.error('Error al obtener pagos:', err.message);
    }
  };

  const handleRegistrarPago = async (e) => {
    e.preventDefault();
    if (!cotizacionSeleccionada) return;

    const montoAbono = parseFloat(formPago.monto);
    if (isNaN(montoAbono) || montoAbono <= 0) {
      setMensaje({ tipo: 'error', texto: 'Ingresa un monto válido mayor a 0.' });
      return;
    }

    try {
      setGuardandoPago(true);
      setMensaje({ tipo: '', texto: '' });

      // 1. Insertar el Abono en la tabla `pagos`
      const { error: pagoError } = await supabase.from('pagos').insert([
        {
          cotizacion_id: cotizacionSeleccionada.id,
          monto: montoAbono,
          metodo: formPago.metodo,
          referencia: formPago.referencia,
          notas: formPago.notas
        }
      ]);

      if (pagoError) throw pagoError;

      // 2. Actualizar el campo `monto_pagado` en la tabla `cotizaciones`
      const nuevoMontoPagado = parseFloat(cotizacionSeleccionada.monto_pagado || 0) + montoAbono;
      const { error: cotError } = await supabase
        .from('cotizaciones')
        .update({ monto_pagado: nuevoMontoPagado })
        .eq('id', cotizacionSeleccionada.id);

      if (cotError) throw cotError;

      setMensaje({ tipo: 'exito', texto: `¡Abono de $${montoAbono.toFixed(2)} registrado correctamente!` });

      // Limpiar formulario y refrescar datos
      setFormPago({ monto: '', metodo: 'transferencia', referencia: '', notas: '' });
      await fetchCotizaciones();
      fetchHistorialPagos(cotizacionSeleccionada.id);

      // Actualizar estado local del ítem seleccionado
      setCotizacionSeleccionada({
        ...cotizacionSeleccionada,
        monto_pagado: nuevoMontoPagado,
        saldo_pendiente: cotizacionSeleccionada.total - nuevoMontoPagado
      });

    } catch (err) {
      setMensaje({ tipo: 'error', texto: `Error al registrar pago: ${err.message}` });
    } finally {
      setGuardandoPago(false);
    }
  };

  // --- CÁLCULOS GENERALES ---
  const totalVendido = cotizaciones.reduce((acc, c) => acc + parseFloat(c.total || 0), 0);
  const totalCobrado = cotizaciones.reduce((acc, c) => acc + parseFloat(c.monto_pagado || 0), 0);
  const totalPendiente = totalVendido - totalCobrado;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '24px' }}>
        💰 Control de Pagos y Abonos
      </h1>

      {/* DASHBOARD DE RESUMEN FINANCIERO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>TOTAL VENDIDO</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0f172a', marginTop: '4px' }}>
            ${totalVendido.toFixed(2)}
          </div>
        </div>

        <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
          <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 'bold' }}>TOTAL COBRADO</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#15803d', marginTop: '4px' }}>
            ${totalCobrado.toFixed(2)}
          </div>
        </div>

        <div style={{ padding: '16px', background: '#fef2f2', borderRadius: '10px', border: '1px solid #fecaca' }}>
          <span style={{ fontSize: '0.85rem', color: '#991b1b', fontWeight: 'bold' }}>POR COBRAR</span>
          <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#b91c1c', marginTop: '4px' }}>
            ${totalPendiente.toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LISTA DE COTIZACIONES / EVENTOS */}
        <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#0f172a' }}>Selecciona una Cotización</h2>

          {loading ? (
            <p>Cargando cotizaciones...</p>
          ) : cotizaciones.length === 0 ? (
            <p style={{ color: '#64748b' }}>No hay cuentas pendientes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '480px', overflowY: 'auto' }}>
              {cotizaciones.map(cot => {
                const pagado = parseFloat(cot.monto_pagado || 0);
                const total = parseFloat(cot.total || 0);
                const saldo = total - pagado;
                const estaLiquidado = saldo <= 0;

                return (
                  <div
                    key={cot.id}
                    onClick={() => seleccionarCotizacion(cot)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: cotizacionSeleccionada?.id === cot.id ? '#2563eb' : '#cbd5e1',
                      backgroundColor: cotizacionSeleccionada?.id === cot.id ? '#eff6ff' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem' }}>
                      <span>Folio #{cot.folio || 'N/A'} - {cot.clientes?.nombre || 'Cliente'}</span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        backgroundColor: estaLiquidado ? '#dcfce7' : '#fee2e2',
                        color: estaLiquidado ? '#15803d' : '#991b1b'
                      }}>
                        {estaLiquidado ? 'Liquidado' : 'Pendiente'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.85rem' }}>
                      <span style={{ color: '#475569' }}>Total: ${total.toFixed(2)}</span>
                      <span style={{ fontWeight: 'bold', color: estaLiquidado ? '#059669' : '#dc2626' }}>
                        Saldo: ${saldo.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* DETALLE Y REGISTRO DE ABONO */}
        {cotizacionSeleccionada ? (
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', color: '#0f172a' }}>
              Estado de Cuenta - Folio #{cotizacionSeleccionada.folio}
            </h2>
            <p style={{ color: '#475569', fontSize: '0.85rem', marginBottom: '16px' }}>
              Cliente: <strong>{cotizacionSeleccionada.clientes?.nombre}</strong>
            </p>

            {/* ESTADO DE SALDOS DE LA COTIZACIÓN */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Costo Total</span>
                <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>${parseFloat(cotizacionSeleccionada.total || 0).toFixed(2)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#166534' }}>Abonado</span>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#166534' }}>${parseFloat(cotizacionSeleccionada.monto_pagado || 0).toFixed(2)}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#991b1b' }}>Pendiente</span>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#991b1b' }}>
                  ${(parseFloat(cotizacionSeleccionada.total || 0) - parseFloat(cotizacionSeleccionada.monto_pagado || 0)).toFixed(2)}
                </div>
              </div>
            </div>

            {mensaje.texto && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '6px',
                marginBottom: '16px',
                backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
                color: mensaje.tipo === 'exito' ? '#166534' : '#991b1b',
                fontSize: '0.85rem',
                fontWeight: 'bold'
              }}>
                {mensaje.texto}
              </div>
            )}

            {/* FORMULARIO REGISTRAR PAGOS */}
            <form onSubmit={handleRegistrarPago} style={{ marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#1e293b' }}>Registrar Nuevo Abono</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Monto del Abono ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={formPago.monto}
                    onChange={e => setFormPago({ ...formPago, monto: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Método de Pago</label>
                  <select
                    value={formPago.metodo}
                    onChange={e => setFormPago({ ...formPago, metodo: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  >
                    {METODOS_PAGO.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px' }}>Referencia / Folio de Transacción</label>
                <input
                  type="text"
                  placeholder="Ej. SPEI #98231 o Voucher"
                  value={formPago.referencia}
                  onChange={e => setFormPago({ ...formPago, referencia: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <button
                type="submit"
                disabled={guardandoPago}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: guardandoPago ? '#94a3b8' : '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: guardandoPago ? 'not-allowed' : 'pointer'
                }}
              >
                {guardandoPago ? 'Guardando Pago...' : '💵 Aplicar Abono'}
              </button>
            </form>

            {/* HISTORIAL DE PAGOS APLICADOS */}
            <div>
              <h3 style={{ fontSize: '1rem', marginBottom: '12px', color: '#1e293b' }}>
                Historial de Abonos ({historialPagos.length})
              </h3>

              {historialPagos.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No hay pagos registrados para esta propuesta.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {historialPagos.map(pago => {
                    const fechaStr = new Date(pago.fecha_pago).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={pago.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderRadius: '6px', border: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>
                            ${parseFloat(pago.monto).toFixed(2)} — <span style={{ textTransform: 'capitalize', color: '#2563eb' }}>{pago.metodo}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            📅 {fechaStr} {pago.referencia && `| Ref: ${pago.referencia}`}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 'bold' }}>✓ Aplicado</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          <div style={{ padding: '40px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
            Selecciona una cotización de la lista de la izquierda para registrar un abono o consultar saldos.
          </div>
        )}

      </div>
    </div>
  );
}