# NOTICE

This is a reboot of the `canvas-ui` library, and is heavily work-in-progress; do
not use this in a production environment... yet. It was started due to the
following reasons:
- There was a name clash with `canvas-ui` - the new name might not be the final name
- `canvas-ui` has very volatile versioning due to a premature release. This library will not have a version 1.0.0 anytime soon
- Lack of events in `canvas-ui`, making more complex UI hard to do without custom widgets
- Lack of layering and decoration systems in `canvas-ui`, leading to a very blocky appearance and more complex code when handling background clearing
- Awkward flexbox system (remaining space is distributed, instead of final space)
- No testing
- No CI (which also polluted the repo with a docs folder)

Even if there wasn't a name clash, a reboot would probably be done at some point
to prevent having a version 20 of `canvas-ui`.

The first release will prioritise the following features:
- Layering system
- Decoration system

Other things that would be nice to fix:
- Get rid of ugly theme generation system; replace it with just code

# lazy-widgets

Typescript retained mode GUI for the HTML canvas API.

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