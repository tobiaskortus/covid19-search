
```sh
docker volume create covid-19-data
```

```
 docker run -p 27017:27017 covid-19-data:/data/db mongo --quiet
```
