# Keycloak SPA Kubernetes Deployment Guide

## Prerequisites

1. **Kubernetes cluster** (minikube, kind, or cloud provider)
2. **Helm 3.x** installed
3. **Docker** for building images
4. **kubectl** configured to access your cluster

## Build and Deploy Steps

### 1. Build the Docker Image

```bash
# Build the Docker image
docker build -t keycloak-spa:latest .

# If using minikube, load the image into minikube
minikube image load keycloak-spa:latest

# Or push to a registry (replace with your registry)
docker tag keycloak-spa:1.0.0 your-registry/keycloak-spa:1.0.0
docker push your-registry/keycloak-spa:1.0.0
```

### 2. Configure Values

Edit `helm/keycloak-spa/values.yaml` to match your environment:

```yaml
image:
  repository: keycloak-spa # or your-registry/keycloak-spa
  tag: "1.0.0"

ingress:
  enabled: true
  className: "nginx" # or your ingress class
  hosts:
    - host: keycloak-spa.local # or your domain
      paths:
        - path: /
          pathType: Prefix

secrets:
  sessionSecret: "your-strong-session-secret"
  oidc:
    issuer: "http://your-keycloak-domain/realms/your-realm"
    authorizeUrl: "http://your-keycloak-domain/realms/your-realm/protocol/openid-connect/auth"
    tokenUrl: "http://your-keycloak-domain/realms/your-realm/protocol/openid-connect/token"
    userinfoUrl: "http://your-keycloak-domain/realms/your-realm/protocol/openid-connect/userinfo"
    clientId: "your-client-id"
    clientSecret: "your-client-secret"
    callbackUrl: "http://keycloak-spa.local/auth/callback"
```

### 3. Deploy with Helm

```bash
# Lint the chart
helm lint helm/keycloak-spa

# Test template rendering
helm template keycloak-spa helm/keycloak-spa

# Install the application
helm install keycloak-spa helm/keycloak-spa

# Or upgrade if already installed
helm upgrade keycloak-spa helm/keycloak-spa
```

### 4. Access the Application

```bash
# Check deployment status
kubectl get pods -l app.kubernetes.io/name=keycloak-spa

# Get service information
kubectl get svc keycloak-spa

# If using port-forward for testing
kubectl port-forward svc/keycloak-spa 8080:80

# Then access: http://localhost:8080
```

### 5. Configure DNS/Ingress

For production, configure your DNS to point to the ingress controller:

```bash
# Get ingress information
kubectl get ingress keycloak-spa

# Add to /etc/hosts for testing (replace with actual IP)
echo "192.168.49.2 keycloak-spa.local" >> /etc/hosts
```

## Environment Variables

The following environment variables are used:

- `NODE_ENV`: production/development
- `PORT`: Application port (default: 4001)
- `SESSION_SECRET`: Session encryption secret
- `OIDC_ISSUER`: Keycloak realm issuer URL
- `OIDC_AUTHORIZE_URL`: OIDC authorization endpoint
- `OIDC_TOKEN_URL`: OIDC token endpoint
- `OIDC_USERINFO_URL`: OIDC userinfo endpoint
- `OIDC_CLIENT_ID`: OIDC client ID
- `OIDC_CLIENT_SECRET`: OIDC client secret
- `OIDC_CALLBACK_URL`: OIDC callback URL

## Health Checks

The application provides health check endpoints:

- **Liveness**: `/health` - Basic application health
- **Readiness**: `/ready` - Application readiness for traffic

## Troubleshooting

### Check logs

```bash
kubectl logs -l app.kubernetes.io/name=keycloak-spa
```

### Check secrets

```bash
kubectl get secret keycloak-spa-secret -o yaml
```

### Debug pod

```bash
kubectl exec -it deployment/keycloak-spa -- /bin/sh
```

### Common Issues

1. **Image pull errors**: Ensure the image is available in the specified registry
2. **OIDC configuration**: Verify Keycloak client configuration matches
3. **DNS/Ingress**: Check ingress controller and DNS configuration
4. **Secrets**: Ensure all required secrets are properly set

## Production Considerations

1. Use proper secrets management (not plaintext in values.yaml)
2. Configure TLS/SSL certificates
3. Set appropriate resource limits and requests
4. Configure monitoring and logging
5. Use a proper container registry
6. Implement proper RBAC
7. Configure network policies if needed
