import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import InventarioManager from './components/InventarioManager';
import ClientesYAgenda from './components/ClientesYAgenda';
import Cotizador from './components/Cotizador';
import ContratosManager from './components/ContratosManager';
import PagosManager from './components/PagosManager';

// ==========================================
// CONSTANTES Y CONFIGURACIONES
// ==========================================
const CATEGORIAS = [
  { value: 'mobiliario', label: 'Mobiliario' },
  { value: 'globos', label: 'Globos' },
  { value: 'personajes_decorativos', label: 'Personajes Decorativos' },
  { value: 'letreros_led', label: 'Letreros LED' },
  { value: 'letreros_mdf', label: 'Letreros de MDF' },
  { value: 'lonas_personalizadas', label: 'Lonas Personalizadas' },
  { value: 'otros', label: 'Otros' },
];

const TIPOS_AGENDA = [
  { value: 'evento', label: '🎉 Evento Fiesta' },
  { value: 'montaje', label: '🛠️ Montaje' },
  { value: 'desmontaje', label: '🚚 Desmontaje' },
  { value: 'reunion_cliente', label: '🤝 Reunión Cliente' },
];

// ==========================================
// COMPONENTE 1: GESTIÓN DE INVENTARIO Y STORAGE
// ==========================================
function InventarioManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  const [form, setForm] = useState({
    nombre: '',
    categoria: 'mobiliario',
    descripcion: '',
    stock_total: 1,
    precio_alquiler: 0,
  });
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState(null);

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

      if (archivoImagen) {
        const fileExt = archivoImagen.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
        const filePath = `items/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('inventario-fotos')
          .upload(filePath, archivoImagen);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('inventario-fotos')
          .getPublicUrl(filePath);

        fotoUrl = urlData.publicUrl;
      }

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
      setForm({
        nombre: '',
        categoria: 'mobiliario',
        descripcion: '',
        stock_total: 1,
        precio_alquiler: 0,
      });
      setArchivoImagen(null);
      setPreviewImagen(null);

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
        {/* Formulario */}
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

        {/* Listado */}
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

// ==========================================
// COMPONENTE 2: CLIENTES Y AGENDA
// ==========================================
function ClientesYAgenda() {
  const [tab, setTab] = useState('agenda');
  
  const [clientes, setClientes] = useState([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [formCliente, setFormCliente] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion_habitual: '',
    notas: ''
  });

  const [eventos, setEventos] = useState([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [formAgenda, setFormAgenda] = useState({
    titulo: '',
    tipo: 'evento',
    cliente_id: '',
    fecha_inicio: '',
    fecha_fin: '',
    lugar: '',
    notas: ''
  });

  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });

  useEffect(() => {
    fetchClientes();
    fetchAgenda();
  }, []);

  const fetchClientes = async () => {
    try {
      setLoadingClientes(true);
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error('Error al cargar clientes:', error.message);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleGuardarCliente = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    try {
      const { error } = await supabase.from('clientes').insert([formCliente]);
      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: '¡Cliente registrado correctamente!' });
      setFormCliente({ nombre: '', telefono: '', email: '', direccion_habitual: '', notas: '' });
      fetchClientes();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `Error: ${error.message}` });
    }
  };

  const fetchAgenda = async () => {
    try {
      setLoadingAgenda(true);
      const { data, error } = await supabase
        .from('agenda')
        .select('*, clientes(nombre, telefono)')
        .order('fecha_inicio', { ascending: true });

      if (error) throw error;
      setEventos(data || []);
    } catch (error) {
      console.error('Error al cargar agenda:', error.message);
    } finally {
      setLoadingAgenda(false);
    }
  };

  const handleGuardarAgenda = async (e) => {
    e.preventDefault();
    setMensaje({ tipo: '', texto: '' });
    try {
      const payload = {
        titulo: formAgenda.titulo,
        tipo: formAgenda.tipo,
        fecha_inicio: formAgenda.fecha_inicio,
        fecha_fin: formAgenda.fecha_fin || formAgenda.fecha_inicio,
        lugar: formAgenda.lugar,
        notas: formAgenda.notas
      };

      if (formAgenda.cliente_id) {
        payload.cliente_id = formAgenda.cliente_id;
      }

      const { error } = await supabase.from('agenda').insert([payload]);
      if (error) throw error;

      setMensaje({ tipo: 'exito', texto: '¡Actividad agendada con éxito!' });
      setFormAgenda({
        titulo: '',
        tipo: 'evento',
        cliente_id: '',
        fecha_inicio: '',
        fecha_fin: '',
        lugar: '',
        notas: ''
      });
      fetchAgenda();
    } catch (error) {
      setMensaje({ tipo: 'error', texto: `Error: ${error.message}` });
    }
  };

  const toggleCompletado = async (id, estadoActual) => {
    try {
      const { error } = await supabase
        .from('agenda')
        .update({ completado: !estadoActual })
        .eq('id', id);

      if (error) throw error;
      fetchAgenda();
    } catch (error) {
      console.error('Error al actualizar agenda:', error.message);
    }
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nombre.toLowerCase().includes(busquedaCliente.toLowerCase()) ||
    (c.telefono && c.telefono.includes(busquedaCliente))
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', borderBottom: '2px solid #e2e8f0' }}>
        <button
          onClick={() => { setTab('agenda'); setMensaje({ tipo: '', texto: '' }); }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            backgroundColor: tab === 'agenda' ? '#2563eb' : '#f1f5f9',
            color: tab === 'agenda' ? '#fff' : '#475569',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📅 Agenda & Compromisos
        </button>
        <button
          onClick={() => { setTab('clientes'); setMensaje({ tipo: '', texto: '' }); }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px 8px 0 0',
            border: 'none',
            backgroundColor: tab === 'clientes' ? '#2563eb' : '#f1f5f9',
            color: tab === 'clientes' ? '#fff' : '#475569',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          👥 Registro de Clientes
        </button>
      </div>

      {mensaje.texto && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '6px',
          marginBottom: '20px',
          backgroundColor: mensaje.tipo === 'exito' ? '#dcfce7' : '#fee2e2',
          color: mensaje.tipo === 'exito' ? '#166534' : '#991b1b',
          fontSize: '0.9rem'
        }}>
          {mensaje.texto}
        </div>
      )}

      {tab === 'agenda' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#0f172a' }}>Agendar Actividad</h2>
            <form onSubmit={handleGuardarAgenda}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Título *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Montaje XV Años Valeria"
                  value={formAgenda.titulo}
                  onChange={e => setFormAgenda({ ...formAgenda, titulo: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Tipo de Actividad</label>
                <select
                  value={formAgenda.tipo}
                  onChange={e => setFormAgenda({ ...formAgenda, tipo: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  {TIPOS_AGENDA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Cliente (Opcional)</label>
                <select
                  value={formAgenda.cliente_id}
                  onChange={e => setFormAgenda({ ...formAgenda, cliente_id: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                >
                  <option value="">-- Sin asignar --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Fecha y Hora Inicio *</label>
                <input
                  type="datetime-local"
                  required
                  value={formAgenda.fecha_inicio}
                  onChange={e => setFormAgenda({ ...formAgenda, fecha_inicio: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Lugar del Evento</label>
                <input
                  type="text"
                  placeholder="Ej. Salón Jardín Real"
                  value={formAgenda.lugar}
                  onChange={e => setFormAgenda({ ...formAgenda, lugar: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Guardar en Agenda
              </button>
            </form>
          </div>

          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#0f172a' }}>Próximos Compromisos ({eventos.length})</h2>
            {loadingAgenda ? (
              <p>Cargando agenda...</p>
            ) : eventos.length === 0 ? (
              <p style={{ color: '#64748b' }}>No tienes actividades programadas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {eventos.map(e => {
                  const fechaObj = new Date(e.fecha_inicio);
                  const fechaStr = fechaObj.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                  const horaStr = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <div key={e.id} style={{
                      padding: '16px',
                      borderRadius: '10px',
                      backgroundColor: '#fff',
                      borderLeft: `6px solid ${e.tipo === 'evento' ? '#8b5cf6' : e.tipo === 'montaje' ? '#f59e0b' : '#10b981'}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: e.completado ? 0.6 : 1
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 'bold', fontSize: '1rem', textDecoration: e.completado ? 'line-through' : 'none' }}>
                            {e.titulo}
                          </span>
                          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#f1f5f9', fontWeight: '600' }}>
                            {e.tipo.toUpperCase()}
                          </span>
                        </div>

                        <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#475569' }}>
                          📅 <strong>{fechaStr}</strong> a las <strong>{horaStr} hrs</strong>
                        </p>

                        {e.clientes && (
                          <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#2563eb' }}>
                            👤 Cliente: {e.clientes.nombre} ({e.clientes.telefono || 'Sin tel'})
                          </p>
                        )}

                        {e.lugar && (
                          <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#64748b' }}>
                            📍 Lugar: {e.lugar}
                          </p>
                        )}
                      </div>

                      <div>
                        <button
                          onClick={() => toggleCompletado(e.id, e.completado)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: e.completado ? '#e2e8f0' : '#dcfce7',
                            color: e.completado ? '#475569' : '#15803d',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          {e.completado ? '✓ Completado' : 'Marcar Listo'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'clientes' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px', alignItems: 'start' }}>
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', color: '#0f172a' }}>Nuevo Cliente</h2>
            <form onSubmit={handleGuardarCliente}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Nombre completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. María González"
                  value={formCliente.nombre}
                  onChange={e => setFormCliente({ ...formCliente, nombre: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Teléfono / WhatsApp</label>
                <input
                  type="tel"
                  placeholder="Ej. +52 55 1234 5678"
                  value={formCliente.telefono}
                  onChange={e => setFormCliente({ ...formCliente, telefono: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Correo Electrónico</label>
                <input
                  type="email"
                  placeholder="maria@gmail.com"
                  value={formCliente.email}
                  onChange={e => setFormCliente({ ...formCliente, email: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>Dirección habitual</label>
                <textarea
                  rows="2"
                  placeholder="Calle, número, colonia..."
                  value={formCliente.direccion_habitual}
                  onChange={e => setFormCliente({ ...formCliente, direccion_habitual: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <button
                type="submit"
                style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Registrar Cliente
              </button>
            </form>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>Directorio ({clientesFiltrados.length})</h2>
              <input
                type="text"
                placeholder="🔍 Buscar por nombre o teléfono..."
                value={busquedaCliente}
                onChange={e => setBusquedaCliente(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', width: '220px' }}
              />
            </div>

            {loadingClientes ? (
              <p>Cargando clientes...</p>
            ) : clientesFiltrados.length === 0 ? (
              <p style={{ color: '#64748b' }}>No se encontraron clientes.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
                {clientesFiltrados.map(c => (
                  <div key={c.id} style={{ padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', color: '#1e293b' }}>{c.nombre}</h3>
                    {c.telefono && <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#475569' }}>📞 {c.telefono}</p>}
                    {c.email && <p style={{ margin: '2px 0', fontSize: '0.85rem', color: '#475569' }}>✉️ {c.email}</p>}
                    {c.direccion_habitual && <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>🏠 {c.direccion_habitual}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// COMPONENTE PRINCIPAL (APP)
// ==========================================
export default function App() {
  const [modulo, setModulo] = useState('inventario');

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Barra de Navegación Superior */}
      <nav style={{ background: '#0f172a', padding: '12px 24px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginRight: '20px' }}>
          🎈 DecoraApp
        </span>
        <button
          onClick={() => setModulo('inventario')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'inventario' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📦 Inventario
        </button>
        <button
          onClick={() => setModulo('agenda')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'agenda' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📅 Clientes y Agenda
        </button>
      </nav>

      {/* Renderizado Condicional del Módulo Activo */}
      {modulo === 'inventario' && <InventarioManager />}
      {modulo === 'agenda' && <ClientesYAgenda />}
    </div>
  );
  export default function App() {
  const [modulo, setModulo] = useState('cotizador');

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Barra de Navegación Superior */}
      <nav style={{ background: '#0f172a', padding: '12px 24px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginRight: '20px' }}>
          🎈 DecoraApp
        </span>
        <button
          onClick={() => setModulo('cotizador')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'cotizador' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📝 Cotizador
        </button>
        <button
          onClick={() => setModulo('inventario')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'inventario' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📦 Inventario
        </button>
        <button
          onClick={() => setModulo('agenda')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'agenda' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📅 Clientes y Agenda
        </button>
      </nav>

      {/* Renderizado Condicional del Módulo Activo */}
      {modulo === 'cotizador' && <Cotizador />}
      {modulo === 'inventario' && <InventarioManager />}
      {modulo === 'agenda' && <ClientesYAgenda />}
    </div>
  );
}
      export default function App() {
  const [modulo, setModulo] = useState('cotizador');

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Barra de Navegación Superior */}
      <nav style={{ background: '#0f172a', padding: '12px 24px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginRight: '20px' }}>
          🎈 DecoraApp
        </span>
        <button
          onClick={() => setModulo('cotizador')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'cotizador' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📝 Cotizador
        </button>
        <button
          onClick={() => setModulo('contratos')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'contratos' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📜 Contratos PDF
        </button>
        <button
          onClick={() => setModulo('inventario')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'inventario' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📦 Inventario
        </button>
        <button
          onClick={() => setModulo('agenda')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'agenda' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📅 Clientes y Agenda
        </button>
      </nav>

      {/* Renderizado Condicional del Módulo Activo */}
      {modulo === 'cotizador' && <Cotizador />}
      {modulo === 'contratos' && <ContratosManager />}
      {modulo === 'inventario' && <InventarioManager />}
      {modulo === 'agenda' && <ClientesYAgenda />}
    </div>
  );
}
export default function App() {
  const [modulo, setModulo] = useState('cotizador');

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '40px' }}>
      {/* Barra de Navegación Superior */}
      <nav style={{ background: '#0f172a', padding: '12px 24px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginRight: '20px' }}>
          🎈 DecoraApp
        </span>
        <button
          onClick={() => setModulo('cotizador')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'cotizador' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📝 Cotizador
        </button>
        <button
          onClick={() => setModulo('pagos')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'pagos' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          💰 Pagos & Saldos
        </button>
        <button
          onClick={() => setModulo('contratos')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'contratos' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📜 Contratos PDF
        </button>
        <button
          onClick={() => setModulo('inventario')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'inventario' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📦 Inventario
        </button>
        <button
          onClick={() => setModulo('agenda')}
          style={{
            padding: '8px 16px',
            backgroundColor: modulo === 'agenda' ? '#2563eb' : 'transparent',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          📅 Clientes y Agenda
        </button>
      </nav>

      {/* Renderizado Condicional del Módulo Activo */}
      {modulo === 'cotizador' && <Cotizador />}
      {modulo === 'pagos' && <PagosManager />}
      {modulo === 'contratos' && <ContratosManager />}
      {modulo === 'inventario' && <InventarioManager />}
      {modulo === 'agenda' && <ClientesYAgenda />}
    </div>
  );
}
}