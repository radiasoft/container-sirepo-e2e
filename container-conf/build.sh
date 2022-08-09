#!/bin/bash
build_image_base=${sirepo_ci_base:-radiasoft/beamsim}
build_is_public=1

build_as_root() {
    umask 022
    build_yum install nodejs16
    npm install -g npx
    npm install -g @playwright/test
    cd /playwright
    npx playwright test


    # TODOS: garsuga
    # somehow tell it where to go
    # login stuff
}

build_as_run_user() {
    
}
