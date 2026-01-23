import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Package, Upload, FileSpreadsheet, Plus, Crown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Productos() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const planActual = user?.empresa?.plan || user?.usuario?.plan || 'gratis';
  const esPlanGratis = planActual === 'gratis';

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!loading) {
      cargarProductos();
    }
  }, [categoriaSeleccionada]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      // Cargar productos y categorías
      const [productosRes, categoriasRes] = await Promise.all([
        axios.get(`${API}/productos`),
        axios.get(`${API}/productos/categorias`)
      ]);
      
      setProductos(productosRes.data);
      setCategorias(categoriasRes.data.categorias || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
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
    }
  };

  const handleUpgrade = async () => {
    try {
      setUpgradeLoading(true);
      
      const response = await axios.post(`${API}/pagos/crear-checkout`, {
        plan_id: 'completo',
        origin_url: window.location.origin
      });

      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Error creando checkout:', error);
      toast.error(error.response?.data?.detail || 'Error al procesar el pago');
    } finally {
      setUpgradeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12" data-testid="productos-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Vista cuando NO hay productos - Pantalla de onboarding
  if (productos.length === 0) {
    return (
      <div className="space-y-6" data-testid="productos-empty">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Catálogo de Productos</h2>
          <p className="text-slate-600 mt-1">Configura tu catálogo para empezar a cotizar</p>
        </div>

        {/* Card principal de bienvenida */}
        <Card className="border-2 border-dashed border-slate-300 bg-slate-50">
          <CardContent className="py-16">
            <div className="text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-emerald-600" />
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                ¡Carga tus productos!
              </h3>
              
              <p className="text-slate-600 mb-8">
                Para que CotizaBot pueda generar cotizaciones automáticas, 
                necesitas cargar tu catálogo de productos.
              </p>

              {/* Opciones de carga */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <Link to="/carga-productos">
                  <Card className="border-2 border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer h-full">
                    <CardContent className="py-6">
                      <FileSpreadsheet className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
                      <h4 className="font-semibold text-slate-900 mb-1">Desde Excel</h4>
                      <p className="text-sm text-slate-500">
                        Sube tu archivo con la plantilla
                      </p>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="border-2 border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-pointer h-full opacity-60">
                  <CardContent className="py-6">
                    <Plus className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <h4 className="font-semibold text-slate-900 mb-1">Agregar manualmente</h4>
                    <p className="text-sm text-slate-500">
                      Próximamente
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Botón principal */}
              <Link to="/carga-productos">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" data-testid="btn-cargar-productos">
                  <Upload className="w-5 h-5 mr-2" />
                  Cargar productos desde Excel
                </Button>
              </Link>

              <p className="text-xs text-slate-400 mt-4">
                Descarga la plantilla de ejemplo en la página de carga
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card de upgrade si es plan gratis */}
        {esPlanGratis && (
          <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardContent className="py-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Crown className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Plan Gratis: 5 cotizaciones</h4>
                    <p className="text-sm text-slate-600">
                      Actualiza al Plan Completo para cotizaciones ilimitadas + WhatsApp
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleUpgrade}
                  disabled={upgradeLoading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="btn-upgrade"
                >
                  {upgradeLoading ? 'Procesando...' : 'Actualizar - $1,160 MXN/mes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Vista normal con productos
  return (
    <div className="space-y-6" data-testid="productos-container">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Catálogo de Productos</h2>
          <p className="text-slate-600 mt-1">{productos.length} productos disponibles</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/carga-productos">
            <Button variant="outline" data-testid="btn-cargar-mas">
              <Upload className="w-4 h-4 mr-2" />
              Cargar más
            </Button>
          </Link>
          
          {esPlanGratis && (
            <Button 
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="btn-upgrade-header"
            >
              <Crown className="w-4 h-4 mr-2" />
              {upgradeLoading ? 'Procesando...' : 'Actualizar Plan'}
            </Button>
          )}
        </div>
      </div>

      {/* Filtro por Categoría */}
      {categorias.length > 0 && (
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
      )}

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

      {/* Card de upgrade al final si es plan gratis */}
      {esPlanGratis && (
        <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 mt-8">
          <CardContent className="py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900">¿Listo para crecer?</h4>
                  <p className="text-sm text-slate-600">
                    Plan Completo: Cotizaciones ilimitadas + Tu número de WhatsApp
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleUpgrade}
                disabled={upgradeLoading}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="btn-upgrade-footer"
              >
                {upgradeLoading ? 'Procesando...' : 'Actualizar ahora - $1,160 MXN/mes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
