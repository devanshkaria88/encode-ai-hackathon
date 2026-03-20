import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { LuffaEnvelope, LuffaIncomingMessage, LuffaGroupPayload } from './luffa.interfaces.js';

const BASE_URL = 'https://apibot.luffa.im/robot';

@Injectable()
export class LuffaService {
  private readonly logger = new Logger(LuffaService.name);
  private readonly secret: string;

  constructor(private config: ConfigService) {
    this.secret = this.config.get<string>('LUFFA_ROBOT_SECRET', '');
  }

  async receive(): Promise<LuffaEnvelope[]> {
    try {
      const resp = await axios.post(`${BASE_URL}/receive`, {
        secret: this.secret,
      });

      let data = resp.data;
      if (data?.data) data = data.data;
      if (!Array.isArray(data)) return [];

      return data.map((item: Record<string, unknown>) => this.parseEnvelope(item));
    } catch (err) {
      this.logger.error('Failed to poll Luffa:', (err as Error).message);
      return [];
    }
  }

  async sendToUser(uid: string, text: string): Promise<boolean> {
    try {
      await axios.post(`${BASE_URL}/send`, {
        secret: this.secret,
        uid,
        msg: JSON.stringify({ text }),
      });
      this.logger.log(`Sent DM to ${uid}: ${text.substring(0, 80)}...`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send DM to ${uid}:`, (err as Error).message);
      return false;
    }
  }

  async sendToGroup(
    groupId: string,
    payload: string | LuffaGroupPayload,
    messageType: 1 | 2 = 1,
  ): Promise<boolean> {
    try {
      const msg =
        typeof payload === 'string'
          ? JSON.stringify({ text: payload })
          : JSON.stringify(payload);

      await axios.post(`${BASE_URL}/sendGroup`, {
        secret: this.secret,
        uid: groupId,
        msg,
        type: String(messageType),
      });
      const preview = typeof payload === 'string' ? payload : payload.text;
      this.logger.log(`Sent group message: ${preview.substring(0, 80)}...`);
      return true;
    } catch (err) {
      this.logger.error('Failed to send group message:', (err as Error).message);
      return false;
    }
  }

  private parseEnvelope(item: Record<string, unknown>): LuffaEnvelope {
    const rawMessages = (item.message ?? item.messages ?? []) as unknown[];
    const messages: LuffaIncomingMessage[] = rawMessages.map((raw) => {
      const obj: Record<string, unknown> =
        typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>);
      return {
        text: (obj.text ?? obj.msg ?? obj.content ?? '') as string,
        msgId: (obj.msgId ?? obj.mid ?? '') as string,
        atList: (obj.atList ?? []) as LuffaIncomingMessage['atList'],
        urlLink: (obj.urlLink ?? null) as string | null,
        uid: (obj.uid ?? null) as string | null,
      };
    });

    return {
      uid: String(item.uid ?? ''),
      count: Number(item.count ?? 0),
      type: Number(item.type ?? 0) as 0 | 1,
      messages,
    };
  }
}
