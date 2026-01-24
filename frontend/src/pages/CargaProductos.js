import { useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function CargaProductos() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResultado(null);
    }
  };

  const descargarTemplate = async () => {
    try {
      // Obtener token del localStorage
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API}/carga-productos/template`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Crear blob y descargar
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_productos_cotizabot.xlsx');
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      window.URL.revokeObjectURL(url);
      link.remove();
      
      toast.success('Template descargado correctamente');
    } catch (error) {
      console.error('Error descargando template:', error);
      toast.error('Error descargando template. Intenta de nuevo.');
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

  return (
    <div className="space-y-6" data-testid="carga-productos-container">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Carga Masiva de Productos</h2>
        <p className="text-slate-600 mt-1">Importa tu catálogo desde Excel</p>
      </div>

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
              <p className="text-xs font-semibold text-slate-700 mb-2">Columnas requeridas:</p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• <strong>nombre</strong>: Nombre del producto</li>
                <li>• <strong>categoria</strong>: Categoría (Tablaroca, Ferretería, etc.)</li>
                <li>• <strong>precio_base</strong>: Precio sin IVA</li>
                <li>• <strong>unidad</strong>: Pieza, Caja, Metro, etc.</li>
                <li>• <strong>sku</strong>: Código único (opcional, se genera automático)</li>
                <li>• <strong>margen_minimo</strong>: Decimal (ej: 0.15 para 15%)</li>
                <li>• <strong>stock</strong>: Cantidad disponible</li>
              </ul>
            </div>
            <Button
              data-testid="btn-descargar-template"
              onClick={descargarTemplate}
              className="w-full"
            >
              📥 Descargar Template Excel
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

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle>Instrucciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <strong>1.</strong> Descarga el template de Excel haciendo click en el botón de arriba.
            </p>
            <p>
              <strong>2.</strong> Abre el archivo con Excel, Google Sheets o LibreOffice.
            </p>
            <p>
              <strong>3.</strong> Completa las filas con tus productos. Puedes copiar y pegar desde tu catálogo actual.
            </p>
            <p>
              <strong>4.</strong> Guarda el archivo (formato .xlsx o .xls).
            </p>
            <p>
              <strong>5.</strong> Sube el archivo usando el botón "Cargar Productos".
            </p>
            <p className="text-amber-600">
              <strong>Nota:</strong> Si un producto con el mismo SKU ya existe, será actualizado. Si no existe, será insertado como nuevo.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}