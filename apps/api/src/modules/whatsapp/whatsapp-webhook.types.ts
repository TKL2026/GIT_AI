/**
 * Forme (partielle) du payload envoyé par Meta sur le webhook WhatsApp
 * Cloud API. Interface volontairement permissive (pas de classe
 * class-validator) : voir whatsapp-webhook.controller.ts pour pourquoi.
 */
export interface WhatsAppWebhookPayload {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
}

export interface WhatsAppWebhookEntry {
  id?: string;
  changes?: WhatsAppWebhookChange[];
}

export interface WhatsAppWebhookChange {
  field?: string;
  value?: WhatsAppWebhookValue;
}

export interface WhatsAppWebhookValue {
  messaging_product?: string;
  messages?: WhatsAppInboundMessage[];
  statuses?: unknown[];
}

export interface WhatsAppInboundMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}
