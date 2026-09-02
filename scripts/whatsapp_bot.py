#!/usr/bin/env python3
"""
====================================================================
 WhatsApp Multi-Device Automation spy & Terminal Management CLI
====================================================================
Features:
 - Link with Phone Number (8-digit Pairing Code, no QR scan needed)
 - Profile Management (Change Name, About Bio, Profile Picture)
 - WhatsApp Status Story Broadcaster (status@broadcast)
 - Automated Message Auto-Replies & Gemini AI smart assistant
 - Live Real-Time Incoming Message Stream Listener
 - Interactive Terminal Shell & Batch Scriptable CLI
 - This Software is made by Apex.
====================================================================
"""

import sys
import os
import json
import time
import argparse
import urllib.request
import urllib.parse
import urllib.error
import threading
from colorama import Fore
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    UNDERLINE = '\033[4m'
    RESET = '\033[0m'
    BG_EMERALD = '\033[42m\033[30m'

DEFAULT_API_URL = os.environ.get("WHATSAPP_BOT_URL", "http://localhost:4044" if os.environ.get("PORT") == "4044" else "http://localhost:3000")

def print_banner():
    banner = f"""{Colors.CYAN}
  ██╗    ██╗██╗  ██╗ █████╗ ████████╗███████╗ █████╗ ██████╗ ██████╗ 
  ██║    ██║██║  ██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗
  ██║ █╗ ██║███████║███████║   ██║   ███████╗███████║██████╔╝██████╔╝
  ██║███╗██║██╔══██║██╔══██║   ██║   ╚════██║██╔══██║██╔═══╝ ██╔═══╝ 
  ╚███╔███╔╝██║  ██║██║  ██║   ██║   ███████║██║  ██║██║     ██║     
   ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝     
{Colors.BOLD}{Colors.GREEN}   >>> WhatsApp Multi-Device Terminal spy (Python Edition) <<<{Colors.RESET}
{Colors.DIM}   • Auth: Link with Phone Number (8-digit Pairing Code)
   • Profile & Status Manager | Automated AI Auto-Replies | Live Listener{Colors.RESET}
"""
    print(banner)
    print(Fore.RED + 'This Software is made by Apex Developers Team!')
