
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../services/supabase';

// Define types for store and delivery
interface Store {
  id: number;
  apodo: string;
  nombre_tienda: string;
  domicilio: string;
  atiende: string | null;
  fecha: string | null;
}

interface Delivery {
  id: number;
  tienda: number;
  dejados: number | null;
  deben: number | null;
  fecha: string;
  observaciones: string | null;
}

const Panel: React.FC = () => {
  // State for stores and deliveries
  const [stores, setStores] = useState<Store[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  
  // State for form inputs
  const [storeNickname, setStoreNickname] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeContact, setStoreContact] = useState('');
  const [storeVisitDate, setStoreVisitDate] = useState('');
  const [deliveryStore, setDeliveryStore] = useState('');
  const [deliveryQuantity, setDeliveryQuantity] = useState('');
  const [deliveryDebt, setDeliveryDebt] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Load data from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stores
        const { data: storesData, error: storesError } = await supabase
          .from('tiendas')
          .select('*');
        if (storesError) throw storesError;
        setStores(storesData || []);

        // Fetch deliveries
        const { data: deliveriesData, error: deliveriesError } = await supabase
          .from('entregas')
          .select('*');
        if (deliveriesError) throw deliveriesError;
        setDeliveries(deliveriesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error al cargar los datos. Por favor, intenta de nuevo.');
      }
    };
    fetchData();
  }, []);

  // Add a new store
  const addStore = async () => {
    if (storeNickname && storeName && storeAddress && storeContact && storeVisitDate) {
      try {
        const newStore = {
          apodo: storeNickname,
          nombre_tienda: storeName,
          domicilio: storeAddress,
          atiende: storeContact,
          fecha: storeVisitDate || null,
        };
        const { data, error } = await supabase
          .from('tiendas')
          .insert([newStore])
          .select();
        if (error) throw error;
        if (data) {
          setStores([...stores, data[0]]);
          setStoreNickname('');
          setStoreName('');
          setStoreAddress('');
          setStoreContact('');
          setStoreVisitDate('');
        }
      } catch (error) {
        console.error('Error adding store:', error);
        alert('Error al agregar la tienda. Por favor, intenta de nuevo.');
      }
    } else {
      alert('Por favor, completa todos los campos.');
    }
  };

  // Add a new delivery
  const addDelivery = async () => {
    if (deliveryStore && deliveryQuantity && deliveryDebt && deliveryDate) {
      try {
        const newDelivery = {
          tienda: parseInt(deliveryStore),
          dejados: parseInt(deliveryQuantity) || null,
          deben: parseInt(deliveryDebt) || null,
          fecha: deliveryDate,
          observaciones: deliveryNotes || null,
        };
        const { data, error } = await supabase
          .from('entregas')
          .insert([newDelivery])
          .select();
        if (error) throw error;
        if (data) {
          setDeliveries([...deliveries, data[0]]);
          setDeliveryStore('');
          setDeliveryQuantity('');
          setDeliveryDebt('');
          setDeliveryDate('');
          setDeliveryNotes('');
          alert('Entrega registrada correctamente.');
        }
      } catch (error) {
        console.error('Error adding delivery:', error);
        alert('Error al registrar la entrega. Por favor, intenta de nuevo.');
      }
    } else {
      alert('Por favor, completa todos los campos obligatorios.');
    }
  };

  // Delete a store and its deliveries
  const deleteStore = async (storeId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tienda y todas sus entregas?')) {
      try {
        // Delete store (this will also delete related deliveries due to ON DELETE CASCADE)
        const { error: storeError } = await supabase
          .from('tiendas')
          .delete()
          .eq('id', storeId);
        if (storeError) throw storeError;

        // Update state
        setStores(stores.filter((store) => store.id !== storeId));
        setDeliveries(deliveries.filter((delivery) => delivery.tienda !== storeId));
      } catch (error) {
        console.error('Error deleting store:', error);
        alert('Error al eliminar la tienda. Por favor, intenta de nuevo.');
      }
    }
  };

  // Delete a delivery
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
        alert('Entrega eliminada correctamente.');
      } catch (error) {
        console.error('Error deleting delivery:', error);
        alert('Error al eliminar la entrega. Por favor, intenta de nuevo.');
      }
    }
  };

  // Get unique store IDs for deliveries
  const storeIds = [...new Set(deliveries.map((d) => d.tienda))];

  return (
    <div className="bg-gray-100 font-sans p-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Panel Karam Bolis Gourmet</h1>

        {/* Formulario para registrar tienda */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Registrar Nueva Tienda</h2>
          <div className="grid grid-cols-1 gap-4">
            <input
              type="text"
              placeholder="Apodo de la tienda"
              value={storeNickname}
              onChange={(e) => setStoreNickname(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Nombre de la tienda"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Domicilio"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Persona que atiende"
              value={storeContact}
              onChange={(e) => setStoreContact(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={storeVisitDate}
              onChange={(e) => setStoreVisitDate(e.target.value)}
              className="border p-2 rounded"
            />
            <button
              onClick={addStore}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Agregar Tienda
            </button>
          </div>
        </div>

        {/* Formulario para registrar entrega */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Registrar Entrega</h2>
          <div className="grid grid-cols-1 gap-4">
            <select
              value={deliveryStore}
              onChange={(e) => setDeliveryStore(e.target.value)}
              className="border p-2 rounded"
            >
              <option value="">Selecciona una tienda</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.nombre_tienda}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Hoy Dejé"
              value={deliveryQuantity}
              onChange={(e) => setDeliveryQuantity(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Monto que deben"
              value={deliveryDebt}
              onChange={(e) => setDeliveryDebt(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="border p-2 rounded"
            />
            <textarea
              placeholder="Observaciones"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              className="border p-2 rounded"
              rows={4}
            />
            <button
              onClick={addDelivery}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              Registrar Entrega
            </button>
          </div>
        </div>

        {/* Listado de tiendas */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Tiendas Registradas</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Apodo</th>
                <th className="border p-2">Nombre</th>
                <th className="border p-2">Domicilio</th>
                <th className="border p-2">Atiende</th>
                <th className="border p-2">Fecha Visita</th>
                <th className="border p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store.id}>
                  <td className="border p-2">{store.apodo}</td>
                  <td className="border p-2">{store.nombre_tienda}</td>
                  <td className="border p-2">{store.domicilio}</td>
                  <td className="border p-2">{store.atiende || 'N/A'}</td>
                  <td className="border p-2">{store.fecha || 'N/A'}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => deleteStore(store.id)}
                      className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Listado de entregas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Entregas Registradas</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Tienda</th>
                <th className="border p-2">Hoy Dejé</th>
                <th className="border p-2">Cuantos Deben</th>
                <th className="border p-2">Fecha Entrega</th>
                <th className="border p-2">Observaciones</th>
                <th className="border p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {storeIds.map((storeId) => {
                const storeDeliveries = deliveries
                  .filter((d) => d.tienda === storeId)
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
                if (storeDeliveries.length === 0) return null;
                const latestDelivery = storeDeliveries[0];
                const store = stores.find((s) => s.id === storeId);
                return (
                  <tr key={storeId}>
                    <td className="border p-2">{store ? store.nombre_tienda : 'Desconocido'}</td>
                    <td className="border p-2">{latestDelivery.dejados || 'N/A'}</td>
                    <td className="border p-2">{latestDelivery.deben || 'N/A'}</td>
                    <td className="border p-2">{latestDelivery.fecha}</td>
                    <td className="border p-2">{latestDelivery.observaciones || 'N/A'}</td>
                    <td className="border p-2 flex gap-2">
                      <Link
                        to={`/deliveries?storeId=${storeId}`}
                        className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
                      >
                        Ver/Editar
                      </Link>
                      <button
                        onClick={() => deleteDelivery(latestDelivery.id)}
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
        </div>
      </div>
    </div>
  );
};

export default Panel;
