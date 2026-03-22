import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Globe,
  Code,
  ShoppingBag,
  Layout,
  Smartphone,
  FileCode,
  ExternalLink,
  Terminal,
  Layers,
  BookOpen,
} from "lucide-react";
import { SiWordpress, SiShopify, SiWoocommerce, SiMagento, SiSquarespace, SiWix, SiWebflow, SiReact, SiNextdotjs, SiVuedotjs, SiAngular, SiHtml5, SiGodaddy } from "react-icons/si";
import { NexiaIcon } from "@/components/NexiaLogo";

const WIDGET_BASE_URL = window.location.origin;

const EMBED_SCRIPT = `<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.id = 'nexia-widget';
    iframe.src = '${WIDGET_BASE_URL}/widget?tenantId=TU_TENANT_ID';
    iframe.allow = 'microphone';
    var pos = 'right';
    function setPos(p, state, w, h) {
      var s = p === 'left' ? 'left' : 'right';
      var o = p === 'left' ? 'right' : 'left';
      var mobile = window.innerWidth <= 480;
      if (state === 'open') {
        if (mobile) {
          iframe.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;height:100%;border:none;z-index:9999;';
        } else {
          iframe.style.cssText = 'position:fixed;bottom:16px;' + s + ':16px;' + o + ':auto;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);';
        }
      } else {
        var cw = (w || 70) + 'px';
        var ch = (h || 70) + 'px';
        iframe.style.cssText = 'position:fixed;bottom:12px;' + s + ':12px;' + o + ':auto;width:' + cw + ';height:' + ch + ';border:none;z-index:9999;';
      }
    }
    setPos(pos, 'closed');
    document.body.appendChild(iframe);
    window.addEventListener('message', function(e) {
      if (!e.data || !e.data.type) return;
      if (e.data.position) pos = e.data.position;
      if (e.data.type === 'nexia_position') { pos = e.data.position; setPos(pos, 'closed'); }
      if (e.data.type === 'open_chat') setPos(pos, 'open');
      if (e.data.type === 'close_chat') setPos(pos, 'closed', e.data.width, e.data.height);
    });
  })();
</script>`;

