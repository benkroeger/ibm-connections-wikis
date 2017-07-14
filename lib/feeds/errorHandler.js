'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules

function constructError(message) {
  const error = new Error(message);
  error.httpStatus = 400;
  return error;
}
const validPageRequests = ['wikiPage', 'pageArtifacts', 'pageNavigationFeed'];

const errorChecker = function errorChecker(params, feedName) {
  if (_.isEmpty(params)) {
    return constructError('params object should not be empty');
  }
  const { wikiLabel, pageLabel, versionLabel } = params;
  if (!wikiLabel && feedName !== 'mediaContent') {
    return constructError(`{{params.wikiLabel}} must be defined in [${feedName}] request`);
  }
  if (validPageRequests.includes(feedName)) {
    if (!pageLabel) {
      return constructError(`{{params.pageLabel}} must be defined in [${feedName}] request`);
    }
  } else if (feedName === 'pageVersion') {
    if (!(pageLabel && versionLabel)) {
      const msg = `{{params.pageLabel}} [${!!pageLabel}], {{params.query.versionLabel}} [${!!versionLabel}]`;
      return constructError(msg);
    }
  }
  return false;
};

module.exports = errorChecker;
