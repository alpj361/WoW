#!/bin/bash
set -e

echo "🚀 Starting Collaborative Map Backend..."

# Check if .env exists, if not use environment variables
if [ ! -f ".env" ]; then
    echo "📝 Creating .env from environment variables..."
    cat > .env << EOF
OUTSCRAPER_API_KEY=${OUTSCRAPER_API_KEY:-}
EXA_API_KEY=${EXA_API_KEY:-}
SUPADATA_API_KEY=${SUPADATA_API_KEY:-}
CACHE_DURATION=${CACHE_DURATION:-3600}
MAX_RESULTS_PER_QUERY=${MAX_RESULTS_PER_QUERY:-20}
DEFAULT_COUNTRY=${DEFAULT_COUNTRY:-Guatemala}
DEFAULT_LANGUAGE=${DEFAULT_LANGUAGE:-es}
EOF
fi

echo "✅ Environment configured"
echo "📦 Cache directory: $(ls -la cache/ 2>/dev/null || echo 'Creating...')"

# Ensure cache directory exists and is writable
mkdir -p cache
chmod 777 cache

echo "🌐 Starting Apache on port ${PORT:-80}..."

# If PORT is set (Render), update Apache to listen on that port
if [ ! -z "$PORT" ]; then
    echo "🔧 Configuring Apache for port $PORT"
    sed -i "s/80/$PORT/g" /etc/apache2/sites-available/000-default.conf
    sed -i "s/Listen 80/Listen $PORT/g" /etc/apache2/ports.conf
fi

# Start Apache
exec apache2-foreground
