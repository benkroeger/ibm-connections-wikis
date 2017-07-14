'use strict';

// node code modules
const fs = require('fs');
const path = require('path');

// 3rd party modules
const nock = require('nock');

// internal modules

const recordHttpRequests = () => {
  nock.recorder.rec({ dont_print: true });
};

const writeNockCallsToFile = () => {
  // eslint-disable-next-line max-len
  fs.writeFileSync(path.join(__dirname, 'nock-calls.js'), `const nock = require('nock');\n/*eslint-disable*/\n${nock.recorder.play().join('\n')}\n/*eslint-enable*/\n`, 'utf8');
};

const mockHttpRequests = () => {
  // eslint-disable-next-line global-require
  require('./nock-calls');
};

const cleanAll = () => nock.cleanAll();

module.exports = {
  recordHttpRequests,
  writeNockCallsToFile,
  mockHttpRequests,
  cleanAll,
};
