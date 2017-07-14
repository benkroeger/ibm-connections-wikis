'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');

// internal modules
const { initParser, extractIdFromURN, toInteger, selectorParserFactory } = require('./../utils/utility');
const xmlNS = require('../constants/xml-namespaces.json');
const rankSchemes = require('../constants/rank-schemes.json');

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
    totalMediaSize: {
      selector: 'td:totalMediaSize',
      transform: toInteger,
    },
    versionUuid: 'td:versionUuid',
    title: 'atom:title[@type="text"]',
    summary: 'atom:summary[@type="text"]',
    published: 'atom:published',
    updated: 'atom:updated',
    label: 'td:label',
    created: 'td:created',
    modified: 'td:modified',
    visibility: 'td:visibility',
    propagation: 'td:propagation',
  };
  const linkSelectors = {
    self: 'atom:link[@rel="self"]',
    alternate: 'atom:link[@rel="alternate"]',
    edit: 'atom:link[@rel="edit"]',
    'edit-media': 'atom:link[@rel="edit-media"]',
    enclosure: 'atom:link[@rel="enclosure"]',
    related: 'atom:link[@rel="related"]',
    replies: 'atom:link[@rel="replies"]',
  };
  const authorSelectors = {
    name: 'atom:author/atom:name',
    userId: 'atom:author/snx:userid',
    orgId: 'atom:author/snx:orgId',
    orgName: 'atom:author/snx:orgName',
    email: 'atom:author/atom:email',
    userState: 'atom:author/snx:userState',
  };

  const rankSelectors = _.reduce(rankSchemes, (result, value, key) =>
    _.assign(result, {
      [key]: `snx:rank[@scheme="${value}"]`,
    }), {});

  const contentSelector = {
    content: 'atom:content[@type="text/html"]',
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

  const content = selectorParser(contentSelector, ['src']);
  const links = selectorParser(linkSelectors, ['href', 'type']);
  const author = selectorParser(authorSelectors);
  const ranks = selectorParser(rankSelectors);

  return _.assign(textValues, content, { links, author, ranks });
}

module.exports = parseXmlNode;
