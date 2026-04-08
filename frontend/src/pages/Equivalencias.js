import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowRight, Search } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Equivalencias() {
  const [jerga, setJerga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newOrig, setNewOrig] = useState('');
  const [newNorm, setNewNorm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/company/jerga`);
      setJerga(res.data?.jerga || []);
    } catch (e) {
      toast.error('Error al cargar equivalencias');
    } finally {
      setLoading(false);
    }
  };

  const agregar = async () => {
    if (!newOrig.trim() || !newNorm.trim()) {
      toast.error('Ambos campos son requeridos');
      return;
    }
    try {
      setSaving(true);
      await axios.post(`${API}/company/jerga`, {
        termino_original: newOrig.trim(),
        termino_normalizado: newNorm.trim(),
      });
      toast.success('Equivalencia guardada');
      setNewOrig('');
      setNewNorm('');
      cargar();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (termino) => {
    if (!window.confirm(`¿Eliminar "${termino}"?`)) return;
    try {
      await axios.delete(`${API}/company/jerga/${encodeURIComponent(termino)}`);
      toast.success('Eliminado');
      cargar();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  const filtered = jerga.filter(j =>
    j.termino_original.toLowerCase().includes(search.toLowerCase()) ||
    j.termino_normalizado.toLowerCase().includes(search.toLowerCase())
  );

  const manualEntries = filtered.filter(j => j.source === 'manual');
  const autoEntries = filtered.filter(j => j.source !== 'manual');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Equivalencias</h1>
        <p className="text-slate-600">
          Cuando un cliente usa nombres de otra marca o competencia, el bot los traduce a tus productos.
        </p>
      </div>

      {/* Agregar nueva */}
      <Card>
        <CardHeader><CardTitle>Agregar equivalencia</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm text-slate-500">Cliente dice...</label>
              <Input
                value={newOrig}
                onChange={e => setNewOrig(e.target.value)}
                placeholder='Ej: "panel de yeso lightrey"'
              />
            </div>
            <div className="hidden sm:flex items-center pt-5">
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-sm text-slate-500">Tu producto es...</label>
              <Input
                value={newNorm}
                onChange={e => setNewNorm(e.target.value)}
                placeholder='Ej: "tablaroca ultralight"'
              />
            </div>
            <Button
              onClick={agregar}
              disabled={saving || !newOrig.trim() || !newNorm.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              {saving ? 'Guardando...' : 'Agregar'}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Ejemplo: si tu competencia vende "Compuesto STD Plus" y tú vendes "Redimix",
            agrega esa equivalencia para que el bot entienda.
          </p>
        </CardContent>
      </Card>

      {/* Buscar */}
      {jerga.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar equivalencia..."
            className="pl-10"
          />
        </div>
      )}

      {/* Equivalencias manuales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tus equivalencias ({manualEntries.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {manualEntries.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">
              No tienes equivalencias manuales. Agrega una arriba.
            </p>
          ) : (
            <div className="space-y-2">
              {manualEntries.map(j => (
                <div key={j.termino_original} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-medium text-slate-700 truncate">"{j.termino_original}"</span>
                    <ArrowRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-emerald-700 font-medium truncate">{j.termino_normalizado}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminar(j.termino_original)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Equivalencias auto-aprendidas */}
      {autoEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Aprendidas automáticamente ({autoEntries.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-slate-400 mb-3">
              El bot aprende de búsquedas exitosas. Puedes eliminar las que no sean correctas.
            </p>
            <div className="space-y-2">
              {autoEntries.map(j => (
                <div key={j.termino_original} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-slate-600 truncate">"{j.termino_original}"</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-sm text-slate-600 truncate">{j.termino_normalizado}</span>
                    <span className="text-xs text-slate-400 flex-shrink-0">({j.usage_count}x)</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => eliminar(j.termino_original)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
