import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';
import { 
  Tag, Plus, Trash2, ToggleLeft, ToggleRight, 
  Users, Calendar, Percent, DollarSign, Loader2,
  Shield, Copy, Check
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AdminPromoCodes() {
  const { user } = useAuth();
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [creando, setCreando] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  
  // Form para crear código
  const [nuevoCode, setNuevoCode] = useState('');
  const [tipoDescuento, setTipoDescuento] = useState('porcentaje');
  const [valorDescuento, setValorDescuento] = useState('');
  const [maxUsos, setMaxUsos] = useState('1');
  const [unUsoPorCliente, setUnUsoPorCliente] = useState(true);
  const [descripcion, setDescripcion] = useState('');

  // Verificar si es admin
  const esAdmin = user?.usuario?.rol === 'admin';

  useEffect(() => {
    if (esAdmin) {
      cargarPromoCodes();
    }
  }, [esAdmin]);

  const cargarPromoCodes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/pagos/promo/listar`);
      setPromoCodes(response.data.promo_codes || []);
    } catch (error) {
      console.error('Error cargando códigos:', error);
      if (error.response?.status === 403) {
        toast.error('No tienes permisos de administrador');
      } else {
        toast.error('Error al cargar códigos promocionales');
      }
    } finally {
      setLoading(false);
    }
  };

  const crearPromoCode = async () => {
    if (!nuevoCode.trim()) {
      toast.error('Ingresa un código');
      return;
    }
    if (!valorDescuento || parseFloat(valorDescuento) <= 0) {
      toast.error('Ingresa un valor de descuento válido');
      return;
    }

    try {
      setCreando(true);
      
      const payload = {
        code: nuevoCode.trim().toUpperCase(),
        max_usos: parseInt(maxUsos) || 1,
        un_uso_por_cliente: unUsoPorCliente,
        descripcion: descripcion || undefined
      };

      if (tipoDescuento === 'porcentaje') {
        payload.descuento_porcentaje = parseInt(valorDescuento);
      } else {
        payload.descuento_fijo = parseFloat(valorDescuento);
      }

      await axios.post(`${API}/pagos/promo/crear`, payload);
      
      toast.success(`Código ${payload.code} creado exitosamente`);
      setShowCrearModal(false);
      resetForm();
      cargarPromoCodes();
    } catch (error) {
      console.error('Error creando código:', error);
      toast.error(error.response?.data?.detail || 'Error al crear código');
    } finally {
      setCreando(false);
    }
  };

  const togglePromoCode = async (promoId, currentState) => {
    try {
      const response = await axios.patch(`${API}/pagos/promo/${promoId}/toggle`);
      
      setPromoCodes(prev => prev.map(p => 
        p.id === promoId ? { ...p, activo: response.data.activo } : p
      ));
      
      toast.success(`Código ${response.data.activo ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error actualizando código:', error);
      toast.error('Error al actualizar código');
    }
  };

  const eliminarPromoCode = async (promoId, code) => {
    if (!confirm(`¿Eliminar el código ${code}?`)) return;

    try {
      await axios.delete(`${API}/pagos/promo/${promoId}`);
      setPromoCodes(prev => prev.filter(p => p.id !== promoId));
      toast.success('Código eliminado');
    } catch (error) {
      console.error('Error eliminando código:', error);
      toast.error('Error al eliminar código');
    }
  };

  const copiarCodigo = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Código copiado');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const resetForm = () => {
    setNuevoCode('');
    setTipoDescuento('porcentaje');
    setValorDescuento('');
    setMaxUsos('1');
    setUnUsoPorCliente(true);
    setDescripcion('');
  };

  // Si no es admin, redirigir
  if (!esAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-promo-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Códigos Promocionales</h2>
            <p className="text-slate-600">Administra los descuentos y promociones</p>
          </div>
        </div>
        
        <Button 
          onClick={() => setShowCrearModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
          data-testid="btn-crear-promo"
        >
          <Plus className="w-4 h-4 mr-2" />
          Crear Código
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{promoCodes.length}</p>
                <p className="text-sm text-slate-500">Total códigos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <ToggleRight className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {promoCodes.filter(p => p.activo).length}
                </p>
                <p className="text-sm text-slate-500">Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {promoCodes.reduce((acc, p) => acc + (p.usos_completados || 0), 0)}
                </p>
                <p className="text-sm text-slate-500">Usos totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de códigos */}
      <Card>
        <CardHeader>
          <CardTitle>Todos los códigos</CardTitle>
        </CardHeader>
        <CardContent>
          {promoCodes.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Tag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No hay códigos promocionales</p>
              <p className="text-sm">Crea uno para empezar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {promoCodes.map((promo) => (
                <div 
                  key={promo.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    promo.activo ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200'
                  }`}
                  data-testid={`promo-${promo.code}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Código */}
                    <div className="flex items-center gap-2">
                      <code className={`px-3 py-1 rounded-md font-mono text-lg ${
                        promo.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                      }`}>
                        {promo.code}
                      </code>
                      <button
                        onClick={() => copiarCodigo(promo.code)}
                        className="p-1 hover:bg-slate-100 rounded"
                        title="Copiar código"
                      >
                        {copiedCode === promo.code ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                    </div>
                    
                    {/* Descuento */}
                    <Badge variant={promo.activo ? 'default' : 'secondary'}>
                      {promo.descuento_porcentaje 
                        ? `${promo.descuento_porcentaje}%`
                        : `$${promo.descuento_fijo} MXN`
                      }
                    </Badge>
                    
                    {/* Info adicional */}
                    <div className="hidden md:flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {promo.usos_actuales || 0}/{promo.max_usos || '∞'}
                      </span>
                      {promo.descripcion && (
                        <span className="max-w-xs truncate">{promo.descripcion}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => togglePromoCode(promo.id, promo.activo)}
                      className={promo.activo ? 'text-emerald-600' : 'text-slate-400'}
                      title={promo.activo ? 'Desactivar' : 'Activar'}
                    >
                      {promo.activo ? (
                        <ToggleRight className="w-5 h-5" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarPromoCode(promo.id, promo.code)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear Código */}
      <Dialog open={showCrearModal} onOpenChange={setShowCrearModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              Crear Código Promocional
            </DialogTitle>
            <DialogDescription>
              Crea un nuevo código de descuento para tus clientes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Código */}
            <div>
              <label className="text-sm font-medium text-slate-700">Código</label>
              <Input
                placeholder="Ej: BIENVENIDO, PROMO50"
                value={nuevoCode}
                onChange={(e) => setNuevoCode(e.target.value.toUpperCase())}
                className="mt-1"
                data-testid="input-nuevo-code"
              />
            </div>

            {/* Tipo de descuento */}
            <div>
              <label className="text-sm font-medium text-slate-700">Tipo de descuento</label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={tipoDescuento === 'porcentaje' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTipoDescuento('porcentaje')}
                >
                  <Percent className="w-4 h-4 mr-2" />
                  Porcentaje
                </Button>
                <Button
                  type="button"
                  variant={tipoDescuento === 'fijo' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setTipoDescuento('fijo')}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Monto fijo
                </Button>
              </div>
            </div>

            {/* Valor */}
            <div>
              <label className="text-sm font-medium text-slate-700">
                {tipoDescuento === 'porcentaje' ? 'Porcentaje de descuento' : 'Monto de descuento (MXN)'}
              </label>
              <div className="relative mt-1">
                <Input
                  type="number"
                  placeholder={tipoDescuento === 'porcentaje' ? '10, 25, 50...' : '100, 200, 500...'}
                  value={valorDescuento}
                  onChange={(e) => setValorDescuento(e.target.value)}
                  className="pl-8"
                  data-testid="input-valor-descuento"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {tipoDescuento === 'porcentaje' ? '%' : '$'}
                </span>
              </div>
            </div>

            {/* Usos máximos */}
            <div>
              <label className="text-sm font-medium text-slate-700">Usos máximos</label>
              <Input
                type="number"
                placeholder="Cantidad de veces que se puede usar"
                value={maxUsos}
                onChange={(e) => setMaxUsos(e.target.value)}
                className="mt-1"
                data-testid="input-max-usos"
              />
            </div>

            {/* Un uso por cliente */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="unUsoPorCliente"
                checked={unUsoPorCliente}
                onChange={(e) => setUnUsoPorCliente(e.target.checked)}
                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
              />
              <label htmlFor="unUsoPorCliente" className="text-sm text-slate-700">
                Solo un uso por cliente
              </label>
            </div>

            {/* Descripción */}
            <div>
              <label className="text-sm font-medium text-slate-700">Descripción (opcional)</label>
              <Input
                placeholder="Ej: Descuento de bienvenida"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                className="mt-1"
                data-testid="input-descripcion"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCrearModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={crearPromoCode}
              disabled={creando}
              className="bg-emerald-600 hover:bg-emerald-700"
              data-testid="btn-confirmar-crear"
            >
              {creando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Código'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
