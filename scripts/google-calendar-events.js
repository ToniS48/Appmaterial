/**
 * Script para obtener eventos de Google Calendar
 * Uso: node scripts/google-calendar-events.js [options]
 */

const { google } = require('googleapis');
const GoogleApisBase = require('./google-apis-base');

class GoogleCalendarScript extends GoogleApisBase {
  constructor() {
    super();
  }

  /**
   * Obtener eventos del calendario
   */
  async getEvents(options = {}) {
    try {
      const authClient = await this.getAuthClient();
      const calendar = google.calendar({ version: 'v3', auth: authClient });

      const calendarId = options.calendarId || process.env.REACT_APP_GOOGLE_CALENDAR_ID || 'primary';
      
      const requestOptions = {
        calendarId,
        timeMin: options.timeMin || new Date().toISOString(),
        maxResults: options.maxResults || 10,
        singleEvents: true,
        orderBy: 'startTime',
      };

      // Solo agregar timeMax si está definido
      if (options.timeMax) {
        requestOptions.timeMax = options.timeMax;
      }

      const response = await calendar.events.list(requestOptions);
      
      const events = (response.data.items || []).map(event => ({
        id: event.id,
        summary: event.summary || 'Sin título',
        description: event.description || '',
        start: event.start,
        end: event.end,
        location: event.location || '',
        attendees: event.attendees || []
      }));

      this.handleResponse(true, events);

    } catch (error) {
      this.handleError(error, 'Google Calendar');
    }
  }

  /**
   * Crear evento en el calendario
   */
  async createEvent(eventData) {
    try {
      const authClient = await this.getAuthClient();
      const calendar = google.calendar({ version: 'v3', auth: authClient });

      const calendarId = eventData.calendarId || process.env.REACT_APP_GOOGLE_CALENDAR_ID || 'primary';

      const event = {
        summary: eventData.summary,
        description: eventData.description || '',
        start: eventData.start,
        end: eventData.end,
        location: eventData.location || '',
        attendees: eventData.attendees || []
      };

      const response = await calendar.events.insert({
        calendarId,
        resource: event
      });

      this.handleResponse(true, {
        id: response.data.id,
        summary: response.data.summary,
        htmlLink: response.data.htmlLink
      });

    } catch (error) {
      this.handleError(error, 'Google Calendar Create');
    }
  }
}

// Ejecutar script si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  const script = new GoogleCalendarScript();

  // Parsear argumentos
  const options = {};
  const action = args[0] || 'getEvents';

  for (let i = 1; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    if (key && value) {
      options[key] = value;
    }
  }

  // Ejecutar acción
  switch (action) {
    case 'getEvents':
      script.getEvents(options);
      break;
    case 'createEvent':
      // Para createEvent, esperamos JSON en stdin o como argumento
      if (options.eventData) {
        try {
          const eventData = JSON.parse(options.eventData);
          script.createEvent(eventData);
        } catch (error) {
          script.handleError(new Error('JSON inválido para eventData'), 'Parse');
        }
      } else {
        script.handleError(new Error('eventData requerido para createEvent'), 'Arguments');
      }
      break;
    default:
      script.handleError(new Error(`Acción desconocida: ${action}`), 'Arguments');
  }
}

module.exports = GoogleCalendarScript;
