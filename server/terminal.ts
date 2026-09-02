import { WebSocket } from 'ws';
import { TerminalLog } from '../src/types';

export class TerminalManager {
  private clients: Set<WebSocket> = new Set();
  private logs: TerminalLog[] = [];

  // ANSI formatting helpers
  static RESET = '\x1b[0m';
  static BOLD = '\x1b[1m';
  static DIM = '\x1b[2m';
  static ITALIC = '\x1b[3m';
  static UNDERLINE = '\x1b[4m';

  // Colors
  static RED = '\x1b[31m';
  static GREEN = '\x1b[32m';
  static YELLOW = '\x1b[33m';
  static BLUE = '\x1b[34m';
  static MAGENTA = '\x1b[35m';
  static CYAN = '\x1b[36m';
  static WHITE = '\x1b[37m';
  static GRAY = '\x1b[90m';
  static BRIGHT_GREEN = '\x1b[92m';
  static BRIGHT_YELLOW = '\x1b[93m';
  static BRIGHT_CYAN = '\x1b[96m';
  static BG_EMERALD = '\x1b[42m\x1b[30m';

  registerClient(ws: WebSocket): void {
    this.clients.add(ws);
    
    // Send welcome banner
    this.sendBannerToClient(ws);

    // Send recent logs
    const recent = this.logs.slice(-50);
    for (const log of recent) {
      if (log.rawAnsi) {
        ws.send(JSON.stringify({ type: 'terminal_output', data: log.rawAnsi }));
      }
    }

    ws.on('close', () => {
      this.clients.delete(ws);
    });
  }

  unregisterClient(ws: WebSocket): void {
    this.clients.delete(ws);
  }

  sendBannerToClient(ws: WebSocket): void {
    const banner = [
      '',
      `${TerminalManager.CYAN}  ██╗    ██╗██╗  ██╗ █████╗ ████████╗███████╗ █████╗ ██████╗ ██████╗ ${TerminalManager.RESET}`,
      `${TerminalManager.CYAN}  ██║    ██║██║  ██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗${TerminalManager.RESET}`,
      `${TerminalManager.CYAN}  ██║ █╗ ██║███████║███████║   ██║   ███████╗███████║██████╔╝██████╔╝${TerminalManager.RESET}`,
      `${TerminalManager.CYAN}  ██║███╗██║██╔══██║██╔══██║   ██║   ╚════██║██╔══██║██╔═══╝ ██╔═══╝ ${TerminalManager.RESET}`,
      `${TerminalManager.CYAN}  ╚███╔███╔╝██║  ██║██║  ██║   ██║   ███████║██║  ██║██║     ██║     ${TerminalManager.RESET}`,
      `${TerminalManager.CYAN}   ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝     ${TerminalManager.RESET}`,
      `${TerminalManager.BOLD}${TerminalManager.BRIGHT_GREEN}   >>> WhatsApp Multi-Device Terminal & Bot Engine v2.5 <<<${TerminalManager.RESET}`,
      `${TerminalManager.GRAY}   • Auth Method: ${TerminalManager.WHITE}Link with Phone Number (Pairing Code)${TerminalManager.RESET}`,
      `${TerminalManager.GRAY}   • Capabilities: ${TerminalManager.WHITE}Profile Edit, Status Broadcast, Auto-Replies, AI Agent, Live Listener${TerminalManager.RESET}`,
      `${TerminalManager.GRAY}   • Type ${TerminalManager.BRIGHT_YELLOW}help${TerminalManager.GRAY} or ${TerminalManager.BRIGHT_YELLOW}?${TerminalManager.GRAY} for command reference${TerminalManager.RESET}`,
      '',
    ].join('\r\n');

    ws.send(JSON.stringify({ type: 'terminal_output', data: banner + '\r\n' }));
  }

  log(level: TerminalLog['level'], message: string, customAnsi?: string): void {
    const timestamp = new Date().toLocaleTimeString();
    const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    
    let color = TerminalManager.WHITE;
    let badge = 'INFO';

    switch (level) {
      case 'success':
        color = TerminalManager.GREEN;
        badge = ' SUCCESS ';
        break;
      case 'error':
        color = TerminalManager.RED;
        badge = '  ERROR  ';
        break;
      case 'warn':
        color = TerminalManager.YELLOW;
        badge = ' WARNING ';
        break;
      case 'incoming':
        color = TerminalManager.CYAN;
        badge = 'INCOMING ';
        break;
      case 'outgoing':
        color = TerminalManager.MAGENTA;
        badge = 'OUTGOING ';
        break;
      case 'system':
        color = TerminalManager.BRIGHT_CYAN;
        badge = ' SYSTEM  ';
        break;
    }

    const formattedAnsi = customAnsi || `${TerminalManager.GRAY}[${timestamp}]${TerminalManager.RESET} ${color}[${badge}]${TerminalManager.RESET} ${message}\r\n`;

    const logEntry: TerminalLog = {
      id,
      timestamp,
      level,
      message,
      rawAnsi: formattedAnsi,
    };

    this.logs.push(logEntry);
    if (this.logs.length > 200) {
      this.logs.shift();
    }

    // Broadcast to all active terminal WebSockets
    const payload = JSON.stringify({ type: 'terminal_output', data: formattedAnsi });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  broadcastJson(type: string, data: unknown): void {
    const payload = JSON.stringify({ type, data });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  clear(): void {
    this.logs = [];
    const clearAnsi = '\x1b[2J\x1b[H';
    const payload = JSON.stringify({ type: 'terminal_output', data: clearAnsi });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }
}

export const terminal = new TerminalManager();
