// ESTADO GLOBAL DE LA APLICACIÓN
// Estructura de datos estricta solicitada para participantes
const participantes = [
    {
      id: 1,
      nombre: "Sergiales",
      apodo: "Zurullete",
      seleccionPeor: "Haití",
      foto: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sergio", 
      stats: { nacimiento: "11-06-2026", altura: "1.74m", peso: "65kg", equipo: "Zurullos FC" },
      predicciones: { 
        maxGoleador: "Mbappé", 
        campeon: "España", 
        subcampeon: "Francia",
        // ID_PARTIDO: { home: goles, away: goles }
        "p1": { home: 3, away: 0 }, // J1
        "p2": { home: 1, away: 1 }, // J1
        "p3": { home: 2, away: 0 }, // J2
        "p4": { home: 0, away: 2 }  // J2
      },
      puntos: 24 // Puntos calculados iniciales (se sobreescriben por JS)
    },
    {
      id: 2,
      nombre: "Ángel",
      apodo: "El Míster",
      seleccionPeor: "Uzbekistán",
      foto: "https://api.dicebear.com/9.x/avataaars/svg?seed=Angel", 
      stats: { nacimiento: "15-05-1998", altura: "1.80m", peso: "75kg", equipo: "Ángel FC" },
      predicciones: { 
        maxGoleador: "Morata", 
        campeon: "Brasil", 
        subcampeon: "Alemania",
        "p1": { home: 3, away: 0 }, 
        "p2": { home: 2, away: 1 },
        "p3": { home: 1, away: 1 },
        "p4": { home: 1, away: 3 }
      },
      puntos: 0
    }
  ];
  
  // Base de datos de partidos estructurada por Jornadas/Grupos
  const partidos = [
    {
      id: "p1",
      jornada: "J1 Fase de Grupos",
      equipoLocal: "España", banderaLocal: "🇪🇸",
      equipoVisitante: "Cabo Verde", banderaVisitante: "🇨🇻",
      fechaIso: "2026-06-10T16:00:00Z", // Ya ha pasado
      resultadoReal: { home: 3, away: 0 }, // Acierto perfecto para ambos
      finalizado: true
    },
    {
      id: "p2",
      jornada: "J1 Fase de Grupos",
      equipoLocal: "Brasil", banderaLocal: "🇧🇷",
      equipoVisitante: "Haití", banderaVisitante: "🇭🇹",
      fechaIso: "2026-06-10T20:00:00Z", // Ya ha pasado
      resultadoReal: { home: 4, away: 1 }, // Acierto de tendencia para Sergiales (puso 1-1 = Error), Ángel puso 2-1 (Tendencia)
      finalizado: true
    },
    {
      id: "p3",
      jornada: "J2 Fase de Grupos",
      equipoLocal: "Francia", banderaLocal: "🇫🇷",
      equipoVisitante: "Inglaterra", banderaVisitante: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      fechaIso: new Date(Date.now() + 3600000).toISOString(), // Futuro (1h)
      resultadoReal: null,
      finalizado: false
    },
    {
      id: "p4",
      jornada: "J2 Fase de Grupos",
      equipoLocal: "Argentina", banderaLocal: "🇦🇷",
      equipoVisitante: "Alemania", banderaVisitante: "🇩🇪",
      fechaIso: new Date(Date.now() + 86400000).toISOString(), // Futuro (Mañana)
      resultadoReal: null,
      finalizado: false
    }
  ];
  
  const reglas = {
    aciertoPerfecto: 3,
    tendencia: 1,
    error: 0,
    campeon: 10,
    subcampeon: 5,
    goleador: 5,
    peorEquipoGolFavor: 1,
    peorEquipoGolesContra3: 1
  };
