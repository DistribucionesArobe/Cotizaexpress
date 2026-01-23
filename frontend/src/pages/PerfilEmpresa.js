import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import DatosFiscales from '../components/DatosFiscales';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function PerfilEmpresa() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [empresa, setEmpresa] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    rfc: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/empresa/perfil`);
      setEmpresa(response.data);
      setFormData({
        nombre: response.data.nombre || '',
        rfc: response.data.rfc || '',
        telefono: response.data.telefono || '',
        email: response.data.email || '',
        direccion: response.data.direccion || ''
      });
    } catch (error) {
      console.error('Error cargando perfil:', error);
      toast.error('Error al cargar perfil de empresa');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await axios.put(`${API}/empresa/perfil`, formData);
      toast.success('Perfil actualizado');
      cargarPerfil();
    } catch (error) {
      console.error('Error guardando perfil:', error);
      toast.error(error.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Usa PNG, JPG, WEBP o SVG');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo es muy grande. Máximo 5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(`${API}/empresa/logo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Logo actualizado');
      setEmpresa({
        ...empresa,
        logo_url: response.data.logo_url
      });
    } catch (error) {
      console.error('Error subiendo logo:', error);
      toast.error(error.response?.data?.detail || 'Error al subir logo');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('¿Eliminar el logo de tu empresa?')) return;

    try {
      setUploading(true);
      await axios.delete(`${API}/empresa/logo`);
      toast.success('Logo eliminado');
      setEmpresa({
        ...empresa,
        logo_url: null
      });
    } catch (error) {
      console.error('Error eliminando logo:', error);
      toast.error('Error al eliminar logo');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="perfil-empresa-page">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Perfil de Empresa</h1>
        <p className="text-slate-600">Configura la información de tu empresa para las cotizaciones</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logo Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Logo de la Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center">
              {/* Logo Preview */}
              <div 
                className="w-40 h-40 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center mb-4 overflow-hidden cursor-pointer hover:border-emerald-500 transition-colors relative group"
                onClick={handleLogoClick}
              >
                {empresa?.logo_url ? (
                  <>
                    <img 
                      src={`${BACKEND_URL}${empresa.logo_url}`}
                      alt="Logo de empresa"
                      className="max-w-full max-h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white text-sm">Cambiar logo</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-slate-400">
                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Click para subir logo</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleLogoChange}
              />

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogoClick}
                  disabled={uploading}
                  data-testid="btn-subir-logo"
                >
                  {uploading ? 'Subiendo...' : 'Subir Logo'}
                </Button>
                {empresa?.logo_url && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleDeleteLogo}
                    disabled={uploading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Eliminar
                  </Button>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-3 text-center">
                PNG, JPG, WEBP o SVG<br/>
                Máximo 5MB • Recomendado: 400x400px
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Company Info Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Información de la Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre de la Empresa</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Mi Empresa S.A. de C.V."
                    data-testid="input-nombre"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    name="rfc"
                    value={formData.rfc}
                    onChange={handleChange}
                    placeholder="XAXX010101000"
                    data-testid="input-rfc"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="81 1234 5678"
                    data-testid="input-telefono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="contacto@miempresa.com"
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  placeholder="Calle Principal #123, Col. Centro, Monterrey, N.L."
                  data-testid="input-direccion"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={saving}
                  data-testid="btn-guardar"
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-emerald-200 bg-emerald-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-emerald-800 mb-1">¿Para qué sirve el logo?</h3>
              <p className="text-emerald-700 text-sm">
                Tu logo aparecerá en todas las cotizaciones PDF que generes con CotizaBot.
                Esto le da un aspecto profesional a tus cotizaciones y refuerza tu marca con tus clientes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
