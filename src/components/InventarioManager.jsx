import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const CATEGORIAS = [
  { value: 'mobiliario', label: 'Mobiliario' },
  { value: 'globos', label: 'Globos' },
  { value: 'personajes_decorativos', label: 'Personajes Decorativos' },
  { value: 'letreros_led', label: 'Letreros LED' },
  { value: 'letreros_mdf', label: 'Letreros de MDF' },
  { value: 'lonas_personalizadas', label: 'Lonas Personalizadas' },
  { value: 'otros', label: 'Otros' },
];

export default function InventarioManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  // Estado del formulario
  const [form, setForm] = useState({
    nombre: '',
    categoria: 'mobiliario',
    descripcion: '',
    stock_total: 1,
    precio_alquiler: 0,
  });
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);

  // Cargar inventario al iniciar
  useEffect(() => {
    fetchInventario();
  }, []);

  const fetchInventario = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventario')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error al cargar inventario:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoImagen(file);
      setPreviewImagen(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMensaje({ tipo: '', texto: '' });

    try {
      let fotoUrl = null;

      // 1. Subir imagen a Supabase Storage si se seleccionó un archivo
      if (archivoImagen) {
        const fileExt = archivoImagen.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `items/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('inventario-fotos')
          .upload(filePath, archivoImagen);

        if (uploadError) throw uploadError;

        // Obtener la URL pública de la imagen
        const { data: urlData } = supabase.storage
          .from('inventario-fotos')
          .getPublicUrl(filePath);

        fotoUrl = urlData.publicUrl;
      }

      // 2. Insertar el artículo en la tabla `inventario`
      const { error: insertError } = await supabase.from('inventario').insert([
        {
          nombre: form.nombre,
          categoria: form.categoria,
          descripcion: form.descripcion,
          stock_total: parseInt(form.stock_total, 10),
          stock_disponible: parseInt(form.stock_total, 10),
          precio_alquiler: parseFloat(form.precio_alquiler),
          foto_url: fotoUrl,
        },
      ]);

      if (insertError) throw insertError;

      setMensaje({ tipo: 'exito', texto: '¡Artículo registrado correctamente!' });

      // Limpiar formulario
      setForm({
        nombre: '',
        categoria: 'mobiliario',
        descripcion: '',
        stock_total: 1,
        precio_alquiler: 0,
      });
      setArchivoImagen(null);
      setPreviewImagen(null);

      // Recargar lista de inventario
      fetchInventario();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `Error: ${error.message}` });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#1e293b', marginBottom: '30px' }}>
        📦 Control de Inventario
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
        
        {/* FORMULARIO DE REGISTRO */}
        <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#0f172a' }}>Nuevo Artículo</h2>

          {mensaje.texto && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '6px',
              marginBottom: '16px',
              backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
              color: mensaje.tipo === 'exito' ? '#166534' : '#991b1b',
              fontSize: '0.9rem'
            }}>
              {mensaje.texto}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>
                Nombre del artículo *
              </label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleInputChange}
                required
                placeholder="Ej. Letrero LED 'Happy Birthday'"
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>
                Categoría *
              </label>
              <select
                name="categoria"
                value={form.categoria}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              >
                {CATEGORIAS.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>
                  Stock Total *
                </label>
                <input
                  type="number"
                  name="stock_total"
                  min="1"
                  value={form.stock_total}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>
                  Precio Alquiler ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="precio_alquiler"
                  min="0"
                  value={form.precio_alquiler}
                  onChange={handleInputChange}
                  required
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>
                Descripción
              </label>
              <textarea
                name="descripcion"
                rows="2"
                value={form.descripcion}
                onChange={handleInputChange}
                placeholder="Dimensiones, color, especificaciones..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', fontSize: '0.85rem' }}>
                Fotografía
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
              {previewImagen && (
                <img
                  src={previewImagen}
                  alt="Vista previa"
                  style={{ marginTop: '10px', width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '6px' }}
                />
              )}
            </div>

            <button
              type="submit"
              disabled={uploading}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: uploading ? '#94a3b8' : '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? 'Guardando...' : 'Guardar Artículo'}
            </button>
          </form>
        </div>

        {/* CATÁLOGO / LISTADO DE ITEMS */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', color: '#0f172a' }}>
            Catálogo Registrado ({items.length})
          </h2>

          {loading ? (
            <p>Cargando inventario...</p>
          ) : items.length === 0 ? (
            <p style={{ color: '#64748b' }}>No hay artículos registrados en el inventario aún.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {items.map((item) => (
                <div key={item.id} style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ width: '100%', height: '140px', backgroundColor: '#f1f5f9' }}>
                    {item.foto_url ? (
                      <img
                        src={item.foto_url}
                        alt={item.nombre}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8' }}>
                        Sin Foto
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '12px' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      borderRadius: '4px',
                      fontWeight: 'bold'
                    }}>
                      {item.categoria.replace('_', ' ')}
                    </span>
                    <h3 style={{ fontSize: '0.95rem', margin: '8px 0 4px 0', color: '#1e293b' }}>{item.nombre}</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                      <span style={{ fontWeight: 'bold', color: '#059669', fontSize: '0.9rem' }}>
                        ${parseFloat(item.precio_alquiler).toFixed(2)}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Stock: {item.stock_disponible}/{item.stock_total}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}