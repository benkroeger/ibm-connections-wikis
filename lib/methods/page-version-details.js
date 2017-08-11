'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules
const { omitDefaultRequestParams, constructError } = require('./utils');
const { pageVersionDetails: parser } = require('../response-parsers');

const qsValidParameters = ['sO', 'ps'];


/**
 * Retrieve page version details that belong to a certain page.
 *
 * @param  {Object}   query                 Query object that holds information required by request uri.
 * @param  {String}   query.wikiLabel       URL parameter that is unique for every community.
 * @param  {String}   query.pageLabel       URL parameter that is unique for every wiki page.
 * @param  {String}   query.versionLabel    URL parameter that is unique for every version of a page.
 * @param  {Object}   options               Additional information used as default for every request options.
 * @param  {Function} callback              [description]
 */
function pageVersionDetails(query = {}, options, callback) {
  const { httpClient } = this;

  const { wikiLabel, pageLabel, versionLabel } = query;

  if (!wikiLabel) {
    const error = constructError('{{query.wikiLabel}} must be defined in [pageVersionDetails] request', 404);
    callback(error);
    return;
  }
  if (!pageLabel) {
    const error = constructError('{{query.pageLabel}} must be defined in [pageVersionDetails] request', 404);
    callback(error);
    return;
  }
  if (!versionLabel) {
    const error = constructError('{{query.versionLabel}} must be defined in [pageVersionDetails] request', 404);
    callback(error);
    return;
  }

  // construct the request options
  const requestOptions = _.merge({}, omitDefaultRequestParams(options), {
    qs: _.pick(query, qsValidParameters),
    headers: {
      accept: 'application/atom+xml',
    },
    uri: `{ authType }/api/wiki/${wikiLabel}/page/${pageLabel}/version/${versionLabel}/entry`,
  });

  httpClient.makeRequest(requestOptions, (requestError, response, body) => {
    if (requestError) {
      callback(requestError);
      return;
    }

    const { statusCode, headers: { 'content-type': contentType } } = response;
    // expected
    // status codes: 200, 403, 404
    // content-type: application/atom+xml
    if (!response || statusCode !== 200) {
      const error = constructError(body || 'received response with unexpected status code', statusCode);
      callback(error);
      return;
    }

    if (!(response.headers && contentType.startsWith('application/atom+xml'))) {
      const error = constructError(`received response with unexpected content-type ${contentType}`, 401);
      callback(error);
      return;
    }

    callback(null, parser(body));
  });
}

module.exports = pageVersionDetails;
