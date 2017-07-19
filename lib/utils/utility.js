'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const xmlUtils = require('oniyi-utils-xml');

// internal modules

const parseXML = xmlUtils.parse;
const serializeXML = xmlUtils.serialize;

/**
 * init parser with namespaces
 * @param  {Object} xmlNS   namespaces
 * @example
 * selectXPath = parserUtils.initParser({...});
 */
const initParser = xmlNS => (xmlUtils.selectUseNamespaces(xmlNS));

/**
 * Convert the given argument into an integer.
 * @param   {*} val  value to convert to an integer.
 * @returns {Number} The integer representation of the value.
 * @static
 */
function toInteger(val) {
  return parseInt(val, 10);
}

/**
 * Convert the given content into an XML DOM Document object if possible.
 * @param   {*}   content    The content to convert to an XML DOM document object.
 * @returns {*}              The XML DOM Document object representation if succesful. Otherwise just returns the content given as the first argument of the function.
 * @static
 */
function ensureXMLDoc(content) {
  let xmlDoc = content;
  if (_.isString(xmlDoc)) {
    xmlDoc = parseXML(xmlDoc);
  }
  return xmlDoc;
}

/**
 * Extract just the id of an IBM Connections Cloud object out of
 * the full Uniform Resource Name.
 * @param   {String} urn   A IBM Connections Cloud Uniform Resource Name.
 * @returns {String}        The id of the IBM Connections Cloud Object
 * @static
 * @example
 * const parserUtils = require('./parser-utils');
 * const id = parserUtils.extractIdFromURN('urn:lsid:ibm.com:oa:a8d112ee-024a-45b1-a7bc-6d918d009a3a');
 * console.log(id); // => 'a8d112ee-024a-45b1-a7bc-6d918d009a3a'
 */
// eslint-disable-next-line arrow-body-style
const extractIdFromURN = urn => urn.split(':')[4];

/**
 * Parse provided selectors
 *
 * @param {Object} xmlNode            Xml node entry
 * @param {Function} selectXPath      Extracting node entry from xmlNode by given selector*
 */
const selectorParserFactory = (xmlNode, selectXPath) =>
  function selectorParser(selectors, multiFields) {
    return _.reduce(selectors, (result, value, selectorKey) => {
      const selector = _.isString(value) ? value : value.selector;
      const node = selectXPath(selector, xmlNode, true);
      if (!node) {
        return result;
      }
      if (multiFields && _.isArray(multiFields)) {
        let multiField = {};
        multiFields.forEach((elem) => { // eslint-disable-line consistent-return
          if (!node.getAttribute(elem)) {
            return result;
          }
          multiField = _.defaultsDeep(multiField, {
            [selectorKey]: {
              [elem]: node.getAttribute(elem),
            },
          });
        });
        return _.assign(result, multiField);
      }

      return _.assign(result, {
        [selectorKey]: _.isFunction(value.transform) ? value.transform(node.textContent) : node.textContent,
      });
    }, {});
  };

/**
 * Look for any authentication parameters in the given object. If any are found,
 * use them to construct an authentication object to pass as part of the parameter object
 * to an http request made by [oniyi-http-client](https://www.npmjs.com/package/oniyi-http-client).
 * @param  {Object} params                   An object containing authentication data.
 * @param  {Object} [params.user]            A LoopBack User model instance.
 * @param  {String} [params.accessToken]     An OAuth access token.
 * @param  {String} [params.bearer]          An OAuth access token.
 * @param  {String} [params.username]        A username.
 * @param  {String} [params.password]        A password.
 * @param  {Object} [params.auth]            An object containing authentication data.
 * @param  {Object} [params.auth.bearer]     An OAuth access token.
 * @param  {String} [params.auth.username]   A username.
 * @param  {String} [params.auth.password]   A password.
 * @returns {Object}                         An object containing authentication data ready to be consumed by oniyi-http-client.
 * @static
 */
function getAuthParams(params) {
  // extract possible credentials

  // LoopBack User Model
  const user = params.user;
  if (user) return { user };

  // OAuth - AccessToken
  const accessToken = params.accessToken || params.bearer || (params.auth && params.auth.bearer);
  // Basic Credentials
  const username = params.username || (params.auth && params.auth.username);
  const password = params.password || (params.auth && params.auth.password);

  if (accessToken) {
    // apply accessToken according to the "request" documentation https://github.com/request/request#http-authentication
    return {
      auth: {
        bearer: accessToken,
      },
    };
  }

  if (username && password) {
    // apply basic credentials according to the "request" documentation https://github.com/request/request#http-authentication
    return {
      auth: {
        username,
        password,
      },
      jar: params.jar,
    };
  }

  return {
    jar: params.jar,
  };
}

/**
 * A factory function that returns a function ready to be attached to the ibm-connections-activities public API.
 * The returned function just calls the original private function passed in as a parameter to the factory, but
 * passing in the instance of [oniyi-http-client](https://www.npmjs.com/package/oniyi-http-client) that the private
 * function should use to issue the actual HTTP requests. This ensures that the service's internal httpClient instance
 * stays private and that the service cannot be used with an external httpClient instance.
 *
 * @param   {Object}   httpClient   An instance of [oniyi-http-client](https://www.npmjs.com/package/oniyi-http-client)
 * @param   {Function} fn           The internal function that the function produced by the factory will call.
 * @returns {Function}              A function which calls the internal function passed to the factory with the internal httpClient instance.
 * @static
 */
function makeServiceMethod(httpClient, fn) {
  return (params, callback) => fn.call(null, httpClient, params, callback);
}

module.exports = {
  initParser,
  parseXML,
  serializeXML,
  ensureXMLDoc,
  toInteger,
  extractIdFromURN,
  selectorParserFactory,
  getAuthParams,
  makeServiceMethod,
};
