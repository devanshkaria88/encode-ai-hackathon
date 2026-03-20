import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class DashboardGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(DashboardGateway.name);

  emitAgentStart(trigger: string) {
    this.server?.emit('agent:start', {
      trigger,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Agent started: ${trigger.substring(0, 80)}`);
  }

  emitToolStart(toolName: string, input: Record<string, unknown>) {
    this.server?.emit('agent:tool-start', {
      tool: toolName,
      input,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Tool start: ${toolName}`);
  }

  emitToolResult(toolName: string, result: unknown) {
    const resultStr = JSON.stringify(result);
    const truncated = resultStr.length > 2000
      ? JSON.parse(resultStr.substring(0, 2000) + '"}')
      : result;

    this.server?.emit('agent:tool-result', {
      tool: toolName,
      result: truncated,
      timestamp: new Date().toISOString(),
    });
    this.logger.debug(`Tool result: ${toolName}`);
  }

  emitAgentComplete(response: string, steps: Array<{ tool: string; description: string }>) {
    this.server?.emit('agent:complete', {
      response,
      steps: steps.map((s) => ({ tool: s.tool, description: s.description })),
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Agent complete: ${response.substring(0, 80)}...`);
  }

  emitAgentError(error: string) {
    this.server?.emit('agent:error', {
      error,
      timestamp: new Date().toISOString(),
    });
    this.logger.error(`Agent error: ${error}`);
  }

  emitLuffaMessageReceived(
    type: 'dm' | 'group',
    text: string,
    senderUid?: string,
  ) {
    this.server?.emit('luffa:message-received', {
      type,
      text,
      senderUid,
      timestamp: new Date().toISOString(),
    });
  }

  emitLuffaMessageSent(
    type: 'dm' | 'group',
    text: string,
    recipientUid?: string,
  ) {
    this.server?.emit('luffa:message-sent', {
      type,
      text,
      recipientUid,
      timestamp: new Date().toISOString(),
    });
  }
}
