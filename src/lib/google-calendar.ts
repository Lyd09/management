
import { getGoogleCalendarClient } from '@/lib/google-auth';
import type { calendar_v3 } from 'googleapis';

// Função para criar um evento no Google Calendar
export const createCalendarEvent = async (tokens: any, eventData: calendar_v3.Params$Resource$Events$Insert) => {
  try {
    const calendar = getGoogleCalendarClient(tokens);
    const response = await calendar.events.insert(eventData);
    return response.data;
  } catch (error: any) {
    console.error('Erro ao criar evento no Google Calendar:', error.response?.data || error.message);
    // Lança o erro para que o chamador possa tratá-lo
    throw new Error('Falha ao criar o evento no Google Calendar.');
  }
};

// Função para atualizar um evento existente
export const updateCalendarEvent = async (tokens: any, eventId: string, eventData: calendar_v3.Params$Resource$Events$Update) => {
  try {
    const calendar = getGoogleCalendarClient(tokens);
    const response = await calendar.events.update({
      ...eventData,
      eventId: eventId,
    });
    return response.data;
  } catch (error: any) {
    console.error('Erro ao atualizar evento no Google Calendar:', error.response?.data || error.message);
    throw new Error('Falha ao atualizar o evento no Google Calendar.');
  }
};

// Função para deletar um evento
export const deleteCalendarEvent = async (tokens: any, eventId: string) => {
    try {
        const calendar = getGoogleCalendarClient(tokens);
        await calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });
        return true;
    } catch (error: any) {
        // Se o evento já foi deletado ou não existe, o erro 410 (Gone) ou 404 (Not Found) pode ocorrer.
        // Nesses casos, não consideramos um erro fatal.
        if (error.code === 410 || error.code === 404) {
            console.warn(`Tentativa de deletar evento que não existe mais: ${eventId}`);
            return true; // Sucesso, pois o estado desejado (evento não existe) foi alcançado.
        }
        console.error('Erro ao deletar evento no Google Calendar:', error.response?.data || error.message);
        throw new Error('Falha ao deletar o evento no Google Calendar.');
    }
};

// Função para obter as configurações do usuário, como o fuso horário
export const getUserCalendarSettings = async (tokens: any) => {
    try {
        const calendar = getGoogleCalendarClient(tokens);
        const settings = await calendar.settings.get({ setting: 'timezone' });
        return settings.data;
    } catch (error: any) {
        console.error('Erro ao buscar configurações do calendário:', error.response?.data || error.message);
        throw new Error('Falha ao buscar as configurações do calendário.');
    }
}
