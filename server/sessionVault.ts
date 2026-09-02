import fs from 'fs';
import path from 'path';
import { terminal } from './terminal';

export interface SessionMetadata {
  isStored: boolean;
  phoneNumber: string | null;
  userJid: string | null;
  userName: string | null;
  storedAt: string | null;
  lastSyncAt: string | null;
  keysCount: number;
  credsSize: number;
  autoRestoreEnabled: boolean;
  foreverSessionActive?: boolean;
  multiDeviceSupported?: boolean;
  sessionToken?: string;
}

export interface SessionVaultData {
  version: number;
  updatedAt: string;
  phoneNumber: string | null;
  userJid: string | null;
  userName: string | null;
  files: Record<string, string>; // filename -> base64 content
}

const DATA_DIR = path.join(process.cwd(), 'data');
const VAULT_FILE = path.join(DATA_DIR, 'session_vault.json');
const DEFAULT_AUTH_DIR = path.join(process.cwd(), 'auth_info_baileys');

export class SessionVaultManager {
  private authDir: string;
  private vaultFile: string;

  constructor(authDir = DEFAULT_AUTH_DIR, vaultFile = VAULT_FILE) {
    this.authDir = authDir;
    this.vaultFile = vaultFile;
    this.ensureDirs();
  }

  private ensureDirs(): void {
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  /**
   * Checks if session is present either in auth_info_baileys directory or the session vault file.
   */
  hasStoredSession(): boolean {
    const credsPath = path.join(this.authDir, 'creds.json');
    if (fs.existsSync(credsPath)) {
      try {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
        if (creds && (creds.me || creds.registered)) return true;
      } catch {
        // continue to check vault
      }
    }

    if (fs.existsSync(this.vaultFile)) {
      try {
        const vault = JSON.parse(fs.readFileSync(this.vaultFile, 'utf-8')) as SessionVaultData;
        if (vault && vault.files && vault.files['creds.json']) {
          return true;
        }
      } catch {
        // ignore
      }
    }

    return false;
  }

  /**
   * Restores session files from vault to auth_info_baileys directory if directory is missing or empty.
   */
  restoreFromVaultIfEmpty(): boolean {
    this.ensureDirs();
    const credsPath = path.join(this.authDir, 'creds.json');
    if (fs.existsSync(credsPath)) {
      return true; // already has live auth files
    }

    if (!fs.existsSync(this.vaultFile)) {
      // Check environment variable fallback
      if (process.env.WHATSAPP_SESSION_TOKEN) {
        terminal.log('system', 'Restoring session from WHATSAPP_SESSION_TOKEN environment variable...');
        return this.importSessionToken(process.env.WHATSAPP_SESSION_TOKEN);
      }
      return false;
    }

    try {
      const raw = fs.readFileSync(this.vaultFile, 'utf-8');
      const vault = JSON.parse(raw) as SessionVaultData;
      if (!vault.files || Object.keys(vault.files).length === 0) {
        return false;
      }

      for (const [filename, base64Content] of Object.entries(vault.files)) {
        const targetPath = path.join(this.authDir, filename);
        const buf = Buffer.from(base64Content, 'base64');
        fs.writeFileSync(targetPath, buf);
      }

      terminal.log(
        'success',
        `🔒 Restored ${Object.keys(vault.files).length} persistent auth keys from Session Vault (Account: ${vault.userName || vault.phoneNumber || 'Stored'}). No re-login required!`
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      terminal.log('error', `Failed to restore session from vault: ${msg}`);
      return false;
    }
  }

  /**
   * Snapshots all files from auth_info_baileys into the persistent session vault.
   */
  backupToVault(phoneNumber?: string | null, userJid?: string | null, userName?: string | null): boolean {
    try {
      this.ensureDirs();
      if (!fs.existsSync(this.authDir)) return false;

      const fileNames = fs.readdirSync(this.authDir);
      if (fileNames.length === 0) return false;

      const filesMap: Record<string, string> = {};
      for (const fn of fileNames) {
        const fullPath = path.join(this.authDir, fn);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          const content = fs.readFileSync(fullPath);
          filesMap[fn] = content.toString('base64');
        }
      }

      const vaultData: SessionVaultData = {
        version: 1,
        updatedAt: new Date().toISOString(),
        phoneNumber: phoneNumber || null,
        userJid: userJid || null,
        userName: userName || null,
        files: filesMap,
      };

      fs.writeFileSync(this.vaultFile, JSON.stringify(vaultData, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error('Failed to backup session to vault:', err);
      return false;
    }
  }

  /**
   * Exports the entire session state as a single portable Base64 Token string.
   */
  exportSessionToken(): string | null {
    if (!this.hasStoredSession()) return null;

    // Refresh vault from auth files first
    this.backupToVault();

    if (fs.existsSync(this.vaultFile)) {
      try {
        const raw = fs.readFileSync(this.vaultFile, 'utf-8');
        const encoded = Buffer.from(raw, 'utf-8').toString('base64');
        return `WBOT-SESSION-${encoded}`;
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Imports and unpacks a single session token string or raw JSON vault into auth directory.
   */
  importSessionToken(tokenOrJson: string): boolean {
    try {
      this.ensureDirs();
      let jsonString = tokenOrJson.trim();

      if (jsonString.startsWith('WBOT-SESSION-')) {
        const b64 = jsonString.replace('WBOT-SESSION-', '');
        jsonString = Buffer.from(b64, 'base64').toString('utf-8');
      } else if (!jsonString.startsWith('{')) {
        // Try direct base64 decode
        try {
          const decoded = Buffer.from(jsonString, 'base64').toString('utf-8');
          if (decoded.startsWith('{')) jsonString = decoded;
        } catch {
          // not base64
        }
      }

      const vault = JSON.parse(jsonString) as SessionVaultData;
      if (!vault || !vault.files || typeof vault.files !== 'object') {
        throw new Error('Invalid session bundle: Missing auth files map');
      }

      // Write files to auth dir
      for (const [filename, base64Content] of Object.entries(vault.files)) {
        const targetPath = path.join(this.authDir, filename);
        const buf = Buffer.from(base64Content, 'base64');
        fs.writeFileSync(targetPath, buf);
      }

      // Also persist to vault file
      fs.writeFileSync(this.vaultFile, JSON.stringify(vault, null, 2), 'utf-8');

      terminal.log(
        'success',
        `🔒 Session Token successfully imported! Restored ${Object.keys(vault.files).length} auth keys.`
      );
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      terminal.log('error', `Session import failed: ${msg}`);
      return false;
    }
  }

  /**
   * Returns metadata and stats about the stored session.
   */
  getSessionMetadata(): SessionMetadata {
    let keysCount = 0;
    let credsSize = 0;
    let storedAt: string | null = null;
    let phoneNumber: string | null = null;
    let userJid: string | null = null;
    let userName: string | null = null;
    const isStored = this.hasStoredSession();

    if (fs.existsSync(this.authDir)) {
      const files = fs.readdirSync(this.authDir);
      keysCount = files.length;
      const credsPath = path.join(this.authDir, 'creds.json');
      if (fs.existsSync(credsPath)) {
        try {
          const stat = fs.statSync(credsPath);
          credsSize = stat.size;
          storedAt = stat.mtime.toISOString();
          const creds = JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
          if (creds.me) {
            userJid = creds.me.id || null;
            userName = creds.me.name || creds.me.notify || null;
            if (userJid) {
              phoneNumber = userJid.split(':')[0].replace(/[^0-9]/g, '');
            }
          }
        } catch {
          // ignore
        }
      }
    }

    if (fs.existsSync(this.vaultFile)) {
      try {
        const vault = JSON.parse(fs.readFileSync(this.vaultFile, 'utf-8')) as SessionVaultData;
        if (!storedAt) storedAt = vault.updatedAt;
        if (!phoneNumber) phoneNumber = vault.phoneNumber;
        if (!userJid) userJid = vault.userJid;
        if (!userName) userName = vault.userName;
        if (keysCount === 0 && vault.files) {
          keysCount = Object.keys(vault.files).length;
        }
      } catch {
        // ignore
      }
    }

    return {
      isStored,
      phoneNumber,
      userJid,
      userName,
      storedAt,
      lastSyncAt: new Date().toISOString(),
      keysCount,
      credsSize,
      autoRestoreEnabled: true,
      foreverSessionActive: true,
      multiDeviceSupported: true,
      sessionToken: isStored ? this.exportSessionToken() || undefined : undefined,
    };
  }

  /**
   * Purges both auth directory and session vault file upon explicit logout.
   */
  clearSession(): void {
    try {
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true });
      }
      if (fs.existsSync(this.vaultFile)) {
        fs.rmSync(this.vaultFile, { force: true });
      }
    } catch (err) {
      console.error('Error clearing session vault:', err);
    }
  }
}

export const sessionVault = new SessionVaultManager();
