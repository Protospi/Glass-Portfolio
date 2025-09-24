import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

export class GoogleCalendarService {
  private calendar: any;
  private auth: JWT;

  constructor() {
    // Initialize the JWT auth with service account credentials
    this.auth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    });

    this.calendar = google.calendar({ version: 'v3', auth: this.auth });
  }

  /**
   * Schedule a new meeting/event in Google Calendar
   */
  async scheduleMeeting(params: {
    title: string;
    description?: string;
    startDateTime: string; // ISO 8601 format
    endDateTime: string; // ISO 8601 format
    attendeeEmails?: string[];
    location?: string;
    calendarId?: string;
  }): Promise<string> {
    try {
      const {
        title,
        description = '',
        startDateTime,
        endDateTime,
        attendeeEmails = [],
        location = '',
        calendarId = 'primary'
      } = params;

      // Prepare attendees array
      const attendees = attendeeEmails.map(email => ({ email }));

      // Create the event
      const event = {
        summary: title,
        description,
        location,
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Sao_Paulo', // Adjust timezone as needed
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Sao_Paulo',
        },
        attendees,
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 30 }, // 30 minutes before
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId,
        resource: event,
        conferenceDataVersion: 1,
        sendUpdates: 'all' // Send invitations to attendees
      });

      const eventId = response.data.id;
      const eventLink = response.data.htmlLink;
      const meetLink = response.data.conferenceData?.entryPoints?.[0]?.uri || 'No meet link generated';

      return `✅ Meeting scheduled successfully!
📅 Event ID: ${eventId}
🔗 Calendar Link: ${eventLink}
📹 Meet Link: ${meetLink}
📧 Invitations sent to: ${attendeeEmails.join(', ') || 'No attendees'}`;

    } catch (error) {
      console.error('Error scheduling meeting:', error);
      return `❌ Error scheduling meeting: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Get upcoming events from calendar
   */
  async getUpcomingEvents(params: {
    maxResults?: number;
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
  }): Promise<string> {
    try {
      const {
        maxResults = 10,
        calendarId = 'primary',
        timeMin = new Date().toISOString(),
        timeMax
      } = params;

      const response = await this.calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];

      if (events.length === 0) {
        return '📅 No upcoming events found.';
      }

      let result = `📅 Upcoming Events (${events.length}):\n\n`;

      events.forEach((event: any, index: number) => {
        const start = event.start?.dateTime || event.start?.date;
        const end = event.end?.dateTime || event.end?.date;
        const startFormatted = new Date(start).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        });
        const endFormatted = new Date(end).toLocaleString('pt-BR', {
          timeZone: 'America/Sao_Paulo'
        });

        result += `${index + 1}. 📝 ${event.summary || 'No title'}\n`;
        result += `   ⏰ ${startFormatted} - ${endFormatted}\n`;
        if (event.location) result += `   📍 ${event.location}\n`;
        if (event.description) result += `   📄 ${event.description}\n`;
        if (event.htmlLink) result += `   🔗 ${event.htmlLink}\n`;
        result += '\n';
      });

      return result;

    } catch (error) {
      console.error('Error getting events:', error);
      return `❌ Error getting events: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Find available time slots for scheduling
   */
  async findAvailableSlots(params: {
    date: string; // YYYY-MM-DD format
    duration: number; // duration in minutes
    workingHoursStart?: string; // HH:MM format
    workingHoursEnd?: string; // HH:MM format
    calendarId?: string;
  }): Promise<string> {
    try {
      const {
        date,
        duration,
        workingHoursStart = '09:00',
        workingHoursEnd = '18:00',
        calendarId = 'primary'
      } = params;

      // Get events for the specified date
      const timeMin = new Date(`${date}T${workingHoursStart}:00-03:00`).toISOString();
      const timeMax = new Date(`${date}T${workingHoursEnd}:00-03:00`).toISOString();

      const response = await this.calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items || [];
      const availableSlots: string[] = [];

      // Convert working hours to minutes
      const [startHour, startMin] = workingHoursStart.split(':').map(Number);
      const [endHour, endMin] = workingHoursEnd.split(':').map(Number);
      const workStart = startHour * 60 + startMin;
      const workEnd = endHour * 60 + endMin;

      // Find gaps between events
      let currentTime = workStart;

      events.forEach((event: any) => {
        const eventStart = new Date(event.start?.dateTime || event.start?.date);
        const eventEnd = new Date(event.end?.dateTime || event.end?.date);
        
        const eventStartMin = eventStart.getHours() * 60 + eventStart.getMinutes();
        const eventEndMin = eventEnd.getHours() * 60 + eventEnd.getMinutes();

        // Check if there's a gap before this event
        if (currentTime + duration <= eventStartMin) {
          const slotStart = Math.floor(currentTime / 60).toString().padStart(2, '0') + ':' + 
                           (currentTime % 60).toString().padStart(2, '0');
          const slotEnd = Math.floor((currentTime + duration) / 60).toString().padStart(2, '0') + ':' + 
                         ((currentTime + duration) % 60).toString().padStart(2, '0');
          availableSlots.push(`${slotStart} - ${slotEnd}`);
        }

        currentTime = Math.max(currentTime, eventEndMin);
      });

      // Check for availability after the last event
      if (currentTime + duration <= workEnd) {
        const slotStart = Math.floor(currentTime / 60).toString().padStart(2, '0') + ':' + 
                         (currentTime % 60).toString().padStart(2, '0');
        const slotEnd = Math.floor((currentTime + duration) / 60).toString().padStart(2, '0') + ':' + 
                       ((currentTime + duration) % 60).toString().padStart(2, '0');
        availableSlots.push(`${slotStart} - ${slotEnd}`);
      }

      if (availableSlots.length === 0) {
        return `❌ No available slots found for ${date} (${duration} minutes duration)`;
      }

      let result = `🕐 Available time slots for ${date} (${duration} minutes each):\n\n`;
      availableSlots.forEach((slot, index) => {
        result += `${index + 1}. ${slot}\n`;
      });

      return result;

    } catch (error) {
      console.error('Error finding available slots:', error);
      return `❌ Error finding available slots: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  /**
   * Cancel/delete an event
   */
  async cancelMeeting(params: {
    eventId: string;
    calendarId?: string;
    sendUpdates?: boolean;
  }): Promise<string> {
    try {
      const {
        eventId,
        calendarId = 'primary',
        sendUpdates = true
      } = params;

      await this.calendar.events.delete({
        calendarId,
        eventId,
        sendUpdates: sendUpdates ? 'all' : 'none'
      });

      return `✅ Meeting cancelled successfully! Event ID: ${eventId}`;

    } catch (error) {
      console.error('Error cancelling meeting:', error);
      return `❌ Error cancelling meeting: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}