class WhatsAppBotClient:
    def __init__(self, base_url=DEFAULT_API_URL):
        self.base_url = base_url.rstrip("/")

    def _request(self, endpoint, method="GET", data=None):
        url = f"{self.base_url}{endpoint}"
        headers = {"Content-Type": "application/json"}
        req_data = json.dumps(data).encode("utf-8") if data else None

        req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                res_body = response.read().decode("utf-8")
                return json.loads(res_body)
        except urllib.error.URLError as e:
            return {"success": False, "error": f"Connection error to {url}: {e}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_status(self):
        return self._request("/api/whatsapp/status")

    def link_with_number(self, phone_number):
        return self._request("/api/whatsapp/pair", method="POST", data={"phoneNumber": phone_number})

    def update_profile_name(self, name):
        return self._request("/api/whatsapp/profile/name", method="POST", data={"name": name})

    def update_profile_status(self, status_bio):
        return self._request("/api/whatsapp/profile/status", method="POST", data={"status": status_bio})

    def post_status_story(self, text, background_color="#075E54", font=1):
        return self._request("/api/whatsapp/story", method="POST", data={
            "text": text,
            "backgroundColor": background_color,
            "font": font
        })

    def send_message(self, phone_number, message_text):
        return self._request("/api/whatsapp/send", method="POST", data={
            "recipient": phone_number,
            "message": message_text
        })

    def get_messages(self, limit=50):
        return self._request(f"/api/whatsapp/messages?limit={limit}")

    def get_session_status(self):
        return self._request("/api/whatsapp/session")

    def export_session(self):
        return self._request("/api/whatsapp/session/export")

    def import_session(self, token):
        return self._request("/api/whatsapp/session/import", method="POST", data={"token": token})

    def reconnect_session(self):
        return self._request("/api/whatsapp/session/reconnect", method="POST")

    def get_rules(self):
        return self._request("/api/whatsapp/rules")

    def add_rule(self, name, trigger, reply_text, match_type="contains"):
        return self._request("/api/whatsapp/rules", method="POST", data={
            "name": name,
            "matchType": match_type,
            "triggerPattern": trigger,
            "replyText": reply_text,
            "applyTo": "all",
            "delaySeconds": 1,
            "priority": 5,
            "enabled": True
        })

    def toggle_ai(self, enabled=True):
        return self._request("/api/whatsapp/config", method="POST", data={"aiAutoReplyEnabled": enabled})

    def exec_command(self, cmd_line):
        return self._request("/api/whatsapp/command", method="POST", data={"command": cmd_line})

    def logout(self):
        return self._request("/api/whatsapp/logout", method="POST")

def cmd_link(client, phone_number):
    print(f"\n{Colors.CYAN}[*] Requesting WhatsApp Pairing Code for {Colors.BOLD}+{phone_number}{Colors.RESET}...")
    res = client.link_with_number(phone_number)
    
    if not res.get("success", False) and "error" in res:
        print(f"{Colors.RED}[!] Failed: {res.get('error') or res.get('message')}{Colors.RESET}")
        return

    print(f"{Colors.YELLOW}[*] Waiting for WhatsApp multi-device handshake...{Colors.RESET}")
    
    # Poll for pairing code
    for _ in range(12):
        time.sleep(1.5)
        st = client.get_status()
        if st.get("connected"):
            print(f"\n{Colors.GREEN}{Colors.BOLD}[✓] WhatsApp Connected! User: {st.get('userName')} ({st.get('userJid')}){Colors.RESET}")
            return
        code = st.get("pairingCode")
        if code:
            print(f"\n{Colors.BG_EMERALD} >>> PAIRING CODE: {code} <<< {Colors.RESET}")
            print(f"\n{Colors.BOLD}Instructions:{Colors.RESET}")
            print(f" 1. Open WhatsApp on your phone")
            print(f" 2. Tap {Colors.BOLD}Settings > Linked Devices > Link a Device{Colors.RESET}")
            print(f" 3. Tap {Colors.CYAN}\"Link with phone number instead\"{Colors.RESET}")
            print(f" 4. Type the 8-digit code: {Colors.BOLD}{Colors.YELLOW}{code}{Colors.RESET}\n")
            break

def cmd_session(client):
    meta = client.get_session_status()
    print(f"\n{Colors.BOLD}=== PERSISTENT SESSION VAULT ==={Colors.RESET}")
    is_stored = meta.get("isStored", False)
    stored_str = f"{Colors.GREEN}YES (Auto-reconnect without login active){Colors.RESET}" if is_stored else f"{Colors.RED}NO (Not linked){Colors.RESET}"
    print(f" • Stored Session   : {stored_str}")
    print(f" • Linked Account   : {meta.get('userName') or 'N/A'} (+{meta.get('phoneNumber') or 'N/A'})")
    print(f" • Stored Auth Keys : {meta.get('keysCount', 0)} cryptographic key files")
    print(f" • Credentials Size : {meta.get('credsSize', 0) / 1024.0:.1f} KB")
    print(f" • Last Snapshot    : {meta.get('storedAt') or 'N/A'}\n")

def cmd_session_export(client):
    res = client.export_session()
    if res.get("success") and res.get("token"):
        print(f"\n{Colors.BG_EMERALD} >>> PORTABLE WHATSAPP SESSION TOKEN <<< {Colors.RESET}")
        print(f"{Colors.GREEN}{Colors.BOLD}{res.get('token')}{Colors.RESET}\n")
        print(f"{Colors.CYAN}To restore this session anywhere: python whatsapp_bot.py --session-import \"<TOKEN>\"{Colors.RESET}\n")
    else:
        print(f"{Colors.RED}[!] No stored session credentials found to export.{Colors.RESET}")

def cmd_session_import(client, token):
    print(f"\n{Colors.CYAN}[*] Importing session credentials token...{Colors.RESET}")
    res = client.import_session(token)
    if res.get("success"):
        print(f"{Colors.GREEN}[✓] {res.get('message')}{Colors.RESET}")
    else:
        print(f"{Colors.RED}[!] Failed to import session: {res.get('message') or res.get('error')}{Colors.RESET}")

def cmd_status(client):
    st = client.get_status()
    print(f"\n{Colors.BOLD}=== WHATSAPP BOT STATUS ==={Colors.RESET}")
    is_conn = st.get("connected", False)
    state_str = f"{Colors.GREEN}CONNECTED (Online){Colors.RESET}" if is_conn else f"{Colors.RED}{st.get('state', 'DISCONNECTED').upper()}{Colors.RESET}"
    
    print(f" • Connection State : {state_str}")
    print(f" • Account Name     : {st.get('userName') or 'N/A'}")
    print(f" • Account JID      : {st.get('userJid') or 'N/A'}")
    print(f" • Status Bio       : {st.get('userStatus') or 'N/A'}")
    print(f" • Pairing Code     : {st.get('pairingCode') or 'None'}")
    print(f" • Uptime           : {st.get('uptimeSeconds', 0)} seconds\n")

def cmd_listen(client):
    print(f"\n{Colors.CYAN}{Colors.BOLD}[*] Starting Real-Time Incoming Message Listener... (Ctrl+C to stop){Colors.RESET}\n")
    seen_ids = set()
    try:
        while True:
            res = client.get_messages(limit=20)
            messages = res.get("messages", []) if isinstance(res, dict) else []
            for msg in reversed(messages):
                mid = msg.get("id")
                if mid and mid not in seen_ids:
                    seen_ids.add(mid)
                    ts = time.strftime('%H:%M:%S', time.localtime(msg.get('timestamp', 0) / 1000.0))
                    direction = f"{Colors.MAGENTA}[OUT]{Colors.RESET}" if msg.get("fromMe") else f"{Colors.GREEN}[IN]{Colors.RESET}"
                    sender = msg.get("senderName") or msg.get("senderNumber")
                    num = msg.get("senderNumber")
                    text = msg.get("text", "")
                    print(f"[{ts}] {direction} {Colors.BOLD}+{num}{Colors.RESET} ({sender}): {text}")
            time.sleep(2)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}[*] Listener stopped.{Colors.RESET}")

