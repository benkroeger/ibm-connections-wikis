'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules
const { initParser, extractIdFromURN, toInteger, selectorParserFactory } = require('./../utils/utility');
const xmlNS = require('../constants/xml-namespaces.json');

const selectXPath = initParser(xmlNS);

function parseXmlNode(xmlNode) {
  const selectorParser = selectorParserFactory(xmlNode, selectXPath);

  /* Selector definitions */
  const textValueSelectors = {
    id: {
      selector: 'atom:id',
      transform: extractIdFromURN,
    },
    versionLabel: {
      selector: 'td:versionLabel',
      transform: toInteger,
    },
    label: 'td:label',
    documentUuid: 'td:documentUuid',
    title: 'atom:title[@type="text"]',
    published: 'atom:published',
    updated: 'atom:updated',
    created: 'td:created',
    modified: 'td:modified',
    libraryId: 'td:libraryId',
    summary: 'atom:summary[@type="text"]',
    content: 'atom:content[@type="text/html"]',
  };

  const linkSelectors = {
    self: 'atom:link[@rel="self"]',
    alternate: 'atom:link[@rel="alternate"]',
    edit: 'atom:link[@rel="edit"]',
    'edit-media': 'atom:link[@rel="edit-media"]',
    enclosure: 'atom:link[@rel="enclosure"]',
  };

  const authorSelectors = {
    name: 'atom:author/atom:name',
    userId: 'atom:author/snx:userid',
    orgId: 'atom:author/snx:orgId',
    orgName: 'atom:author/snx:orgName',
    email: 'atom:author/atom:email',
    userState: 'atom:author/snx:userState',
  };

  const versionModifierSelectors = {
    name: 'td:modifier/atom:name',
    userId: 'td:modifier/snx:userid',
    orgId: 'td:modifier/snx:orgId',
    orgName: 'td:modifier/snx:orgName',
    email: 'td:modifier/atom:email',
    userState: 'td:modifier/snx:userState',
  };

  /* Selector parsing */
  const textValues = _.reduce(textValueSelectors, (result, value, name) => {
    const selector = _.isString(value) ? value : value.selector;
    const node = selectXPath(selector, xmlNode, true);
    if (!node) {
      return result;
    }
    return _.assign(result, {
      [name]: _.isFunction(value.transform) ? value.transform(node.textContent) : node.textContent,
    });
  }, {});

  const links = selectorParser(linkSelectors, ['href', 'type']);
  const author = selectorParser(authorSelectors);
  const modifier = selectorParser(versionModifierSelectors);

  return _.assign(textValues, { links, author, modifier });
}

module.exports = parseXmlNode;
