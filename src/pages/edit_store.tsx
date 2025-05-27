import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import supabase from '../services/supabase';

// Define type for store
interface Store {
  id: number;
  apodo: string;
  nombre_tienda: string;
  domicilio: string;
  atiende: string | null;
  fecha: string | null;
}

const EditStore: React.FC = () => {
  // Get storeId from URL query parameters
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const storeId = urlParams.get('storeId') || '';

  // State for store data and form inputs
  const [store, setStore] = useState<Store | null>(null);
  const [apodo, setApodo] = useState('');
  const [nombreTienda, setNombreTienda] = useState('');
  const [domicilio, setDomicilio] = useState('');
  const [atiende, setAtiende] = useState('');
  const [fecha, setFecha] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load store data from Supabase on mount
  useEffect(() => {
    const fetchStore = async () => {
      try {
        setIsLoading(true);
        if (!storeId || isNaN(parseInt(storeId))) {
          throw new Error('ID de tienda inválido');
        }

        const { data, error } = await supabase
          .from('tiendas')
          .select('*')
          .eq('id', parseInt(storeId))
          .single();
        if (error) throw error;

        if (data) {
          setStore(data);
          setApodo(data.apodo || '');
          setNombreTienda(data.nombre_tienda || '');
          setDomicilio(data.domicilio || '');
          setAtiende(data.atiende || '');
          setFecha(data.fecha || '');
        }
      } catch (error: any) {
        console.error('Error fetching store:', error);
        setError(error.message || 'Error al cargar la tienda. Por favor, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };
    if (storeId) {
      fetchStore();
    } else {
      setError('No se proporcionó un ID de tienda válido.');
    }
  }, [storeId]);

  // Handle saving store changes
  const saveStore = async () => {
    if (apodo && nombreTienda && domicilio && atiende && fecha) {
      try {
        const updatedStore = {
          apodo,
          nombre_tienda: nombreTienda,
          domicilio,
          atiende,
          fecha,
        };
        const { error } = await supabase
          .from('tiendas')
          .update(updatedStore)
          .eq('id', parseInt(storeId));
        if (error) throw error;

        setStore({ ...store!, ...updatedStore });
        alert('Tienda actualizada correctamente.');
      } catch (error) {
        console.error('Error updating store:', error);
        alert('Error al actualizar la tienda. Por favor, intenta de nuevo.');
      }
    } else {
      alert('Por favor, completa todos los campos obligatorios.');
    }
  };

  if (error) {
    return (
      <div className="bg-gray-100 font-sans p-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6">Error</h1>
          <p className="text-red-500 text-center">{error}</p>
          <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
            Volver al Panel
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading || !store) {
    return (
      <div className="bg-gray-100 font-sans p-4 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6">Cargando...</h1>
          <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
            Volver al Panel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 font-sans p-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          Editar Tienda: {store.nombre_tienda}
        </h1>
        <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
          Volver al Panel
        </Link>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Detalles de la Tienda</h2>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="Apodo de la tienda"
              value={apodo}
              onChange={(e) => setApodo(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Nombre de la tienda"
              value={nombreTienda}
              onChange={(e) => setNombreTienda(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Domicilio"
              value={domicilio}
              onChange={(e) => setDomicilio(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Persona que atiende"
              value={atiende}
              onChange={(e) => setAtiende(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={saveStore}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditStore;
