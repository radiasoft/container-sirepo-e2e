### Building the container

Run inside of the root directory of this repo:

`radia_run container-build`

### Running tests

To start the docker container and run all tests use
[`etc/run.sh`](etc/run.sh). The general form is:

```sh
docker run --rm -it --network=host \
   -e SIREPO_E2E_EMAIL=vagrant+<some-tag>@<local-host>
   -e SIREPO_E2E_HTTP=https://<remote-host>
   -v $HOME/mail:$HOME/mail
   radiasoft/sirepo-e2e
   bash -l -c 'cd ~/playwright && npx playwright test'
```
