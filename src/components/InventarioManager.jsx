import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Package, Plus, Image as ImageIcon } from 'lucide-react';

export default function InventarioManager() {
  const [items, setItems] = useState([]);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [stock, setStock] = useState(1);
  const [precioRenta, setPrecioRenta] = useState(0);
  const [imagen, setImagen] = useState(null);

  useEffect(() => {
    cargarInventario();
  }, []);

  const cargarInventario = async () => {
    const { data } = await supabase.from('inventario').select('*').order('created_at', { ascending: false });
    if (data) setItems(data);
  };

  const subirImagen = async (file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `inventario/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('decoraciones').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('decoraciones').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const guardarElemento = async (e) => {
    e.preventDefault();
    try {
      let imagenUrl = '';
      if (imagen) {
        imagenUrl = await subirImagen(imagen);
      }

      const { error } = await supabase.from('inventario').insert([
        {
          nombre,
          categoria,
          stock: Number(stock),
          precio_renta: Number(precioRenta),
          imagen_url: imagenUrl,
        },
      ]);

      if (!error) {
        setNombre('');
        setCategoria('');
        setStock(1);
        setPrecioRenta(0);
        setImagen(null);
        cargarInventario();
      }
    } catch (error) {
      alert('Error guardando elemento: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <Plus className="h-5 w-5 text-pink-500" />
          <h2 className="text-lg font-bold text-gray-800">Agregar al Inventario</h2>
        </div>
        <form onSubmit={guardarElemento} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Nombre del artículo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
          <input
            type="text"
            placeholder="Categoría (Mobiliario, Globos, Banners)"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="number"
            placeholder="Cantidad en Stock"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="number"
            placeholder="Precio Renta"
            value={precioRenta}
            onChange={(e) => setPrecioRenta(e.target.value)}
            className="border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImagen(e.target.files[0])}
            className="border rounded-lg p-2 text-sm bg-gray-50"
          />
          <button
            type="submit"
            className="lg:col-span-1 bg-pink-500 text-white font-medium py-2 rounded-lg hover:bg-pink-600 transition"
          >
            Guardar Elemento
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <Package className="h-5 w-5 text-pink-500" />
          <h2 className="text-lg font-bold text-gray-800">Catálogo de Artículos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="border rounded-lg overflow-hidden bg-gray-50 flex flex-col">
              <div className="h-36 bg-gray-200 flex items-center justify-center overflow-hidden">
                {item.imagen_url ? (
                  <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="p-3 space-y-1 flex-1">
                <span className="text-xs font-semibold text-pink-500 uppercase">{item.categoria}</span>
                <h3 className="font-bold text-gray-800 text-sm">{item.nombre}</h3>
                <div className="flex justify-between text-xs text-gray-600 pt-2 border-t">
                  <span>Stock: {item.stock}</span>
                  <span className="font-bold text-slate-800">${item.precio_renta}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}