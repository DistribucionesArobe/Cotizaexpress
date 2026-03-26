import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Package, Upload, Pencil, Trash2, LayoutGrid, LayoutList, X, Check, Plus } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function Productos() {
  const { user } = useAuth();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [productoEditando, setProductoEditando] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    cargarProductos();
  }, []);

  const cargarProductos = async () => {
    try {
      setLoading(true);
      const url = searchQ
        ? `${API}/pricebook/items?limit=1000&q=${encodeURIComponent(searchQ)}`
        : `${API}/pricebook/items?limit=1000`;
      const res = await axios.get(url);
      setProductos(res.data.items || []);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    cargarProductos();
  };

  const toggleSelect = (id) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(productos.map(p => p.id));
  const clearSelection = () => setSelectedIds([]);

  const eliminarSeleccionados = async () => {
    if (!window.confirm(`¿Eliminar ${selectedIds.length} productos?`)) return;
    try {
      for (const id of selectedIds) {
        await axios.delete(`${API}/pricebook/items/${id}`);
      }
      toast.success(`${selectedIds.length} productos eliminados`);
      setSelectedIds([]);
      cargarProductos();
    } catch (e) {
      toast.error('Error al eliminar');
    }
  };

  const limpiarDuplicados = async () => {
    try {
      const res = await axios.post(`${API}/pricebook/deduplicate`);
      toast.success(`${res.data.deleted || 0} duplicados eliminados`);
      cargarProductos();
    } catch (e) {
      toast.error('Error al limpiar duplicados');
    }
  };

  const abrirEdicion = async (producto) => {
    setProductoEditando(producto);
    setEditForm({
      name: producto.name || '',
      price: producto.price || '',
      unit: producto.unit || '',
      sku: producto.sku || '',
      synonyms: '',
    });
    setSugerencias([]);
    try {
      const res = await axios.get(`${API}/pricebook/items/${producto.id}/synonyms-suggestions`);
      setEditForm(prev => ({ ...prev, synonyms: (res.data.existing || []).join(', ') }));
      setSugerencias(res.data.suggestions || []);
    } catch (e) {
      console.error('Error cargando sinónimos:', e);
    }
  };

  const agregarSugerencia = (sug) => {
    setEditForm(prev => {
      const existing = prev.synonyms ? prev.synonyms.split(',').map(s => s.trim()).filter(Boolean) : [];
      if (!existing.includes(sug)) {
        return { ...prev, synonyms: [...existing, sug].join(', ') };
      }
      return prev;
    });
    setSugerencias(prev => prev.filter(s => s !== sug));
  };

  const guardarEdicion = async () => {
    try {
      setGuardando(true);
      await axios.patch(`${API}/pricebook/items/${productoEditando.id}`, {
        name: editForm.name,
        price: parseFloat(editForm.price),
        unit: editForm.unit,
        sku: editForm.sku,
        synonyms: editForm.synonyms,
      });
      toast.success('Producto actualizado');
      setProductoEditando(null);
      cargarProductos();
    } catch (e) {
      toast.error('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    if (!productoAEliminar) return;
    try {
      setEliminando(true);
      await axios.delete(`${API}/pricebook/items/${productoAEliminar.id}`);
      toast.success('Producto eliminado');
      setProductoAEliminar(null);
      cargarProductos();
    } catch (e) {
      toast.error('Error al eliminar');
    } finally {
      setEliminando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Catálogo de Productos</h2>
          <p className="text-slate-600 mt-1">{productos.length} productos disponibles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={limpiarDuplicados}>Limpiar duplicados</Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
            <LayoutList className="w-4 h-4" />
          </Button>
          <Link to="/carga-productos">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Upload className="w-4 h-4 mr-2" />Carga Masiva
            </Button>
          </Link>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input placeholder="Buscar producto..." value={searchQ} onChange={e => setSearchQ(e.target.value)} className="max-w-sm" />
        <Button type="submit" variant="outline">Buscar</Button>
        {searchQ && <Button type="button" variant="ghost" onClick={() => { setSearchQ(''); cargarProductos(); }}>Limpiar</Button>}
      </form>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="text-sm font-medium text-emerald-700">{selectedIds.length} productos seleccionados</span>
          <Button size="sm" variant="destructive" onClick={eliminarSeleccionados}>Eliminar seleccionados</Button>
          <Button size="sm" variant="ghost" onClick={clearSelection}>Cancelar</Button>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b text-slate-500">
                <th className="text-left p-3">
                  <input type="checkbox" onChange={e => e.target.checked ? selectAll() : clearSelection()} checked={selectedIds.length === productos.length && productos.length > 0} />
                </th>
                <th className="text-left p-3">Nombre</th>
                <th className="text-left p-3">SKU</th>
                <th className="text-right p-3">Precio</th>
                <th className="text-left p-3">Unidad</th>
                <th className="text-left p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map(p => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="p-3"><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-slate-500">{p.sku || '-'}</td>
                  <td className="p-3 text-right text-emerald-600 font-semibold">${p.price?.toLocaleString('es-MX')}</td>
                  <td className="p-3 text-slate-500">{p.unit || '-'}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => abrirEdicion(p)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:text-red-700" onClick={() => setProductoAEliminar(p)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map(producto => (
            <Card key={producto.id} className={`relative ${selectedIds.includes(producto.id) ? 'border-emerald-500 bg-emerald-50' : ''}`}>
              <input type="checkbox" checked={selectedIds.includes(producto.id)} onChange={() => toggleSelect(producto.id)} className="absolute top-3 left-3 w-4 h-4 accent-emerald-600" />
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pl-5">
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight">{producto.name}</h3>
                    {producto.sku && <p className="text-xs text-slate-500 mt-0.5">SKU: {producto.sku}</p>}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => abrirEdicion(producto)} className="text-slate-400 hover:text-emerald-600 p-1">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setProductoAEliminar(producto)} className="text-slate-400 hover:text-red-500 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500">Precio:</p>
                    <p className="text-emerald-600 font-bold text-base">${producto.price?.toLocaleString('es-MX')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Unidad:</p>
                    <p className="text-slate-700 font-medium text-sm">{producto.unit || 'Pieza'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {productos.length === 0 && (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">No hay productos</h3>
          <p className="text-slate-500 mb-4">Sube tu catálogo desde Excel para empezar</p>
          <Link to="/carga-productos">
            <Button className="bg-emerald-600 hover:bg-emerald-700"><Upload className="w-4 h-4 mr-2" />Subir Catálogo</Button>
          </Link>
        </div>
      )}

      <Dialog open={!!productoEditando} onOpenChange={() => setProductoEditando(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={editForm.name || ''} onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Precio ($)</Label>
                <Input type="number" value={editForm.price || ''} onChange={e => setEditForm(prev => ({ ...prev, price: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Unidad</Label>
                <Input value={editForm.unit || ''} onChange={e => setEditForm(prev => ({ ...prev, unit: e.target.value }))} placeholder="Pieza, Rollo, Kg..." />
              </div>
            </div>
            <div className="space-y-1">
              <Label>SKU</Label>
              <Input value={editForm.sku || ''} onChange={e => setEditForm(prev => ({ ...prev, sku: e.target.value }))} placeholder="Código interno" />
            </div>
            <div className="space-y-1">
              <Label>Sinónimos</Label>
              <Input
                value={editForm.synonyms || ''}
                onChange={e => setEditForm(prev => ({ ...prev, synonyms: e.target.value }))}
                placeholder="clavo, clavito, nail... (separados por coma)"
              />
              <p className="text-xs text-slate-500">Palabras alternativas que usan tus clientes para pedir este producto</p>
            </div>
            {sugerencias.length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Sugerencias de IA</Label>
                <div className="flex flex-wrap gap-1">
                  {sugerencias.map(sug => (
                    <button
                      key={sug}
                      onClick={() => agregarSugerencia(sug)}
                      className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 hover:bg-emerald-100 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductoEditando(null)}>Cancelar</Button>
            <Button onClick={guardarEdicion} disabled={guardando} className="bg-emerald-600 hover:bg-emerald-700">
              {guardando ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!productoAEliminar} onOpenChange={() => setProductoAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>{productoAEliminar?.name}</strong>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarEliminar} disabled={eliminando} className="bg-red-600 hover:bg-red-700">
              {eliminando ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}