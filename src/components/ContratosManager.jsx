import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import SignatureCanvas from 'react-signature-canvas';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ContratoPDF from './ContratoPDF';

export default function ContratosManager() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null);
  const [detallesCotizacion, setDetallesCotizacion] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firmaUrl, setFirmaUrl] = useState(null);
  const [guardandoFirma, setGuardandoFirma] = useState(false);

  const sigCanvasRef = useRef(null);

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cotizaciones')
        .select('*, clientes(nombre, telefono, email, direccion_habitual)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCotizaciones(data || []);
    } catch (err) {
      console.error('Error al obtener cotizaciones:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const seleccionarCotizacion = async (cot) => {
    setCotizacionSeleccionada(cot);
    setFirmaUrl(null);
    setDetallesCotizacion([]);

    try {
      const { data, error } = await supabase
        .from('detalles_cotizacion')
        .select('*, inventario(nombre)')
        .eq('cotizacion_id', cot.id);

      if (error) throw error;
      setDetallesCotizacion(data || []);

      // Verificar si ya existe un contrato firmado previamente
      const { data: contratoExistente } = await supabase
        .from('contratos')
        .select('*')
        .eq('cotizacion_id', cot.id)
        .maybeSingle();

      if (contratoExistente && contratoExistente.firma_cliente_url) {
        setFirmaUrl(contratoExistente.firma_cliente_url);
      }
    } catch (err) {
      console.error('Error al obtener detalles:', err.message);
    }
  };

  const limpiarFirma = () => {
    if (sigCanvasRef.current) {
      sigCanvasRef.current.clear();
    }
  };

  const guardarFirmaYContrato = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      alert('Por favor dibuja la firma en el recuadro antes de guardar.');
      return;
    }

    try {
      setGuardandoFirma(true);

      // 1. Obtener imagen Base64 y convertir a Blob
      const dataUrl = sigCanvasRef.current.getTrimmedCanvas().toDataURL('image/png');
      const blob = await (await fetch(dataUrl)).blob();

      // 2. Subir imagen de firma a Supabase Storage
      const fileName = `firmas/firma_${cotizacionSeleccionada.id}_${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('inventario-fotos')
        .upload(fileName, blob, { contentType: 'image/png' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('inventario-fotos')
        .getPublicUrl(fileName);

      const publicFirmaUrl = urlData.publicUrl;
      setFirmaUrl(publicFirmaUrl);

      // 3. Registrar o actualizar Contrato en BD
      const { error: contratoError } = await supabase.from('contratos').upsert([
        {
          cotizacion_id: cotizacionSeleccionada.id,
          folio_contrato: `CTR-${cotizacionSeleccionada.folio || Date.now()}`,
          firma_cliente_url: publicFirmaUrl,
          estado: 'firmado',
          fecha_firma: new Date().toISOString()
        }
      ], { onConflict: 'cotizacion_id' });

      if (contratoError) throw contratoError;

      alert('¡Firma guardada correctamente en el contrato!');
    } catch (err) {
      alert(`Error al guardar firma: ${err.message}`);
    } finally {
      setGuardandoFirma(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '24px' }}>
        📜 Gestión y Firma de Contratos
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
        
        {/* LISTA DE COTIZACIONES */}
        <div style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '14px', color: '#0f172a' }}>Selecciona una Cotización</h2>
          
          {loading ? (
            <p>Cargando cotizaciones...</p>
          ) : cotizaciones.length === 0 ? (
            <p style={{ color: '#64748b' }}>No hay cotizaciones registradas.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto' }}>
              {cotizaciones.map(cot => (
                <div
                  key={cot.id}
                  onClick={() => seleccionarCotizacion(cot)}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: cotizacionSeleccionada?.id === cot.id ? '#eff6ff' : '#fff',
                    borderColor: cotizacionSeleccionada?.id === cot.id ? '#2563eb' : '#cbd5e1',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    <span>Folio #{cot.folio || 'N/A'}</span>
                    <span style={{ color: '#059669' }}>${parseFloat(cot.total || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '4px' }}>
                    👤 {cot.clientes?.nombre || 'Cliente sin nombre'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    🎉 {cot.tematica || 'Sin temática'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PANEL DE FIRMA Y DESCARGA */}
        {cotizacionSeleccionada ? (
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#0f172a' }}>
              Contrato para Folio #{cotizacionSeleccionada.folio || 'SF'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '16px' }}>
              Cliente: <strong>{cotizacionSeleccionada.clientes?.nombre || 'N/A'}</strong>
            </p>

            {/* LIENZO DE FIRMA MANUSCRITA */}
            {!firmaUrl ? (
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Firma del Cliente en Pantalla:
                </label>
                <div style={{ border: '2px dashed #cbd5e1', borderRadius: '8px', backgroundColor: '#fafafa', marginBottom: '10px' }}>
                  <SignatureCanvas
                    ref={sigCanvasRef}
                    penColor="#0f172a"
                    canvasProps={{ width: 450, height: 160, className: 'sigCanvas' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={limpiarFirma}
                    style={{ padding: '8px 14px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={guardarFirmaYContrato}
                    disabled={guardandoFirma}
                    style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', flex: 1 }}
                  >
                    {guardandoFirma ? 'Guardando Firma...' : '✍️ Confirmar y Guardar Firma'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '14px', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ color: '#166534', fontWeight: 'bold', margin: '0 0 8px 0', fontSize: '0.9rem' }}>
                  ✓ Este contrato ya cuenta con firma digital registrada.
                </p>
                <img src={firmaUrl} alt="Firma registrada" style={{ height: '50px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '4px' }} />
              </div>
            )}

            {/* BOTÓN DE DESCARGA PDF */}
            <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '16px' }}>
              {cotizacionSeleccionada && detallesCotizacion ? (
                <PDFDownloadLink
                  document={
                    <ContratoPDF
                      cotizacion={cotizacionSeleccionada}
                      cliente={cotizacionSeleccionada.clientes}
                      detalles={detallesCotizacion}
                      firmaUrl={firmaUrl}
                    />
                  }
                  fileName={`Contrato_PartyArt_Folio_${cotizacionSeleccionada.folio || 'SF'}.pdf`}
                  style={{ textDecoration: 'none' }}
                >
                  {({ loading: pdfLoading }) => (
                    <button
                      style={{
                        width: '100%',
                        padding: '12px',
                        backgroundColor: pdfLoading ? '#94a3b8' : '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        cursor: pdfLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {pdfLoading ? 'Generando documento PDF...' : '📄 Descargar Contrato PDF (Party Art)'}
                    </button>
                  )}
                </PDFDownloadLink>
              ) : (
                <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                  Cargando información del contrato...
                </p>
              )}
            </div>

          </div>
        ) : (
          <div style={{ padding: '40px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
            Selecciona una cotización de la lista de la izquierda para firmar o generar el contrato PDF.
          </div>
        )}

      </div>
    </div>
  );
}