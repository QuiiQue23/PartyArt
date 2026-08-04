import React, { useState } from 'react';
import { Sparkles, Loader, Download } from 'lucide-react';

export default function GeneradorIA() {
  const [prompt, setPrompt] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [cargando, setCargando] = useState(false);

  const generarDiseno = async () => {
    if (!prompt) return;
    setCargando(true);
    setImagenUrl('');

    try {
      const response = await fetch('/.netlify/functions/generar-imagen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (data.url) {
        setImagenUrl(data.url);
      } else {
        alert('Error al generar la imagen.');
      }
    } catch (err) {
      alert('Error en el servidor de IA: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-2">
        <Sparkles className="h-6 w-6 text-pink-500" />
        <h2 className="text-xl font-bold text-gray-800">Diseñador de Arreglos con IA (Imagen 3)</h2>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Describe la decoración o temática deseada:
        </label>
        <textarea
          rows="3"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ej: Arco de globos orgánico en colores rosa pastel y dorado con fondo de lona personalizado temática Gabby Dollhouse..."
          className="w-full border rounded-lg p-3 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <button
        onClick={generarDiseno}
        disabled={cargando}
        className="w-full bg-pink-500 text-white font-medium py-2.5 rounded-lg hover:bg-pink-600 transition flex items-center justify-center space-x-2 disabled:bg-gray-300"
      >
        {cargando ? (
          <>
            <Loader className="h-5 w-5 animate-spin" />
            <span>Generando propuesta visual...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            <span>Generar Propuesta con IA</span>
          </>
        )}
      </button>

      {imagenUrl && (
        <div className="space-y-3 pt-4 border-t">
          <h3 className="font-semibold text-gray-800 text-sm">Resultado Generado:</h3>
          <div className="border rounded-lg overflow-hidden bg-gray-100 max-h-96 flex items-center justify-center">
            <img src={imagenUrl} alt="Propuesta IA" className="max-h-96 w-auto object-contain" />
          </div>
          <a
            href={imagenUrl}
            download="propuesta-party-art.png"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center space-x-2 text-sm text-pink-600 font-medium hover:underline"
          >
            <Download className="h-4 w-4" />
            <span>Descargar Imagen</span>
          </a>
        </div>
      )}
    </div>
  );
}