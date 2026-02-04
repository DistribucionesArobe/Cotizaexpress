import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Plus, Zap, Trash2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CargaProductos() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [activeTab, setActiveTab] = useState('rapida'); // 'rapida' o 'excel'
  
  // Estado para carga rápida
  const [productosRapidos, setProductosRapidos] = useState([
    { nombre: '', precio: '' }
  ]);
  const [loadingRapida, setLoadingRapida] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResultado(null);
    }
  };

  const cargarProductos = async () => {
    if (!file) {
      toast.error('Selecciona un archivo Excel');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/carga-productos/upload-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResultado(response.data);
      toast.success(`Productos cargados: ${response.data.productos_insertados} insertados, ${response.data.productos_actualizados} actualizados`);
      setFile(null);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error(error.response?.data?.detail || 'Error cargando productos');
    } finally {
      setLoading(false);
    }
  };

  // Funciones para carga rápida
  const agregarFila = () => {
    setProductosRapidos([...productosRapidos, { nombre: '', precio: '' }]);
  };

  const eliminarFila = (index) => {
    if (productosRapidos.length > 1) {
      setProductosRapidos(productosRapidos.filter((_, i) => i !== index));
    }
  };

  const actualizarProducto = (index, campo, valor) => {
    const nuevos = [...productosRapidos];
    nuevos[index][campo] = valor;
    setProductosRapidos(nuevos);
  };

  const cargarRapido = async () => {
    // Filtrar productos válidos
    const productosValidos = productosRapidos.filter(
      p => p.nombre.trim() && p.precio && parseFloat(p.precio) > 0
    );

    if (productosValidos.length === 0) {
      toast.error('Agrega al menos un producto con nombre y precio');
      return;
    }

    setLoadingRapida(true);
    try {
      const response = await axios.post(`${API}/carga-productos/rapida`, {
        productos: productosValidos.map(p => ({
          nombre: p.nombre.trim(),
          precio_base: parseFloat(p.precio),
          categoria: 'General',
          unidad: 'Pieza'
        }))
      });

      toast.success(`✅ ${response.data.productos_insertados} productos cargados`);
      setProductosRapidos([{ nombre: '', precio: '' }]);
      setResultado(response.data);
    } catch (error) {
      console.error('Error en carga rápida:', error);
      toast.error(error.response?.data?.detail || 'Error cargando productos');
    } finally {
      setLoadingRapida(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="carga-productos-container">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Carga de Productos</h2>
        <p className="text-slate-600 mt-1">Agrega productos a tu catálogo</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('rapida')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'rapida'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Zap className="w-4 h-4 inline mr-2" />
          Carga Rápida
        </button>
        <button
          onClick={() => setActiveTab('excel')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'excel'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 inline mr-2" />
          Desde Excel
        </button>
      </div>

      {/* Carga Rápida */}
      {activeTab === 'rapida' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Carga Rápida
            </CardTitle>
            <p className="text-sm text-slate-500">Solo nombre y precio. Sin complicaciones.</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 px-1">
                <div className="col-span-7">Nombre del producto</div>
                <div className="col-span-3">Precio (sin IVA)</div>
                <div className="col-span-2"></div>
              </div>

              {/* Filas de productos */}
              {productosRapidos.map((producto, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-7">
                    <Input
                      placeholder="Ej: Cemento gris 50kg"
                      value={producto.nombre}
                      onChange={(e) => actualizarProducto(index, 'nombre', e.target.value)}
                      data-testid={`input-nombre-${index}`}
                    />
                  </div>
                  <div className="col-span-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={producto.precio}
                        onChange={(e) => actualizarProducto(index, 'precio', e.target.value)}
                        data-testid={`input-precio-${index}`}
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    {productosRapidos.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarFila(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Botón agregar fila */}
              <Button
                variant="outline"
                size="sm"
                onClick={agregarFila}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar otro producto
              </Button>

              {/* Botón cargar */}
              <Button
                onClick={cargarRapido}
                disabled={loadingRapida}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
                data-testid="btn-cargar-rapido"
              >
                {loadingRapida ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cargando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Cargar {productosRapidos.filter(p => p.nombre && p.precio).length} producto(s)
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-slate-400 mt-4 text-center">
              Los productos se guardarán con categoría "General" y unidad "Pieza". 
              Puedes editarlos después desde la sección de Productos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Carga desde Excel */}
      {activeTab === 'excel' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paso 1: Descargar Template */}
          <Card data-testid="card-template">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                  1
                </span>
                Descargar Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Descarga la plantilla de Excel con el formato correcto para cargar tus productos.
              </p>
              <div className="bg-slate-50 p-4 rounded-lg mb-4">
                <p className="text-xs font-semibold text-slate-700 mb-2">Columnas del template:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• <strong>nombre</strong>: Nombre del producto *</li>
                  <li>• <strong>categoria</strong>: Categoría (Cemento, Acero, etc.) *</li>
                  <li>• <strong>precio_base</strong>: Precio sin IVA *</li>
                  <li>• <strong>unidad</strong>: Saco, Pieza, Metro, etc.</li>
                  <li>• <strong>stock</strong>: Cantidad disponible (opcional)</li>
                  <li>• <strong>descripcion</strong>: Descripción del producto (opcional)</li>
                </ul>
              </div>
              <Button
                onClick={async () => {
                  try {
                    toast.info('Descargando template...');
                    const response = await fetch(`${API}/carga-productos/template`);
                    if (!response.ok) throw new Error('Error al descargar');
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'template_productos_cotizabot.xlsx';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    toast.success('¡Template descargado!');
                  } catch (error) {
                    console.error('Error descargando template:', error);
                    toast.error('Error al descargar. Intenta de nuevo.');
                  }
                }}
                className="w-full bg-slate-900 hover:bg-slate-800"
                data-testid="btn-descargar-template"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Template Excel
              </Button>
            </CardContent>
          </Card>

          {/* Paso 2: Subir Archivo */}
          <Card data-testid="card-upload">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                  2
                </span>
                Cargar Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4">
                Completa el template con tus productos y súbelo aquí.
              </p>
              
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center mb-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  data-testid="file-input"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer inline-flex flex-col items-center"
                >
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {file ? file.name : 'Click para seleccionar archivo'}
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    .xlsx o .xls
                  </span>
                </label>
              </div>

              <Button
                data-testid="btn-cargar-productos"
                onClick={cargarProductos}
                disabled={!file || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cargando...
                  </>
                ) : (
                  '📤 Cargar Productos'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resultados */}
      {resultado && (
        <Card data-testid="card-resultado">
          <CardHeader>
            <CardTitle>Resultado de la Carga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">Productos Insertados</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {resultado.productos_insertados}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">Productos Actualizados</p>
                <p className="text-3xl font-bold text-blue-600">
                  {resultado.productos_actualizados}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600">Errores</p>
                <p className="text-3xl font-bold text-red-600">
                  {resultado.errores?.length || 0}
                </p>
              </div>
            </div>

            {resultado.errores && resultado.errores.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-800 mb-2">Errores encontrados:</p>
                <ul className="text-xs text-red-700 space-y-1">
                  {resultado.errores.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}