#!/usr/bin/env python3
"""
Made by Apex Cyber security Team
WhatsApp spy Web App - Cross-Platform Auto Localhost Runner
Automatically validates Node.js, installs npm modules if needed,
sets PORT=4044, launches the default browser, and runs the web app.
"""
import os
import sys
import subprocess
import time
import webbrowser
import shutil
import threading
from colorama import Fore 
PORT = 4044
URL = f"http://localhost:{PORT}"

def main():
    print("=" * 64)
    print(Fore.RED + f"  WhatsApp spy Web App - Auto Localhost Runner")
    print(f"  Target: {URL}")
    print("=" * 64)

    # Check for node and npm
    if not shutil.which("node") or not shutil.which("npm"):
        print("\n[ERROR] Node.js and npm are required to run the web application.")
        print("Please install Node.js 18+ from https://nodejs.org\n")
        input("Press Enter to exit...")
        sys.exit(1)

    # Auto-install npm dependencies if missing
    if not os.path.exists("node_modules"):
        print("\n[1/3] Apex: Dependencies missing. Running 'npm install' automatically...")
        res = subprocess.run(["npm", "install"], shell=True)
        if res.returncode != 0:
            print("\n[ERROR] 'npm install' failed.")
            input("Press Enter to exit...")
            sys.exit(1)
    else:
        print("\n[1/3] Dependencies found (node_modules ready).")

    print(f"[2/3] Apex is Setting server environment to PORT {PORT}...")
    env = os.environ.copy()
    env["PORT"] = str(PORT)

    # Launch browser after slight delay
    def open_browser():
        time.sleep(2.5)
        print(f"[3/3] Launching web browser to {URL}...")
        try:
            webbrowser.open(URL)
        except Exception:
            pass

    threading.Thread(target=open_browser, daemon=True).start()

    print(f"\n🚀 WhatsApp spy Web Server running on {URL}")
    print("Press Ctrl+C in this terminal to stop the server.\n")

    try:
        cmd = ["npx", "tsx", "server.ts"]
        subprocess.run(cmd, env=env, shell=True)
    except KeyboardInterrupt:
        print("\n[INFO] WhatsApp spy Web App stopped.")

if __name__ == "__main__":
    main()
