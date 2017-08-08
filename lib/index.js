'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const OniyiHttpClient = require('oniyi-http-client');
const credentialsPlugin = require('oniyi-http-plugin-credentials');
const formatUrlTemplatePlugin = require('oniyi-http-plugin-format-url-template');

// internal modules
const responseParsers = require('./response-parsers');
const { omitDefaultRequestParams, constructError } = require('./utils/utility');

const contentPathRegex = /^https?:\/\/[^\/]+\/wikis\/(.+)/;
const selectFirstPath = /(.+?)\//;
const injectAuthTypeTemplate = contentPath => contentPath.replace(selectFirstPath, '{ mediaAuthType }/');

/**
 * The factory function exported by the ibm-connections-wikis module which returns an instance of the [IbmConnectionsWikisService].
 *
 * @param   {String} baseUrl                                   The base URL of the IBM Connections Cloud instance with which the service will be communicating.
 * @param   {Object} serviceOptions                            An object of key-value pairs to set as defaults for the service.
 * @param   {String} [serviceOptions.accessToken]              An OAuth access token for the IBM Connections Cloud instance with which the service will be communicating.
 *                                                             If you provide this, it will be provided as a bearer token in the Authorization header on every request you
 *                                                             make with the service.
 * @param   {Object} [serviceOptions.headers]                  An object of key-value pairs, where a key is a HTTP header name and the corresponding value is the value for
 *                                                             the HTTP header. These headers and their values will be attached to every request the service makes.
 */
