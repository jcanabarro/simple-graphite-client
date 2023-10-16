# simple-graphite-client

[![npm](https://img.shields.io/node/v/v18.18.1)](https://www.npmjs.com/package/simple-graphite-client)
[![Tests](https://github.com/jcanabarro/simple-graphite-client/actions/workflows/test.yml/badge.svg)](https://github.com/jcanabarro/simple-graphite-client/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/github/license/jcanabarro/simple-graphite-client)](https://github.com/jcanabarro/simple-graphite-client/blob/main/LICENSE)

This is a compact TypeScript library designed for transmitting data to a Graphite metrics server (Carbon).
It draws significant inspiration from [graphyte](https://github.com/benhoyt/graphyte), a Python library.
Currently, this library is simpler in comparison, as additional complexity wasn't required at this stage.

```bash
npm install simple-graphite-client
```

## Usage

You first have to define the Graphite client:

```ts
import  Sender  from "simple-graphite-client";

const client = new Sender({
     host: "http://graphite.example.org"
});
await client.send({
    metric: "foo.bar",
    value: 42
});
```

If you want to send tagged metrics, the usage is as follows:

```ts
await client.send({
    metric: "foo.bar",
    value: 42,
    tags: {"ding": "dong"}
});
```

If you want to send via UDP instead of TCP, just change `protocol:'udp'` to `Sender()` call.

## License

Licensed under the MIT license.

## Development

### NVM - Node Version Manager

I recommend you to use `nvm` to download the current version of `node.js` used on the project.

To download the `nvm` run the follow command:

_You can look for more information on the [nvm repository](https://github.com/nvm-sh/nvm)_

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
```

Once you have installed `nvm` and it's working, you can run the follow to install the correct version of `node.js`:

_Make sure you are on the current path of the project, where the `.nvmrc` file is located_

```bash
nvm install
```

```bash
nvm use
```

### Installing packages

Once you have installed the current version of `Node.js`, `NPM` you can do it running the follow:

_Make sure you are using the current context of `Node.js` and `NPM`._

```bash
npm install
```

### Test Dependencies

To run the tests you'll need to have `tcp-receiver` running on port `9950` and `9528`.
To do that, run:

```bash
docker run -d -p 9950:9950 -p 9528:9528 cameritelabs/tcp-receiver:latest
```

Once you have the container running you can run:

```bash
# to run the tests
npm run test

# to run the tests and generate coverage report
npm run coverage
```
