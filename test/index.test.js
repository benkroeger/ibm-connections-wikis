'use strict';

// node core modules

// 3rd party modules
const test = require('ava');
const _ = require('lodash');

// internal modules
const { wikiPage } = require('../lib/response-parsers');
const { wikiPageMock } = require('./helpers/wiki-page-mock.js');
const WikiSource = require('../lib');

// configure dotenv
require('dotenv').config();

const { USER_CREDENTIALS: userCredentials } = process.env;

let source = {};
test.before(() => {
  const auth = `Basic ${new Buffer(userCredentials).toString('base64')}`;
  const defaults = {
    headers: {
      Authorization: auth,
    },
  };
  source = new WikiSource('https://apps.na.collabserv.com/wikis/', defaults);
});

test('validate result for retrieving a feed of a wiki navigation', (t) => {
  const result = wikiPage(wikiPageMock);
  // console.log(result);
});

test.cb('test', (t) => {
  const params = {
    authType: 'oauth',
    wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
    pageLabel: '43fa8474-8597-445a-9643-b4a0360035d2',
  };

  source.feeds.wikiPage(params, (err, response) => {
    // console.log(response);
    t.end();
  });
});

test.cb('test2', (t) => {
  const params = {
    authType: 'oauth',
    wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
    pageLabel: 'cfd4229d-9b2a-4845-b5f0-a3e530785eff',
  };

  source.feeds.pageArtifacts(params, (err, response) => {
    // response.pageComments.forEach(elem => console.log(elem));
    t.end();
  });
});

test.cb('test3', (t) => {
  const params = {
    authType: 'oauth',
    wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
    pageLabel: 'cfd4229d-9b2a-4845-b5f0-a3e530785eff',
  };

  source.feeds.wikiPage(params, (err, response) => {
    const content = response.wikiPage.content.src;
    const params = {
      content,
      authType: 'basic',
    };

    source.feeds.mediaContent(params, (err, response) => {
      console.log(err);
      console.log(response);
      t.end();
    });
  });
});

