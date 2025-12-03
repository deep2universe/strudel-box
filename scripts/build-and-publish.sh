#!/bin/bash

# =============================================================================
# Strudel Box - Build and Publish Script
# =============================================================================
# This script builds the VS Code extension and publishes it to:
# - VS Code Marketplace (marketplace.visualstudio.com)
# - Open VSX Registry (open-vsx.org)
#
# Prerequisites:
# - Node.js 18+ and npm
# - vsce: npm install -g @vscode/vsce
# - ovsx: npm install -g ovsx
# - VS Code Marketplace PAT: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
# - Open VSX Token: https://open-vsx.org/user-settings/tokens
#
# Usage:
#   ./scripts/build-and-publish.sh [command]
#
# Commands:
#   build     - Build extension only (creates .vsix file)
#   publish   - Build and publish to both marketplaces
#   vscode    - Publish to VS Code Marketplace only
#   openvsx   - Publish to Open VSX only
#   clean     - Remove build artifacts
#   check     - Verify prerequisites and configuration
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Change to project root
cd "$PROJECT_ROOT"

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        log_error "$1 is not installed"
        return 1
    fi
    return 0
}

# =============================================================================
# Check Prerequisites
# =============================================================================

check_prerequisites() {
    local target="${1:-all}"  # all, vscode, openvsx, or build
    
    log_info "Checking prerequisites..."
    
    local missing=0
    
    # Check Node.js
    if check_command node; then
        local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$node_version" -lt 18 ]; then
            log_error "Node.js 18+ required (found v$node_version)"
            missing=1
        else
            log_success "Node.js $(node -v)"
        fi
    else
        missing=1
    fi
    
    # Check npm
    if check_command npm; then
        log_success "npm $(npm -v)"
    else
        missing=1
    fi
    
    # Check vsce (needed for build and vscode publish)
    if check_command vsce; then
        log_success "vsce $(vsce --version)"
    else
        log_warning "vsce not found. Install with: npm install -g @vscode/vsce"
        missing=1
    fi
    
    # Check ovsx only if needed for openvsx or full publish
    if [ "$target" = "all" ] || [ "$target" = "openvsx" ]; then
        if check_command ovsx; then
            log_success "ovsx $(ovsx --version)"
        else
            log_warning "ovsx not found. Install with: npm install -g ovsx"
            if [ "$target" = "openvsx" ]; then
                missing=1
            fi
        fi
    fi
    
    # Check for tokens based on target
    if [ "$target" = "all" ] || [ "$target" = "vscode" ]; then
        if [ -z "$VSCE_PAT" ]; then
            log_warning "VSCE_PAT environment variable not set (needed for VS Code Marketplace)"
        fi
    fi
    
    if [ "$target" = "all" ] || [ "$target" = "openvsx" ]; then
        if [ -z "$OVSX_PAT" ]; then
            log_warning "OVSX_PAT environment variable not set (needed for Open VSX)"
        fi
    fi
    
    return $missing
}

# =============================================================================
# Verify Package Configuration
# =============================================================================

verify_package() {
    log_info "Verifying package.json configuration..."
    
    local errors=0
    
    # Check required fields
    local publisher=$(node -p "require('./package.json').publisher || ''")
    if [ -z "$publisher" ]; then
        log_error "Missing 'publisher' field in package.json"
        errors=1
    else
        log_success "Publisher: $publisher"
    fi
    
    local name=$(node -p "require('./package.json').name")
    log_info "Extension name: $name"
    
    local version=$(node -p "require('./package.json').version")
    log_info "Version: $version"
    
    local icon=$(node -p "require('./package.json').icon || ''")
    if [ -z "$icon" ]; then
        log_warning "Missing 'icon' field in package.json (recommended for marketplace)"
    elif [ ! -f "$icon" ]; then
        log_error "Icon file not found: $icon"
        errors=1
    else
        log_success "Icon: $icon"
    fi
    
    local license=$(node -p "require('./package.json').license || ''")
    if [ -z "$license" ]; then
        log_warning "Missing 'license' field in package.json"
    else
        log_success "License: $license"
    fi
    
    local repository=$(node -p "require('./package.json').repository?.url || require('./package.json').repository || ''")
    if [ -z "$repository" ]; then
        log_warning "Missing 'repository' field in package.json"
    else
        log_success "Repository: $repository"
    fi
    
    # Check LICENSE file
    if [ ! -f "LICENSE" ] && [ ! -f "LICENSE.md" ] && [ ! -f "LICENSE.txt" ]; then
        log_warning "No LICENSE file found"
    else
        log_success "LICENSE file exists"
    fi
    
    # Check README
    if [ ! -f "README.md" ]; then
        log_error "README.md not found"
        errors=1
    else
        log_success "README.md exists"
    fi
    
    return $errors
}

# =============================================================================
# Clean Build Artifacts
# =============================================================================

