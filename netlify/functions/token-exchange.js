/**
 * GitHub OAuth Token Exchange Proxy
 * Securely exchanges GitHub OAuth authorization codes for access tokens
 * without exposing the client secret in browser-based applications
 */

const allowedOrigins = [
  'https://uor-foundation.github.io',
  'https://uormcp.netlify.app',
  'https://uor-mcp.netlify.app',
  'http://localhost:3000',
  'http://localhost:8080',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8080'
];

exports.handler = async function(event, context) {
  const origin = event.headers.origin || event.headers.Origin || '';
  const isAllowedOrigin = allowedOrigins.includes(origin) || origin.endsWith('.netlify.app');
  
  const headers = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }
  
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        success: false,
        error: 'Method not allowed' 
      })
    };
  }
  
  try {
    const body = JSON.parse(event.body);
    const { code, client_id, redirect_uri } = body;
    
    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Authorization code is required' 
        })
      };
    }
    
    if (!client_id) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Client ID is required' 
        })
      };
    }
    
    const client_secret = process.env.GITHUB_CLIENT_SECRET || 
                         process.env.GITHUB_CLIENT_SECRET_KEY || 
                         process.env.GH_CLIENT_SECRET ||
                         process.env.GITHUB_SECRET;
    
    console.log('Netlify Function Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NETLIFY: process.env.NETLIFY,
      CONTEXT: process.env.CONTEXT,
      DEPLOY_URL: process.env.DEPLOY_URL,
      SITE_NAME: process.env.SITE_NAME
    });
    
    console.log('Environment variable names that might contain secrets:', 
      Object.keys(process.env)
        .filter(key => 
          key.toLowerCase().includes('secret') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('key') ||
          key.toLowerCase().includes('auth') ||
          key.toLowerCase().includes('github')
        )
        .sort()
    );
    
    if (!client_secret) {
      console.error('GitHub client secret environment variable is not set');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: 'Server configuration error: GitHub client secret is not set',
          details: 'Please check Netlify environment variables configuration'
        })
      };
    }
    
    console.log('Token exchange request:', { 
      code_length: code ? code.length : 0,
      client_id,
      redirect_uri,
      has_secret: !!client_secret
    });
    
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code
      })
    });
    
    const data = await response.json();
    
    console.log('GitHub OAuth response:', {
      status: response.status,
      has_error: !!data.error,
      error: data.error,
      error_description: data.error_description
    });
    
    if (data.error) {
      console.error('GitHub API error:', data.error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          error: data.error,
          error_description: data.error_description 
        })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        ...data
      })
    };
  } catch (error) {
    console.error('Token exchange error:', error);
    
    const sanitizedError = error.message.replace(/token|secret|key/gi, '***');
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to exchange authorization code for token',
        details: sanitizedError
      })
    };
  }
};
