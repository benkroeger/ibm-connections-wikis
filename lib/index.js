'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const OniyiHttpClient = require('oniyi-http-client');
const credentialsPlugins = require('oniyi-http-plugin-credentials');
const formatUrlTemplatePlugins = require('oniyi-http-plugin-format-url-template');

// internal modules
const feeds = require('./feeds');
const { getAuthParams, makeServiceMethod } = require('./utils/utility');

/**
 * The factory function exported by the ibm-connections-activities module which returns an instance of the [IbmConnectionsActivitiesService](#markdown-header-ibmconnectionsactivitiesservice).
 *
 * @param   {String} baseUrl                                   The base URL of the IBM Connections Cloud instance with which the service will be communicating.
 * @param   {Object} serviceOptions                            An object of key-value pairs to set as defaults for the service.
 * @param   {String} [serviceOptions.accessToken]              An OAuth access token for the IBM Connections Cloud instance with which the service will be communicating.
 *                                                             If you provide this, it will be provided as a bearer token in the Authorization header on every request you
 *                                                             make with the service.
 * @param   {Object} [serviceOptions.headers]                  An object of key-value pairs, where a key is a HTTP header name and the corresponding value is the value for
 *                                                             the HTTP header. These headers and their values will be attached to every request the service makes.
 */
module.exports = function IbmConnectionsActivitiesService(baseUrl, serviceOptions) {
  const defaultAuthParams = {
    defaults: serviceOptions && getAuthParams(serviceOptions),
  };
  const defaultHeaders = {
    defaults: {
      headers: serviceOptions && serviceOptions.headers,
    },
  };
  // options we'll use across the module
  const options = _.merge({
    defaults: {
      // make sure our base url ends with a "/", url.resolve doesn't work correctly otherwise
      baseUrl: baseUrl.charAt(baseUrl.length - 1) === '/' ? baseUrl : `${baseUrl}/`,
      headers: {},
      followRedirect: true,
    },
  },
    defaultAuthParams,
    defaultHeaders,
    serviceOptions);

  // create a http client to be used throughout this service
  const httpClient = new OniyiHttpClient(options);

  if (options.credentials) {
    httpClient.use(credentialsPlugins(options.credentials));
  }
  httpClient.use(formatUrlTemplatePlugins(options.formatUrlTemplate));

  function makeServiceMethodFactory(fn) {
    return makeServiceMethod(httpClient, fn);
  }

  return {
    // JSDoc located in lib/feeds/index.js
    feeds: Object.keys(feeds)
      .reduce((result, key) => {
        _.assign(result, {
          [key]: makeServiceMethodFactory(feeds[key]),
        });
        return result;
      }, {}),
  };
};
