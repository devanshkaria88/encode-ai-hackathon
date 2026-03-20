export interface LuffaIncomingMessage {
  text: string;
  msgId: string;
  atList: Array<{ name: string; did: string; length: number; location: number; userType: number }>;
  urlLink: string | null;
  uid: string | null;
}

export interface LuffaEnvelope {
  uid: string;
  count: number;
  type: 0 | 1; // 0=DM, 1=group
  messages: LuffaIncomingMessage[];
}

export interface LuffaButton {
  name: string;
  selector: string;
  isHidden: 0 | 1;
}

export interface LuffaGroupPayload {
  text: string;
  button?: LuffaButton[];
  atList?: Array<{ name: string; did: string; length: number; location: number; userType: number }>;
  urlLink?: string;
}
