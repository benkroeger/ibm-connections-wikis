'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules
const parser = require('./../response-parsers/index');
const ibmUris = require('./../constants/ibm-uris');
const errorHandler = require('./errorHandler');
const { getAuthParams } = require('../utils/utility');

/**
 * A factory function that returns a function which retrieves the IBM Connections Cloud feed whose name was passed into the factory.
 * @param   {String} feedName     The name of the feed that the returned function should retrieve when called.
 * @returns {Function}            A function which, when invoked, will attempt to retrieve the feed whose name was passed into the factory function.
 * @private
 */
function makeFeedLoader(feedName) {
  return function loadFeed(httpClient, params, callback) {
    // making sure we have the right params
    const error = errorHandler(params, feedName);
    if (error) {
      callback(error);
      return;
    }

    const qsValidParameters = ibmUris()[feedName].queryParams;
    const { query = {}, authType } = params;

    // build request params
    const authParams = getAuthParams(params);
    const requestParams = _.merge({}, _.omit(params, ['authType', 'query']), {
      uri: ibmUris(params)[feedName].uri,
      method: 'GET',
      headers: {
        accept: 'application/atom+xml',
      },
      authType: authType || '',
      followRedirect: true,
      qs: _.pick(query || {}, Object.keys(qsValidParameters)),
    }, authParams);
    // build http request and return parsed data to service caller
    httpClient
      .makeRequest(requestParams, (feedErr, response, body) => {
        if (feedErr) {
          callback(feedErr);
          return;
        }

        if (!response || response.statusCode !== 200) {
          const err = new Error(response.statusMessage);
          err.httpStatus = response.statusCode;
          callback(err);
          return;
        }

        callback(null, parser[feedName](body, params));
      });
  };
}
/**
 * An object containing a function for each feed type in IBM Connections Wikis. Retrieve a feed by invoking the function whose name corresponds to the feed's name.
 * @namespace feedLoader
 * @param source                   Source object that contains data we need for parsing
 * @kind Object
 */
const feedLoader = [
  /**
   * Retrieve navigation feed structure that belongs to a community.
   * @param  {Object}   params                         Request parameters that will be used to retrieve the community structure feed.
   * @param  {String}   params.query.wikiLabel         URL parameter that is unique for every community.
   * @param  {Function} callback                       Called with the results of the feed request. Called with `(err, feed)`.
   */
  'navigationFeed',
  /**
   * Retrieve wiki page that belong to specific place.
   * @param  {Object}   params                         Request parameters that will be used to retrieve the wiki pages.
   * @param  {String}   params.query.wikiLabel         URL parameter that is unique for every community.
   * @param  {String}   params.query.pageLabel         URL parameter that is unique for every wiki page.
   * @param  {Function} callback                       Called with the results of the feed request. Called with `(err, feed)`.
   */
  'wikiPage',
  /**
   * Retrieve the comments/versions feed from wiki page.
   * @param  {Object}   params                         Request parameters that will be used to retrieve the comments/versions feed.
   * @param  {String}   params.query.wikiLabel         URL parameter that is unique for every community.
   * @param  {String}   params.query.pageLabel         URL parameter that is unique for every wiki page.
   * @param  {String}   params.query.category          Optional parameter, can be equal to 'version', 'attachment' and 'tag'.
   * @param  {Function} callback                       Called with the results of the feed request. Called with `(err, feed)`.
   */
  'pageArtifacts',
  /**
   * Retrieve page version that belong to a certain page.
   * @param  {Object}   params                         Request parameters that will be used to retrieve the files from folder feed.
   * @param  {String}   params.query.wikiLabel         URL parameter that is unique for every community.
   * @param  {String}   params.query.pageLabel         URL parameter that is unique for every wiki page.
   * @param  {String}   params.query.versionLabel      URL parameter that is unique for every version of a page.
   * @param  {Function} callback                       Called with the results of the feed request. Called with `(err, feed)`.
   */
  'pageVersion',
  /**
   * Retrieve feed of media content. Used by version and wiki page
   * @param  {Object}   params                         Request parameters that will be used to retrieve the files from folder feed.
   * @param  {String}   params.content                 URL parameter used as request uri.
   * @param  {Function} callback                       Called with the results of the feed request. Called with `(err, feed)`.
   */
  'mediaContent',
].reduce((result, feedName) => {
  _.assign(result, {
    [feedName]: makeFeedLoader(feedName),
  });
  return result;
}, {});

module.exports = feedLoader;
