
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
  // State for daily bolis calculation
  const [dailyBolisResult, setDailyBolisResult] = useState<{ storeName: string; total: number }[]>([]);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      } catch (error: any) {
        console.error('Error fetching data:', error);
        setErrorMessage(`Error al cargar datos: ${error.message}`);
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
          setErrorMessage(null);
        }
      } catch (error: any) {
        console.error('Error adding store:', error);
        setErrorMessage(`Error al agregar la tienda: ${error.message}`);
      }
    } else {
      setErrorMessage('Por favor, completa todos los campos');
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
          setErrorMessage(null);
          alert('Entrega registrada correctamente.');
        }
      } catch (error: any) {
        console.error('Error adding delivery:', error);
        setErrorMessage(`Error al registrar la entrega: ${error.message}`);
      }
    } else {
      setErrorMessage('Por favor, completa todos los campos');
    }
  };

  // Delete a store and its deliveries
  const deleteStore = async (storeId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta tienda y todas sus entregas?')) {
      try {
        const { error: storeError } = await supabase
          .from('tiendas')
          .delete()
          .eq('id', storeId);
        if (storeError) throw storeError;

        setStores(stores.filter((store) => store.id !== storeId));
        setDeliveries(deliveries.filter((delivery) => delivery.tienda !== storeId));
        setErrorMessage(null);
      } catch (error: any) {
        console.error('Error deleting store:', error);
        setErrorMessage(`Error al eliminar la tienda: ${error.message}`);
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

        setDeliveries(deliveries.filter((delivery) => delivery.id !== deliveryId));
        setErrorMessage(null);
        alert('Entrega eliminada correctamente.');
      } catch (error: any) {
        console.error('Error deleting delivery:', error);
        setErrorMessage(`Error al eliminar la entrega: ${error.message}`);
      }
    }
  };

  // Calculate total bolis sold today
  const calculateDailyBolis = async () => {
    try {
      setErrorMessage(null);
      // Get today's date in CST (America/Chicago)
      const today = new Date().toLocaleDateString('en-CA', { 
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).split('/').join('-'); // Format: YYYY-MM-DD
      console.log('Fecha de hoy (CST):', today);

      // Fetch deliveries for today
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .rpc('get_deliveries_for_date', { target_date: today });

      if (deliveriesError) throw deliveriesError;
      console.log('Entregas de hoy:', deliveriesData);

      // Group deliveries by tienda_id and calculate sum of dejados
      const bolisByStore: { [key: number]: number } = {};
      deliveriesData.forEach((delivery: Delivery) => {
        if (delivery.dejados !== null && !isNaN(delivery.dejados)) {
          bolisByStore[delivery.tienda] = (bolisByStore[delivery.tienda] || 0) + delivery.dejados;
        }
      });

      console.log('Bolis por tienda:', bolisByStore);

      // Prepare result for display
      const result = Object.entries(bolisByStore).map(([tiendaId, total]) => {
        const store = stores.find((s) => s.id === parseInt(tiendaId));
        return {
          storeName: store ? store.nombre_tienda : `Tienda ${tiendaId}`,
          total,
        };
      });

      // Calculate grand total
      const grandTotal = result.reduce((sum, item) => sum + item.total, 0);

      // Update UI with results
      setDailyBolisResult(result);
      setGrandTotal(grandTotal);

      if (result.length === 0) {
        setErrorMessage(`No se registraron bolis dejados hoy (${today}).`);
      }
    } catch (error: any) {
      console.error('Error calculando bolis del día:', error);
      setErrorMessage(`Error al calcular los bolis dejados: ${error.message}`);
    }
  };

  // Get unique store IDs for deliveries
  const storeIds = [...new Set(deliveries.map((d) => d.tienda))];

  return (
    <div className="bg-gray-100 font-sans p-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Panel Karam Bolis Gourmet</h1>

        {/* Cuadro para calcular bolis del día */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6 text-center">
          <button
            onClick={calculateDailyBolis}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 text-sm"
          >
            Hacer cuenta del día
          </button>
          {errorMessage && (
            <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
          )}
          {dailyBolisResult.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold">Bolis dejados hoy:</h3>
              <ul className="text-left">
                {dailyBolisResult.map((item, index) => (
                  <li key={index} className="text-sm">
                    {item.storeName}: {item.total} bolis
                  </li>
                ))}
              </ul>
              <p className="text-sm font-bold mt-2">Total: {grandTotal} bolis</p>
            </div>
          )}
        </div>

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
                  {store.apodo}
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
                  <td className="border p-2 flex gap-2">
                    <Link
                      to={`/edit-store?storeId=${store.id}`}
                      className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
                    >
                      Ver/Editar
                    </Link>
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
