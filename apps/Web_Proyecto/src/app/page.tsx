import styles from "./page.module.css";
import Link from "next/link";

const toolCategories = [
  {
    id: "ia",
    title: "Inteligencia Artificial",
    description: "Potenciadas por modelos avanzados de IA",
    tools: [
      { id: "remove-background", name: "Quitar Fondos", desc: "Elimina el fondo de cualquier imagen de forma mágica", icon: "✨" },
      { id: "ai-detector", name: "Detector de IA", desc: "Identifica textos generados por Inteligencia Artificial", icon: "🤖" },
    ]
  },
  {
    id: "documentos",
    title: "Documentos y PDFs",
    description: "Edita, convierte y optimiza tus archivos",
    tools: [
      { id: "pdf-to-word", name: "PDF a Word", desc: "Convierte documentos PDF a formato editable", icon: "📄" },
      { id: "pdf-summarizer", name: "Resumidor de PDFs", desc: "Obtén los puntos clave de documentos largos", icon: "📑" },
      { id: "sign-pdf", name: "Firma de Documentos", desc: "Firma PDFs digitalmente de forma segura", icon: "✍️" },
    ]
  },
  {
    id: "imagen",
    title: "Imágenes y Multimedia",
    description: "Herramientas de conversión y edición gráfica",
    tools: [
      { id: "compress-image", name: "Comprimir Imágenes", desc: "Reduce el tamaño de tus fotos sin perder calidad", icon: "🗜️" },
      { id: "ocr-scanner", name: "OCR (Texto a Imagen)", desc: "Extrae texto de cualquier imagen escaneada", icon: "🔍" },
    ]
  },
  {
    id: "audio",
    title: "Audio y Voz",
    description: "Transcribe y genera voces",
    tools: [
      { id: "audio-to-text", name: "Audio a Texto", desc: "Transcribe audios a texto automáticamente", icon: "🎙️" },
      { id: "text-to-speech", name: "Texto a Voz", desc: "Convierte texto a voz natural con IA", icon: "🔊" },
    ]
  },
  {
    id: "utilidades",
    title: "Utilidades Web",
    description: "Pequeñas herramientas para el día a día",
    tools: [
      { id: "password-generator", name: "Generador de Contraseñas", desc: "Crea contraseñas ultra seguras", icon: "🔑" },
      { id: "qr-generator", name: "Generador de QR", desc: "Crea códigos QR personalizados al instante", icon: "📱" },
    ]
  }
];

export default function Home() {
  return (
    <div className={styles.container}>
      <section className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.badgeDot}></span>
          <span>Plataforma web con +10 herramientas gratuitas</span>
        </div>
        <h1 className={styles.title}>
          Tu <span className="text-gradient">SwissKnife</span> Digital
        </h1>
        <p className={styles.subtitle}>
          Todas las herramientas que necesitas en un solo lugar. Conversión, edición, inteligencia artificial y utilidades rápidas directamente desde tu navegador.
        </p>
      </section>

      <div className={styles.sectionsContainer}>
        {toolCategories.map((category) => (
          <section key={category.id} className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <h2 className={styles.categoryTitle}>{category.title}</h2>
              <p className={styles.categoryDesc}>{category.description}</p>
            </div>
            
            <div className={styles.grid}>
              {category.tools.map((tool) => (
                <Link href={`/tools/${tool.id}`} key={tool.id} className={`${styles.card} glass`}>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardIcon}>{tool.icon}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{tool.name}</h3>
                  <p className={styles.cardDesc}>{tool.desc}</p>
                  
                  <div className={styles.cardArrow}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
