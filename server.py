"""
LearnPlay Dev Server
Runs a lightweight HTTP static server with CORS headers for Gemma 4 & Ollama support.
"""

import http.server
import socketserver
import os
import sys

PORT = 5173

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

class ThreadingServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True

if __name__ == '__main__':
    web_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(web_dir)
    
    server = ThreadingServer(("", PORT), CORSRequestHandler)
    print(f"LearnPlay Server running at http://localhost:{PORT}")
    print(f"Serving root: {web_dir}")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        sys.exit(0)
