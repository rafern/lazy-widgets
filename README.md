# lazy-widgets

Typescript retained mode GUI for the HTML canvas API - a reboot of the
[@rafern/canvas-ui](https://www.npmjs.com/package/@rafern/canvas-ui) library.

This library's API is not stable and is expected to heavily change in the
future. Planned features/changes:
- Rewrite flexbox system to distribute final space instead of remaining space
- Rewrite layout system to no longer use 2 stages, or to not unnecessarily mark widgets as dirty
- Add decoration system
- Rich text

## Contributing

To build this project, run `npm run build`. To build in watch mode and with
unminified output run `npm run dev`; the `http-server` package must be
installed.

To check for linter errors, run `npm run lint`.

To add/modify theme properties, modify the `theme_properties.json` file and run
`npm run generate_theme`.

## Documentation

Documentation can be generated locally with the command `npm run docs`. Output
will be in a new `docs` folder. The documentation is also served on
[Github Pages](https://rafern.github.io/lazy-widgets).

## Example

Examples can be found in the `examples` folder, which are also served on
[Github Pages](https://rafern.github.io/lazy-widgets/examples).

## Special thanks

Special thanks to Playko ([website](https://www.playko.com/),
[github](https://github.com/playkostudios)) where this project started and is
currently being developed at.

## License

This project is licensed under the MIT license (see the LICENSE file)

This project uses the following open-source projects:
- [@typescript-eslint/eslint-plugin](https://github.com/typescript-eslint/typescript-eslint) licensed under the MIT license
- [@typescript-eslint/parser](https://github.com/typescript-eslint/typescript-eslint) licensed under the BSD 2-Clause license
- [canvas-roundrect-polyfill](https://github.com/Kaiido/roundRect) licensed under the MIT license
- [concurrently](https://github.com/open-cli-tools/concurrently) licensed under the MIT license
- [esbuild](https://github.com/evanw/esbuild) licensed under the MIT license
- [eslint](https://github.com/eslint/eslint) licensed under the MIT license
- [eslint-plugin-tsdoc](https://github.com/microsoft/tsdoc) licensed under the MIT license
- [rimraf](https://github.com/isaacs/rimraf) licensed under the ISC license
- [typedoc](https://github.com/TypeStrong/TypeDoc) licensed under the Apache 2.0 license
- [typescript](https://github.com/Microsoft/TypeScript) licensed under the Apache 2.0 license
- [tslib](https://github.com/Microsoft/tslib) licensed under the BSD Zero Clause License
- [http-server](https://github.com/http-party/http-server) licensed under the MIT license
