#!/usr/bin/env python3
"""
WhatsApp Bot Desktop Program - Native GUI & Control Hub
Features:
- Live WhatsApp Multi-Device Connection Monitor & Forever Session Status
- 8-Digit Pairing Code Login Generator
- Groq AI Auto-Reply (LLaMA-3.1-8b-instant @ temp 0.4) Manager & Prompt Studio
- Live Incoming & Outgoing Message Stream Viewer
- Direct Message Sender & Status Story Broadcaster
- Profile Display Name & About Bio Editor
- Persistent Session Vault (Zero-Login Token Export/Import & Reconnection)
- Built-in Terminal Command Console
"""

import sys
import os
import json
import time
import urllib.request
import urllib.error
import threading
import webbrowser
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext

DEFAULT_API_URL = os.environ.get("WHATSAPP_spy_URL", "http://localhost:4044" if os.environ.get("PORT") == "4044" else "http://localhost:3000")

class WhatsAppClient:
    def __init__(self, base_url=DEFAULT_API_URL):
        self.base_url = base_url.rstrip("/")

    def request(self, endpoint, method="GET", data=None):
        url = f"{self.base_url}{endpoint}"
        req = urllib.request.Request(url, method=method)
        req.add_header("Content-Type", "application/json")
        req.add_header("User-Agent", "WhatsAppBotDesktop/2.0")

        body = None
        if data is not None:
            body = json.dumps(data).encode("utf-8")

        try:
            with urllib.request.urlopen(req, data=body, timeout=15) as resp:
                res_body = resp.read().decode("utf-8")
                return json.loads(res_body)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            try:
                return json.loads(err_body)
            except Exception:
                return {"error": f"HTTP {e.code}: {e.reason}", "success": False}
        except Exception as e:
            return {"error": str(e), "success": False}


class WhatsAppDesktopApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("WhatsApp spy Desktop Hub - Apex developers Team")
        self.geometry("980x680")
        self.minsize(860, 580)
        self.configure(bg="#121214")

        self.client = WhatsAppClient(DEFAULT_API_URL)
        self.is_connected = False
        self.current_pairing_code = ""
        self.auto_refresh_active = True

        self.setup_styles()
        self.build_ui()
        self.start_background_sync()

    def setup_styles(self):
        self.style = ttk.Style(self)
        self.style.theme_use("clam")

        # Configure dark aesthetic
        self.style.configure(".", background="#121214", foreground="#e4e4e7", font=("Segoe UI", 9))
        self.style.configure("TNotebook", background="#18181b", borderwidth=0)
        self.style.configure("TNotebook.Tab", background="#27272a", foreground="#a1a1aa", padding=[14, 8], font=("Segoe UI", 9, "bold"))
        self.style.map("TNotebook.Tab", background=[("selected", "#09090b")], foreground=[("selected", "#22c55e")])

        self.style.configure("TFrame", background="#121214")
        self.style.configure("Card.TFrame", background="#18181b", relief="solid", borderwidth=1)
        self.style.configure("TLabel", background="#121214", foreground="#e4e4e7")
        self.style.configure("Card.TLabel", background="#18181b", foreground="#e4e4e7")
        self.style.configure("Muted.TLabel", background="#18181b", foreground="#71717a")
        
        self.style.configure("Green.TButton", background="#22c55e", foreground="#09090b", font=("Segoe UI", 9, "bold"), borderwidth=0)
        self.style.map("Green.TButton", background=[("active", "#16a34a"), ("disabled", "#27272a")])

        self.style.configure("Dark.TButton", background="#27272a", foreground="#e4e4e7", borderwidth=0)
        self.style.map("Dark.TButton", background=[("active", "#3f3f46")])

    def build_ui(self):
        # Top Header Bar
        header = tk.Frame(self, bg="#18181b", height=54, padx=16, pady=8)
        header.pack(fill="x", side="top")

        title_frame = tk.Frame(header, bg="#18181b")
        title_frame.pack(side="left")
        
        tk.Label(title_frame, text="⚡ WHATSAPP spy DESKTOP", font=("Segoe UI", 12, "bold"), fg="#22c55e", bg="#18181b").pack(anchor="w")
        tk.Label(title_frame, text="Multi-Device Forever Session • Groq LLaMA-3.1-8b-instant", font=("Segoe UI", 8), fg="#a1a1aa", bg="#18181b").pack(anchor="w")

        # Top Server URL & Refresh
        server_frame = tk.Frame(header, bg="#18181b")
        server_frame.pack(side="right")

        self.server_url_var = tk.StringVar(value=DEFAULT_API_URL)
        tk.Label(server_frame, text="Server:", fg="#71717a", bg="#18181b", font=("Segoe UI", 8)).pack(side="left", padx=4)
        server_entry = tk.Entry(server_frame, textvariable=self.server_url_var, width=24, bg="#27272a", fg="#ffffff", insertbackground="#ffffff", relief="flat")
        server_entry.pack(side="left", padx=4)
        
        btn_connect = tk.Button(server_frame, text="Connect", command=self.update_server_url, bg="#27272a", fg="#ffffff", relief="flat", font=("Segoe UI", 8))
        btn_connect.pack(side="left", padx=4)

        self.status_pill = tk.Label(server_frame, text="● CHECKING...", fg="#eab308", bg="#18181b", font=("Segoe UI", 9, "bold"))
        self.status_pill.pack(side="left", padx=8)

        # Tabbed Content Area
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill="both", expand=True, padx=12, pady=10)

        # Tabs
        self.tab_status = tk.Frame(self.notebook, bg="#121214")
        self.tab_groq_ai = tk.Frame(self.notebook, bg="#121214")
        self.tab_messages = tk.Frame(self.notebook, bg="#121214")
        self.tab_send = tk.Frame(self.notebook, bg="#121214")
        self.tab_session = tk.Frame(self.notebook, bg="#121214")
        self.tab_terminal = tk.Frame(self.notebook, bg="#121214")

        self.notebook.add(self.tab_status, text="  Dashboard & Pairing  ")
        self.notebook.add(self.tab_groq_ai, text="  🤖 Groq AI Auto-Reply  ")
        self.notebook.add(self.tab_messages, text="  💬 Live Messages  ")
        self.notebook.add(self.tab_send, text="  ✉️ Quick Send & Story  ")
        self.notebook.add(self.tab_session, text="  🔒 Forever Session Vault  ")
        self.notebook.add(self.tab_terminal, text="  💻 Console REPL  ")

        self.build_status_tab()
        self.build_groq_ai_tab()
        self.build_messages_tab()
        self.build_send_tab()
        self.build_session_tab()
        self.build_terminal_tab()

    # --- TAB 1: Status & Pairing ---
    def build_status_tab(self):
        container = tk.Frame(self.tab_status, bg="#121214", padx=16, pady=16)
        container.pack(fill="both", expand=True)

        # Left Column: Account Details
        left_col = tk.Frame(container, bg="#18181b", padx=16, pady=16, relief="solid", bd=1)
        left_col.pack(side="left", fill="both", expand=True, padx=(0, 8))

        tk.Label(left_col, text="WHATSAPP BOT STATE", font=("Segoe UI", 11, "bold"), fg="#22c55e", bg="#18181b").pack(anchor="w", pady=(0, 12))

        self.lbl_account_name = tk.Label(left_col, text="Name: Unknown", font=("Segoe UI", 10, "bold"), fg="#ffffff", bg="#18181b")
        self.lbl_account_name.pack(anchor="w", pady=2)

        self.lbl_account_phone = tk.Label(left_col, text="Phone: Not Linked", font=("Segoe UI", 9), fg="#a1a1aa", bg="#18181b")
        self.lbl_account_phone.pack(anchor="w", pady=2)

        self.lbl_account_jid = tk.Label(left_col, text="JID: N/A", font=("Segoe UI", 8), fg="#71717a", bg="#18181b")
        self.lbl_account_jid.pack(anchor="w", pady=2)

        self.lbl_account_bio = tk.Label(left_col, text="Bio/Status: N/A", font=("Segoe UI", 9), fg="#e4e4e7", bg="#18181b")
        self.lbl_account_bio.pack(anchor="w", pady=2)

        self.lbl_account_uptime = tk.Label(left_col, text="Uptime: 0s", font=("Segoe UI", 9), fg="#38bdf8", bg="#18181b")
        self.lbl_account_uptime.pack(anchor="w", pady=(8, 12))

        # Logout Button
        btn_logout = tk.Button(left_col, text="Disconnect / Logout", command=self.handle_logout, bg="#ef4444", fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=4)
        btn_logout.pack(anchor="w", pady=(8, 0))

        # Right Column: Phone Pairing Code Box
        right_col = tk.Frame(container, bg="#18181b", padx=16, pady=16, relief="solid", bd=1)
        right_col.pack(side="right", fill="both", expand=True, padx=(8, 0))

        tk.Label(right_col, text="LINK WHATSAPP PHONE NUMBER", font=("Segoe UI", 11, "bold"), fg="#38bdf8", bg="#18181b").pack(anchor="w", pady=(0, 8))
        tk.Label(right_col, text="Enter your full international phone number (e.g. +1234567890) to generate an official 8-digit Multi-Device Pairing Code.", font=("Segoe UI", 8), fg="#a1a1aa", bg="#18181b", wraplength=380, justify="left").pack(anchor="w", pady=(0, 10))

        pair_input_frame = tk.Frame(right_col, bg="#18181b")
        pair_input_frame.pack(fill="x", pady=4)

        self.phone_var = tk.StringVar()
        phone_entry = tk.Entry(pair_input_frame, textvariable=self.phone_var, font=("Segoe UI", 11), bg="#27272a", fg="#ffffff", insertbackground="#ffffff", relief="flat")
        phone_entry.pack(side="left", fill="x", expand=True, padx=(0, 6), ipady=4)

        btn_get_code = tk.Button(pair_input_frame, text="Generate 8-Digit Code", command=self.handle_generate_pairing_code, bg="#22c55e", fg="#09090b", font=("Segoe UI", 9, "bold"), relief="flat", padx=12, pady=4)
        btn_get_code.pack(side="right")

        # Code display box
        self.code_display_frame = tk.Frame(right_col, bg="#09090b", padx=12, pady=12, relief="solid", bd=1)
        self.code_display_frame.pack(fill="x", pady=14)

        self.lbl_code_value = tk.Label(self.code_display_frame, text="NO ACTIVE CODE", font=("Consolas", 18, "bold"), fg="#eab308", bg="#09090b")
        self.lbl_code_value.pack(pady=4)

        instructions = (
            "1. Open WhatsApp on your phone\n"
            "2. Tap Settings > Linked Devices > Link a Device\n"
            "3. Tap 'Link with phone number instead'\n"
            "4. Type the 8-digit code shown above"
        )
        tk.Label(self.code_display_frame, text=instructions, font=("Segoe UI", 8), fg="#71717a", bg="#09090b", justify="left").pack(anchor="w")

    # --- TAB 2: Groq AI Auto-Reply ---
    def build_groq_ai_tab(self):
        container = tk.Frame(self.tab_groq_ai, bg="#121214", padx=16, pady=16)
        container.pack(fill="both", expand=True)

        header_box = tk.Frame(container, bg="#18181b", padx=14, pady=12, relief="solid", bd=1)
        header_box.pack(fill="x", pady=(0, 12))

        self.ai_enabled_var = tk.BooleanVar(value=False)
        chk_ai = tk.Checkbutton(
            header_box,
            text="⚡ Enable Groq AI Auto-Reply (LLaMA-3.1-8b-instant)",
            variable=self.ai_enabled_var,
            command=self.handle_save_ai_config,
            font=("Segoe UI", 11, "bold"),
            fg="#22c55e",
            bg="#18181b",
            selectcolor="#09090b",
            activebackground="#18181b",
            activeforeground="#22c55e"
        )
        chk_ai.pack(anchor="w")

        tk.Label(
            header_box,
            text="When enabled, every incoming conversation receives intelligent contextual replies powered by Groq LLaMA-3.1 with multi-turn chat history context.",
            font=("Segoe UI", 8),
            fg="#a1a1aa",
            bg="#18181b"
        ).pack(anchor="w", pady=(4, 0))

        # Parameters Card
        params_box = tk.Frame(container, bg="#18181b", padx=14, pady=12, relief="solid", bd=1)
        params_box.pack(fill="x", pady=(0, 12))

        # Row 1: Model & Temperature
        r1 = tk.Frame(params_box, bg="#18181b")
        r1.pack(fill="x", pady=4)

        tk.Label(r1, text="AI Model:", fg="#e4e4e7", bg="#18181b", font=("Segoe UI", 9, "bold")).pack(side="left", padx=(0, 6))
        self.ai_model_var = tk.StringVar(value="llama-3.1-8b-instant")
        ent_model = tk.Entry(r1, textvariable=self.ai_model_var, width=24, bg="#27272a", fg="#ffffff", relief="flat")
        ent_model.pack(side="left", padx=(0, 16))

        tk.Label(r1, text="Temperature:", fg="#e4e4e7", bg="#18181b", font=("Segoe UI", 9, "bold")).pack(side="left", padx=(0, 6))
        self.ai_temp_var = tk.DoubleVar(value=0.4)
        ent_temp = tk.Entry(r1, textvariable=self.ai_temp_var, width=8, bg="#27272a", fg="#ffffff", relief="flat")
        ent_temp.pack(side="left", padx=(0, 16))

        # System Prompt Box
        prompt_box = tk.Frame(container, bg="#18181b", padx=14, pady=12, relief="solid", bd=1)
        prompt_box.pack(fill="both", expand=True)

        tk.Label(prompt_box, text="System Persona & Bot Prompt:", font=("Segoe UI", 9, "bold"), fg="#38bdf8", bg="#18181b").pack(anchor="w", pady=(0, 4))
        self.txt_system_prompt = scrolledtext.ScrolledText(prompt_box, height=8, bg="#09090b", fg="#e4e4e7", insertbackground="#ffffff", font=("Consolas", 9), relief="flat")
        self.txt_system_prompt.pack(fill="both", expand=True, pady=(0, 8))
        self.txt_system_prompt.insert("1.0", "You are an intelligent, polite, and helpful WhatsApp AI assistant. Keep responses concise, direct, helpful, and friendly (1-3 short paragraphs). Use bolding (*text*) for emphasis.")

        btn_save_prompt = tk.Button(prompt_box, text="💾 Save AI Settings & Sync to Bot", command=self.handle_save_ai_config, bg="#22c55e", fg="#09090b", font=("Segoe UI", 9, "bold"), relief="flat", padx=14, pady=6)
        btn_save_prompt.pack(side="right")

    # --- TAB 3: Messages ---
    def build_messages_tab(self):
        container = tk.Frame(self.tab_messages, bg="#121214", padx=12, pady=12)
        container.pack(fill="both", expand=True)

        top_ctrl = tk.Frame(container, bg="#121214")
        top_ctrl.pack(fill="x", pady=(0, 8))

        tk.Label(top_ctrl, text="LIVE INCOMING & OUTGOING STREAM", font=("Segoe UI", 10, "bold"), fg="#e4e4e7", bg="#121214").pack(side="left")
        
        btn_refresh_msg = tk.Button(top_ctrl, text="🔄 Refresh Messages", command=self.fetch_messages, bg="#27272a", fg="#ffffff", font=("Segoe UI", 8), relief="flat")
        btn_refresh_msg.pack(side="right", padx=4)

        btn_clear_msg = tk.Button(top_ctrl, text="🗑️ Clear Logs", command=self.handle_clear_messages, bg="#27272a", fg="#ef4444", font=("Segoe UI", 8), relief="flat")
        btn_clear_msg.pack(side="right", padx=4)

        # Message Listbox/Text
        self.txt_messages = scrolledtext.ScrolledText(container, bg="#09090b", fg="#e4e4e7", font=("Consolas", 9), relief="flat")
        self.txt_messages.pack(fill="both", expand=True)

    # --- TAB 4: Send & Story ---
    def build_send_tab(self):
        container = tk.Frame(self.tab_send, bg="#121214", padx=16, pady=16)
        container.pack(fill="both", expand=True)

        # Send Message Card
        send_card = tk.Frame(container, bg="#18181b", padx=14, pady=12, relief="solid", bd=1)
        send_card.pack(fill="x", pady=(0, 12))

        tk.Label(send_card, text="SEND DIRECT WHATSAPP MESSAGE", font=("Segoe UI", 10, "bold"), fg="#22c55e", bg="#18181b").pack(anchor="w", pady=(0, 6))

        r_rec = tk.Frame(send_card, bg="#18181b")
        r_rec.pack(fill="x", pady=2)
        tk.Label(r_rec, text="Recipient Phone / JID:", fg="#a1a1aa", bg="#18181b", font=("Segoe UI", 8)).pack(side="left", padx=(0, 8))
        self.send_to_var = tk.StringVar()
        ent_to = tk.Entry(r_rec, textvariable=self.send_to_var, width=30, bg="#27272a", fg="#ffffff", relief="flat")
        ent_to.pack(side="left", ipady=3)

        r_msg = tk.Frame(send_card, bg="#18181b")
        r_msg.pack(fill="x", pady=6)
        tk.Label(r_msg, text="Message Text:", fg="#a1a1aa", bg="#18181b", font=("Segoe UI", 8)).pack(anchor="w")
        self.txt_direct_msg = tk.Text(r_msg, height=3, bg="#09090b", fg="#ffffff", relief="flat")
        self.txt_direct_msg.pack(fill="x", pady=2)

        btn_send_now = tk.Button(send_card, text="📤 Send Message", command=self.handle_send_message, bg="#22c55e", fg="#09090b", font=("Segoe UI", 9, "bold"), relief="flat", padx=12, pady=4)
        btn_send_now.pack(anchor="e")

        # Post Status Story Card
        story_card = tk.Frame(container, bg="#18181b", padx=14, pady=12, relief="solid", bd=1)
        story_card.pack(fill="x")

        tk.Label(story_card, text="BROADCAST STATUS STORY", font=("Segoe UI", 10, "bold"), fg="#a855f7", bg="#18181b").pack(anchor="w", pady=(0, 6))
        self.txt_story = tk.Text(story_card, height=2, bg="#09090b", fg="#ffffff", relief="flat")
        self.txt_story.pack(fill="x", pady=2)

        btn_post_story = tk.Button(story_card, text="✨ Publish Status Story", command=self.handle_post_story, bg="#a855f7", fg="#ffffff", font=("Segoe UI", 9, "bold"), relief="flat", padx=12, pady=4)
        btn_post_story.pack(anchor="e", pady=(4, 0))

    # --- TAB 5: Session Vault ---
    def build_session_tab(self):
        container = tk.Frame(self.tab_session, bg="#121214", padx=16, pady=16)
        container.pack(fill="both", expand=True)

        vault_card = tk.Frame(container, bg="#18181b", padx=14, pady=12, relief="solid", bd=1)
        vault_card.pack(fill="x", pady=(0, 12))

        tk.Label(vault_card, text="🔒 PERSISTENT FOREVER SESSION VAULT", font=("Segoe UI", 11, "bold"), fg="#22c55e", bg="#18181b").pack(anchor="w", pady=(0, 4))
        tk.Label(vault_card, text="Your multi-device credentials, encryption keys, and tokens are stored in the persistent vault to stay logged in forever without re-scanning QR codes or re-entering phone numbers.", font=("Segoe UI", 8), fg="#a1a1aa", bg="#18181b", wraplength=700, justify="left").pack(anchor="w", pady=(0, 10))

        self.lbl_vault_status = tk.Label(vault_card, text="Checking vault...", font=("Segoe UI", 9), fg="#e4e4e7", bg="#18181b")
        self.lbl_vault_status.pack(anchor="w", pady=2)

        btn_row = tk.Frame(vault_card, bg="#18181b")
        btn_row.pack(fill="x", pady=8)

        btn_export = tk.Button(btn_row, text="🔑 Export Portable Token", command=self.handle_export_token, bg="#27272a", fg="#38bdf8", font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=4)
        btn_export.pack(side="left", padx=(0, 8))

        btn_reconnect = tk.Button(btn_row, text="🔄 Force Socket Reconnect", command=self.handle_force_reconnect, bg="#27272a", fg="#22c55e", font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=4)
        btn_reconnect.pack(side="left")

        # Import Token Card
        import_card = tk.Frame(container, bg="#18181b", padx=14, pady=12, relief="solid", bd=1)
        import_card.pack(fill="both", expand=True)

        tk.Label(import_card, text="IMPORT SESSION TOKEN (ZERO-LOGIN RESTORE)", font=("Segoe UI", 10, "bold"), fg="#eab308", bg="#18181b").pack(anchor="w", pady=(0, 4))
        self.txt_import_token = scrolledtext.ScrolledText(import_card, height=4, bg="#09090b", fg="#ffffff", font=("Consolas", 8), relief="flat")
        self.txt_import_token.pack(fill="both", expand=True, pady=4)

        btn_import = tk.Button(import_card, text="📥 Restore Session from Token", command=self.handle_import_token, bg="#eab308", fg="#09090b", font=("Segoe UI", 9, "bold"), relief="flat", padx=12, pady=4)
        btn_import.pack(anchor="e")

    # --- TAB 6: Terminal Console REPL ---
    def build_terminal_tab(self):
        container = tk.Frame(self.tab_terminal, bg="#121214", padx=12, pady=12)
        container.pack(fill="both", expand=True)

        self.txt_repl = scrolledtext.ScrolledText(container, bg="#09090b", fg="#22c55e", font=("Consolas", 9), relief="flat")
        self.txt_repl.pack(fill="both", expand=True, pady=(0, 6))

        cmd_row = tk.Frame(container, bg="#121214")
        cmd_row.pack(fill="x")

        tk.Label(cmd_row, text="Command:", fg="#71717a", bg="#121214").pack(side="left", padx=(0, 4))
        self.cmd_var = tk.StringVar()
        cmd_entry = tk.Entry(cmd_row, textvariable=self.cmd_var, bg="#27272a", fg="#ffffff", font=("Consolas", 10), insertbackground="#ffffff", relief="flat")
        cmd_entry.pack(side="left", fill="x", expand=True, padx=(0, 6), ipady=3)
        cmd_entry.bind("<Return>", lambda e: self.handle_exec_cmd())

        btn_exec = tk.Button(cmd_row, text="Execute", command=self.handle_exec_cmd, bg="#22c55e", fg="#09090b", font=("Segoe UI", 8, "bold"), relief="flat", padx=10)
        btn_exec.pack(side="right")

    # --- Sync & Handlers ---
    def update_server_url(self):
        url = self.server_url_var.get().strip()
        if url:
            self.client = WhatsAppClient(url)
            self.refresh_status()

    def start_background_sync(self):
        def loop():
            while self.auto_refresh_active:
                try:
                    self.refresh_status()
                    self.fetch_messages()
                except Exception:
                    pass
                time.sleep(4)

        t = threading.Thread(target=loop, daemon=True)
        t.start()

    def refresh_status(self):
        st = self.client.request("/api/whatsapp/status")
        if st.get("error"):
            self.status_pill.config(text="● OFFLINE", fg="#ef4444")
            return

        connected = st.get("connected", False)
        self.is_connected = connected

        if connected:
            self.status_pill.config(text="● CONNECTED", fg="#22c55e")
            self.lbl_account_name.config(text=f"Name: {st.get('userName') or 'WhatsApp Bot'}")
            self.lbl_account_phone.config(text=f"Phone: +{st.get('phoneNumber') or 'Unknown'}")
            self.lbl_account_jid.config(text=f"JID: {st.get('userJid') or 'N/A'}")
            self.lbl_account_bio.config(text=f"Bio: {st.get('userStatus') or 'Online'}")
            uptime = st.get("uptimeSeconds", 0)
            self.lbl_account_uptime.config(text=f"Uptime: {uptime}s (Forever Session Active)")
        else:
            state = st.get("state", "disconnected").upper()
            self.status_pill.config(text=f"● {state}", fg="#eab308")

        pair_code = st.get("pairingCode")
        if pair_code:
            self.lbl_code_value.config(text=pair_code, fg="#22c55e")
        elif not connected:
            self.lbl_code_value.config(text="READY TO PAIR", fg="#71717a")

    def fetch_messages(self):
        res = self.client.request("/api/whatsapp/messages?limit=40")
        msgs = res.get("messages", [])
        if msgs:
            text_block = ""
            for m in reversed(msgs):
                ts = time.strftime("%H:%M:%S", time.localtime(m.get("timestamp", 0) / 1000.0))
                dir_tag = "[SENT]" if m.get("fromMe") else "[RECV]"
                sender = m.get("senderName") or m.get("senderNumber") or "Unknown"
                text_block += f"[{ts}] {dir_tag} {sender}: {m.get('text')}\n"

            self.txt_messages.delete("1.0", "end")
            self.txt_messages.insert("end", text_block)
            self.txt_messages.see("end")

    def handle_generate_pairing_code(self):
        num = self.phone_var.get().strip()
        if not num:
            messagebox.showwarning("Warning", "Please enter a phone number with country code (e.g. +1234567890)")
            return

        res = self.client.request("/api/whatsapp/pair", method="POST", data={"phoneNumber": num})
        if res.get("success"):
            messagebox.showinfo("Pairing Code", f"Pairing Code requested!\nCheck the code display or your phone.")
            self.refresh_status()
        else:
            messagebox.showerror("Error", res.get("message") or "Failed to request code")

    def handle_save_ai_config(self):
        prompt = self.txt_system_prompt.get("1.0", "end").strip()
        enabled = self.ai_enabled_var.get()
        model = self.ai_model_var.get().strip()
        temp = self.ai_temp_var.get()

        data = {
            "aiAutoReplyEnabled": enabled,
            "aiProvider": "groq",
            "groqModel": model,
            "groqTemperature": temp,
            "aiSystemPrompt": prompt,
        }

        res = self.client.request("/api/whatsapp/config", method="POST", data=data)
        if res.get("success"):
            messagebox.showinfo("Success", f"Groq AI Auto-Reply configured! (Enabled: {enabled})")
        else:
            messagebox.showerror("Error", "Failed to update AI settings")

    def handle_send_message(self):
        to = self.send_to_var.get().strip()
        msg = self.txt_direct_msg.get("1.0", "end").strip()
        if not to or not msg:
            messagebox.showwarning("Warning", "Please provide recipient and message")
            return

        res = self.client.request("/api/whatsapp/send", method="POST", data={"recipient": to, "message": msg})
        if res.get("success"):
            self.txt_direct_msg.delete("1.0", "end")
            messagebox.showinfo("Sent", "Message sent successfully!")
        else:
            messagebox.showerror("Error", res.get("message") or "Failed to send message")

    def handle_post_story(self):
        story_text = self.txt_story.get("1.0", "end").strip()
        if not story_text:
            messagebox.showwarning("Warning", "Please enter status story text")
            return

        res = self.client.request("/api/whatsapp/story", method="POST", data={"text": story_text})
        if res.get("success"):
            self.txt_story.delete("1.0", "end")
            messagebox.showinfo("Published", "Status Story posted to WhatsApp!")
        else:
            messagebox.showerror("Error", res.get("message") or "Failed to post story")

    def handle_export_token(self):
        res = self.client.request("/api/whatsapp/session/export")
        token = res.get("token")
        if token:
            self.clipboard_clear()
            self.clipboard_append(token)
            messagebox.showinfo("Token Exported", "Session token copied to clipboard!\nYou can paste this into any WhatsApp bot instance to restore without login.")
        else:
            messagebox.showwarning("No Token", "No stored session token available.")

    def handle_force_reconnect(self):
        res = self.client.request("/api/whatsapp/session/reconnect", method="POST")
        messagebox.showinfo("Reconnecting", res.get("message") or "Socket reconnection triggered")

    def handle_import_token(self):
        tok = self.txt_import_token.get("1.0", "end").strip()
        if not tok:
            messagebox.showwarning("Warning", "Please paste your session token")
            return

        res = self.client.request("/api/whatsapp/session/import", method="POST", data={"token": tok})
        if res.get("success"):
            messagebox.showinfo("Restored", "Session restored successfully from token!")
            self.refresh_status()
        else:
            messagebox.showerror("Error", res.get("message") or "Failed to import session token")

    def handle_logout(self):
        if messagebox.askyesno("Confirm Logout", "Are you sure you want to log out and clear persistent credentials?"):
            res = self.client.request("/api/whatsapp/logout", method="POST")
            messagebox.showinfo("Logged Out", res.get("message") or "Logged out")
            self.refresh_status()

    def handle_exec_cmd(self):
        cmd = self.cmd_var.get().strip()
        if not cmd:
            return
        self.cmd_var.set("")
        self.txt_repl.insert("end", f"> {cmd}\n")
        self.txt_repl.see("end")

        def run():
            res = self.client.request("/api/whatsapp/command", method="POST", data={"command": cmd})
            msg = res.get("message", "Executed")
            self.txt_repl.insert("end", f"{msg}\n")
            self.txt_repl.see("end")

        threading.Thread(target=run, daemon=True).start()


if __name__ == "__main__":
    app = WhatsAppDesktopApp()
    app.mainloop()
