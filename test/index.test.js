'use strict';

// node core modules
const fs = require('fs');
const path = require('path');

// 3rd party modules
const test = require('ava');
const _ = require('lodash');

// internal modules
const WikiSource = require('../lib');
const { mockHttpRequests, cleanAll, writeNockCallsToFile, recordHttpRequests } = require('./helpers/http-mocking-utils');

// configure dotenv
require('dotenv').config();

const { USER_CREDENTIALS: userCredentials } = process.env;
const nockCallsExist = fs.existsSync(path.join(__dirname, 'helpers/nock-calls.js'));

test.beforeEach((t) => {
  const auth = `Basic ${new Buffer(userCredentials).toString('base64')}`;
  const defaults = {
    headers: {
      Authorization: auth,
    },
  };
  const serviceOptions = {
    defaults,
  };
  const baseMembers = ['id', 'versionLabel', 'title', 'published', 'updated', 'created',
    'content', 'links', 'author', 'modified'];

  const wikiPageMembers = [...baseMembers, 'label', 'summary', 'visibility', 'versionUuid',
    'propagation', 'totalMediaSize', 'ranks'];
  const wikiVersionPageMembers = [...baseMembers, 'label', 'summary', 'documentUuid', 'libraryId'];
  const wikiCommentsMembers = [...baseMembers, 'language', 'deleteWithRecord'];
  const wikiVersionsMembers = [...baseMembers, 'label', 'summary', 'libraryId', 'documentUuid'];

  const source = new WikiSource('https://apps.na.collabserv.com/wikis/', serviceOptions);
  _.assign(t.context, {
    source,
    serviceOptions,
    wikiPageMembers,
    wikiVersionPageMembers,
    wikiCommentsMembers,
    wikiVersionsMembers,
  });
});

test.before(() => {
  if (!nockCallsExist) {
    recordHttpRequests();
    return;
  }
  mockHttpRequests();
});

test.after(() => {
  if (!nockCallsExist) {
    writeNockCallsToFile();
  }
  cleanAll();
});

/* Successful scenarios validations */

test.cb('validate retrieving wiki navigation feed, wikiLabel provided', (t) => {
  const { source } = t.context;
  const params = {
    authType: 'basic',
    wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
  };

  source.feeds.navigationFeed(params, (err, response) => {
    t.true(_.isNull(err));
    t.true('navigationFeed' in response, `{navigationFeed} should be a member of ${response}`);

    const { navigationFeed } = response;
    t.true(_.isPlainObject(navigationFeed), `{navigationFeed} should be plain object, instead we got: [${typeof navigationFeed}]`);
    t.true('items' in navigationFeed, `{items} should be a member of ${navigationFeed}`);

    const { items } = navigationFeed;
    t.true(_.isArray(items), `{items} should be an array, instead we got: [${typeof items}]`);
    t.is(items.length, 13, `there should be exactly 9 items in ${items}`);
    t.end();
  });
});

test.cb('validate retrieving wiki page, wikiLabel & pageLabel provided', (t) => {
  const { source, wikiPageMembers } = t.context;
  const params = {
    authType: 'basic',
    wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
    pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
  };

  source.feeds.wikiPage(params, (err, response) => {
    t.true(_.isNull(err));
    t.true('wikiPage' in response, `{wikiPage} should be a member of ${response}`);

    const { wikiPage } = response;
    t.true(_.isPlainObject(wikiPage), `{wikiPage} should be plain object, instead we got: [${typeof wikiPage}]`);
    wikiPageMembers.forEach(prop => t.true(prop in wikiPage, `[${prop}] should be a member of {response.wikiPage}`));
    ['links', 'author', 'ranks'].forEach(prop => t.true(_.isPlainObject(wikiPage[prop]), `[${prop}] should be a plain object, instead we got: [${typeof wikiPage[prop]}]`));
    ['totalMediaSize', 'versionLabel'].forEach(prop => t.true(_.isFinite(wikiPage[prop]), `[${prop}] should be an integer, instead we got: [${typeof wikiPage[prop]}]`));
    t.end();
  });
});