function CopyBlock({ code, language = "html" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.02]" data-testid="code-block">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="text-[10px] font-mono text-white/30 uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200 bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white/80"
          data-testid="button-copy-code"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copiado!" : "Copiar"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-white/70">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface Guide {
  id: string;
  name: string;
  icon: any;
  iconColor: string;
  category: "ecommerce" | "cms" | "builder" | "framework" | "other";
  difficulty: "fácil" | "medio";
  steps: { title: string; description: string; code?: string; codeLanguage?: string; note?: string }[];
}

const guides: Guide[] = [
  {
    id: "html",
    name: "HTML / Sitio Estatico",
    icon: SiHtml5,
    iconColor: "#e34f26",
    category: "other",
    difficulty: "fácil",
    steps: [
      {
        title: "Copia el código de instalación",
        description: "Agrega este script justo antes de la etiqueta </body> en tu archivo HTML.",
        code: EMBED_SCRIPT,
        codeLanguage: "html",
      },
      {
        title: "Reemplaza TU_TENANT_ID",
        description: "Cambia TU_TENANT_ID por el ID de tu cuenta. Lo encuentras en tu Dashboard > Integración.",
        note: "Si no tienes cuenta aun, registrate gratis en foxbot.cl para obtener tu ID.",
      },
      {
        title: "Sube los cambios",
        description: "Guarda el archivo y sube los cambios a tu servidor. El chatbot aparecerá automáticamente en la esquina inferior derecha.",
      },
    ],
  },
  {
    id: "wordpress",
    name: "WordPress",
    icon: SiWordpress,
    iconColor: "#21759b",
    category: "cms",
    difficulty: "fácil",
    steps: [
      {
        title: "Ve a Apariencia > Editor de temas",
        description: "En tu panel de WordPress, navega a Apariencia > Editor de temas (o usa un plugin como 'Insert Headers and Footers').",
      },
      {
        title: "Abre el archivo footer.php",
        description: "Selecciona el archivo footer.php en el editor de temas.",
      },
      {
        title: "Pega el código antes de </body>",
        description: "Agrega el siguiente código justo antes de la línea <?php wp_footer(); ?> o antes de </body>:",
        code: EMBED_SCRIPT,
        codeLanguage: "html",
      },
      {
        title: "Guarda los cambios",
        description: "Haz clic en 'Actualizar archivo'. El chatbot aparecerá en todas las paginas de tu WordPress.",
        note: "Alternativa: Usa el plugin 'WPCode' para insertar el script sin editar archivos del tema.",
      },
    ],
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    icon: SiWoocommerce,
    iconColor: "#96588a",
    category: "ecommerce",
    difficulty: "fácil",
    steps: [
      {
        title: "Instala igual que WordPress",
        description: "WooCommerce funciona sobre WordPress, así que el proceso es idéntico. Ve a Apariencia > Editor de temas.",
      },
      {
        title: "Agrega el script en footer.php",
        description: "Pega este código antes de </body>:",
        code: EMBED_SCRIPT,
        codeLanguage: "html",
      },
      {
        title: "Conecta tu catálogo (opcional)",
        description: "Para que el bot muestre productos de tu tienda, ve a tu Dashboard de Nexia AI > Integración y conecta tu API de WooCommerce con las credenciales de tu tienda.",
        note: "Necesitas las claves de API de WooCommerce: ve a WooCommerce > Ajustes > Avanzado > API REST para generarlas.",
      },
    ],
  },
  {
    id: "shopify",
    name: "Shopify",
    icon: SiShopify,
    iconColor: "#95bf47",
    category: "ecommerce",
    difficulty: "fácil",
    steps: [
      {
        title: "Ve a Tienda Online > Temas",
        description: "En tu panel de Shopify, navega a Tienda Online > Temas y haz clic en 'Editar código' en tu tema activo.",
      },
      {
        title: "Abre theme.liquid",
        description: "En el editor de código, busca y abre el archivo Layout > theme.liquid.",
      },
      {
        title: "Pega el código antes de </body>",
        description: "Agrega este script justo antes de la etiqueta </body>:",
        code: EMBED_SCRIPT,
        codeLanguage: "html",
      },
      {
        title: "Guarda y publica",
        description: "Haz clic en 'Guardar'. El chatbot aparecerá en tu tienda Shopify inmediatamente.",
      },
    ],
  },
  {
    id: "magento",
    name: "Magento",
    icon: SiMagento,
    iconColor: "#f46f25",
    category: "ecommerce",
    difficulty: "medio",
    steps: [
      {
        title: "Accede al panel de administración",
        description: "Ve a Content > Design > Configuration en tu panel de Magento.",
      },
      {
        title: "Edita el tema predeterminado",
        description: "Selecciona tu Store View y haz clic en 'Edit'. Ve a la sección 'HTML Head' o 'Footer'.",
      },
      {
        title: "Agrega el script en 'Miscellaneous Scripts'",
        description: "Pega el siguiente código en el campo 'Scripts and Style Sheets' o 'Miscellaneous HTML':",
        code: EMBED_SCRIPT,
        codeLanguage: "html",
      },
      {
        title: "Limpia la cache",
        description: "Ve a System > Cache Management y limpia la cache. El chatbot aparecerá en tu tienda.",
      },
    ],
  },
  {
    id: "squarespace",
    name: "Squarespace",
    icon: SiSquarespace,
    iconColor: "#ffffff",
    category: "builder",
    difficulty: "fácil",
    steps: [
      {
        title: "Ve a Configuración > Avanzado",
        description: "En tu panel de Squarespace, navega a Configuración > Avanzado > Inyeccion de código.",
      },
      {
        title: "Pega en el campo 'Footer'",
        description: "En la sección 'Footer', pega el siguiente código:",
        code: EMBED_SCRIPT,
        codeLanguage: "html",
      },
      {
        title: "Guarda los cambios",
        description: "Haz clic en 'Guardar'. El chatbot estará disponible en todas las paginas de tu sitio.",
        note: "La inyeccion de código requiere un plan Business o superior en Squarespace.",
      },
    ],
  },
  {
    id: "wix",
    name: "Wix",
    icon: SiWix,
    iconColor: "#0c6efc",
    category: "builder",
    difficulty: "fácil",
    steps: [
      {
        title: "Ve al editor de Wix",
        description: "Abre tu sitio en el editor de Wix.",
      },
      {
        title: "Agrega un Embed HTML",
        description: "Haz clic en Agregar (+) > Embeds > HTML embebido. Arrastralo a cualquier parte de tu página.",
      },
      {
        title: "Pega el código del widget",
        description: "Haz clic en 'Introducir código' y pega lo siguiente:",
        code: EMBED_SCRIPT,
        codeLanguage: "html",
      },
      {
        title: "Publica tu sitio",
        description: "Haz clic en 'Publicar' para que los cambios se apliquen en tu sitio en vivo.",
        note: "En Wix, el embed HTML se muestra como un elemento flotante. Ajusta su posicion si es necesario.",
      },
    ],
  },
  {
    id: "webflow",
    name: "Webflow",
    icon: SiWebflow,
    iconColor: "#4353ff",
    category: "builder",
    difficulty: "fácil",
    steps: [
      {
        title: "Ve a Project Settings",
        description: "En tu proyecto de Webflow, ve a Project Settings > Custom Code.",
      },
      {
        title: "Pega en Footer Code",
        description: "En la sección 'Footer Code', pega el siguiente script:",
        code: EMBED_SCRIPT,
        codeLanguage: "html",
      },
      {
        title: "Publica el sitio",
        description: "Haz clic en 'Publish'. El chatbot aparecerá en todas las paginas del sitio publicado.",
        note: "El código personalizado solo funciona en sitios publicados, no en el editor de Webflow.",
      },
    ],
  },
  {
    id: "react",
    name: "React / Vite",
    icon: SiReact,
    iconColor: "#61dafb",
    category: "framework",
    difficulty: "medio",
    steps: [
      {
        title: "Crea el componente NexiaWidget",
        description: "Crea un nuevo archivo en tu proyecto React:",
        code: "// src/components/NexiaWidget.jsx\nimport { useEffect } from 'react';\n\nexport default function NexiaWidget({ tenantId }) {\n  useEffect(() => {\n    const iframe = document.createElement('iframe');\n    iframe.src = `" + WIDGET_BASE_URL + "/widget?tenantId=${tenantId}`;\n    iframe.allow = 'microphone';\n    iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:80px;height:80px;border:none;z-index:9999;';\n    document.body.appendChild(iframe);\n    const handler = (e) => {\n      if (!e.data || !e.data.type) return;\n      const mobile = window.innerWidth <= 480;\n      if (e.data.type === 'open_chat') {\n        iframe.style.cssText = mobile\n          ? 'position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:9999;'\n          : 'position:fixed;bottom:20px;right:20px;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);';\n      } else if (e.data.type === 'close_chat') {\n        iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:80px;height:80px;border:none;z-index:9999;';\n      }\n    };\n    window.addEventListener('message', handler);\n    return () => { window.removeEventListener('message', handler); iframe.remove(); };\n  }, [tenantId]);\n  return null;\n}",
        codeLanguage: "jsx",
      },
      {
        title: "Agrega el componente en tu App",
        description: "Importa y usa el componente en tu App.jsx o layout principal:",
        code: `import NexiaWidget from './components/NexiaWidget';\n\nfunction App() {\n  return (\n    <div>\n      {/* Tu aplicación */}\n      <NexiaWidget tenantId="TU_TENANT_ID" />\n    </div>\n  );\n}`,
        codeLanguage: "jsx",
      },
    ],
  },
  {
    id: "nextjs",
    name: "Next.js",
    icon: SiNextdotjs,
    iconColor: "#ffffff",
    category: "framework",
    difficulty: "medio",
    steps: [
      {
        title: "Crea el componente con 'use client'",
        description: "Crea un archivo de componente client-side:",
        code: "// components/NexiaWidget.tsx\n'use client';\nimport { useEffect } from 'react';\n\nexport default function NexiaWidget({ tenantId }: { tenantId: string }) {\n  useEffect(() => {\n    const iframe = document.createElement('iframe');\n    iframe.src = `" + WIDGET_BASE_URL + "/widget?tenantId=${tenantId}`;\n    iframe.allow = 'microphone';\n    iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:80px;height:80px;border:none;z-index:9999;';\n    document.body.appendChild(iframe);\n    const handler = (e: MessageEvent) => {\n      if (!e.data || !e.data.type) return;\n      const mobile = window.innerWidth <= 480;\n      if (e.data.type === 'open_chat') {\n        iframe.style.cssText = mobile\n          ? 'position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:9999;'\n          : 'position:fixed;bottom:20px;right:20px;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);';\n      } else if (e.data.type === 'close_chat') {\n        iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:80px;height:80px;border:none;z-index:9999;';\n      }\n    };\n    window.addEventListener('message', handler);\n    return () => { window.removeEventListener('message', handler); iframe.remove(); };\n  }, [tenantId]);\n  return null;\n}",
        codeLanguage: "tsx",
      },
      {
        title: "Agregalo en tu layout.tsx",
        description: "Importa el widget en tu layout principal o en la página que quieras:",
        code: `// app/layout.tsx\nimport NexiaWidget from '@/components/NexiaWidget';\n\nexport default function RootLayout({ children }) {\n  return (\n    <html>\n      <body>\n        {children}\n        <NexiaWidget tenantId="TU_TENANT_ID" />\n      </body>\n    </html>\n  );\n}`,
        codeLanguage: "tsx",
      },
    ],
  },
  {
    id: "vue",
    name: "Vue.js / Nuxt",
    icon: SiVuedotjs,
    iconColor: "#4fc08d",
    category: "framework",
    difficulty: "medio",
    steps: [
      {
        title: "Crea el componente NexiaWidget.vue",
        description: "Crea un nuevo componente Vue:",
        code: "<!-- components/NexiaWidget.vue -->\n<template>\n  <div></div>\n</template>\n\n<script setup>\nimport { onMounted, onUnmounted } from 'vue';\n\nconst props = defineProps({ tenantId: String });\nlet iframe;\nlet handler;\n\nonMounted(() => {\n  iframe = document.createElement('iframe');\n  iframe.src = `" + WIDGET_BASE_URL + "/widget?tenantId=${props.tenantId}`;\n  iframe.allow = 'microphone';\n  iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:80px;height:80px;border:none;z-index:9999;';\n  document.body.appendChild(iframe);\n  handler = (e) => {\n    if (!e.data || !e.data.type) return;\n    const mobile = window.innerWidth <= 480;\n    if (e.data.type === 'open_chat') {\n      iframe.style.cssText = mobile\n        ? 'position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:9999;'\n        : 'position:fixed;bottom:20px;right:20px;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);';\n    } else if (e.data.type === 'close_chat') {\n      iframe.style.cssText = 'position:fixed;bottom:20px;right:20px;width:80px;height:80px;border:none;z-index:9999;';\n    }\n  };\n  window.addEventListener('message', handler);\n});\n\nonUnmounted(() => {\n  window.removeEventListener('message', handler);\n  if (iframe) iframe.remove();\n});\n</script>",
        codeLanguage: "vue",
      },
      {
        title: "Usa el componente en tu App",
        description: "Agregalo en tu App.vue o layout principal:",
        code: `<template>\n  <div>\n    <!-- Tu aplicación -->\n    <NexiaWidget tenantId="TU_TENANT_ID" />\n  </div>\n</template>\n\n<script setup>\nimport NexiaWidget from './components/NexiaWidget.vue';\n</script>`,
        codeLanguage: "vue",
      },
    ],
  },
  {
    id: "angular",
    name: "Angular",
    icon: SiAngular,
    iconColor: "#dd0031",
    category: "framework",
    difficulty: "medio",
    steps: [
      {
        title: "Agrega el script en index.html",
        description: "La forma más simple es agregar el script directamente en src/index.html antes de </body>:",
        code: EMBED_SCRIPT,
        codeLanguage: "html",
      },
      {
        title: "Alternativa: Usa un componente",
        description: "Para más control, crea un componente Angular que inyecte el iframe usando Renderer2 en ngOnInit y lo remueva en ngOnDestroy.",
      },
    ],
  },
  {
    id: "gtm",
    name: "Google Tag Manager",
    icon: Globe,
    iconColor: "#4285f4",
    category: "other",
    difficulty: "fácil",
    steps: [
      {
        title: "Crea una nueva etiqueta",
        description: "En tu contenedor de GTM, haz clic en 'Nueva etiqueta' > Tipo: HTML personalizado.",
      },
      {
        title: "Pega el script",
        description: "En el campo HTML, pega el siguiente código:",
        code: EMBED_SCRIPT,
        codeLanguage: "html",
      },
      {
        title: "Configura el activador",
        description: "En 'Activacion', selecciona 'Todas las paginas' (o las paginas donde quieras el chat).",
      },
      {
        title: "Publica el contenedor",
        description: "Guarda la etiqueta y haz clic en 'Enviar' para publicar los cambios en GTM.",
      },
    ],
  },
  {
    id: "prestashop",
    name: "PrestaShop",
    icon: ShoppingBag,
    iconColor: "#df0067",
    category: "ecommerce",
    difficulty: "fácil",
    steps: [
      {
        title: "Ve a Diseño > Posiciones",
        description: "En tu panel de PrestaShop, navega a Diseño > Posiciones.",
      },
      {
        title: "Conecta un modulo al hook 'displayFooter'",
        description: "Busca el hook 'displayFooter' o usa el modulo 'Custom text blocks' para insertar HTML personalizado.",
      },
      {
        title: "Pega el código del widget",
        description: "Inserta el siguiente script:",
        code: EMBED_SCRIPT,
        codeLanguage: "html",
      },
      {
        title: "Limpia la cache del tema",
        description: "Ve a Rendimiento > Limpiar cache y recarga tu sitio.",
      },
    ],
  },
  {
    id: "iframe",
    name: "iFrame Directo",
    icon: Layout,
    iconColor: "#8b5cf6",
    category: "other",
    difficulty: "fácil",
    steps: [
      {
        title: "Usa el iframe con postMessage",
        description: "Inserta el iframe y el script para que el widget se abra y cierre automáticamente:",
        code: `<iframe\n  id="nexia-widget"\n  src="${WIDGET_BASE_URL}/widget?tenantId=TU_TENANT_ID"\n  style="position:fixed;bottom:20px;right:20px;width:80px;height:80px;border:none;z-index:9999;"\n  allow="microphone"\n></iframe>\n<script>\n  window.addEventListener('message', function(e) {\n    var f = document.getElementById('nexia-widget');\n    if (!f || !e.data || !e.data.type) return;\n    var mobile = window.innerWidth <= 480;\n    if (e.data.type === 'open_chat') {\n      f.style.cssText = mobile\n        ? 'position:fixed;bottom:0;right:0;width:100%;height:100%;border:none;z-index:9999;'\n        : 'position:fixed;bottom:20px;right:20px;width:400px;height:620px;border:none;z-index:9999;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.3);';\n    } else if (e.data.type === 'close_chat') {\n      f.style.cssText = 'position:fixed;bottom:20px;right:20px;width:80px;height:80px;border:none;z-index:9999;';\n    }\n  });\n</script>`,
        codeLanguage: "html",
      },
      {
        title: "Coloca antes de </body>",
        description: "Pega el código justo antes de la etiqueta de cierre </body> en tu página.",
        note: "Este método es más simple pero no permite ocultar/mostrar el widget dinamicamente.",
      },
    ],
  },
];

const categories = [
  { id: "all", label: "Todos", icon: Globe },
  { id: "ecommerce", label: "E-commerce", icon: ShoppingBag },
  { id: "cms", label: "CMS", icon: FileCode },
  { id: "builder", label: "Constructores", icon: Layout },
  { id: "framework", label: "Frameworks", icon: Code },
  { id: "other", label: "Otros", icon: Terminal },
] as const;

export function GuidesPanel() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = guides.filter((g) => {
    const matchCategory = activeCategory === "all" || g.category === activeCategory;
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6" data-testid="guides-panel">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white/90 mb-1" data-testid="text-guides-panel-title">Guías de Instalación</h2>
          <p className="text-sm text-white/40">Manuales paso a paso para integrar tu chatbot en cualquier plataforma.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
          <div className="relative flex-1 w-full max-w-md">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar plataforma..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-[#BB86FC]/30 transition-all duration-300 placeholder:text-white/20"
              data-testid="input-search-guides-panel"
            />
            <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-[#BB86FC]/15 text-[#BB86FC] border border-[#BB86FC]/25"
                  : "bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-white/60"
              }`}
              data-testid={`button-panel-category-${cat.id}`}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-white/30 text-sm" data-testid="text-panel-no-results">No se encontraron guías para "{search}"</p>
            </div>
          )}
          {filtered.map((guide) => {
            const isExpanded = expandedGuide === guide.id;
            const Icon = guide.icon;
            return (
              <div key={guide.id} className="rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.02] transition-all duration-300" data-testid={`card-panel-guide-${guide.id}`}>
                <button
                  onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                  className="w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.02]"
                  data-testid={`button-panel-expand-${guide.id}`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${guide.iconColor}15` }}>
                    <Icon className="w-4 h-4" style={{ color: guide.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white/90">{guide.name}</h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                        guide.difficulty === "fácil"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-amber-500/15 text-amber-400"
                      }`}>
                        {guide.difficulty === "fácil" ? "Fácil" : "Medio"}
                      </span>
                    </div>
                    <p className="text-xs text-white/30 mt-0.5">{guide.steps.length} pasos</p>
                  </div>
                  <div className="shrink-0 transition-transform duration-300" style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                    <ChevronRight className="w-4 h-4 text-white/20" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-5 pt-0 border-t border-white/[0.04]">
                    <div className="mt-4 space-y-5">
                      {guide.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex gap-3" data-testid={`step-panel-${guide.id}-${stepIndex}`}>
                          <div className="flex flex-col items-center shrink-0">
                            <div className="w-7 h-7 rounded-full bg-[#BB86FC]/10 flex items-center justify-center text-xs font-bold text-[#BB86FC]">
                              {stepIndex + 1}
                            </div>
                            {stepIndex < guide.steps.length - 1 && (
                              <div className="w-px flex-1 bg-white/[0.06] mt-2" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pb-2">
                            <h4 className="text-sm font-bold text-white/80 mb-1">{step.title}</h4>
                            <p className="text-xs text-white/40 leading-relaxed mb-3">{step.description}</p>
                            {step.code && (
                              <CopyBlock code={step.code} language={step.codeLanguage || "html"} />
                            )}
                            {step.note && (
                              <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                                <Layers className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                                <p className="text-[11px] text-amber-300/70 leading-relaxed">{step.note}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Guides() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = guides.filter((g) => {
    const matchCategory = activeCategory === "all" || g.category === activeCategory;
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="guides-page">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full animate-orb-drift" style={{ background: "radial-gradient(circle, hsl(142, 72%, 40%, 0.06) 0%, transparent 60%)" }} />
      </div>

      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/60 backdrop-blur-xl" data-testid="nav-guides">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2 text-white/30 hover:text-primary transition-colors" data-testid="link-back-home">
              <ArrowLeft className="w-4 h-4" />
            </a>
            <NexiaIcon className="w-8 h-8" />
            <span className="text-lg font-extrabold text-white">Nexia AI</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold tracking-wider">GUIAS</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/register">
              <Button size="sm" className="rounded-xl font-bold" data-testid="button-guides-register">
                Prueba Gratis
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <section className="relative py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide">GUIAS DE INSTALACION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5" data-testid="text-guides-title">
              Instala Nexia AI en
              <br />
              <span className="text-gradient-green">cualquier plataforma</span>
            </h1>
            <p className="text-white/40 text-lg max-w-2xl mx-auto leading-relaxed" data-testid="text-guides-description">
              Manuales paso a paso para integrar tu chatbot con IA en tu sitio web, tienda online o aplicación.
              Copia, pega y listo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
            <div className="relative flex-1 w-full max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar plataforma..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-primary/30 transition-all duration-300 placeholder:text-white/20"
                data-testid="input-search-guides"
              />
              <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mb-10">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat.id
                    ? "bg-primary/15 text-primary border border-primary/25"
                    : "glass-card text-white/40 hover:text-white/60"
                }`}
                data-testid={`button-category-${cat.id}`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-white/30 text-lg" data-testid="text-no-results">No se encontraron guías para "{search}"</p>
              </div>
            )}
            {filtered.map((guide) => {
              const isExpanded = expandedGuide === guide.id;
              const Icon = guide.icon;
              return (
                <div key={guide.id} className="rounded-2xl glass-card overflow-hidden transition-all duration-300" data-testid={`card-guide-${guide.id}`}>
                  <button
                    onClick={() => setExpandedGuide(isExpanded ? null : guide.id)}
                    className="w-full flex items-center gap-4 p-5 text-left transition-colors hover:bg-white/[0.02]"
                    data-testid={`button-expand-${guide.id}`}
                  >
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${guide.iconColor}15` }}>
                      <Icon className="w-5 h-5" style={{ color: guide.iconColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white/90" data-testid={`text-guide-name-${guide.id}`}>{guide.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          guide.difficulty === "fácil"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-amber-500/15 text-amber-400"
                        }`} data-testid={`badge-difficulty-${guide.id}`}>
                          {guide.difficulty === "fácil" ? "Fácil" : "Medio"}
                        </span>
                      </div>
                      <p className="text-sm text-white/30 mt-0.5">{guide.steps.length} pasos</p>
                    </div>
                    <div className="shrink-0 transition-transform duration-300" style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}>
                      <ChevronRight className="w-5 h-5 text-white/20" />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-6 pt-0 border-t border-white/[0.04]">
                      <div className="mt-5 space-y-6">
                        {guide.steps.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex gap-4" data-testid={`step-${guide.id}-${stepIndex}`}>
                            <div className="flex flex-col items-center shrink-0">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {stepIndex + 1}
                              </div>
                              {stepIndex < guide.steps.length - 1 && (
                                <div className="w-px flex-1 bg-white/[0.06] mt-2" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pb-2">
                              <h4 className="text-sm font-bold text-white/80 mb-1.5">{step.title}</h4>
                              <p className="text-sm text-white/40 leading-relaxed mb-3">{step.description}</p>
                              {step.code && (
                                <CopyBlock code={step.code} language={step.codeLanguage || "html"} />
                              )}
                              {step.note && (
                                <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                  <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                  <p className="text-[12px] text-amber-300/70 leading-relaxed">{step.note}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-16 rounded-2xl glass-card p-8 text-center" data-testid="section-help">
            <h3 className="text-xl font-bold mb-3" data-testid="text-help-title">Tu plataforma no esta en la lista?</h3>
            <p className="text-white/40 text-sm mb-6 max-w-lg mx-auto leading-relaxed">
              Nexia AI funciona con cualquier sitio web que permita agregar HTML o JavaScript.
              El proceso es siempre el mismo: copia el script y pegalo antes de &lt;/body&gt;.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a href="/register">
                <Button className="rounded-xl font-bold" data-testid="button-help-register">
                  Registrate y prueba gratis
                </Button>
              </a>
              <a href="/demo">
                <Button variant="outline" className="rounded-xl border-white/10" data-testid="button-help-demo">
                  Ver demo en vivo
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.04] py-8 px-4 text-center" data-testid="footer-guides">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <NexiaIcon className="w-8 h-8" />
          <span className="text-lg font-extrabold text-white">Nexia AI</span>
        </div>
        <p className="text-xs text-white/20">&copy; {new Date().getFullYear()} Nexia AI by Web Maker Chile. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
