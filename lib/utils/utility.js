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

module.exports = {
  initParser,
  parseXML,
  serializeXML,
  ensureXMLDoc,
  toInteger,
  extractIdFromURN,
  selectorParserFactory,
};
