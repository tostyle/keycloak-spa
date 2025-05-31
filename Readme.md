# Keycloak SPA Integration

A full-stack single-page application (SPA) demonstrating secure authentication and authorization using Keycloak as an identity provider. This project showcases best practices for integrating OpenID Connect (OIDC) authentication with a modern React frontend and Express backend.

## Tech Stack

### Runtime & Package Management

- **Bun**: High-performance JavaScript/TypeScript runtime
- **pnpm**: Fast, disk space efficient package manager

### Frontend

- **React 19**: UI library
- **Vite**: Next generation frontend tooling
- **TypeScript**: Type-safe JavaScript

### Backend

- **Express.js**: Web framework for Node.js
- **TypeScript**: For type-safe server code
- **Passport.js**: Authentication middleware
- **OIDC**: OpenID Connect implementation

### Authentication

- **Keycloak**: Open-source identity and access management
- **Passport-OpenIDConnect**: OIDC strategy for Passport

### Development Tools

- **Bun Watch Mode**: Built-in file watcher for automatic server restarts
- **TypeScript**: Static typing for JavaScript
- **dotenv**: Environment variable management

## Project Structure

```
/
├── src/                  # React frontend source code
│   ├── components/       # React components
│   ├── App.jsx           # Main React application
│   └── main.jsx          # React entry point
├── server.ts             # Express server with OIDC authentication
├── index.html            # HTML entry point
├── vite.config.js        # Vite configuration
└── tsconfig.json         # TypeScript configuration
```

## Prerequisites

- Node.js 16+ or [Bun](https://bun.sh/) installed
- [pnpm](https://pnpm.io/) installed (`npm install -g pnpm`)
- [Keycloak](https://www.keycloak.org/) server running (default: localhost:9880)
- A configured Keycloak realm and client (default realm: "tostyle", client: "backoffice")

## Environment Setup

Create a `.env` file in the root directory:

```
# Server
PORT=4001
SESSION_SECRET=your_session_secret

# Keycloak OIDC Configuration
OIDC_ISSUER=http://localhost:9880/realms/tostyle
OIDC_AUTH_URL=http://localhost:9880/realms/tostyle/protocol/openid-connect/auth
OIDC_TOKEN_URL=http://localhost:9880/realms/tostyle/protocol/openid-connect/token
OIDC_USER_INFO_URL=http://localhost:9880/realms/tostyle/protocol/openid-connect/userinfo
OIDC_CLIENT_ID=backoffice
OIDC_CLIENT_SECRET=your_client_secret
OIDC_CALLBACK_URL=http://localhost:4001/auth/callback
```

## Installation

```bash
# Install dependencies
pnpm install
```

## Development

```bash
# Start development server with Bun's built-in watch mode
bun run start:dev
```

This will:

1. Start the Express server with TypeScript compilation using Bun
2. Load the Vite middleware for React hot module replacement
3. Watch for changes and automatically restart the server (using Bun's native watch mode)

## Building for Production

```bash
# Build frontend and backend
pnpm run build

# Start production server
pnpm start:prod
```

## Authentication Flow

1. User visits the application
2. User clicks "Login"
3. User is redirected to Keycloak login page
4. After successful login, user is redirected back to the application
5. The application receives and stores authentication tokens
6. Protected routes check for valid session before granting access

## Kubernetes Deployment

This application includes a complete Helm chart for Kubernetes deployment with production-ready configurations.

### Quick Start with Helm

1. **Build and deploy** (automated):
   ```bash
   # Development deployment
   ./deploy.sh -e dev

   # Production deployment with custom image tag
   ./deploy.sh -e prod -t v1.0.0 -r your-registry.io
   ```

2. **Manual deployment**:
   ```bash
   # Build Docker image
   docker build -t keycloak-spa:latest .

   # Deploy with Helm
   helm install keycloak-spa helm/keycloak-spa

   # Or upgrade existing deployment
   helm upgrade keycloak-spa helm/keycloak-spa
   ```

### Deployment Features

- **Health Checks**: Liveness and readiness probes
- **Auto-scaling**: Horizontal Pod Autoscaler support
- **Security**: Non-root containers, security contexts
- **Secrets Management**: Kubernetes secrets for sensitive data
- **Ingress**: NGINX ingress with TLS support
- **Multi-Environment**: Separate values files for dev/prod

### Environment Configuration

The Helm chart supports multiple environments:

- `values-dev.yaml`: Development configuration
- `values-prod.yaml`: Production configuration with security hardening

### Kubernetes Resources

The Helm chart creates:
- **Deployment**: Application pods with health checks
- **Service**: Internal service for pod communication  
- **Ingress**: External traffic routing with TLS
- **Secret**: Secure storage for OIDC credentials
- **ConfigMap**: Non-sensitive configuration
- **ServiceAccount**: Kubernetes RBAC
- **HorizontalPodAutoscaler**: Auto-scaling (optional)

### Monitoring and Health Checks

- **Liveness Probe**: `/health` - Basic application health
- **Readiness Probe**: `/ready` - Application readiness for traffic
- **Health Check Interval**: Configurable via Helm values

### Deployment Scripts

- `deploy.sh`: Complete deployment automation
- `validate-helm.sh`: Helm chart validation
- Package.json scripts for Docker and Helm operations

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Key Features

- Secure authentication via OIDC/OAuth2
- Session management with Express
- TypeScript for type safety
- Integrated Vite dev server for fast frontend development
- Hot module replacement for React components
- Production-ready Kubernetes deployment
- Docker containerization with multi-stage builds
- Helm chart for easy Kubernetes management

## License

ISC
