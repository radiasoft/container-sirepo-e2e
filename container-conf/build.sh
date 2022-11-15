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
    npm i -g npx
    cd "$build_guest_conf"
    cp -a playwright "$HOME"
    cd ~/playwright
    npm i @playwright/test
    npx playwright install
}