test.cb('validate retrieving wiki version page, wikiLabel, pageLabel & versionLabel provided', (t) => {
  const { source, wikiVersionPageMembers } = t.context;
  const params = {
    authType: 'basic',
    wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
    pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
    versionLabel: 'db47be61-98e0-478f-8616-df6c4cd82a1d',
  };

  source.feeds.pageVersion(params, (err, response) => {
    t.true(_.isNull(err));
    t.true('pageVersion' in response, `{pageVersion} should be a member of ${response}`);

    const { pageVersion } = response;
    t.true(_.isPlainObject(pageVersion), `{pageVersion} should be plain object, instead we got: [${typeof pageVersion}]`);
    wikiVersionPageMembers.forEach(prop => t.true(prop in pageVersion, `[${prop}] should be a member of {response.pageVersion}`));
    ['links', 'author', 'modifier'].forEach(prop => t.true(_.isPlainObject(pageVersion[prop]), `[${prop}] should be a plain object, instead we got: [${typeof pageVersion[prop]}]`));
    t.true(_.isFinite(pageVersion.versionLabel), `[versionLabel] should be a number, instead we got: [${typeof pageVersion.versionLabel}]`);
    t.end();
  });
});

test.cb('validate retrieving all comments from wiki page, wikiLabel & pageLabel provided', (t) => {
  const { source, wikiCommentsMembers } = t.context;
  const params = {
    authType: 'basic',
    wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
    pageLabel: 'cfd4229d-9b2a-4845-b5f0-a3e530785eff',
  };

  source.feeds.pageArtifacts(params, (err, response) => {
    t.true(_.isNull(err));
    t.true('pageComments' in response, `{pageComments} should be a member of ${response}`);

    const { pageComments } = response;

    t.true(_.isArray(pageComments), `{pageComments} should be an Array, instead we got: [${typeof pageComments}]`);
    pageComments.forEach((comment, i) => {
      wikiCommentsMembers.forEach((prop) => {
        t.true(prop in comment, `[${prop}] should be a member of {response.pageComments[${i}].comment}`);
        t.true(_.isFinite(comment.versionLabel), `[versionLabel] should be a number, instead we got: [${typeof pageComments.versionLabel}]`);
      });
      ['links', 'author', 'modifier'].forEach(prop => t.true(_.isPlainObject(comment[prop]), `[${prop}] should be a plain object, instead we got: [${typeof comment[prop]}]`));
    });
    t.end();
  });
});

test.cb('validate retrieving all versions from wiki page, wikiLabel, pageLabel and query.category provided', (t) => {
  const { source, wikiVersionsMembers } = t.context;
  const params = {
    query: {
      category: 'version',
    },
    authType: 'basic',
    wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
    pageLabel: 'cfd4229d-9b2a-4845-b5f0-a3e530785eff',
  };

  source.feeds.pageArtifacts(params, (err, response) => {
    t.true(_.isNull(err));
    t.true('pageVersions' in response, `{pageVersions} should be a member of ${response}`);

    const { pageVersions } = response;
    t.true(_.isArray(pageVersions), `{pageVersions} should be an Array, instead we got: [${typeof pageVersions}]`);
    pageVersions.forEach((comment, i) => {
      wikiVersionsMembers.forEach((prop) => {
        t.true(prop in comment, `[${prop}] should be a member of {response.pageVersions[${i}].comment}`);
        t.true(_.isFinite(comment.versionLabel), `[versionLabel] should be a number, instead we got: [${typeof pageVersions.versionLabel}]`);
      });
      ['links', 'author', 'modifier'].forEach(prop => t.true(_.isPlainObject(comment[prop]), `[${prop}] should be a plain object, instead we got: [${typeof comment[prop]}]`));
    });
    t.end();
  });
});

test.cb('validate retrieving wiki page "media content", "authType" provided', (t) => {
  const { source } = t.context;
  const params = {
    authType: 'basic',
    wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
    pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
  };

  source.feeds.wikiPage(params, (err, response) => {
    const content = response.wikiPage.content.src;
    source.feeds.mediaContent(_.assign({}, params, { content }), (err, response) => { // eslint-disable-line no-shadow
      t.true(_.isNull(err));
      t.true('mediaContent' in response, `{mediaContent} should be a member of ${response}`);
      t.true(_.isString(response.mediaContent), `{mediaContent} should be a String, instead we got: [${typeof mediaContent}]`);
      t.end();
    });
  });
});

test.cb('validate retrieving wiki version page "media content", wikiLabel provided', (t) => {
  const { source } = t.context;
  const params = {
    authType: 'basic',
    wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
    pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
    versionLabel: 'db47be61-98e0-478f-8616-df6c4cd82a1d',
  };

  source.feeds.pageVersion(params, (err, response) => {
    const content = response.pageVersion.content.src;
    source.feeds.mediaContent(_.assign({}, params, { content }), (err, response) => { // eslint-disable-line no-shadow
      t.true(_.isNull(err));
      t.true('mediaContent' in response, `{mediaContent} should be a member of ${response}`);

      const { mediaContent } = response;
      t.true(_.isString(mediaContent), `{mediaContent} should be a String, instead we got: [${typeof mediaContent}]`);
      t.false(mediaContent.includes('<!DOCTYPE html'), '{mediaContent} should not start with "<!DOCTYPE html"');
      t.end();
    });
  });
});

