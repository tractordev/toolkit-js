
build: dist/duplex.js  dist/duplex.min.js
.PHONY: build

npm:
	deno run -A scripts/build_npm.ts 0.2.0
.PHONY: npm

clobber:
	rm -rf ./dist
.PHONY: clobber

dist/duplex.js: **.ts
	mkdir -p dist
	esbuild index.ts --bundle --format=esm --outfile=./dist/duplex.js 

dist/duplex.min.js: **.ts
	esbuild index.ts --bundle --format=esm --outfile=./dist/duplex.min.js --minify