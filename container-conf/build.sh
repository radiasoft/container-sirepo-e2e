#!/bin/bash
build_image_base=radiasoft/fedora
build_is_public=1

build_as_root() {
    dnf module enable -y nodejs:16/default
    declare x=(
        at-spi2-atk
        atk
        libdrm
        libgbm
        libwayland-client
        libXcomposite  
        libXdamage 
        libxkbcommon
        libXrandr
        nodejs
        nss
        pango 
    )
    build_yum install "${x[@]}"
}

build_as_run_user() {
    cd "$build_guest_conf"
    cp -a playwright "$HOME"
    cd ~/playwright
    cat >> ~/.post_bivio_bashrc << 'EOF'
export PLAYWRIGHT_BROWSERS_PATH=$HOME/playwright-browsers 
EOF
    cat ~/.post_bivio_bashrc
    install_source_bashrc
    npm i -g npx
    npm i @playwright/test
    npx playwright install
}
