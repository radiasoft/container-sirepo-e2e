#!/bin/bash
#
# Run playwright tests in docker container
#
set -eou pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

_main() {
    if [[ ! -d ~/mail ]]; then
        echo ~/mail " needs to be created, see sirepo/etc" 1>&2
        return 1
    fi
    exec docker run --rm -it --network=host \
       -e SIREPO_E2E_EMAIL=vagrant+sirepo-e2e@localhost.localdomain \
       -e SIREPO_E2E_HTTP=http://localhost.localdomain:8000 \
       -v ~/mail:/home/vagrant/mail \
       radiasoft/sirepo-e2e \
       bash -c 'cd ~/playwright && npx playwright test'
}

_main "$@"
