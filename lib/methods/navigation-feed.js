'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules
const { omitDefaultRequestParams, constructError } = require('./utils');

/**
 * Retrieve navigation feed structure that belongs to a community.
 *
 * @param  {Object}   query               Query object that holds information required by request uri.
 * @param  {String}   query.wikiLabel     URL parameter that is unique for every community
 * @param  {Object}   options             Additional information used as default for every request options.
 * @param  {Function} callback            [description]
 */
function navigationFeed(query = {}, options, callback) {
  const { httpClient } = this;

  const qsValidParameters = ['breadcrumb', 'parent', 'timestamp'];
  const { wikiLabel } = query;

  if (!wikiLabel) {
    const error = constructError('{{query.wikiLabel}} must be defined in [navigationFeed] request', 404);
    callback(error);
    return;
  }

  // construct the request options
  const requestOptions = _.merge({}, omitDefaultRequestParams(options), {
    qs: _.pick(query, qsValidParameters),
    headers: {
      accept: 'application/atom+xml',
    },
    uri: `{ authType }/api/wiki/${wikiLabel}/nav/feed`,
    json: true,
  });

  httpClient.makeRequest(requestOptions, (requestError, response, body) => {
    if (requestError) {
      callback(requestError);
      return;
    }

    const { statusCode, headers: { 'content-type': contentType } } = response;
    // expected
    // status codes: 200, 403, 404
    // content-type: application/json
    if (!response || statusCode !== 200) {
      const error = constructError(body || 'received response with unexpected status code', statusCode);
      callback(error);
      return;
    }

    if (!response.headers || !contentType.startsWith('application/json')) {
      const error = constructError(`received response with unexpected content-type ${contentType}`, 401);
      callback(error);
      return;
    }

    callback(null, { navigationFeed: body });
  });
}

module.exports = navigationFeed;
