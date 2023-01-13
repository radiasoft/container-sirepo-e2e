# container-sirepo-e2e
### Building the container
Run inside of the root directory of this repo:
`radia_run container-build`
### Running tests
To start the docker container and run all tests:
```docker run --rm -it --network=host -v $HOME/mail:$HOME/mail radiasoft/sirepo-e2e bash -l -c 'cd ~/playwright && npx playwright test'```