def interactive_shell(client):
    print_banner()
    print(f"{Colors.YELLOW}Type 'help' to view all commands, or 'exit' to quit.{Colors.RESET}\n")
    
    while True:
        try:
            prompt = f"{Colors.BOLD}{Colors.GREEN}whatsapp-bot{Colors.CYAN}> {Colors.RESET}"
            user_input = input(prompt).strip()
            if not user_input:
                continue

            if user_input.lower() in ("exit", "quit"):
                print(f"{Colors.YELLOW}Goodbye!{Colors.RESET}")
                break

            if user_input.lower() == "help":
                print(f"""
{Colors.BOLD}Commands:{Colors.RESET}
  {Colors.YELLOW}link <phone_number>{Colors.RESET}         Request 8-digit WhatsApp Pairing Code
  {Colors.YELLOW}status{Colors.RESET}                      Check bot connection & account info
  {Colors.YELLOW}session{Colors.RESET}                     Show persistent session vault status
  {Colors.YELLOW}session export{Colors.RESET}              Export portable session token
  {Colors.YELLOW}session import <token>{Colors.RESET}      Import session token without login
  {Colors.YELLOW}reconnect{Colors.RESET}                   Force socket reconnect
  {Colors.YELLOW}profile name <text>{Colors.RESET}         Update WhatsApp account display name
  {Colors.YELLOW}profile about <text>{Colors.RESET}        Update WhatsApp Bio / About text
  {Colors.YELLOW}story <text>{Colors.RESET}                Post status/story broadcast to WhatsApp
  {Colors.YELLOW}send <number> <msg>{Colors.RESET}         Send message to a phone number
  {Colors.YELLOW}listen{Colors.RESET}                      Start live incoming message listener
  {Colors.YELLOW}rules{Colors.RESET}                       List auto-reply rules
  {Colors.YELLOW}rules add <kw> <msg>{Colors.RESET}        Add new auto-reply rule
  {Colors.YELLOW}ai <on|off>{Colors.RESET}                 Toggle Gemini AI smart replies
  {Colors.YELLOW}logout{Colors.RESET}                      Disconnect WhatsApp session
  {Colors.YELLOW}clear{Colors.RESET}                       Clear screen
""")
                continue

            if user_input.lower() == "clear":
                os.system("cls" if os.name == "nt" else "clear")
                print_banner()
                continue

            parts = user_input.split(" ")
            cmd = parts[0].lower()

            if cmd == "link":
                if len(parts) < 2:
                    print(f"{Colors.RED}Usage: link <phone_number> (e.g. link +1234567890){Colors.RESET}")
                else:
                    cmd_link(client, parts[1])
            elif cmd == "status":
                cmd_status(client)
            elif cmd == "session":
                if len(parts) >= 2 and parts[1].lower() == "export":
                    cmd_session_export(client)
                elif len(parts) >= 3 and parts[1].lower() == "import":
                    token = " ".join(parts[2:])
                    cmd_session_import(client, token)
                else:
                    cmd_session(client)
            elif cmd in ("reconnect", "reload"):
                print(f"{Colors.CYAN}[*] Reconnecting persistent session socket...{Colors.RESET}")
                res = client.reconnect_session()
                print(f"{Colors.GREEN}[✓] {res.get('message')}{Colors.RESET}")
            elif cmd == "listen":
                cmd_listen(client)
            elif cmd == "profile":
                if len(parts) < 3:
                    print(f"{Colors.RED}Usage: profile <name|about> <value>{Colors.RESET}")
                elif parts[1].lower() == "name":
                    val = " ".join(parts[2:])
                    res = client.update_profile_name(val)
                    print(f"{Colors.GREEN}[✓] {res.get('message')}{Colors.RESET}")
                elif parts[1].lower() in ("about", "bio", "status"):
                    val = " ".join(parts[2:])
                    res = client.update_profile_status(val)
                    print(f"{Colors.GREEN}[✓] {res.get('message')}{Colors.RESET}")
            elif cmd == "story":
                if len(parts) < 2:
                    print(f"{Colors.RED}Usage: story <message_to_broadcast>{Colors.RESET}")
                else:
                    val = " ".join(parts[1:])
                    res = client.post_status_story(val)
                    print(f"{Colors.GREEN}[✓] {res.get('message')}{Colors.RESET}")
            elif cmd == "send":
                if len(parts) < 3:
                    print(f"{Colors.RED}Usage: send <phone_number> <message>{Colors.RESET}")
                else:
                    target = parts[1]
                    msg = " ".join(parts[2:])
                    res = client.send_message(target, msg)
                    print(f"{Colors.GREEN}[✓] {res.get('message')}{Colors.RESET}")
            elif cmd == "rules":
                if len(parts) >= 4 and parts[1].lower() == "add":
                    kw = parts[2]
                    rep = " ".join(parts[3:])
                    res = client.add_rule(f"Rule ({kw})", kw, rep)
                    print(f"{Colors.GREEN}[✓] Added auto-reply rule for '{kw}'{Colors.RESET}")
                else:
                    rules_res = client.get_rules()
                    rules = rules_res.get("rules", [])
                    print(f"\n{Colors.BOLD}Auto-Reply Rules ({len(rules)}):{Colors.RESET}")
                    for r in rules:
                        status = f"{Colors.GREEN}ON{Colors.RESET}" if r.get("enabled") else f"{Colors.RED}OFF{Colors.RESET}"
                        print(f" • [{status}] Trigger: '{Colors.YELLOW}{r.get('triggerPattern')}{Colors.RESET}' -> Reply: '{r.get('replyText') or '(AI Response)'}'")
                    print()
            elif cmd == "ai":
                if len(parts) >= 2 and parts[1].lower() in ("on", "off"):
                    on = parts[1].lower() == "on"
                    client.toggle_ai(on)
                    print(f"{Colors.GREEN}[✓] AI Smart Auto-Reply set to {on}{Colors.RESET}")
                else:
                    print(f"{Colors.RED}Usage: ai <on|off>{Colors.RESET}")
            elif cmd == "logout":
                res = client.logout()
                print(f"{Colors.YELLOW}[✓] {res.get('message')}{Colors.RESET}")
            else:
                # Forward to server command interpreter
                res = client.exec_command(user_input)
                if not res.get("success", False) and "error" in res:
                    print(f"{Colors.RED}[!] {res.get('error')}{Colors.RESET}")

        except (KeyboardInterrupt, EOFError):
            print(f"\n{Colors.YELLOW}Exiting shell...{Colors.RESET}")
            break

