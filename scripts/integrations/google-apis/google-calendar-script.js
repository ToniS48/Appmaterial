/**
 * Script para Google Calendar API
 * Maneja operaciones de calendario usando argumentos de línea de comandos
 */

const GoogleApisBase = require('./google-apis-base');
const { google } = require('googleapis');

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

      const calendarId = options.calendarId || 'primary';
      
      const params = {
        calendarId,
        maxResults: parseInt(options.maxResults) || 10,
        singleEvents: true,
        orderBy: 'startTime',
      };

      // Agregar timeMin si está definido
      if (options.timeMin) {
        params.timeMin = options.timeMin;
      } else {
        // Por defecto, obtener eventos desde ahora
        params.timeMin = new Date().toISOString();
      }

      // Agregar timeMax si está definido
      if (options.timeMax) {
        params.timeMax = options.timeMax;
      }

      const response = await calendar.events.list(params);
      
      const events = response.data.items || [];
      const formattedEvents = events.map(event => ({
        id: event.id,
        summary: event.summary || 'Sin título',
        description: event.description || '',
        start: event.start,
        end: event.end,
        location: event.location || '',
        attendees: event.attendees || []
      }));

      this.handleResponse(true, formattedEvents);
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

      const calendarId = eventData.calendarId || 'primary';
      
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

  /**
   * Listar calendarios disponibles
   */
  async listCalendars() {
    try {
      const authClient = await this.getAuthClient();
      const calendar = google.calendar({ version: 'v3', auth: authClient });

      const response = await calendar.calendarList.list();
      
      const calendars = response.data.items || [];
      const formattedCalendars = calendars.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description || '',
        backgroundColor: cal.backgroundColor,
        foregroundColor: cal.foregroundColor,
        accessRole: cal.accessRole
      }));

      this.handleResponse(true, formattedCalendars);
    } catch (error) {
      this.handleError(error, 'Google Calendar List');
    }
  }
}

// Procesar argumentos de línea de comandos
async function main() {
  const args = process.argv.slice(2);
  const action = args[0];

  const script = new GoogleCalendarScript();

  try {
    switch (action) {
      case 'events':
        const eventOptions = {};
        for (let i = 1; i < args.length; i += 2) {
          const key = args[i].replace('--', '');
          const value = args[i + 1];
          if (value && value !== 'undefined') {
            eventOptions[key] = value;
          }
        }
        await script.getEvents(eventOptions);
        break;

      case 'create':
        const eventData = JSON.parse(args[1] || '{}');
        await script.createEvent(eventData);
        break;

      case 'calendars':
        await script.listCalendars();
        break;

      default:
        console.log('Uso: node google-calendar-script.js <action> [options]');
        console.log('Acciones disponibles:');
        console.log('  events --calendarId primary --maxResults 10 --timeMin <date> --timeMax <date>');
        console.log('  create <eventJson>');
        console.log('  calendars');
        process.exit(1);
    }
  } catch (error) {
    script.handleError(error, 'Main');
  }
}

if (require.main === module) {
  main();
}

module.exports = GoogleCalendarScript;
