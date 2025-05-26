
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import supabase from '../services/supabase';

// Define types for store and delivery
interface Store {
  id: number;
  nombre_tienda: string;
}

interface Delivery {
  id: number;
  tienda: number;
  dejados: number | null;
  deben: number | null;
  fecha: string;
  observaciones: string | null;
}

const Deliveries: React.FC = () => {
  // Get storeId from URL query parameters
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const storeId = urlParams.get('storeId') || '';

  // State for stores, deliveries, and error handling
  const [stores, setStores] = useState<Store[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // State for editing deliveries
  const [editDeliveries, setEditDeliveries] = useState<{
    [key: number]: { dejados: string; deben: string; fecha: string; observaciones: string };
  }>({});

  // Load data from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        if (!storeId || isNaN(parseInt(storeId))) {
          throw new Error('ID de tienda inválido');
        }

        // Fetch stores
        const { data: storesData, error: storesError } = await supabase
          .from('tiendas')
          .select('id, nombre_tienda');
        if (storesError) throw storesError;
        setStores(storesData || []);

        // Fetch deliveries for the specific store
        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from('entregas')
          .select('*')
          .eq('tienda', parseInt(storeId));
        if (deliveriesError) throw deliveriesError;
        setDeliveries(deliveriesData || []);

        // Initialize edit state for each delivery
        const initialEditState = deliveriesData?.reduce((acc, delivery) => ({
          ...acc,
          [delivery.id]: {
            dejados: delivery.dejados?.toString() || '',
            deben: delivery.deben?.toString() || '',
            fecha: delivery.fecha,
            observaciones: delivery.observaciones || '',
          },
        }), {});
        setEditDeliveries(initialEditState || {});
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Error al cargar los datos. Por favor, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };
    if (storeId) {
      fetchData();
    } else {
      setError('No se proporcionó un ID de tienda válido.');
    }
  }, [storeId]);

  // Handle input changes for editing deliveries
  const handleInputChange = (deliveryId: number, field: string, value: string) => {
    setEditDeliveries((prev) => ({
      ...prev,
      [deliveryId]: {
        ...prev[deliveryId],
        [field]: value,
      },
    }));
  };

  // Handle saving a delivery
  const saveDelivery = async (deliveryId: number) => {
    const { dejados, deben, fecha, observaciones } = editDeliveries[deliveryId] || {};

    if (dejados && deben && fecha) {
      try {
        const updatedDelivery = {
          dejados: parseInt(dejados) || null,
          deben: parseInt(deben) || null,
          fecha,
          observaciones: observaciones || null,
        };
        const { error } = await supabase
          .from('entregas')
          .update(updatedDelivery)
          .eq('id', deliveryId);
        if (error) throw error;

        // Update state
        setDeliveries(
          deliveries.map((delivery) =>
            delivery.id === deliveryId
              ? { ...delivery, ...updatedDelivery }
              : delivery
          )
        );
        alert('Entrega actualizada correctamente.');
      } catch (error) {
        console.error('Error updating delivery:', error);
        alert('Error al actualizar la entrega. Por favor, intenta de nuevo.');
      }
    } else {
      alert('Por favor, completa todos los campos obligatorios.');
    }
  };

  // Handle deleting a delivery
  const deleteDelivery = async (deliveryId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta entrega?')) {
      try {
        const { error } = await supabase
          .from('entregas')
          .delete()
          .eq('id', deliveryId);
        if (error) throw error;

        // Update state
        setDeliveries(deliveries.filter((delivery) => delivery.id !== deliveryId));
        setEditDeliveries((prev) => {
          const { [deliveryId]: _, ...rest } = prev;
          return rest;
        });
        alert('Entrega eliminada correctamente.');
      } catch (error) {
        console.error('Error deleting delivery:', error);
        alert('Error al eliminar la entrega. Por favor, intenta de nuevo.');
      }
    }
  };

  // Find the store based on storeId
  const store = stores.find((s) => s.id === parseInt(storeId));

  // Filter and sort deliveries for the current store
  const storeDeliveries = deliveries.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

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

  if (isLoading) {
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
          Entregas de <span>{store ? store.nombre_tienda : 'Desconocido'}</span>
        </h1>
        <Link to="/" className="text-blue-500 hover:underline mb-4 inline-block">
          Volver al Panel
        </Link>

        {/* Listado de entregas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Entregas Registradas</h2>
          {storeDeliveries.length === 0 ? (
            <p className="text-center">No hay entregas registradas para esta tienda.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Cantidad Anterior</th>
                  <th className="border p-2">Hoy Dejé</th>
                  <th className="border p-2">Cuantos Deben</th>
                  <th className="border p-2">Fecha Entrega</th>
                  <th className="border p-2">Observaciones</th>
                  <th className="border p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {storeDeliveries.map((delivery, index) => {
                  const previousQuantity =
                    index < storeDeliveries.length - 1 ? storeDeliveries[index + 1].dejados || 'N/A' : 'N/A';
                  return (
                    <tr key={delivery.id}>
                      <td className="border p-2">{previousQuantity}</td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={editDeliveries[delivery.id]?.dejados || ''}
                          onChange={(e) => handleInputChange(delivery.id, 'dejados', e.target.value)}
                          className="border p-2 rounded w-full"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="number"
                          value={editDeliveries[delivery.id]?.deben || ''}
                          onChange={(e) => handleInputChange(delivery.id, 'deben', e.target.value)}
                          className="border p-2 rounded w-full"
                        />
                      </td>
                      <td className="border p-2">
                        <input
                          type="date"
                          value={editDeliveries[delivery.id]?.fecha || ''}
                          onChange={(e) => handleInputChange(delivery.id, 'fecha', e.target.value)}
                          className="border p-2 rounded w-full"
                        />
                      </td>
                      <td className="border p-2">
                        <textarea
                          value={editDeliveries[delivery.id]?.observaciones || ''}
                          onChange={(e) => handleInputChange(delivery.id, 'observaciones', e.target.value)}
                          className="border p-2 rounded w-full"
                          rows={2}
                        />
                      </td>
                      <td className="border p-2 flex gap-2">
                        <button
                          onClick={() => saveDelivery(delivery.id)}
                          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => deleteDelivery(delivery.id)}
                          className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deliveries;
