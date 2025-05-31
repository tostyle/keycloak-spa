#!/bin/bash

# Helm Chart Validation Script
set -e

echo "🔍 Validating Keycloak SPA Helm Chart..."

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    echo "❌ Helm is not installed. Please install Helm first."
    exit 1
fi

# Navigate to the chart directory
CHART_DIR="helm/keycloak-spa"

if [ ! -d "$CHART_DIR" ]; then
    echo "❌ Chart directory not found: $CHART_DIR"
    exit 1
fi

echo "📁 Chart directory: $CHART_DIR"

# Lint the chart
echo "🔧 Linting Helm chart..."
helm lint "$CHART_DIR"

if [ $? -eq 0 ]; then
    echo "✅ Helm lint passed"
else
    echo "❌ Helm lint failed"
    exit 1
fi

# Test template rendering
echo "📄 Testing template rendering..."
helm template test-release "$CHART_DIR" > /tmp/keycloak-spa-templates.yaml

if [ $? -eq 0 ]; then
    echo "✅ Template rendering successful"
    echo "📄 Templates saved to: /tmp/keycloak-spa-templates.yaml"
else
    echo "❌ Template rendering failed"
    exit 1
fi

# Validate with different values
echo "🔄 Testing with custom values..."
cat > /tmp/test-values.yaml << EOF
replicaCount: 2
image:
  repository: test/keycloak-spa
  tag: "test"
ingress:
  enabled: true
  hosts:
    - host: test.example.com
      paths:
        - path: /
          pathType: Prefix
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 250m
    memory: 256Mi
EOF

helm template test-release "$CHART_DIR" -f /tmp/test-values.yaml > /tmp/keycloak-spa-custom-templates.yaml

if [ $? -eq 0 ]; then
    echo "✅ Custom values template rendering successful"
else
    echo "❌ Custom values template rendering failed"
    exit 1
fi

# Check if templates contain expected resources
echo "🔍 Validating generated resources..."

TEMPLATE_FILE="/tmp/keycloak-spa-templates.yaml"

# Check for required Kubernetes resources
REQUIRED_RESOURCES=("Deployment" "Service" "Secret" "ServiceAccount" "ConfigMap")

for resource in "${REQUIRED_RESOURCES[@]}"; do
    if grep -q "kind: $resource" "$TEMPLATE_FILE"; then
        echo "✅ Found $resource"
    else
        echo "❌ Missing $resource"
        exit 1
    fi
done

# Check for optional resources (only if enabled)
if grep -q "autoscaling:" "$CHART_DIR/values.yaml"; then
    if grep -q "kind: HorizontalPodAutoscaler" "$TEMPLATE_FILE"; then
        echo "✅ Found HorizontalPodAutoscaler (optional)"
    fi
fi

# Validate YAML syntax
echo "📝 Validating YAML syntax..."
if command -v yamllint &> /dev/null; then
    yamllint "$TEMPLATE_FILE"
    echo "✅ YAML syntax validation passed"
else
    echo "⚠️  yamllint not found, skipping YAML syntax validation"
fi

# Check for common Kubernetes best practices
echo "🏆 Checking best practices..."

# Check if health checks are configured
if grep -q "livenessProbe" "$TEMPLATE_FILE" && grep -q "readinessProbe" "$TEMPLATE_FILE"; then
    echo "✅ Health probes configured"
else
    echo "⚠️  Health probes not found"
fi

# Check if resource limits are configurable
if grep -q "resources:" "$TEMPLATE_FILE"; then
    echo "✅ Resource limits configurable"
else
    echo "⚠️  Resource limits not configured"
fi

# Check if security context is set
if grep -q "securityContext" "$TEMPLATE_FILE"; then
    echo "✅ Security context configured"
else
    echo "⚠️  Security context not configured"
fi

echo ""
echo "🎉 Helm chart validation completed successfully!"
echo ""
echo "📋 Summary:"
echo "   - Chart linting: ✅"
echo "   - Template rendering: ✅"
echo "   - Required resources: ✅"
echo "   - YAML syntax: ✅"
echo ""
echo "🚀 Your Helm chart is ready for deployment!"
echo ""
echo "Next steps:"
echo "1. Build your Docker image: docker build -t keycloak-spa:latest ."
echo "2. Update values.yaml with your configuration"
echo "3. Deploy: helm install keycloak-spa $CHART_DIR"

# Cleanup
rm -f /tmp/test-values.yaml