module.exports = function IbmConnectionsWikisService(baseUrl, serviceOptions = {}) {
  const defaultHeaders = {
    defaults: {
      headers: serviceOptions && serviceOptions.headers,
    },
  };
  // params we'll use across the module
  const params = _.merge({
    defaults: {
      authType: 'oauth',
      baseUrl: baseUrl.charAt(baseUrl.length - 1) === '/' ? baseUrl : `${baseUrl}/`,
      followRedirect: true,
    },
  },
    defaultHeaders,
    serviceOptions);

  // create a http client to be used throughout this service
  const httpClient = new OniyiHttpClient(params);
  const { plugins = {} } = params;

  if (plugins.credentials) {
    httpClient.use(credentialsPlugin(plugins.credentials));
  }

  const formatUrlTemplateOptions = _.merge({
    valuesMap: {
      authType: {
        saml: '',
        cookie: '',
      },
    },
  }, plugins.formatUrlTemplate || {});

  httpClient.use(formatUrlTemplatePlugin(formatUrlTemplateOptions));

  /**
   * Retrieve navigation feed structure that belongs to a community.
   *
   * @param  {Object}   query               Query object that holds information required by request uri.
   * @param  {String}   query.wikiLabel     URL parameter that is unique for every community
   * @param  {Object}   options             Additional information used as default for every request options.
   * @param  {Function} callback            [description]
   */
  const navigationFeed = (query = {}, options, callback) => {
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

      callback(null, responseParsers.navigationFeed(body));
    });
  };

  /**
   * Retrieve wiki page that belong to specific place.
   *
   * @param  {Object}   query               Query object that holds information required by request uri.
   * @param  {String}   query.wikiLabel     URL parameter that is unique for every community.
   * @param  {String}   query.pageLabel     URL parameter that is unique for every wiki page.
   * @param  {Object}   options             Additional information used as default for every request options.
   * @param  {Function} callback            [description]
   */
  const wikiPage = (query = {}, options, callback) => {
    const qsValidParameters = ['acls', 'includeTags'];

    const { wikiLabel, pageLabel } = query;
    if (!wikiLabel) {
      const error = constructError('{{query.wikiLabel}} must be defined in [wikiPage] request', 404);
      callback(error);
      return;
    }
    if (!pageLabel) {
      const error = constructError('{{query.pageLabel}} must be defined in [wikiPage] request', 404);
      callback(error);
      return;
    }

    // construct the request options
    const requestOptions = _.merge({}, omitDefaultRequestParams(options), {
      qs: _.pick(query, qsValidParameters),
      headers: {
        accept: 'application/atom+xml',
      },
      uri: `{ authType }/api/wiki/${wikiLabel}/page/${pageLabel}/entry`,
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

      callback(null, responseParsers.wikiPage(body));
    });
  };

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
  const pageVersionDetails = (query = {}, options, callback) => {
    const qsValidParameters = ['sO', 'ps'];

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

      callback(null, responseParsers.pageVersionDetails(body));
    });
  };

  /**
   * Retrieve the comments feed from wiki page.
   *
   * @param  {Object}   query                 Query object that holds information required by request uri.
   * @param  {String}   query.wikiLabel       URL parameter that is unique for every community.
   * @param  {String}   query.pageLabel       URL parameter that is unique for every wiki page.
   * @param  {Object}   options               Additional information used as default for every request options.
   * @param  {Function} callback              [description]
   */
  const pageComments = (query = {}, options, callback) => {
    const qsValidParameters = ['sO', 'ps'];

    const { wikiLabel, pageLabel } = query;

    if (!wikiLabel) {
      const error = constructError('{{query.wikiLabel}} must be defined in [pageVersion] request', 404);
      callback(error);
      return;
    }
    if (!pageLabel) {
      const error = constructError('{{query.pageLabel}} must be defined in [pageVersion] request', 404);
      callback(error);
      return;
    }

    // construct the request options
    const requestOptions = _.merge({}, omitDefaultRequestParams(options), {
      qs: _.pick(query, qsValidParameters),
      headers: {
        accept: 'application/atom+xml',
      },
      uri: `{ authType }/api/wiki/${wikiLabel}/page/${pageLabel}/feed`,
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

      callback(null, responseParsers.pageComments(body));
    });
  };

  /**
   * Retrieve the versions feed from wiki page.
   *
   * @param  {Object}   query                 Query object that holds information required by request uri.
   * @param  {String}   query.wikiLabel       URL parameter that is unique for every community.
   * @param  {String}   query.pageLabel       URL parameter that is unique for every wiki page.
   * @param  {Object}   options               Additional information used as default for every request options.
   * @param  {Function} callback              [description]
   */
  const pageVersions = (query = {}, options, callback) => {
    const qsValidParameters = ['sO', 'ps'];

    const { wikiLabel, pageLabel } = query;

    if (!wikiLabel) {
      const error = constructError('{{query.wikiLabel}} must be defined in [pageVersion] request', 404);
      callback(error);
      return;
    }
    if (!pageLabel) {
      const error = constructError('{{query.pageLabel}} must be defined in [pageVersion] request', 404);
      callback(error);
      return;
    }

    // construct the request options
    const requestOptions = _.merge({}, omitDefaultRequestParams(options), {
      qs: _.defaultsDeep({
        category: 'version',
      },
        _.pick(query, qsValidParameters)),
      headers: {
        accept: 'application/atom+xml',
      },
      uri: `{ authType }/api/wiki/${wikiLabel}/page/${pageLabel}/feed`,
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

      callback(null, responseParsers.pageVersions(body));
    });
  };

  /**
   * Retrieve feed of media content. Used by version and wiki page.
   *
   * @param  {Object}   query                   Query object that holds information required by request uri.
   * @param  {Object}   options                 Additional information used as default for every request options.
   * @param  {String}   options.content         Content src acquired from wikiPage or wikiVersionDetails entry.
   * @param  {Function} callback                [description]
   */
  const mediaContent = (query, options = {}, callback) => {
    const qsValidParameters = [];

    const { content } = options;

    // parse content uri
    const uri = ((url) => {
      if (!url) {
        return url;
      }
      // e.x. https://baseUrl.com/wikis/oauth/some/path
      // need to strip this path to oauth/some/path and replace 'oauth' with our custom { mediaAuthType } template
      // This is necessary due different authType's required by different environments.
      // Now we can easily set { mediaAuthType } via 'serviceOptions' directly from an environment.
      const [, contentPath] = contentPathRegex.exec(url);
      return injectAuthTypeTemplate(contentPath);
    })(content);

    // construct the request options
    const requestOptions = _.merge({}, omitDefaultRequestParams(options), {
      qs: _.pick(query, qsValidParameters),
      headers: {
        accept: 'application/atom+xml',
      },
      uri,
    });

    httpClient.makeRequest(requestOptions, (requestError, response, body) => {
      if (requestError) {
        callback(requestError);
        return;
      }

      const { statusCode } = response;
      // expected
      // status codes: 200, 401, 403, 404
      if (!response || statusCode !== 200) {
        const error = constructError(body || 'received response with unexpected status code', statusCode);
        callback(error);
        return;
      }

      callback(null, responseParsers.mediaContent(body));
    });
  };

  return { navigationFeed, wikiPage, pageVersionDetails, pageComments, pageVersions, mediaContent };
};
