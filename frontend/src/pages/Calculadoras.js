import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Calculator Functions
const calculatorFunctions = {
  muroTablaroca: (alto, largo) => {
    const m2 = alto * largo;
    const tablaroca = Math.ceil(Math.ceil(m2 / (1.22 * 2.44) * 2 * 1.03) * 1.03);
    const pijas = Math.ceil(tablaroca * 30 / 100) * 100;
    return [
      { name: 'Tablaroca ultralight', qty: tablaroca, unit: 'pza' },
      { name: 'Canal 6.35 x 3.05 cal 26', qty: Math.ceil((largo / 3) * 2), unit: 'pza' },
      { name: 'Poste 6.35 x 3.05 cal 26', qty: (Math.ceil(largo / 0.61) + 1) * (Math.ceil(alto / 3.05) + 1), unit: 'pza' },
      { name: 'Pija 6 x 1', qty: pijas, unit: 'pza' },
      { name: 'Pija framer', qty: Math.ceil(pijas / 2 / 100) * 100, unit: 'pza' },
      { name: 'Perfacinta', qty: Math.ceil((m2 / 2.44) / 20), unit: 'rollo' },
      { name: 'Redimix 21.8 kg', qty: Math.ceil(m2 / 14), unit: 'pza' },
    ];
  },

  muroDurock: (alto, largo) => {
    const m2 = alto * largo;
    const durock = Math.ceil(Math.ceil(m2 / (1.22 * 2.44) * 2 * 1.03) * 1.03);
    const pijas = Math.ceil(durock * 30 / 100) * 100;
    return [
      { name: 'Durock', qty: durock, unit: 'pza' },
      { name: 'Canal 6.35 x 3.05 cal 22', qty: Math.ceil((largo / 3) * 2), unit: 'pza' },
      { name: 'Poste 6.35 x 3.05 cal 20', qty: (Math.ceil(largo / 0.406) + 1) * (Math.ceil(alto / 3.05) + 1), unit: 'pza' },
      { name: 'Pija para durock', qty: pijas, unit: 'pza' },
      { name: 'Pija framer', qty: Math.ceil(pijas / 2 / 100) * 100, unit: 'pza' },
      { name: 'Cinta fibra de vidrio', qty: Math.ceil((m2 / 2.44) / 20), unit: 'rollo' },
      { name: 'Basecoat', qty: Math.ceil(m2 / 4), unit: 'saco' },
    ];
  },

  plafonTablaroca: (largo, ancho) => {
    const m2 = largo * ancho;
    const tablaroca = Math.ceil(m2 / 2.9768 * 1.07);
    const pijas = Math.ceil(tablaroca * 30 / 100) * 100;
    return [
      { name: 'Tablaroca ultralight', qty: tablaroca, unit: 'pza' },
      { name: 'Canal listón cal 26', qty: Math.ceil(((m2 / 0.61) * 1.05) / 3.05) + 2, unit: 'pza' },
      { name: 'Canaleta de carga cal 24', qty: Math.ceil(((m2 / 1.22) * 1.05) / 3.05), unit: 'pza' },
      { name: 'Ángulo de amarre cal 26', qty: Math.ceil(((largo * 2) + (ancho * 2)) / 3.05), unit: 'pza' },
      { name: 'Pija 6 x 1', qty: pijas, unit: 'pza' },
      { name: 'Pija framer', qty: Math.ceil(pijas / 2 / 100) * 100, unit: 'pza' },
      { name: 'Perfacinta', qty: Math.ceil((m2 * 0.8 * 1.05) / 75), unit: 'rollo' },
      { name: 'Redimix 21.8 kg', qty: Math.ceil((m2 * 0.65 * 1.05) / 21.8), unit: 'pza' },
      { name: 'Alambre galvanizado cal 12.5', qty: Math.ceil(m2 / 20), unit: 'rollo' },
    ];
  },

  plafonReticulado: (largo, ancho) => {
    const m2 = largo * ancho;
    return [
      { name: 'Plafón radar 61x61', qty: Math.ceil(m2 / 0.36 * 1.03), unit: 'pza' },
      { name: 'Tee principal', qty: Math.ceil(m2 * 0.29), unit: 'pza' },
      { name: 'Tee 1.22', qty: Math.ceil(m2 * 1.4), unit: 'pza' },
      { name: 'Tee 61', qty: Math.ceil(m2 * 1.4), unit: 'pza' },
      { name: 'Ángulo perimetral', qty: Math.ceil(((largo * 2) + (ancho * 2)) / 3.05), unit: 'pza' },
      { name: 'Alambre galvanizado cal 12.5', qty: Math.ceil(m2 / 20), unit: 'rollo' },
    ];
  },

  pintura: (m2, manos = 2) => {
    const rendimiento = 10;
    const litros = m2 * manos / rendimiento;
    return [
      { name: 'Pintura vinílica', qty: Math.ceil(litros / 19), unit: 'cubeta 19L' },
      { name: 'Rodillo 9"', qty: Math.ceil(m2 / 100), unit: 'pza' },
      { name: 'Brocha 4"', qty: 1, unit: 'pza' },
      { name: 'Cinta masking', qty: Math.ceil(m2 / 50), unit: 'rollo' },
      { name: 'Lija para pared', qty: Math.ceil(m2 / 20), unit: 'pza' },
    ];
  },

  impermeabilizante: (m2, manos = 2) => {
    const rendimiento = 4;
    const litros = m2 * manos / rendimiento;
    const cubetas19 = Math.ceil(litros / 19);
    return [
      { name: 'Impermeabilizante', qty: cubetas19, unit: 'cubeta 19L' },
      { name: 'Sellador acrílico', qty: Math.ceil(m2 / 6 / 19), unit: 'cubeta 19L' },
      { name: 'Malla de refuerzo', qty: Math.ceil(m2 * 1.1), unit: 'm' },
      { name: 'Escoba o cepillo', qty: 1, unit: 'pza' },
    ];
  },

  rejacero: (metros, alturaIdx) => {
    // alturaIdx: 1=1.00m, 1.5=1.50m, 2=2.00m, 2.5=2.50m
    const altura = alturaIdx;
    const rejas = Math.ceil(metros / 2.50);
    const postes = rejas + 1;
    // Abrazaderas per post based on height
    let abrPerPost = 2;
    if (altura >= 2.50) abrPerPost = 5;
    else if (altura >= 2.00) abrPerPost = 4;
    else if (altura >= 1.50) abrPerPost = 3;
    const abrazaderas = postes * abrPerPost;
    // Poste height is 0.50m taller than reja
    const alturaPosteMap = { 1: '1.50', 1.5: '2.00', 2: '2.50', 2.5: '3.10' };
    const alturaPoste = alturaPosteMap[altura] || (altura + 0.5).toFixed(2);
    const alturaStr = String(altura).replace(/\.?0+$/, '');
    return [
      { name: `Reja ciclónica ${alturaStr}m × 2.50m`, qty: rejas, unit: 'pza' },
      { name: `Poste ${alturaPoste}m para rejacero`, qty: postes, unit: 'pza' },
      { name: 'Abrazadera para rejacero', qty: abrazaderas, unit: 'pza' },
    ];
  },
};

