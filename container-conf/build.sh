#!/bin/bash
build_image_base=radiasoft/fedora
build_is_public=1

build_as_root() {
    umask 022
    build_yum install nodejs16
    npm install -g npx
    npm install -g @playwright/test

    export SIREPO_E2E_USER=test_user
    export SIREPO_ENDPOINT=sirepo.com

    cd $build_guest_conf/playwright
    # TODO: replace endpoint in playwright config
    npx playwright test


    # TODOS: garsuga
    # somehow tell it where to go
    # login stuff

    


}

build_as_run_user() {
    
}
