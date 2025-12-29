# Login Adapter System

This document describes the login adapter system for the XenForo Media Crawler application.

## Overview

The login adapter system provides a flexible way to handle different login flows for various XenForo sites. Each site
can use a different login adapter depending on its specific authentication requirements.

## Architecture

### Components

1. **ILoginAdapter Interface** (`login-adapter.interface.ts`)
    - Defines the contract for all login adapters
    - Methods:
        - `login()`: Performs site-specific login
        - `getName()`: Returns adapter name

2. **BaseLoginAdapter** (`base-login-adapter.ts`)
    - Abstract base class with common utility methods
    - Provides:
        - CSRF token extraction
        - Cookie management
        - Common patterns for XenForo sites

3. **Concrete Adapters**
    - **XamvnCloneLoginAdapter**: Default adapter for standard XenForo installations
    - **XamVNComLoginAdapter**: Specific adapter for xamvn.com with custom flow

### Factory Pattern

The `getLoginAdapter()` factory function creates adapter instances based on the `LoginAdapterType` enum:

```typescript
const adapter = getLoginAdapter(LoginAdapterType.XAMVN_CLONE);
```

## Available Adapters

### 1. XamvnCloneLoginAdapter (`xamvn-clone`)

**Use Case**: Standard XenForo installations and most clones

**Login Flow**:

1. GET `/login/` to retrieve login page and initial cookies
2. Extract CSRF token from HTML
3. POST credentials to `/login/login`
4. Handle cookies from response

**Compatible Sites**: Most standard XenForo sites

### 2. XamVNComLoginAdapter (`xamvn-com`)

**Use Case**: xamvn.com specific implementation

**Login Flow**:

1. GET `/` (homepage) to establish session
2. GET `/login/` to retrieve login page
3. Extract CSRF token
4. POST credentials to `/login/login`
5. Follow redirects to complete authentication

**Compatible Sites**: xamvn.com

## Adding a New Site

When creating a new site, specify the login adapter type:

```typescript
const site = {
  name: "My Site",
  url: "https://example.com",
  loginAdapter: "xamvn-clone" // or "xamvn-com"
};
```

## Creating a New Login Adapter

To add support for a new site with custom login flow:

### 1. Create Adapter Class

Create a new file in `apps/backend/src/xenforo_crawler/adapters/`:

```typescript
// my-site-login.adapter.ts
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { Response } from 'express';
import { BaseLoginAdapter } from './base-login-adapter';

export class MySiteLoginAdapter extends BaseLoginAdapter {
  getName(): string {
    return 'MySiteLoginAdapter';
  }

  async login(
    username: string,
    password: string,
    axiosInstance: AxiosInstance,
    siteUrl: string,
    expressResponse?: Response,
  ): Promise<AxiosResponse> {
    // Implement site-specific login flow
    // 1. Fetch necessary pages
    // 2. Extract tokens
    // 3. Submit login
    // 4. Handle cookies and redirects
  }
}
```

### 2. Register Adapter

Update `apps/backend/src/xenforo_crawler/adapters/index.ts`:

```typescript
// Add to enum
export enum LoginAdapterType {
  XAMVN_CLONE = 'xamvn-clone',
  XAMVN_COM = 'xamvn-com',
  MY_SITE = 'my-site', // Add this
}

// Add to factory
export function getLoginAdapter(type: LoginAdapterType): ILoginAdapter {
  switch (type) {
    case LoginAdapterType.XAMVN_CLONE:
      return new XamvnCloneLoginAdapter();
    case LoginAdapterType.XAMVN_COM:
      return new XamVNComLoginAdapter();
    case LoginAdapterType.MY_SITE:
      return new MySiteLoginAdapter(); // Add this
    default:
      throw new Error(`Unknown login adapter type: ${type}`);
  }
}
```

### 3. Update Controller

Add new adapter info to `xenforo_crawler.controller.ts`:

```typescript
@Get('/login-adapters')
public async listLoginAdapters(): Promise<LoginAdaptersResponseDto> {
  return {
    adapters: [
      // ... existing adapters
      {
        key: 'my-site',
        name: 'My Site',
        description: 'Specific adapter for my custom site',
      },
    ],
  };
}
```

### 4. Update Type Mapping

Add mapping in `xenforo_client.service.ts`:

```typescript
private getLoginAdapterByType(adapterType: string): ILoginAdapter {
  const typeMap: Record<string, LoginAdapterType> = {
    'xamvn-clone': LoginAdapterType.XAMVN_CLONE,
    'xamvn-com': LoginAdapterType.XAMVN_COM,
    'my-site': LoginAdapterType.MY_SITE, // Add this
  };
  // ...
}
```

## Database Migration

To add the `loginAdapter` column to existing databases, run:

```sql
ALTER TABLE Site
ADD COLUMN loginAdapter VARCHAR(50) NOT NULL DEFAULT 'xamvn-clone'
AFTER url;
```

Or use the migration file:

```bash
mysql -u username -p database_name < apps/backend/src/database/migrations/001_add_login_adapter_to_site.sql
```

## API Endpoints

### List Available Adapters

```
GET /api/xenforo-crawler/login-adapters
```

Response:

```json
{
  "adapters": [
    {
      "key": "xamvn-clone",
      "name": "XamVN Clone (Standard XenForo)",
      "description": "Works with standard XenForo installations and most clones"
    },
    {
      "key": "xamvn-com",
      "name": "XamVN.com",
      "description": "Specific adapter for xamvn.com site with custom login flow"
    }
  ]
}
```

### Login with Adapter

The login endpoint automatically uses the adapter specified in the site's configuration:

```
POST /api/xenforo-crawler/login
Body: {
  "username": "user",
  "password": "pass",
  "siteId": 1
}
```

## Best Practices

1. **Reuse Base Adapter Methods**: Use `extractCsrfToken()` and `setCookiesFromResponse()` from `BaseLoginAdapter`
2. **Handle Redirects**: Follow HTTP redirects appropriately for your site
3. **Cookie Management**: Ensure all cookies are properly saved and sent
4. **Error Handling**: Provide clear error messages for debugging
5. **Logging**: Use `console.log()` to log important steps for debugging

## Troubleshooting

### Login Fails

- Check if the correct adapter is selected for the site
- Verify CSRF token extraction is working
- Ensure cookies are being saved and sent correctly
- Check for site-specific requirements (e.g., additional headers, captcha)

### Adapter Not Found

- Verify the adapter key matches the enum value
- Check that the adapter is registered in the factory function
- Ensure the site's `loginAdapter` field is set correctly
