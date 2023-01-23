# lazy-widgets

Typescript retained mode GUI for the HTML canvas API - a reboot of the
[@rafern/canvas-ui](https://www.npmjs.com/package/@rafern/canvas-ui) library.

This library's API is not stable and is expected to heavily change in the
future. Planned features/changes:
- Rewrite flexbox system to distribute final space instead of remaining space
- Rewrite layout system to no longer use 2 stages, or to not unnecessarily mark widgets as dirty
- Add layer system
- Add decoration system
- Immediately-dispatched input events
- Replace callbacks with events
- Add widget output events (hover-start, hover-end, etc...)
- Rich text

## Contributing

To check for linter errors, run `npm run lint`

To build this project, run `npm run build`

To build this project in watch mode and with unminified output run `npm run dev`

To re-generate the documentation, run `npm run docs`

To add/modify theme properties, modify the `theme_properties.json` file and run
`npm run generate_theme`

## Example

Examples can be found in the `examples` folder

## Special thanks

Special thanks to Playko ([website](https://www.playko.com/),
[github](https://github.com/playkostudios)) where this project started and is
currently being developed at.

## License

This project is licensed under the MIT license (see the LICENSE file)

This project uses the following open-source projects:
- [@knodes/typedoc-plugin-pages](https://github.com/KnodesCommunity/typedoc-plugins) licensed under the MIT license
- [@typescript-eslint/eslint-plugin](https://github.com/typescript-eslint/typescript-eslint) licensed under the MIT license
- [@typescript-eslint/parser](https://github.com/typescript-eslint/typescript-eslint) licensed under the BSD 2-Clause license
- [esbuild](https://github.com/evanw/esbuild) licensed under the MIT license
- [eslint](https://github.com/eslint/eslint) licensed under the MIT license
- [eslint-plugin-tsdoc](https://github.com/microsoft/tsdoc) licensed under the MIT license
- [local-web-server](https://github.com/lwsjs/local-web-server) licensed under the MIT license
- [rimraf](https://github.com/isaacs/rimraf) licensed under the ISC license
- [typedoc](https://github.com/TypeStrong/TypeDoc) licensed under the Apache 2.0 license
- [typescript](https://github.com/Microsoft/TypeScript) licensed under the Apache 2.0 license
