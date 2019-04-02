# meajudafi-front-end

Front-end of the [meajudafi](https://github.com/conradoqg/meajudafi-stack) stack.

## Pages

The front-end is composed by a few views that shows information about Brazilian funds, indicators and broker's available funds:

- Indicators view: Contains economic indicators, top and bottom funds and fund's changes;
- Fund List view: The complete list of registered funds including charts with investment return, risk, sharpe, consistency and so on;
- Fund Comparison view: A tool to compare funds and see their investment return, risk, sharpe, correlation to benchmark and so on.

## Development

```sh
# To start the development server, you can run:
$ npm start
```

### Tasks

- `start`: Starts the development server;
- `build`: Builds the front-end by bundling the source-files and generating the production bundle file;
- `check-build`: Same as build but generating development bundle file and reports to debug the size of it;
- `dist`: Agreggates the necessary front-end files.

## Related repositories

- [meajudafi-stack](https://github.com/conradoqg/meajudafi-stack)
- [meajudafi-workers](https://github.com/conradoqg/meajudafi-workers)
- [meajudafi-docker-container-crontab](https://github.com/conradoqg/meajudafi-docker-container-crontab)

License
----
This project is licensed under the [MIT](LICENSE.md) License.