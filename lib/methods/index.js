'use strict';

// node core modules

// 3rd party modules

// internal modules
const navigationFeed = require('./navigation-feed');
const wikiPage = require('./wiki-page');
const pageVersionDetails = require('./page-version-details');
const pageComments = require('./page-comments');
const pageVersions = require('./page-versions');
const mediaContent = require('./media-content');

module.exports = {
  navigationFeed,
  wikiPage,
  pageVersionDetails,
  pageComments,
  pageVersions,
  mediaContent,
};
