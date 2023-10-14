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

const client = new Sender("http://graphite.example.org");
client.send("foo.bar", 42);
```

If you want to send tagged metrics, the usage is as follows:

```ts
client.send("foo.bar", 42, null, {"ding": "dong"});
```

If you want to send via UDP instead of TCP, just change `protocol='udp'` to `Sender()` call.

## License

Licensed under the MIT license.
