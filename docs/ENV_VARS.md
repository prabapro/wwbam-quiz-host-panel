# Guide for using Infisical Secret Manager for Environment Variables

## Setup

1. Configure the secrets in [Infisical](https://app.infisical.com/secret-manager)
2. Run `infisical login` to authenticate
3. Run `infisical init` - This will generate `.infisical.json` - Safe to commit to version control
4. To inject the environment variables => `pnpm dev:env` (Actual command => `infisical run -- pnpm dev`)

## Example Infisical Secrets Configuration

```
VITE_API_URL=https://api.example.com      # Client-side accessible
VITE_APP_NAME=My React App                # Client-side accessible
DATABASE_URL=postgresql://user:pass@host  # Server-side only
API_SECRET_KEY=secret123                  # Server-side only
DEV_SERVER_PORT=3000                      # Vite config only
```

**Note**: Only variables prefixed with `VITE_` are accessible in client-side code.

## Referencing Env Variables Examples

### Vite Config Example

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: process.env.DEV_SERVER_PORT || 3000,
    proxy: {
      '/api': {
        target: process.env.API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

### App.jsx Example

```jsx
// src/App.jsx
import { useState } from 'react';

function App() {
  const [data, setData] = useState(null);

  const fetchData = async () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    const response = await fetch(`${apiUrl}/users`);
    const result = await response.json();
    setData(result);
  };

  return (
    <div>
      <h1>{import.meta.env.VITE_APP_NAME}</h1>
      <p>Environment: {import.meta.env.MODE}</p>
      <button onClick={fetchData}>Fetch Data</button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}

export default App;
```

### Netlify Functions Example

```javascript
// netlify/functions/api.js
export const handler = async (event, context) => {
  // Access any environment variable (no VITE_ prefix needed)
  const databaseUrl = process.env.DATABASE_URL;
  const apiKey = process.env.API_SECRET_KEY;
  const publicApiUrl = process.env.VITE_API_URL;

  try {
    // Your function logic here
    const response = await fetch(`${publicApiUrl}/external-api`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Success' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

## Syncing Secrets to Netlify

1. Go to Infisical Secrets UI > Integrations > Native Integrations > Add Integrations > Netlify
2. Authorize Netlify OAuth
3. Select the site & Integrate
4. All the secrets stored in Infisical vault will be uploaded into Netlify
