import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../supabaseClient';
import { FileCheck, PenTool, CheckCircle } from 'lucide-react';

export default function ContratosPagos() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cotizacionSel, setCotizacionSel] = useState('');
  const sigCanvas = useRef({});
  const [firmado, setFirmado] = useState(false);

  useEffect(() => {
    cargarCotizaciones();
  }, []);

  const cargarCotizaciones = async () => {
    const { data } = await supabase.from('cotizaciones').select('*, clientes(nombre)');
    if (data) setCotizaciones(data);
  };

  const limpiarFirma = () => {
    sigCanvas.current.clear();
  };

  const guardarContrato = async () => {
    if (!cotizacionSel || sigCanvas.current.isEmpty()) {
      alert('Selecciona una cotización y firma el contrato.');
      return;
    }

    const firmaData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

    const { error } = await supabase.from('contratos').insert([
      {
        cotizacion_id: cotizacionSel,
        firma_url: firmaData,
        estado: 'firmado',
      },
    ]);

    if (!error) {
      setFirmado(true);
      alert('Contrato firmado y registrado correctamente.');
    } else {
      alert('Error registrando contrato: ' + error.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <FileCheck className="h-6 w-6 text-pink-500" />
        <h2 className="text-xl font-bold text-gray-800">Generación y Firma de Contrato</h2>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cotización Asociada</label>
        <select
          value={cotizacionSel}
          onChange={(e) => setCotizacionSel(e.target.value)}
          className="w-full border rounded-lg p-2.5 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
        >
          <option value="">-- Seleccionar Cotización --</option>
          {cotizaciones.map((c) => (
            <option key={c.id} value={c.id}>
              {c.clientes?.nombre} - Total: ${c.total} ({c.fecha_evento})
            </option>
          ))}
        </select>
      </div>

      {/* Vista previa cláusulas del contrato */}
      <div className="border rounded-lg p-4 bg-gray-50 text-xs text-gray-600 leading-relaxed space-y-2">
        <h3 className="font-bold text-sm text-gray-800">Contrato de Servicios Party Art</h3>
        <p>
          1. Party Art se compromete a realizar la instalación decorativa en la fecha acordada.
        </p>
        <p>
          2. El cliente deberá abonar el saldo total acordado antes o al momento de finalizar la instalación.
        </p>
        <p>
          3. Cualquier daño causado al mobiliario o estructuras durante el evento correrá por cuenta del cliente.
        </p>
      </div>

      {/* Lienzo para la firma digital */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 flex items-center space-x-1">
          <PenTool className="h-4 w-4 text-pink-500" />
          <span>Firma Digital del Cliente</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{ className: 'w-full h-40 sigCanvas' }}
          />
        </div>
        <button
          onClick={limpiarFirma}
          className="text-xs text-red-500 hover:underline"
        >
          Borrar / Repetir Firma
        </button>
      </div>

      <button
        onClick={guardarContrato}
        className="w-full bg-pink-500 text-white font-medium py-3 rounded-lg hover:bg-pink-600 transition flex items-center justify-center space-x-2"
      >
        <CheckCircle className="h-5 w-5" />
        <span>Registrar Contrato Firmado</span>
      </button>

      {firmado && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
          ¡El contrato ha sido procesado con éxito!
        </div>
      )}
    </div>
  );
}