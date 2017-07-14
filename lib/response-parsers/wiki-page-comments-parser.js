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
    published: 'atom:published',
    updated: 'atom:updated',
    created: 'td:created',
    modified: 'td:modified',
    content: 'atom:content[@type="text"]',
    title: 'atom:title[@type="text"]',
    language: 'td:language',
    deleteWithRecord: 'td:deleteWithRecord',
  };

  const linkSelectors = {
    self: 'atom:link[@rel="self"]',
    alternate: 'atom:link[@rel="alternate"]',
    edit: 'atom:link[@rel="edit"]',
    'edit-media': 'atom:link[@rel="edit-media"]',
  };

  const authorSelectors = {
    name: 'atom:author/atom:name',
    userId: 'atom:author/snx:userid',
    email: 'atom:author/atom:email',
    userState: 'atom:author/snx:userState',
    orgId: 'atom:author/snx:orgId',
    guest: 'atom:author/td:guest',
  };

  const commentModifierSelectors = {
    name: 'td:modifier/atom:name',
    userId: 'td:modifier/snx:userid',
    email: 'td:modifier/atom:email',
    userState: 'td:modifier/snx:userState',
    orgId: 'td:modifier/snx:orgId',
    guest: 'td:modifier/td:guest',
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
  const modifier = selectorParser(commentModifierSelectors);

  return _.assign(textValues, { links, author, modifier });
}

module.exports = parseXmlNode;
