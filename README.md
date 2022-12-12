# container-sirepo-e2e
`radia_run container-build`
```docker run --rm -it --network=host -v $HOME/mail:$HOME/mail radiasoft/sirepo-e2e bash -l -c 'cd ~/playwright && npx playwright test'```
