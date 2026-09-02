import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import { botEngine } from './server/whatsapp';
import { storage } from './server/storage';
import { terminal } from './server/terminal';
import { executeTerminalCommand } from './server/commandHandler';

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const server = http.createServer(app);

  // WebSocket Server for Terminal & Live Events
  const wss = new WebSocketServer({ server, path: '/ws/terminal' });

  wss.on('connection', (ws: WebSocket) => {
    terminal.registerClient(ws);

    ws.on('message', async (data: Buffer | string) => {
      try {
        const payload = JSON.parse(data.toString());
        if (payload.type === 'command' && typeof payload.command === 'string') {
          await executeTerminalCommand(payload.command);
        } else if (payload.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch {
        // Raw text command fallback
        const raw = data.toString();
        if (raw) {
          await executeTerminalCommand(raw);
        }
      }
    });
  });

  // --- API Endpoints ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Get WhatsApp Bot Status
  app.get('/api/whatsapp/status', (req, res) => {
    res.json(botEngine.getStatus());
  });

  // Request 8-Digit Pairing Code with Phone Number
  app.post('/api/whatsapp/pair', async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      res.status(400).json({ success: false, message: 'Phone number is required' });
      return;
    }
    const result = await botEngine.linkWithPhoneNumber(phoneNumber);
    res.json(result);
  });

  // Update Profile Name
  app.post('/api/whatsapp/profile/name', async (req, res) => {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Name is required' });
      return;
    }
    const result = await botEngine.updateProfileName(name);
    res.json(result);
  });

  // Update Profile Status (Bio/About)
  app.post('/api/whatsapp/profile/status', async (req, res) => {
    const { status } = req.body;
    if (!status) {
      res.status(400).json({ success: false, message: 'Status bio text is required' });
      return;
    }
    const result = await botEngine.updateProfileStatus(status);
    res.json(result);
  });

  // Update Profile Picture
  app.post('/api/whatsapp/profile/picture', async (req, res) => {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      res.status(400).json({ success: false, message: 'Base64 image is required' });
      return;
    }
    const result = await botEngine.updateProfilePicture(imageBase64);
    res.json(result);
  });

  // Post Status / Story Broadcast
  app.post('/api/whatsapp/story', async (req, res) => {
    const { text, backgroundColor, font } = req.body;
    if (!text) {
      res.status(400).json({ success: false, message: 'Story text is required' });
      return;
    }
    const result = await botEngine.postStatusStory(text, backgroundColor, font);
    res.json(result);
  });

  // Get Posted Stories
  app.get('/api/whatsapp/stories', (req, res) => {
    res.json({ stories: storage.getStories() });
  });

  // Send Direct Message
  app.post('/api/whatsapp/send', async (req, res) => {
    const { recipient, message } = req.body;
    if (!recipient || !message) {
      res.status(400).json({ success: false, message: 'Recipient and message are required' });
      return;
    }
    const result = await botEngine.sendMessage(recipient, message);
    res.json(result);
  });

  // Get Incoming & Logged Messages
  app.get('/api/whatsapp/messages', (req, res) => {
    const limit = parseInt(req.query.limit as string, 10) || 100;
    res.json({ messages: storage.getMessages(limit) });
  });

  // Clear Message Logs
  app.delete('/api/whatsapp/messages', (req, res) => {
    storage.clearMessages();
    res.json({ success: true, message: 'Message history cleared' });
  });

  // Get Auto-Reply Rules
  app.get('/api/whatsapp/rules', (req, res) => {
    res.json({ rules: storage.getRules() });
  });

  // Add Auto-Reply Rule
  app.post('/api/whatsapp/rules', (req, res) => {
    const newRule = storage.addRule(req.body);
    res.json({ success: true, rule: newRule });
  });

  // Update Auto-Reply Rule
  app.put('/api/whatsapp/rules/:id', (req, res) => {
    const updated = storage.updateRule(req.params.id, req.body);
    if (updated) {
      res.json({ success: true, rule: updated });
    } else {
      res.status(404).json({ success: false, message: 'Rule not found' });
    }
  });

  // Delete Auto-Reply Rule
  app.delete('/api/whatsapp/rules/:id', (req, res) => {
    const deleted = storage.deleteRule(req.params.id);
    res.json({ success: deleted });
  });

  // Get Bot Config
  app.get('/api/whatsapp/config', (req, res) => {
    res.json(storage.getConfig());
  });

  // Update Bot Config
  app.post('/api/whatsapp/config', (req, res) => {
    const updated = storage.updateConfig(req.body);
    res.json({ success: true, config: updated });
  });

  // Execute Terminal Command from Web UI or Python CLI
  app.post('/api/whatsapp/command', async (req, res) => {
    const { command } = req.body;
    if (!command) {
      res.status(400).json({ success: false, message: 'Command is required' });
      return;
    }
    await executeTerminalCommand(command);
    res.json({ success: true, message: `Command executed: ${command}` });
  });

  // Get Stored Session Status & Metadata
  app.get('/api/whatsapp/session', (req, res) => {
    res.json(botEngine.getSessionMetadata());
  });

  // Export Session String Token & Vault Bundle
  app.get('/api/whatsapp/session/export', (req, res) => {
    const token = botEngine.exportSessionToken();
    const meta = botEngine.getSessionMetadata();
    res.json({
      success: !!token,
      token,
      metadata: meta,
    });
  });

  // Import Session Token String
  app.post('/api/whatsapp/session/import', async (req, res) => {
    const { token } = req.body;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ success: false, message: 'Session token string is required' });
      return;
    }
    const result = await botEngine.importSessionToken(token);
    res.json(result);
  });

  // Force Reconnect
  app.post('/api/whatsapp/session/reconnect', async (req, res) => {
    const result = await botEngine.forceReconnect();
    res.json(result);
  });

  // Download Session Backup File
  app.get('/api/whatsapp/session/download-backup', (req, res) => {
    const vaultPath = path.join(process.cwd(), 'data', 'session_vault.json');
    if (fs.existsSync(vaultPath)) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="whatsapp-session-vault.json"');
      res.sendFile(vaultPath);
    } else {
      res.status(404).json({ success: false, message: 'No stored session vault found' });
    }
  });

  // Logout WhatsApp
  app.post('/api/whatsapp/logout', async (req, res) => {
    const result = await botEngine.logout();
    res.json(result);
  });

  // AI Reply Live Test
  app.post('/api/whatsapp/ai/test', async (req, res) => {
    const { message, prompt } = req.body;
    try {
      const { generateSmartReply } = await import('./server/ai');
      const response = await generateSmartReply(
        message || 'Hello, can you help me?',
        'Tester',
        '1234567890',
        'test-preview@s.whatsapp.net',
        prompt
      );
      res.json({ success: true, reply: response, model: storage.getConfig().groqModel || 'llama-3.1-8b-instant' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || 'AI Generation error' });
    }
  });

  // Download Python Bot CLI Script
  app.get('/api/whatsapp/download-script', (req, res) => {
    const scriptPath = path.join(process.cwd(), 'scripts', 'whatsapp_bot.py');
    if (fs.existsSync(scriptPath)) {
      res.setHeader('Content-Type', 'text/x-python');
      res.setHeader('Content-Disposition', 'attachment; filename="whatsapp_bot.py"');
      res.sendFile(scriptPath);
    } else {
      res.status(404).send('Script not found');
    }
  });

  // Download Native Desktop Python GUI Program
  app.get('/api/whatsapp/desktop/download-gui', (req, res) => {
    const scriptPath = path.join(process.cwd(), 'whatsapp_desktop.py');
    if (fs.existsSync(scriptPath)) {
      res.setHeader('Content-Type', 'text/x-python');
      res.setHeader('Content-Disposition', 'attachment; filename="whatsapp_desktop.py"');
      res.sendFile(scriptPath);
    } else {
      res.status(404).send('Desktop GUI script not found');
    }
  });

  // Download Windows Desktop Launcher (.bat)
  app.get('/api/whatsapp/desktop/download-windows-bat', (req, res) => {
    const batPath = path.join(process.cwd(), 'run_desktop.bat');
    if (fs.existsSync(batPath)) {
      res.setHeader('Content-Type', 'application/x-bat');
      res.setHeader('Content-Disposition', 'attachment; filename="run_desktop.bat"');
      res.sendFile(batPath);
    } else {
      res.status(404).send('Windows launcher not found');
    }
  });

  // Download macOS / Linux Desktop Launcher (.sh)
  app.get('/api/whatsapp/desktop/download-macos-sh', (req, res) => {
    const shPath = path.join(process.cwd(), 'run_desktop.sh');
    if (fs.existsSync(shPath)) {
      res.setHeader('Content-Type', 'application/x-sh');
      res.setHeader('Content-Disposition', 'attachment; filename="run_desktop.sh"');
      res.sendFile(shPath);
    } else {
      res.status(404).send('Unix launcher not found');
    }
  });

  // Download 1-Click Localhost Windows Runner (.bat)
  app.get('/api/whatsapp/localhost/download-windows-bat', (req, res) => {
    const batPath = path.join(process.cwd(), 'start_localhost.bat');
    if (fs.existsSync(batPath)) {
      res.setHeader('Content-Type', 'application/x-bat');
      res.setHeader('Content-Disposition', 'attachment; filename="start_localhost.bat"');
      res.sendFile(batPath);
    } else {
      res.status(404).send('start_localhost.bat not found');
    }
  });

  // Download 1-Click Localhost macOS / Linux Runner (.sh)
  app.get('/api/whatsapp/localhost/download-macos-sh', (req, res) => {
    const shPath = path.join(process.cwd(), 'start_localhost.sh');
    if (fs.existsSync(shPath)) {
      res.setHeader('Content-Type', 'application/x-sh');
      res.setHeader('Content-Disposition', 'attachment; filename="start_localhost.sh"');
      res.sendFile(shPath);
    } else {
      res.status(404).send('start_localhost.sh not found');
    }
  });

  // Download 1-Click Localhost Python Auto-Runner (.py)
  app.get('/api/whatsapp/localhost/download-auto-py', (req, res) => {
    const pyPath = path.join(process.cwd(), 'auto_run.py');
    if (fs.existsSync(pyPath)) {
      res.setHeader('Content-Type', 'text/x-python');
      res.setHeader('Content-Disposition', 'attachment; filename="auto_run.py"');
      res.sendFile(pyPath);
    } else {
      res.status(404).send('auto_run.py not found');
    }
  });

  // Vite middleware for development / static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    terminal.log('system', `WhatsApp Bot Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