// Main Calculator Component
const Calculadoras = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeSubcategory, setActiveSubcategory] = useState(null);
  const [inputs, setInputs] = useState({});
  const [results, setResults] = useState(null);

  const categories = {
    construccion: {
      label: '🏗️ Construcción Ligera',
      description: 'Calcula materiales para muros y plafones',
      subcategories: {
        muroTablaroca: { label: 'Muro Tablaroca', fields: ['alto', 'largo'] },
        muroDurock: { label: 'Muro Durock', fields: ['alto', 'largo'] },
        plafonTablaroca: { label: 'Plafón Tablaroca', fields: ['largo', 'ancho'] },
        plafonReticulado: { label: 'Plafón Reticulado', fields: ['largo', 'ancho'] },
      },
    },
    pintura: {
      label: '🎨 Pintura',
      description: 'Calcula pintura y accesorios necesarios',
      directCalc: 'pintura',
      subcategories: {
        pintura: { label: 'Pintura Vinílica', fields: ['m2', 'manos'] },
      },
    },
    impermeabilizante: {
      label: '🛡️ Impermeabilizantes',
      description: 'Calcula materiales impermeabilizantes',
      directCalc: 'impermeabilizante',
      subcategories: {
        impermeabilizante: { label: 'Impermeabilizante', fields: ['m2', 'manos'] },
      },
    },
    rejacero: {
      label: '🔩 Rejacero',
      description: 'Calcula reja ciclónica, postes y abrazaderas',
      directCalc: 'rejacero',
      subcategories: {
        rejacero: { label: 'Reja ciclónica', fields: ['metrosReja', 'alturaReja'] },
      },
    },
  };

  const handleInputChange = (field, value) => {
    setInputs({ ...inputs, [field]: parseFloat(value) || '' });
  };

  const handleCalculate = () => {
    if (!activeSubcategory) return;

    const currentSubcategory = categories[activeCategory].subcategories[activeSubcategory];
    const requiredFields = currentSubcategory.fields;

    // Check if all fields are filled
    if (!requiredFields.every(field => inputs[field] !== '' && inputs[field] !== undefined)) {
      alert('Por favor completa todos los campos');
      return;
    }

    // Get the calculator function
    const calculatorFunc = calculatorFunctions[activeSubcategory];
    if (!calculatorFunc) return;

    // Call the calculator with the appropriate arguments
    const args = requiredFields.map(field => inputs[field]);
    const materialsList = calculatorFunc(...args);

    setResults(materialsList);
  };

  const generateWhatsAppMessage = () => {
    if (!results) return '';

    let message = `Hola, quiero cotizar los siguientes materiales:\n\n`;
    results.forEach(item => {
      message += `- ${item.name}: ${item.qty} ${item.unit}\n`;
    });
    message += `\n¿Cuál es el costo total y tiempo de entrega?`;

    return encodeURIComponent(message);
  };

  const handleWhatsAppClick = () => {
    const message = generateWhatsAppMessage();
    window.open(`https://wa.me/5218342472640?text=${message}`, '_blank');
  };

  const handleRegistroClick = () => {
    navigate('/registro');
  };

  const renderInputFields = () => {
    if (!activeSubcategory) return null;

    const currentSubcategory = categories[activeCategory].subcategories[activeSubcategory];
    const fields = currentSubcategory.fields;

    const fieldLabels = {
      alto: { label: 'Alto (metros)', placeholder: 'Ej: 3.05' },
      largo: { label: 'Largo (metros)', placeholder: 'Ej: 5' },
      ancho: { label: 'Ancho (metros)', placeholder: 'Ej: 4' },
      m2: { label: 'Área total (m²)', placeholder: 'Ej: 100' },
      manos: { label: 'Número de manos', placeholder: '1-3 (default 2)', min: 1, max: 3 },
      metrosReja: { label: 'Metros lineales de reja', placeholder: 'Ej: 25' },
      alturaReja: { label: 'Altura de la reja', type: 'select', options: [
        { value: 1, label: '1.00 m' },
        { value: 1.5, label: '1.50 m' },
        { value: 2, label: '2.00 m' },
        { value: 2.5, label: '2.50 m' },
      ]},
    };

    return (
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {fieldLabels[field]?.label}
            </label>
            {fieldLabels[field]?.type === 'select' ? (
              <select
                value={inputs[field] !== undefined ? inputs[field] : ''}
                onChange={e => handleInputChange(field, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
              >
                <option value="">Selecciona...</option>
                {fieldLabels[field].options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <input
                type="number"
                placeholder={fieldLabels[field]?.placeholder}
                value={inputs[field] !== undefined && inputs[field] !== '' ? inputs[field] : ''}
                onChange={e => handleInputChange(field, e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                min={fieldLabels[field]?.min}
                max={fieldLabels[field]?.max}
                step="0.01"
              />
            )}
          </div>
        ))}
        <Button
          onClick={handleCalculate}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Calcular
        </Button>
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Calculadora de Materiales de Construcción | CotizaExpress</title>
        <meta
          name="description"
          content="Calcula los materiales que necesitas para tu proyecto de construcción. Tablaroca, pintura, impermeabilizantes, acero y más."
        />
        <meta
          name="keywords"
          content="calculadora de materiales, calcular tablaroca, calcular pintura, calculadora construcción, materiales construcción"
        />
        <meta property="og:title" content="Calculadora de Materiales de Construcción | CotizaExpress" />
        <meta property="og:description" content="Calcula los materiales que necesitas para tu proyecto" />
        <meta property="og:type" content="website" />
      </Helmet>

      <nav className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-xl font-bold text-slate-900">CotizaBot</Link>
          <div className="flex gap-4">
            <Link to="/precios" className="text-slate-600 hover:text-emerald-600 hidden sm:block">Precios</Link>
            <Link to="/registro"><Button className="bg-emerald-600 hover:bg-emerald-700">Comenzar</Button></Link>
          </div>
        </div>
      </nav>

      <main className="bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-16 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Calculadoras de Construcción
            </h1>
            <p className="text-xl text-emerald-50">
              Calcula los materiales que necesitas para tu proyecto
            </p>
          </div>
        </section>

        {/* Main Content */}
        <section className="max-w-6xl mx-auto py-16 px-4">
          {!activeCategory ? (
            // Category Selection
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {Object.entries(categories).map(([key, category]) => (
                <Card
                  key={key}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setActiveCategory(key);
                    // If category has directCalc, skip subcategory selection
                    if (category.directCalc) {
                      setActiveSubcategory(category.directCalc);
                      // Set default manos=2 for pintura/impermeabilizante
                      if (category.directCalc === 'pintura' || category.directCalc === 'impermeabilizante') {
                        setInputs({ manos: 2 });
                      } else {
                        setInputs({});
                      }
                    }
                  }}
                >
                  <CardHeader>
                    <CardTitle className="text-2xl">{category.label}</CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Seleccionar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Subcategory and Calculator View
            <div className="space-y-8">
              {/* Breadcrumb / Back Button */}
              <Button
                variant="outline"
                onClick={() => {
                  setActiveCategory(null);
                  setActiveSubcategory(null);
                  setInputs({});
                  setResults(null);
                }}
                className="mb-4"
              >
                ← Volver a categorías
              </Button>

              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">
                    {categories[activeCategory].label}
                  </CardTitle>
                  <CardDescription>
                    {categories[activeCategory].description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {!activeSubcategory ? (
                    // Subcategory Selection
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(categories[activeCategory].subcategories).map(
                        ([key, subcategory]) => (
                          <Button
                            key={key}
                            onClick={() => {
                              setActiveSubcategory(key);
                              setInputs({});
                              setResults(null);
                            }}
                            variant="outline"
                            className="h-auto p-4 justify-start"
                          >
                            <span className="text-left">{subcategory.label}</span>
                          </Button>
                        )
                      )}
                    </div>
                  ) : (
                    // Calculator Form and Results
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Input Section */}
                      <div>
                        <h3 className="text-xl font-semibold mb-6 text-gray-900">
                          {categories[activeCategory].subcategories[activeSubcategory].label}
                        </h3>
                        {renderInputFields()}
                        {!categories[activeCategory].directCalc && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setActiveSubcategory(null);
                              setInputs({});
                              setResults(null);
                            }}
                            className="w-full mt-4"
                          >
                            Cambiar tipo
                          </Button>
                        )}
                      </div>

                      {/* Results Section */}
                      {results && (
                        <div>
                          <h3 className="text-xl font-semibold mb-6 text-gray-900">
                            Materiales Necesarios
                          </h3>
                          <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-emerald-50 border-b border-gray-200">
                                <tr>
                                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                    Material
                                  </th>
                                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                                    Cantidad
                                  </th>
                                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                                    Unidad
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {results.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                      {item.name}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm font-medium text-emerald-600">
                                      {item.qty}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                                      {item.unit}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CTA Section */}
              {results && (
                <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
                  <CardContent className="pt-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold text-gray-900">
                        ¿Listo para tu proyecto?
                      </h3>
                      <p className="text-gray-700">
                        Conecta con ferreterías locales para obtener cotizaciones de los materiales que necesitas.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          onClick={handleWhatsAppClick}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          📱 Cotizar por WhatsApp
                        </Button>
                        <Button
                          onClick={handleRegistroClick}
                          variant="outline"
                          className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                        >
                          🏪 ¿Eres ferretería?
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </section>

        {/* Info Section */}
        <section className="bg-white py-16 px-4 border-t border-gray-200">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Cómo funciona
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-emerald-600 mb-4">1️⃣</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Elige tu proyecto</h3>
                  <p className="text-gray-600">
                    Selecciona el tipo de material o construcción que necesitas calcular.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-emerald-600 mb-4">2️⃣</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingresa medidas</h3>
                  <p className="text-gray-600">
                    Proporciona las dimensiones de tu proyecto en metros.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold text-emerald-600 mb-4">3️⃣</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Obtén cotizaciones</h3>
                  <p className="text-gray-600">
                    Conecta con ferreterías para obtener precios y disponibilidad.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-lg font-bold text-white mb-2">CotizaBot</p>
          <p className="text-sm">Automatiza las cotizaciones de tu negocio por WhatsApp</p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Link to="/privacidad" className="hover:text-white">Privacidad</Link>
            <Link to="/terminos" className="hover:text-white">Términos</Link>
            <Link to="/precios" className="hover:text-white">Precios</Link>
          </div>
          <p className="text-xs mt-6">© {new Date().getFullYear()} CotizaExpress. Todos los derechos reservados.</p>
        </div>
      </footer>
    </>
  );
};

export default Calculadoras;
