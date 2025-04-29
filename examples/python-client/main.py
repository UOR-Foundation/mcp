"""
UOR-MCP Python Client Example

This example demonstrates how to use the UOR-MCP API with Python.
It shows how to authenticate with GitHub, initialize the MCP connection,
and perform basic UOR operations.
"""

import os
import json
import random
import string
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
import requests
import threading
import time

config = {
    "github_client_id": os.environ.get("GITHUB_CLIENT_ID"),
    "token_exchange_proxy": os.environ.get("TOKEN_EXCHANGE_PROXY"),
    "mcp_endpoint": "https://68113dd199a34737508b5211--uor-mcp.netlify.app/mcp",
    "redirect_uri": "http://localhost:3000/callback",
    "port": 3000
}

access_token = None
server = None
auth_event = threading.Event()

class OAuthCallbackHandler(BaseHTTPRequestHandler):
    """Handler for OAuth callback requests."""
    
    def do_GET(self):
        """Handle GET requests to the callback endpoint."""
        global access_token
        
        if self.path.startswith('/callback'):
            import urllib.parse
            query = urllib.parse.urlparse(self.path).query
            params = dict(urllib.parse.parse_qsl(query))
            
            if 'code' in params and 'state' in params:
                code = params['code']
                state = params['state']
                
                if state != server.state:
                    self.send_response(400)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    self.wfile.write(b'Invalid state parameter')
                    return
                
                try:
                    token_response = requests.post(
                        config["token_exchange_proxy"],
                        data={
                            'code': code,
                            'client_id': config["github_client_id"],
                            'redirect_uri': config["redirect_uri"],
                        },
                        headers={'Content-Type': 'application/x-www-form-urlencoded'}
                    )
                    
                    token_data = token_response.json()
                    access_token = token_data.get('access_token')
                    
                    if access_token:
                        self.send_response(200)
                        self.send_header('Content-type', 'text/html')
                        self.end_headers()
                        self.wfile.write(b'Authentication successful! You can close this window.')
                        auth_event.set()
                    else:
                        self.send_response(500)
                        self.send_header('Content-type', 'text/html')
                        self.end_headers()
                        self.wfile.write(b'Failed to obtain access token')
                except Exception as e:
                    print(f"Error exchanging code for token: {e}")
                    self.send_response(500)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()
                    self.wfile.write(f'Error: {str(e)}'.encode('utf-8'))
            else:
                self.send_response(400)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(b'Missing code or state parameter')
        else:
            self.send_response(404)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b'Not found')
    
    def log_message(self, format, *args):
        """Suppress log messages."""
        return


def start_auth_flow():
    """Start the GitHub OAuth flow."""
    global server
    
    print('Starting GitHub OAuth flow...')
    
    state = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
    
    server = HTTPServer(('localhost', config["port"]), OAuthCallbackHandler)
    server.state = state
    
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = True
    server_thread.start()
    
    auth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={config['github_client_id']}"
        f"&redirect_uri={config['redirect_uri']}"
        f"&state={state}"
        f"&scope=repo"
    )
    webbrowser.open(auth_url)
    
    auth_event.wait()
    
    server.shutdown()
    server_thread.join()
    
    return access_token


def initialize_mcp():
    """Initialize MCP connection."""
    print('Initializing MCP connection...')
    
    request = {
        "jsonrpc": "2.0",
        "method": "initialize",
        "params": {},
        "id": 1
    }
    
    response = requests.post(
        config["mcp_endpoint"],
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        },
        json=request
    )
    
    data = response.json()
    print('MCP initialized with capabilities:')
    print(json.dumps(data["result"]["capabilities"], indent=2))
    return data["result"]["capabilities"]


def list_tools():
    """List available tools."""
    print('Listing available tools...')
    
    request = {
        "jsonrpc": "2.0",
        "method": "tools/list",
        "params": {},
        "id": 2
    }
    
    response = requests.post(
        config["mcp_endpoint"],
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        },
        json=request
    )
    
    data = response.json()
    print('Available tools:')
    print(json.dumps(data["result"]["tools"], indent=2))
    return data["result"]["tools"]


def create_uor_object(type_name, data):
    """Create a UOR object."""
    print(f"Creating UOR object of type '{type_name}'...")
    
    request = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "tool": "createUOR",
            "parameters": {
                "type": type_name,
                "data": data
            }
        },
        "id": 3
    }
    
    response = requests.post(
        config["mcp_endpoint"],
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {access_token}'
        },
        json=request
    )
    
    data = response.json()
    print('Created UOR object:')
    print(json.dumps(data["result"], indent=2))
    return data["result"]


def main():
    """Main function."""
    if not config["github_client_id"] or not config["token_exchange_proxy"]:
        print('Error: GITHUB_CLIENT_ID and TOKEN_EXCHANGE_PROXY environment variables must be set')
        print('Example usage:')
        print('GITHUB_CLIENT_ID=your_client_id TOKEN_EXCHANGE_PROXY=your_proxy_url python main.py')
        return
    
    try:
        token = start_auth_flow()
        if not token:
            print('Authentication failed')
            return
        
        print(f'Authentication successful! Token: {token[:5]}...')
        
        capabilities = initialize_mcp()
        
        tools = list_tools()
        
        uor_object = create_uor_object('concept', {
            'name': 'Example Concept',
            'description': 'This is an example concept created with the Python client'
        })
        
        print('Example completed successfully!')
    except Exception as e:
        print(f'Error: {e}')


if __name__ == '__main__':
    main()