def main():
    parser = argparse.ArgumentParser(description="WhatsApp Multi-Device Automation Bot CLI (Link with Number, Profile, Status, Auto-Replies)")
    parser.add_argument("--url", default=DEFAULT_API_URL, help="WhatsApp bot server URL (default: http://localhost:3000)")
    parser.add_argument("--link", metavar="NUMBER", help="Link WhatsApp with Phone Number and generate 8-digit Pairing Code")
    parser.add_argument("--status", action="store_true", help="Check WhatsApp bot connection status and account details")
    parser.add_argument("--session-status", action="store_true", help="Check persistent session vault health and storage details")
    parser.add_argument("--session-export", action="store_true", help="Export portable session token for zero-login backup/migration")
    parser.add_argument("--session-import", metavar="TOKEN", help="Import session token and restore connection without pairing code")
    parser.add_argument("--reconnect", action="store_true", help="Force reconnect persistent WhatsApp session socket")
    parser.add_argument("--profile-name", metavar="NAME", help="Change WhatsApp account display name")
    parser.add_argument("--profile-status", metavar="BIO", help="Change WhatsApp Bio / About status text")
    parser.add_argument("--story", metavar="TEXT", help="Post status/story broadcast to WhatsApp status@broadcast")
    parser.add_argument("--send", metavar="NUMBER", help="Send a WhatsApp message (requires --message)")
    parser.add_argument("--message", metavar="TEXT", help="Message content to send with --send")
    parser.add_argument("--listen", action="store_true", help="Start real-time incoming message stream listener")
    parser.add_argument("--rules", action="store_true", help="List all auto-reply rules")
    parser.add_argument("--ai", choices=["on", "off"], help="Enable or disable Gemini AI smart auto-replies")
    parser.add_argument("-i", "--interactive", action="store_true", help="Start interactive command line terminal shell")

    args = parser.parse_args()
    client = WhatsAppBotClient(args.url)

    # If specific flags were passed, execute and exit
    if args.link:
        cmd_link(client, args.link)
    elif args.status:
        cmd_status(client)
    elif args.session_status:
        cmd_session(client)
    elif args.session_export:
        cmd_session_export(client)
    elif args.session_import:
        cmd_session_import(client, args.session_import)
    elif args.reconnect:
        res = client.reconnect_session()
        print(f"[✓] {res.get('message')}")
    elif args.profile_name:
        res = client.update_profile_name(args.profile_name)
        print(f"[✓] {res.get('message')}")
    elif args.profile_status:
        res = client.update_profile_status(args.profile_status)
        print(f"[✓] {res.get('message')}")
    elif args.story:
        res = client.post_status_story(args.story)
        print(f"[✓] {res.get('message')}")
    elif args.send:
        if not args.message:
            print("[!] Error: --message is required when using --send")
            sys.exit(1)
        res = client.send_message(args.send, args.message)
        print(f"[✓] {res.get('message')}")
    elif args.listen:
        cmd_listen(client)
    elif args.rules:
        r_res = client.get_rules()
        for r in r_res.get("rules", []):
            print(f"• Trigger: {r.get('triggerPattern')} -> Reply: {r.get('replyText')}")
    elif args.ai:
        client.toggle_ai(args.ai == "on")
        print(f"[✓] AI Auto-Reply turned {args.ai.upper()}")
    else:
        # Default to interactive shell
        interactive_shell(client)

if __name__ == "__main__":
    main()