clean() {
    log_info "Cleaning build artifacts..."
    
    rm -rf dist/
    rm -rf webview-ui/dist/
    rm -rf out/
    rm -f *.vsix
    
    log_success "Clean complete"
}

# =============================================================================
# Install Dependencies
# =============================================================================

install_deps() {
    log_info "Installing dependencies..."
    
    # Root dependencies
    npm ci
    
    # Webview dependencies
    cd webview-ui
    npm ci
    cd ..
    
    log_success "Dependencies installed"
}

# =============================================================================
# Build Extension
# =============================================================================

build_extension() {
    log_info "Building extension..."
    
    # Build webview first
    log_info "Building webview UI..."
    cd webview-ui
    npm run build
    cd ..
    
    # Build extension
    log_info "Building extension host..."
    npm run package
    
    log_success "Extension built successfully"
}

# =============================================================================
# Package Extension
# =============================================================================

package_extension() {
    log_info "Packaging extension..."
    
    # Get version from package.json
    local version=$(node -p "require('./package.json').version")
    local name=$(node -p "require('./package.json').name")
    
    # Package with vsce
    vsce package --no-dependencies
    
    local vsix_file="${name}-${version}.vsix"
    
    if [ -f "$vsix_file" ]; then
        log_success "Package created: $vsix_file"
        echo "$vsix_file"
    else
        log_error "Failed to create package"
        return 1
    fi
}

# =============================================================================
# Publish to VS Code Marketplace
# =============================================================================

publish_vscode() {
    log_info "Publishing to VS Code Marketplace..."
    
    if [ -z "$VSCE_PAT" ]; then
        log_error "VSCE_PAT environment variable not set"
        log_info "Get your token at: https://dev.azure.com"
        log_info "Then run: export VSCE_PAT=your-token"
        return 1
    fi
    
    vsce publish -p "$VSCE_PAT"
    
    log_success "Published to VS Code Marketplace"
}

# =============================================================================
# Publish to Open VSX
# =============================================================================

publish_openvsx() {
    log_info "Publishing to Open VSX..."
    
    if [ -z "$OVSX_PAT" ]; then
        log_error "OVSX_PAT environment variable not set"
        log_info "Get your token at: https://open-vsx.org/user-settings/tokens"
        log_info "Then run: export OVSX_PAT=your-token"
        return 1
    fi
    
    # Get the vsix file
    local version=$(node -p "require('./package.json').version")
    local name=$(node -p "require('./package.json').name")
    local vsix_file="${name}-${version}.vsix"
    
    if [ ! -f "$vsix_file" ]; then
        log_error "VSIX file not found: $vsix_file"
        log_info "Run 'build' command first"
        return 1
    fi
    
    ovsx publish "$vsix_file" -p "$OVSX_PAT"
    
    log_success "Published to Open VSX"
}

# =============================================================================
# Full Build Process
# =============================================================================

full_build() {
    log_info "Starting full build process..."
    echo ""
    
    verify_package || {
        log_error "Package verification failed. Please fix the issues above."
        return 1
    }
    echo ""
    
    clean
    echo ""
    
    install_deps
    echo ""
    
    build_extension
    echo ""
    
    package_extension
    echo ""
    
    log_success "Build complete!"
}

# =============================================================================
# Full Publish Process
# =============================================================================

full_publish() {
    full_build || return 1
    
    echo ""
    log_info "Starting publish process..."
    echo ""
    
    publish_vscode || log_warning "VS Code Marketplace publish failed"
    echo ""
    
    publish_openvsx || log_warning "Open VSX publish failed"
    echo ""
    
    log_success "Publish process complete!"
}

# =============================================================================
# Main
# =============================================================================

print_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  build     - Build extension only (creates .vsix file)"
    echo "  publish   - Build and publish to both marketplaces"
    echo "  vscode    - Publish to VS Code Marketplace only"
    echo "  openvsx   - Publish to Open VSX only"
    echo "  clean     - Remove build artifacts"
    echo "  check     - Verify prerequisites and configuration"
    echo ""
    echo "Environment Variables:"
    echo "  VSCE_PAT  - Personal Access Token for VS Code Marketplace"
    echo "  OVSX_PAT  - Access Token for Open VSX Registry"
}

case "${1:-build}" in
    build)
        check_prerequisites "build" || exit 1
        full_build
        ;;
    publish)
        check_prerequisites "all" || exit 1
        full_publish
        ;;
    vscode)
        check_prerequisites "vscode" || exit 1
        full_build || exit 1
        publish_vscode
        ;;
    openvsx)
        check_prerequisites "openvsx" || exit 1
        full_build || exit 1
        publish_openvsx
        ;;
    clean)
        clean
        ;;
    check)
        check_prerequisites "all"
        echo ""
        verify_package
        ;;
    help|--help|-h)
        print_usage
        ;;
    *)
        log_error "Unknown command: $1"
        print_usage
        exit 1
        ;;
esac
