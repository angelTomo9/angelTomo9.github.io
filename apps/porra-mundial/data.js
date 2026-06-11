// Configuración de los participantes y sus predicciones.
// Las predicciones de cada partido usan el ID del partido devuelto por la API.

const appData = {
    participants: [
        {
            id: 'angel',
            name: 'Ángel',
            avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Angel',
            bonuses: {
                champion: 'España', 
                subChampion: 'Francia', 
                topScorer: 'Morata', 
                worstTeam: 'Haití' 
            },
            predictions: {
                // Ejemplo de predicción: Partido ID 537369 (España - Cabo Verde)
                537369: { homeScore: 3, awayScore: 0 }
            }
        },
        {
            id: 'sergio',
            name: 'Sergio (Zurullete)',
            avatarUrl: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sergio',
            bonuses: {
                champion: 'Brasil',
                subChampion: 'Alemania',
                topScorer: 'Mbappé',
                worstTeam: 'Uzbekistán'
            },
            predictions: {
                537369: { homeScore: 1, awayScore: 1 }
            }
        }
    ],
    // Array con los IDs de los partidos que valen el doble 
    // (según el vídeo, los partidos de España y de sus rivales de grupo)
    doublePointsMatches: [
        537369 // Ejemplo: ID del España vs Cabo Verde
    ],
    rules: {
        exactMatch: 3,
        tendency: 1,
        fail: 0,
        champion: 10,
        subChampion: 5,
        topScorer: 5,
        worstTeamGoalReceived: 1
    }
};
