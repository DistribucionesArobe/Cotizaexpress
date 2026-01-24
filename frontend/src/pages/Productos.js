import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Package, Upload, FileSpreadsheet, Plus, Crown, Pencil, Check, X, Tag, Loader2, Save, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Productos() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [loading, setLoading] = useState(true);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [editandoPrecio, setEditandoPrecio] = useState(null);
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [guardandoPrecio, setGuardandoPrecio] = useState(false);
  const [esDemo, setEsDemo] = useState(false);
  
  // Estado para modal de checkout
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoValidation, setPromoValidation] = useState(null);
  const [validandoPromo, setValidandoPromo] = useState(false);
  
  // Estado para modal de agregar producto
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [creandoProducto, setCreandoProducto] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    categoria: '',
    precio_base: '',
    unidad: 'Pieza',
    stock: '0',
    descripcion: ''
  });

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
      
      const [productosRes, categoriasRes, countRes] = await Promise.all([
        axios.get(`${API}/productos`),
        axios.get(`${API}/productos/categorias`),
        axios.get(`${API}/productos/count`)
      ]);
      
      setProductos(productosRes.data);
      setCategorias(categoriasRes.data.categorias || []);
      
      // Si no tiene productos propios pero hay productos en la lista, son de demo
      setEsDemo(countRes.data.count === 0 && productosRes.data.length > 0);
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
        origin_url: window.location.origin,
        promo_code: promoValidation?.valid ? promoCode : undefined
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

  const openCheckoutModal = () => {
    setShowCheckoutModal(true);
    setPromoCode('');
    setPromoValidation(null);
  };

  const validarPromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoValidation(null);
      return;
    }

    try {
      setValidandoPromo(true);
      const response = await axios.post(`${API}/pagos/promo/validar`, {
        code: promoCode.trim()
      });
      
      setPromoValidation(response.data);
      
      if (response.data.valid) {
        toast.success(`¡Código válido! Descuento: ${response.data.descuento_texto}`);
      } else {
        toast.error(response.data.error || 'Código no válido');
      }
    } catch (error) {
      console.error('Error validando código:', error);
      setPromoValidation({ valid: false, error: 'Error validando código' });
    } finally {
      setValidandoPromo(false);
    }
  };

  const iniciarEdicionPrecio = (producto) => {
    setEditandoPrecio(producto.id);
    setNuevoPrecio(producto.precio_base.toString());
  };

  const cancelarEdicion = () => {
    setEditandoPrecio(null);
    setNuevoPrecio('');
  };

  const guardarPrecio = async (productoId) => {
    const precio = parseFloat(nuevoPrecio);
    
    if (isNaN(precio) || precio <= 0) {
      toast.error('Ingresa un precio válido mayor a 0');
      return;
    }

    try {
      setGuardandoPrecio(true);
      
      await axios.patch(`${API}/productos/${productoId}/precio`, {
        precio_base: precio
      });
      
      // Actualizar el producto en el estado local
      setProductos(prev => prev.map(p => 
        p.id === productoId ? { ...p, precio_base: precio } : p
      ));
      
      toast.success('Precio actualizado');
      setEditandoPrecio(null);
      setNuevoPrecio('');
    } catch (error) {
      console.error('Error actualizando precio:', error);
      toast.error(error.response?.data?.detail || 'Error al actualizar precio');
    } finally {
      setGuardandoPrecio(false);
    }
  };

  const resetNuevoProducto = () => {
    setNuevoProducto({
      nombre: '',
      categoria: '',
      precio_base: '',
      unidad: 'Pieza',
      stock: '0',
      descripcion: ''
    });
  };

  const crearProducto = async () => {
    // Validaciones
    if (!nuevoProducto.nombre.trim()) {
      toast.error('Ingresa el nombre del producto');
      return;
    }
    if (!nuevoProducto.categoria.trim()) {
      toast.error('Ingresa la categoría');
      return;
    }
    if (!nuevoProducto.precio_base || parseFloat(nuevoProducto.precio_base) <= 0) {
      toast.error('Ingresa un precio válido mayor a 0');
      return;
    }

    try {
      setCreandoProducto(true);
      
      const payload = {
        nombre: nuevoProducto.nombre.trim(),
        categoria: nuevoProducto.categoria.trim(),
        precio_base: parseFloat(nuevoProducto.precio_base),
        unidad: nuevoProducto.unidad,
        stock: parseFloat(nuevoProducto.stock) || 0,
        descripcion: nuevoProducto.descripcion.trim() || null
      };
      // SKU se genera automáticamente en el backend

      const response = await axios.post(`${API}/productos`, payload);
      
      // Agregar el producto a la lista
      setProductos(prev => [...prev, response.data]);
      
      // Actualizar categorías si es nueva
      if (!categorias.includes(payload.categoria)) {
        setCategorias(prev => [...prev, payload.categoria].sort());
      }
      
      // Si era demo, ya no lo es
      setEsDemo(false);
      
      toast.success(`Producto "${payload.nombre}" creado exitosamente`);
      setShowAddProductModal(false);
      resetNuevoProducto();
    } catch (error) {
      console.error('Error creando producto:', error);
      toast.error(error.response?.data?.detail || 'Error al crear producto');
    } finally {
      setCreandoProducto(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12" data-testid="productos-loading">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  // Vista cuando NO hay productos
  if (productos.length === 0) {
    return (
      <div className="space-y-6" data-testid="productos-empty">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Catálogo de Productos</h2>
          <p className="text-slate-600 mt-1">Configura tu catálogo para empezar a cotizar</p>
        </div>

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

                <Card 
                  className="border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer h-full"
                  onClick={() => setShowAddProductModal(true)}
                  data-testid="btn-agregar-manual-empty"
                >
                  <CardContent className="py-6">
                    <Plus className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-slate-900 mb-1">Agregar manualmente</h4>
                    <p className="text-sm text-slate-500">
                      Crea productos uno por uno
                    </p>
                  </CardContent>
                </Card>
              </div>

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
                  onClick={openCheckoutModal}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  data-testid="btn-upgrade"
                >
                  Actualizar - $1,160 MXN/mes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal Agregar Producto - También en vista vacía */}
        <Dialog open={showAddProductModal} onOpenChange={(open) => {
          setShowAddProductModal(open);
          if (!open) resetNuevoProducto();
        }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Agregar Producto
              </DialogTitle>
              <DialogDescription>
                Crea un nuevo producto para tu catálogo
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nombre del producto *</label>
                <Input
                  placeholder="Ej: Cemento Gris 50kg"
                  value={nuevoProducto.nombre}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, nombre: e.target.value }))}
                  className="mt-1"
                  data-testid="input-producto-nombre"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Categoría *</label>
                <Input
                  placeholder="Ej: Cemento, Acero, Pintura"
                  value={nuevoProducto.categoria}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, categoria: e.target.value }))}
                  className="mt-1"
                  list="categorias-list-empty"
                  data-testid="input-producto-categoria"
                />
                <datalist id="categorias-list-empty">
                  {categorias.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Precio base (MXN) *</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={nuevoProducto.precio_base}
                      onChange={(e) => setNuevoProducto(prev => ({ ...prev, precio_base: e.target.value }))}
                      className="pl-7"
                      min="0"
                      step="0.01"
                      data-testid="input-producto-precio"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Unidad</label>
                  <Select
                    value={nuevoProducto.unidad}
                    onValueChange={(value) => setNuevoProducto(prev => ({ ...prev, unidad: value }))}
                  >
                    <SelectTrigger className="mt-1" data-testid="select-producto-unidad">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pieza">Pieza</SelectItem>
                      <SelectItem value="Kg">Kilogramo</SelectItem>
                      <SelectItem value="Litro">Litro</SelectItem>
                      <SelectItem value="Metro">Metro</SelectItem>
                      <SelectItem value="M2">Metro cuadrado</SelectItem>
                      <SelectItem value="M3">Metro cúbico</SelectItem>
                      <SelectItem value="Caja">Caja</SelectItem>
                      <SelectItem value="Bulto">Bulto</SelectItem>
                      <SelectItem value="Rollo">Rollo</SelectItem>
                      <SelectItem value="Saco">Saco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Stock inicial</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={nuevoProducto.stock}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, stock: e.target.value }))}
                  className="mt-1"
                  min="0"
                  data-testid="input-producto-stock"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Descripción (opcional)</label>
                <Input
                  placeholder="Descripción del producto..."
                  value={nuevoProducto.descripcion}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, descripcion: e.target.value }))}
                  className="mt-1"
                  data-testid="input-producto-descripcion"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddProductModal(false)}>
                Cancelar
              </Button>
              <Button
                onClick={crearProducto}
                disabled={creandoProducto}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="btn-confirmar-producto"
              >
                {creandoProducto ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar producto
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vista normal con productos
  return (
    <div className="space-y-6" data-testid="productos-container">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Catálogo de Productos</h2>
          <p className="text-slate-600 mt-1">
            {productos.length} productos {esDemo ? 'de ejemplo' : 'disponibles'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setShowAddProductModal(true)}
            data-testid="btn-agregar-producto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar producto
          </Button>
          
          <Link to="/carga-productos">
            <Button variant="outline" data-testid="btn-cargar-mas">
              <Upload className="w-4 h-4 mr-2" />
              {esDemo ? 'Cargar mis productos' : 'Cargar más'}
            </Button>
          </Link>
          
          {esPlanGratis && (
            <Button 
              onClick={openCheckoutModal}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="btn-upgrade-header"
            >
              <Crown className="w-4 h-4 mr-2" />
              Actualizar Plan
            </Button>
          )}
        </div>
      </div>

      {/* Banner de demo */}
      {esDemo && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  Estos son productos de ejemplo para que pruebes el sistema
                </p>
                <p className="text-sm text-amber-700">
                  Puedes editar los precios para ver cómo funcionan las cotizaciones. Carga tus propios productos cuando estés listo.
                </p>
              </div>
            </div>
            <Link to="/carga-productos">
              <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                Cargar mis productos
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Nota de edición */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <Pencil className="w-4 h-4 inline mr-2" />
        Haz clic en el precio de cualquier producto para editarlo
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
                {/* Precio editable */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Precio base:</span>
                  
                  {editandoPrecio === producto.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">$</span>
                      <Input
                        type="number"
                        value={nuevoPrecio}
                        onChange={(e) => setNuevoPrecio(e.target.value)}
                        className="w-24 h-8 text-right"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') guardarPrecio(producto.id);
                          if (e.key === 'Escape') cancelarEdicion();
                        }}
                        data-testid={`input-precio-${producto.sku}`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                        onClick={() => guardarPrecio(producto.id)}
                        disabled={guardandoPrecio}
                        data-testid={`btn-guardar-${producto.sku}`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-slate-500 hover:text-slate-700"
                        onClick={cancelarEdicion}
                        data-testid={`btn-cancelar-${producto.sku}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <button
                      onClick={() => iniciarEdicionPrecio(producto)}
                      className="text-lg font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer flex items-center gap-1 group"
                      data-testid={`precio-${producto.sku}`}
                    >
                      ${producto.precio_base.toLocaleString('es-MX')}
                      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
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
                onClick={openCheckoutModal}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="btn-upgrade-footer"
              >
                Actualizar ahora - $1,160 MXN/mes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Checkout con Código Promo */}
      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-emerald-600" />
              Plan Completo CotizaBot
            </DialogTitle>
            <DialogDescription>
              Cotizaciones ilimitadas + Tu número de WhatsApp Business
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Resumen del precio */}
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Precio mensual:</span>
                <span className={`font-bold ${promoValidation?.valid ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                  $1,160 MXN
                </span>
              </div>
              
              {promoValidation?.valid && (
                <>
                  <div className="flex justify-between items-center text-emerald-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Descuento ({promoValidation.descuento_texto}):
                    </span>
                    <span>-${promoValidation.descuento.toLocaleString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="font-semibold text-slate-900">Total a pagar:</span>
                    <span className="text-xl font-bold text-emerald-600">
                      ${promoValidation.precio_final.toLocaleString('es-MX')} MXN
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Campo de código promocional */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                ¿Tienes un código promocional?
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Ingresa tu código"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoValidation(null);
                  }}
                  className="flex-1"
                  data-testid="input-promo-code"
                />
                <Button
                  variant="outline"
                  onClick={validarPromoCode}
                  disabled={!promoCode.trim() || validandoPromo}
                  data-testid="btn-validar-promo"
                >
                  {validandoPromo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Aplicar'
                  )}
                </Button>
              </div>
              
              {promoValidation && !promoValidation.valid && (
                <p className="text-sm text-red-500">{promoValidation.error}</p>
              )}
              
              {promoValidation?.valid && (
                <p className="text-sm text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  {promoValidation.descripcion || 'Código aplicado correctamente'}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCheckoutModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="btn-confirmar-pago"
            >
              {upgradeLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  Pagar {promoValidation?.valid ? `$${promoValidation.precio_final.toLocaleString('es-MX')}` : '$1,160'} MXN
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Agregar Producto */}
      <Dialog open={showAddProductModal} onOpenChange={(open) => {
        setShowAddProductModal(open);
        if (!open) resetNuevoProducto();
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Agregar Producto
            </DialogTitle>
            <DialogDescription>
              Crea un nuevo producto para tu catálogo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Nombre */}
            <div>
              <label className="text-sm font-medium text-slate-700">Nombre del producto *</label>
              <Input
                placeholder="Ej: Cemento Gris 50kg"
                value={nuevoProducto.nombre}
                onChange={(e) => setNuevoProducto(prev => ({ ...prev, nombre: e.target.value }))}
                className="mt-1"
                data-testid="input-producto-nombre"
              />
            </div>

            {/* Categoría y SKU */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Categoría *</label>
                <Input
                  placeholder="Ej: Cemento, Acero, Pintura"
                  value={nuevoProducto.categoria}
                  onChange={(e) => setNuevoProducto(prev => ({ ...prev, categoria: e.target.value }))}
                  className="mt-1"
                  list="categorias-list"
                  data-testid="input-producto-categoria"
                />
                <datalist id="categorias-list">
                  {categorias.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Precio y Unidad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Precio base (MXN) *</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={nuevoProducto.precio_base}
                    onChange={(e) => setNuevoProducto(prev => ({ ...prev, precio_base: e.target.value }))}
                    className="pl-7"
                    min="0"
                    step="0.01"
                    data-testid="input-producto-precio"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Unidad</label>
                <Select
                  value={nuevoProducto.unidad}
                  onValueChange={(value) => setNuevoProducto(prev => ({ ...prev, unidad: value }))}
                >
                  <SelectTrigger className="mt-1" data-testid="select-producto-unidad">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pieza">Pieza</SelectItem>
                    <SelectItem value="Kg">Kilogramo</SelectItem>
                    <SelectItem value="Litro">Litro</SelectItem>
                    <SelectItem value="Metro">Metro</SelectItem>
                    <SelectItem value="M2">Metro cuadrado</SelectItem>
                    <SelectItem value="M3">Metro cúbico</SelectItem>
                    <SelectItem value="Caja">Caja</SelectItem>
                    <SelectItem value="Bulto">Bulto</SelectItem>
                    <SelectItem value="Rollo">Rollo</SelectItem>
                    <SelectItem value="Saco">Saco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Stock */}
            <div>
              <label className="text-sm font-medium text-slate-700">Stock inicial</label>
              <Input
                type="number"
                placeholder="0"
                value={nuevoProducto.stock}
                onChange={(e) => setNuevoProducto(prev => ({ ...prev, stock: e.target.value }))}
                className="mt-1"
                min="0"
                data-testid="input-producto-stock"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="text-sm font-medium text-slate-700">Descripción (opcional)</label>
              <Input
                placeholder="Descripción del producto..."
                value={nuevoProducto.descripcion}
                onChange={(e) => setNuevoProducto(prev => ({ ...prev, descripcion: e.target.value }))}
                className="mt-1"
                data-testid="input-producto-descripcion"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProductModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={crearProducto}
              disabled={creandoProducto}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="btn-confirmar-producto"
            >
              {creandoProducto ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar producto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
