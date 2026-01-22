import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [categoriaSeleccionada]);

  const cargarDatos = async () => {
    try {
      const response = await axios.get(`${API}/productos/categorias`);
      setCategorias(response.data.categorias || []);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const cargarProductos = async () => {
    try {
      const url = categoriaSeleccionada
        ? `${API}/productos?categoria=${categoriaSeleccionada}`
        : `${API}/productos`;
      const response = await axios.get(url);
      setProductos(response.data);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12" data-testid="productos-loading">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6" data-testid="productos-container">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Catálogo de Productos</h2>
        <p className="text-slate-600 mt-1">{productos.length} productos disponibles</p>
      </div>

      {/* Filtro por Categoría */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          data-testid="categoria-todas"
          variant={categoriaSeleccionada === '' ? 'default' : 'outline'}
          className="cursor-pointer px-4 py-2"
          onClick={() => setCategoriaSeleccionada('')}
        >
          Todas
        </Badge>
        {categorias.map((cat) => (
          <Badge
            key={cat}
            data-testid={`categoria-${cat}`}
            variant={categoriaSeleccionada === cat ? 'default' : 'outline'}
            className="cursor-pointer px-4 py-2"
            onClick={() => setCategoriaSeleccionada(cat)}
          >
            {cat}
          </Badge>
        ))}
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {productos.map((producto) => (
          <Card key={producto.id} data-testid={`producto-${producto.sku}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {producto.categoria}
                  </Badge>
                  <CardTitle className="text-base">{producto.nombre}</CardTitle>
                  <p className="text-xs text-slate-500 mt-1">SKU: {producto.sku}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Precio base:</span>
                  <span className="text-lg font-bold text-emerald-600">
                    ${producto.precio_base.toLocaleString('es-MX')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Unidad:</span>
                  <span className="font-medium">{producto.unidad}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Stock:</span>
                  <span className={`font-medium ${
                    producto.stock > 50 ? 'text-emerald-600' :
                    producto.stock > 0 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {producto.stock} {producto.unidad}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}