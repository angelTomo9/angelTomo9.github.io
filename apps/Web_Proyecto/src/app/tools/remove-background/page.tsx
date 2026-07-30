"use client";

import { useState } from "react";
import styles from "./page.module.css";
import Link from "next/link";

export default function RemoveBackgroundTool() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleProcess = () => {
    setIsProcessing(true);
    // Simulate processing time
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
    }, 3000);
  };

  return (
    <div className={styles.container}>
      <Link href="/" className={styles.backLink}>
        &larr; Volver a herramientas
      </Link>
      
      <header className={styles.header}>
        <div className={styles.iconWrapper}>✨</div>
        <h1 className={styles.title}>Quitar Fondos</h1>
        <p className={styles.subtitle}>
          Elimina el fondo de cualquier imagen de forma automática usando Inteligencia Artificial.
        </p>
      </header>

      <main className={styles.workspace}>
        <div className={`${styles.dropzone} glass`}>
          {!isProcessing && !isDone && (
            <div className={styles.uploadArea}>
              <div className={styles.uploadIcon}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 16V8M12 8L8 12M12 8L16 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 16C4 18.2091 5.79086 20 8 20H16C18.2091 20 20 18.2091 20 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Arrastra una imagen aquí</h3>
              <p>O haz clic para seleccionar un archivo (JPG, PNG, WebP)</p>
              <button className={styles.primaryBtn} onClick={handleProcess}>
                Seleccionar Imagen (Simular)
              </button>
            </div>
          )}

          {isProcessing && (
            <div className={styles.processingArea}>
              <div className={styles.spinner}></div>
              <h3>Procesando imagen con IA...</h3>
              <p>Detectando sujetos y eliminando el fondo de forma mágica.</p>
              <div className={styles.progressBar}>
                <div className={styles.progressFill}></div>
              </div>
            </div>
          )}

          {isDone && (
            <div className={styles.resultArea}>
              <div className={styles.successIcon}>✓</div>
              <h3>¡Fondo eliminado con éxito!</h3>
              <div className={styles.actions}>
                <button className={styles.primaryBtn}>Descargar HD</button>
                <button className={styles.secondaryBtn} onClick={() => setIsDone(false)}>Procesar otra imagen</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