/* Error / Wrong input scenarios validations */

test.cb('error validation for retrieving wiki navigation feed, "params" are empty', (t) => {
  const { source } = t.context;

  source.feeds.navigationFeed({}, (err) => {
    t.is(err.message, 'params object should not be empty');
    t.is(err.httpStatus, 400);
    t.end();
  });
});

test.cb('error validation for retrieving wiki navigation feed, wikiLabel not provided', (t) => {
  const { source } = t.context;
  const params = {
    authType: 'basic',
  };

  source.feeds.navigationFeed(params, (err) => {
    t.is(err.message, '{{params.wikiLabel}} must be defined in [navigationFeed] request');
    t.is(err.httpStatus, 400);
    t.end();
  });
});

test.cb('error validation for retrieving wiki page, wikiLabel not provided', (t) => {
  const { source } = t.context;
  const params = {
    authType: 'basic',
  };

  source.feeds.wikiPage(params, (err) => {
    t.is(err.message, '{{params.wikiLabel}} must be defined in [wikiPage] request');
    t.is(err.httpStatus, 400);
    t.end();
  });
});

test.cb('error validation for retrieving wiki page, pageLabel not provided', (t) => {
  const { source } = t.context;
  const params = {
    authType: 'basic',
    wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
  };

  source.feeds.wikiPage(params, (err) => {
    t.is(err.message, '{{params.pageLabel}} must be defined in [wikiPage] request');
    t.is(err.httpStatus, 400);
    t.end();
  });
});

test.cb('error validation for retrieving wiki page, wrong wikiLabel provided', (t) => {
  const { source } = t.context;
  const params = {
    authType: 'basic',
    wikiLabel: 'mock label',
    pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
  };

  source.feeds.wikiPage(params, (err) => {
    t.is(err.message, 'Not Found');
    t.is(err.httpStatus, 404);
    t.end();
  });
});

test.cb('error validation for retrieving wiki version page, versionLabel not provided', (t) => {
  const { source } = t.context;
  const params = {
    authType: 'basic',
    wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
    pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
  };

  source.feeds.pageVersion(params, (err) => {
    t.is(err.message, `Provided {{params.pageLabel}} : [true] and 
      {{params.query.versionLabel}} : [false] should be equal to [true]`);
    t.is(err.httpStatus, 400);
    t.end();
  });
});

test.cb('error validation for retrieving wiki version page, wrong versionLabel provided', (t) => {
  const { source } = t.context;
  const params = {
    authType: 'basic',
    wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
    pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
    versionLabel: 'mock version label',
  };

  source.feeds.pageVersion(params, (err) => {
    t.is(err.message, 'Not Found');
    t.is(err.httpStatus, 404);
    t.end();
  });
});

test.cb('error validation for retrieving all comments from wiki page, wrong pageLabel provided', (t) => {
  const { source } = t.context;
  const params = {
    query: {
      category: 'version',
    },
    authType: 'basic',
    wikiLabel: '434a24f4-28a2-45a4-b83a-a55120f1ca72',
    pageLabel: 'mock page label',
  };

  source.feeds.pageArtifacts(params, (err) => {
    t.is(err.message, 'Not Found');
    t.is(err.httpStatus, 404);
    t.end();
  });
});

test.cb('error validation for retrieving wiki page "media content", wrong "authType" provided', (t) => {
  const { source } = t.context;
  const params = {
    authType: 'oauth',
    wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
    pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
  };

  source.feeds.wikiPage(params, (err, response) => {
    const content = response.wikiPage.content.src;
    source.feeds.mediaContent(_.assign({}, params, { content }), (err, response) => { // eslint-disable-line no-shadow
      const { mediaContent } = response;
      t.true(mediaContent.includes('<!DOCTYPE html'), '{mediaContent} should start with "<!DOCTYPE html"');
      t.end();
    });
  });
});

test.cb('error validation for not providing valid "uri" while fetching "wikiPage"', (t) => {
  const { source } = t.context;
  const params = {
    authType: 'oauth',
    wikiLabel: '2feb2356-ab0f-458d-8a27-334363d9d192',
    pageLabel: '0f8ee02f-0bcb-435a-859c-857845cd9d78',
  };

  source.feeds.wikiPage(params, (err) => {
    t.true(_.isNull(err));
    source.feeds.mediaContent(params, (err) => { // eslint-disable-line no-shadow
      t.is(err.message, 'options.uri must be a string when using options.baseUrl');
      t.end();
    });
  });
});
