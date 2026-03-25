cat /home/claude/fixes/Productos.js
Output

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { Package, Upload, Plus, Pencil, Check, X, Trash2, LayoutGrid, LayoutList, Loader2 } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedIds, setSelectedIds] = useState([]);
  const [searchQ, setSearchQ] = useState('');

  // Estado para edición inline de precio
  const [editandoPrecio, setEditandoPrecio] = useState(null);
  const [nuevoPrecio, setNuevoPrecio] = useState('');
  const [guardandoPrecio, setGuardandoPrecio] = useState(false);

  // Estado para eliminar
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

  // Selección múltiple
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

  // Editar precio inline
  const iniciarEditarPrecio = (producto) => {
    setEditandoPrecio(producto.id);
    setNuevoPrecio(producto.price?.toString() || '');
  };

  const guardarPrecio = async (productoId) => {
    const precio = parseFloat(nuevoPrecio);
    if (isNaN(precio) || precio < 0) {
      toast.error('Precio inválido');
      return;
    }
    try {
      setGuardandoPrecio(true);
      await axios.patch(`${API}/pricebook/items/${productoId}`, { price: precio });
      toast.success('Precio actualizado');
      setEditandoPrecio(null);
      cargarProductos();
    } catch (e) {
      toast.error('Error al actualizar precio');
    } finally {
      setGuardandoPrecio(false);
    }
  };

  const cancelarEdicion = () => {
    setEditandoPrecio(null);
    setNuevoPrecio('');
  };

  // Eliminar producto individual
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Catálogo de Productos</h2>
          <p className="text-slate-600 mt-1">{productos.length} productos disponibles</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={limpiarDuplicados}>
            Limpiar duplicados
          </Button>
          <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
            <LayoutList className="w-4 h-4" />
          </Button>
          <Link to="/carga-productos">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Upload className="w-4 h-4 mr-2" />
              Carga Masiva
            </Button>
          </Link>
        </div>
      </div>

      {/* Búsqueda */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Buscar producto..."
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">Buscar</Button>
        {searchQ && <Button type="button" variant="ghost" onClick={() => { setSearchQ(''); cargarProductos(); }}>Limpiar</Button>}
      </form>

      {/* Barra de selección múltiple */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
          <span className="text-sm font-medium text-emerald-700">{selectedIds.length} productos seleccionados</span>
          <Button size="sm" variant="destructive" onClick={eliminarSeleccionados}>Eliminar seleccionados</Button>
          <Button size="sm" variant="ghost" onClick={clearSelection}>Cancelar</Button>
        </div>
      )}

      {/* Vista Lista */}
      {viewMode === 'list' && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b text-slate-500">
                <th className="text-left p-3">
                  <input
                    type="checkbox"
                    onChange={e => e.target.checked ? selectAll() : clearSelection()}
                    checked={selectedIds.length === productos.length && productos.length > 0}
                  />
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
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                    />
                  </td>
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-slate-500">{p.sku || '-'}</td>
                  <td className="p-3 text-right">
                    {editandoPrecio === p.id ? (
                      <div className="flex items-center gap-1 justify-end">
                        <Input
                          type="number"
                          value={nuevoPrecio}
                          onChange={e => setNuevoPrecio(e.target.value)}
                          className="w-24 h-7 text-right"
                          autoFocus
                        />
                        <Button size="sm" className="h-7 w-7 p-0 bg-emerald-600" onClick={() => guardarPrecio(p.id)} disabled={guardandoPrecio}>
                          <Check className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={cancelarEdicion}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <span
                        className="text-emerald-600 font-semibold cursor-pointer hover:underline"
                        onClick={() => iniciarEditarPrecio(p)}
                      >
                        ${p.price?.toLocaleString('es-MX')}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500">{p.unit || '-'}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => iniciarEditarPrecio(p)}>
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

      {/* Vista Grid */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productos.map(producto => (
            <Card key={producto.id} className={`relative ${selectedIds.includes(producto.id) ? 'border-emerald-500 bg-emerald-50' : ''}`}>
              <input
                type="checkbox"
                checked={selectedIds.includes(producto.id)}
                onChange={() => toggleSelect(producto.id)}
                className="absolute top-3 left-3 w-4 h-4 accent-emerald-600"
              />
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pl-5">
                    <h3 className="font-semibold text-slate-900 text-sm leading-tight">{producto.name}</h3>
                    {producto.sku && <p className="text-xs text-slate-500 mt-0.5">SKU: {producto.sku}</p>}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button onClick={() => iniciarEditarPrecio(producto)} className="text-slate-400 hover:text-emerald-600 p-1">
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
                    {editandoPrecio === producto.id ? (
                      <div className="flex items-center gap-1 mt-1">
                        <Input
                          type="number"
                          value={nuevoPrecio}
                          onChange={e => setNuevoPrecio(e.target.value)}
                          className="w-24 h-7 text-right text-sm"
                          autoFocus
                        />
                        <button onClick={() => guardarPrecio(producto.id)} disabled={guardandoPrecio} className="text-emerald-600 hover:text-emerald-700">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelarEdicion} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <p
                        className="text-emerald-600 font-bold text-base cursor-pointer hover:underline"
                        onClick={() => iniciarEditarPrecio(producto)}
                      >
                        ${producto.price?.toLocaleString('es-MX')}
                      </p>
                    )}
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
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Upload className="w-4 h-4 mr-2" />
              Subir Catálogo
            </Button>
          </Link>
        </div>
      )}

      {/* Dialog confirmar eliminar */}
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
}// force update Wed Mar 25 16:04:00 CST 2026
