#!/bin/bash
build_image_base=radiasoft/fedora
build_is_public=1

build_as_root() {
    build_yum install nodejs
}

build_as_run_user() {
    npm install -g npx @playwright/test
    # TODO: garsuga setup browsers????
}
