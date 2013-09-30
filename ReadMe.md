# Web State Machine

This repositoty is the home of the libraries used by WebMole to manage the Web State Machine.


## Usage

Include javascript files from `src` folder and create required objects within your code. You are invited to see it's usage in the µ-crawler and/or the WebMole Chrome Plugin.


## Development

First, install dependences with [npm](https://npmjs.org/) and [bower](http://bower.io/)

	npm install
	bower install

You can use [grunt](http://gruntjs.com/) to develop and test with [jasmine](http://pivotal.github.io/jasmine/) on each file save

	grunt dev

Run tests (with jasmine) from cli with

    grunt test

Generate minified files

    grunt

See `gruntfile.js` for more details.