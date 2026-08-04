import { GoogleGenAI } from '@google/genai';

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const { tematica, articulosInventario, faltantes } = JSON.parse(event.body || '{}');

    if (!tematica) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'La temática del evento es obligatoria' })
      };
    }

    // Inicializa el cliente usando la API Key de Google de las variables de entorno
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `Fotografía fotorrealista de alta calidad del montaje de decoración para un evento social con temática: "${tematica}". 
    Debe incluir los siguientes elementos: ${articulosInventario || 'mesas cilíndricas, estructuras para globos'}. 
    Detalles personalizados: ${faltantes || 'banner temático y letreros'}. 
    Estilo elegante, iluminación profesional de fiesta, composición limpia y llamativa.`;

    // Generar la imagen con el modelo Imagen 3
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-002',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    // Retorna la imagen codificada en base64 lista para insertarse en el <img src="..." />
    const base64Image = response.generatedImages[0].image.imageBytes;
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        exito: true,
        imageUrl: imageUrl,
        promptUtilizado: prompt
      })
    };

  } catch (error) {
    console.error('Error con Imagen 3 / Google AI:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message || 'Error al generar la imagen con Google AI' })
    };
  }
};