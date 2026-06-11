// Base de datos local mockeada para la Porra Mundial V2

const tournamentData = {
    teams: {
        ESP: { name: 'España', flag: '🇪🇸' },
        BRA: { name: 'Brasil', flag: '🇧🇷' },
        FRA: { name: 'Francia', flag: '🇫🇷' },
        ARG: { name: 'Argentina', flag: '🇦🇷' },
        GER: { name: 'Alemania', flag: '🇩🇪' },
        ENG: { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
        POR: { name: 'Portugal', flag: '🇵🇹' },
        HAI: { name: 'Haití', flag: '🇭🇹' }, // Peor equipo
        UZB: { name: 'Uzbekistán', flag: '🇺🇿' }, // Peor equipo
        CPV: { name: 'Cabo Verde', flag: '🇨🇻' } // Peor equipo
    },
    users: [
        {
            id: 'user_1',
            name: 'Ángel',
            avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Angel',
            panini: {
                alias: 'El Míster',
                height: '1.80m',
                weight: '75kg',
                dob: '15/05/1998'
            },
            bonuses: {
                champion: 'ESP',
                subChampion: 'FRA',
                topScorer: 'Morata',
                worstTeam: 'HAI' // Haití asignado como peor equipo
            }
        },
        {
            id: 'user_2',
            name: 'Sergio',
            avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sergio',
            panini: {
                alias: 'Zurullete',
                height: '1.74m',
                weight: '65kg',
                dob: '11/06/2026' // Fecha del mundial
            },
            bonuses: {
                champion: 'BRA',
                subChampion: 'GER',
                topScorer: 'Mbappé',
                worstTeam: 'UZB'
            }
        }
    ],
    matches: [
        {
            id: 'm1',
            homeTeam: 'ESP',
            awayTeam: 'CPV',
            // Partido en el pasado (Finalizado)
            datetime: '2026-06-10T16:00:00Z', 
            status: 'FINISHED',
            homeScore: 3,
            awayScore: 0
        },
        {
            id: 'm2',
            homeTeam: 'BRA',
            awayTeam: 'HAI',
            // Partido finalizado para probar la lógica de Peor Equipo
            // Haití metió 1 gol (+1pt) y recibió exactamente 3 goles (+1pt). Total 2pts para Ángel.
            datetime: '2026-06-10T20:00:00Z',
            status: 'FINISHED',
            homeScore: 3,
            awayScore: 1
        },
        {
            id: 'm3',
            homeTeam: 'FRA',
            awayTeam: 'ENG',
            // Partido en el futuro para probar el Countdown
            // Ponemos una fecha adelantada un poco al futuro respecto a hoy
            datetime: new Date(Date.now() + 3600000).toISOString(), // Dentro de 1 hora
            status: 'TIMED',
            homeScore: null,
            awayScore: null
        },
        {
            id: 'm4',
            homeTeam: 'ARG',
            awayTeam: 'GER',
            datetime: new Date(Date.now() + 86400000).toISOString(), // Mañana
            status: 'TIMED',
            homeScore: null,
            awayScore: null
        }
    ],
    predictions: {
        'user_1': {
            'm1': { homeScore: 3, awayScore: 0 }, // Acierto Perfecto (3 pts)
            'm2': { homeScore: 4, awayScore: 0 }, // Acierto Tendencia (1 pt)
            'm3': { homeScore: 2, awayScore: 1 },
            'm4': { homeScore: 1, awayScore: 1 }
        },
        'user_2': {
            'm1': { homeScore: 2, awayScore: 0 }, // Acierto Tendencia (1 pt)
            'm2': { homeScore: 1, awayScore: 1 }, // Error Total (0 pts)
            'm3': { homeScore: 0, awayScore: 2 },
            'm4': { homeScore: 2, awayScore: 0 }
        }
    },
    config: {
        points: {
            exact: 3,
            tendency: 1,
            fail: 0,
            champion: 10,
            subChampion: 5,
            topScorer: 5
        }
    }
};
