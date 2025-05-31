#!/bin/bash

# Keycloak SPA Deployment Script
# This script automates the build and deployment process

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
BUILD_IMAGE=true
DEPLOY_HELM=true
IMAGE_TAG="latest"
REGISTRY=""
NAMESPACE="default"
HELM_RELEASE_NAME="keycloak-spa"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy Keycloak SPA application to Kubernetes

OPTIONS:
    -e, --environment ENV    Target environment (dev|prod) [default: dev]
    -t, --tag TAG           Docker image tag [default: latest]
    -r, --registry REGISTRY Docker registry URL
    -n, --namespace NS      Kubernetes namespace [default: default]
    -l, --release NAME      Helm release name [default: keycloak-spa]
    --skip-build           Skip Docker image build
    --skip-deploy          Skip Helm deployment
    --build-only           Only build Docker image
    --deploy-only          Only deploy with Helm
    -h, --help             Show this help message

EXAMPLES:
    # Deploy to development environment
    $0 -e dev

    # Deploy to production with custom tag
    $0 -e prod -t v1.2.3 -r your-registry.io

    # Only build Docker image
    $0 --build-only -t v1.2.3

    # Only deploy with existing image
    $0 --deploy-only -e prod

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -r|--registry)
            REGISTRY="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -l|--release)
            HELM_RELEASE_NAME="$2"
            shift 2
            ;;
        --skip-build)
            BUILD_IMAGE=false
            shift
            ;;
        --skip-deploy)
            DEPLOY_HELM=false
            shift
            ;;
        --build-only)
            BUILD_IMAGE=true
            DEPLOY_HELM=false
            shift
            ;;
        --deploy-only)
            BUILD_IMAGE=false
            DEPLOY_HELM=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ "$ENVIRONMENT" != "dev" && "$ENVIRONMENT" != "prod" ]]; then
    print_error "Environment must be 'dev' or 'prod'"
    exit 1
fi

# Set image name
if [[ -n "$REGISTRY" ]]; then
    IMAGE_NAME="$REGISTRY/keycloak-spa:$IMAGE_TAG"
else
    IMAGE_NAME="keycloak-spa:$IMAGE_TAG"
fi

print_status "Starting deployment process..."
print_status "Environment: $ENVIRONMENT"
print_status "Image: $IMAGE_NAME"
print_status "Namespace: $NAMESPACE"
print_status "Helm Release: $HELM_RELEASE_NAME"

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Docker is available
if ! command -v docker &> /dev/null && [[ "$BUILD_IMAGE" == true ]]; then
    print_error "Docker is required but not installed"
    exit 1
fi

# Check if Helm is available
if ! command -v helm &> /dev/null && [[ "$DEPLOY_HELM" == true ]]; then
    print_error "Helm is required but not installed"
    exit 1
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null && [[ "$DEPLOY_HELM" == true ]]; then
    print_error "kubectl is required but not installed"
    exit 1
fi

# Build Docker image
if [[ "$BUILD_IMAGE" == true ]]; then
    print_status "Building Docker image..."
    
    # Build the application first
    print_status "Building the application..."
    bun run build
    
    # Build Docker image
    docker build -t "$IMAGE_NAME" .
    
    if [[ $? -eq 0 ]]; then
        print_success "Docker image built successfully: $IMAGE_NAME"
    else
        print_error "Failed to build Docker image"
        exit 1
    fi
    
    # Push to registry if specified
    if [[ -n "$REGISTRY" ]]; then
        print_status "Pushing image to registry..."
        docker push "$IMAGE_NAME"
        
        if [[ $? -eq 0 ]]; then
            print_success "Image pushed successfully to registry"
        else
            print_error "Failed to push image to registry"
            exit 1
        fi
    fi
fi

# Deploy with Helm
if [[ "$DEPLOY_HELM" == true ]]; then
    print_status "Deploying with Helm..."
    
    # Check if namespace exists
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        print_status "Creating namespace: $NAMESPACE"
        kubectl create namespace "$NAMESPACE"
    fi
    
    # Set values file based on environment
    VALUES_FILE="helm/keycloak-spa/values-$ENVIRONMENT.yaml"
    
    if [[ ! -f "$VALUES_FILE" ]]; then
        print_warning "Values file not found: $VALUES_FILE"
        print_status "Using default values.yaml"
        VALUES_FILE="helm/keycloak-spa/values.yaml"
    fi
    
    # Prepare Helm command
    HELM_ARGS=(
        "upgrade" "$HELM_RELEASE_NAME" "helm/keycloak-spa"
        "--install"
        "--namespace" "$NAMESPACE"
        "--values" "$VALUES_FILE"
        "--set" "image.repository=${IMAGE_NAME%:*}"
        "--set" "image.tag=$IMAGE_TAG"
        "--wait"
        "--timeout" "300s"
    )
    
    # Add registry if specified
    if [[ -n "$REGISTRY" ]]; then
        HELM_ARGS+=("--set" "image.repository=$REGISTRY/keycloak-spa")
    fi
    
    # Run Helm upgrade/install
    print_status "Running Helm deployment..."
    helm "${HELM_ARGS[@]}"
    
    if [[ $? -eq 0 ]]; then
        print_success "Helm deployment completed successfully"
        
        # Show deployment status
        print_status "Deployment status:"
        kubectl get pods -n "$NAMESPACE" -l "app.kubernetes.io/name=keycloak-spa"
        
        print_status "Service information:"
        kubectl get svc -n "$NAMESPACE" -l "app.kubernetes.io/name=keycloak-spa"
        
        # Show ingress if enabled
        if kubectl get ingress -n "$NAMESPACE" "$HELM_RELEASE_NAME" &> /dev/null; then
            print_status "Ingress information:"
            kubectl get ingress -n "$NAMESPACE" "$HELM_RELEASE_NAME"
        fi
        
    else
        print_error "Helm deployment failed"
        exit 1
    fi
fi

print_success "Deployment process completed successfully!"

# Show next steps
cat << EOF

${GREEN}🎉 Deployment Summary:${NC}
- Environment: $ENVIRONMENT
- Image: $IMAGE_NAME
- Namespace: $NAMESPACE
- Helm Release: $HELM_RELEASE_NAME

${BLUE}📋 Next Steps:${NC}
1. Check application logs: kubectl logs -n $NAMESPACE -l app.kubernetes.io/name=keycloak-spa
2. Monitor deployment: kubectl get pods -n $NAMESPACE -w
3. Access application via ingress or port-forward

${YELLOW}🔧 Useful Commands:${NC}
- View logs: kubectl logs -n $NAMESPACE deployment/$HELM_RELEASE_NAME
- Port forward: kubectl port-forward -n $NAMESPACE svc/$HELM_RELEASE_NAME 8080:80
- Update deployment: helm upgrade $HELM_RELEASE_NAME helm/keycloak-spa -n $NAMESPACE
- Rollback: helm rollback $HELM_RELEASE_NAME -n $NAMESPACE

EOF
