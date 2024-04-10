const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/last-updated', (req, res) => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const formattedTime = `${hours}:${minutes < 10 ? '0' : ''}${minutes}`;
  res.send(formattedTime);
});

app.get('/', (req, res) => {
  // Rendere il percorso del file HTML assoluto o adattarlo in base alla struttura del tuo progetto
  res.sendFile(path.join('index.html'));
});

// Dati di esempio per le statistiche globali
let globalStatistics = {
  todayVisits: 0,
  weekVisits: 0,
  monthVisits: 0,
};

app.get('/api/meteo', async (req, res) => {
    try {
      const url = 'https://www.protezionecivilecalabria.it/bollettino-meteo/ws/ws_last_mau.php';
      const response = await axios.get(url);
      const data = response.data;
  
      const todayData = data.oggi || {};
      const tomorrowData = data.domani || {};
  
      const colorMap = {
        0: 'Verde',
        1: 'Gialla',
        2: 'Arancione',
        3: 'Rossa',
      };
  
      const today = {
        date: new Date().toLocaleDateString('it-IT'),
        data: todayData,
      };
  
      const tomorrow = {
        date: (() => {
          const nextDay = new Date();
          nextDay.setDate(nextDay.getDate() + 1);
          return nextDay.toLocaleDateString('it-IT');
        })(),
        data: tomorrowData,
      };
  
      const todayColors = Object.values(today.data).map(value => colorMap[value] || 'Nessuna');
      const tomorrowColors = Object.values(tomorrow.data).map(value => colorMap[value] || 'Nessuna');
  
      const alertInfo = {
        today: {
          date: today.date,
          color: todayColors[6],
          description: today.data.testo || 'Nessuna Descrizione',
        },
        tomorrow: {
          date: tomorrow.date,
          color: tomorrowColors[6],
          description: tomorrow.data.testo || 'Nessuna Descrizione',
        },
      };
  
      if (req.query.day && req.query.day.toLowerCase() === 'today') {
        // Restituisci solo le informazioni per oggi se il parametro day è specificato
        res.json({ alertInfo: alertInfo.today });
      } else if (req.query.day && req.query.day.toLowerCase() === 'tomorrow') {
        // Restituisci solo le informazioni per domani se il parametro day è specificato come 'tomorrow'
        res.json({ alertInfo: alertInfo.tomorrow });
      } else {
        // Restituisci tutte le informazioni per entrambi i giorni
        res.json({ alertInfo });
      }
    } catch (error) {
      console.error('Errore nella richiesta API:', error.message);
      res.status(500).json({ error: 'Errore nella richiesta API' });
    }
  });



  app.post('/api/update-global-statistics', (req, res) => {
    const { duration, count } = req.body; // Modificato da req.query a req.body
    // Effettua l'aggiornamento delle statistiche globali sul lato server
    // Aggiorna globalStatistics in base alle tue esigenze
    globalStatistics[`${duration.toLowerCase()}Visits`] = count;
    res.json({ success: true });
  });
  

// Endpoint per ottenere le statistiche globali
app.get('/api/global-statistics', (req, res) => {
  res.json(globalStatistics);
});
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
