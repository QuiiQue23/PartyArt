import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Users, UserPlus, Phone, Mail, MapPin } from 'lucide-react';

export default function AgendaClientes() {
  const [clientes, setClientes] = useState([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    const { data, error } = await supabase.from('clientes').select('*').order('created_at', { ascending: false });
    if (!error) setClientes(data);
  };

  const agregarCliente = async (e) => {
    e.preventDefault();
    if (!nombre) return;

    const { error } = await supabase.from('clientes').insert([
      { nombre, telefono, email, direccion }
    ]);

    if (!error) {
      setNombre('');
      setTelefono('');
      setEmail('');
      setDireccion('');
      cargarClientes();
    } else {
      alert('Error al guardar cliente: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <UserPlus className="h-5 w-5 text-pink-500" />
          <h2 className="text-lg font-bold text-gray-800">Registrar Nuevo Cliente</h2>
        </div>
        <form onSubmit={agregarCliente} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Nombre completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
            required
          />
          <input
            type="text"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="text"
            placeholder="Dirección"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="border rounded-lg p-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <button
            type="submit"
            className="md:col-span-2 lg:col-span-4 bg-pink-500 text-white font-medium py-2 rounded-lg hover:bg-pink-600 transition"
          >
            Guardar Cliente
          </button>
        </form>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <Users className="h-5 w-5 text-pink-500" />
          <h2 className="text-lg font-bold text-gray-800">Directorio de Clientes</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((c) => (
            <div key={c.id} className="border rounded-lg p-4 bg-gray-50 space-y-2">
              <h3 className="font-bold text-gray-800">{c.nombre}</h3>
              {c.telefono && (
                <div className="flex items-center text-xs text-gray-600 space-x-2">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{c.telefono}</span>
                </div>
              )}
              {c.email && (
                <div className="flex items-center text-xs text-gray-600 space-x-2">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{c.email}</span>
                </div>
              )}
              {c.direccion && (
                <div className="flex items-center text-xs text-gray-600 space-x-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{c.direccion}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}