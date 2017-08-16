'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const { parseXMLNode } = require('oniyi-utils-xml');

// internal modules
const xpath = require('../xpath-select');
const { toDate, urnToId, parseUserInfo } = require('./utils');

const linkRelToNameMap = {
  self: 'self',
  alternate: 'alternate',
  edit: 'edit',
  'edit-media': 'edit-media',
};

const parseLinks = nodes => _.reduce(nodes, (result, node) => {
  const link = parseXMLNode(node, {
    rel: 'string(@rel)',
    type: 'string(@type)',
    href: 'string(@href)',
  }, xpath);
  const { [link.rel || '']: name } = linkRelToNameMap;
  /* beautify preserve:start */
  return Object.assign(result, { [name]: link });
  /* beautify preserve:end */
}, {});

module.exports = xmlNode => parseXMLNode(xmlNode, {
  id: {
    selector: 'string(atom:id)',
    transform: urnToId,
  },
  versionLabel: {
    selector: 'number(td:versionLabel/text())',
  },
  title: 'string(atom:title[@type="text"])',
  published: {
    selector: 'string(atom:published)',
    transform: toDate,
  },
  updated: {
    selector: 'string(atom:updated)',
    transform: toDate,
  },
  created: {
    selector: 'string(td:created)',
    transform: toDate,
  },
  modified: {
    selector: 'string(td:modified)',
    transform: toDate,
  },
  content: 'string(atom:content[@type="text"])',
  language: 'string(td:language)',
  deleteWithRecord: 'string(td:deleteWithRecord)',
  author: { selector: 'atom:author', transform: parseUserInfo },
  modifier: { selector: 'td:modifier', transform: parseUserInfo },
  links: { selector: 'atom:link', transform: parseLinks, multi: true },
}, xpath);
