'use strict';

// node core modules

// 3rd party modules
const _ = require('lodash');
const { parseXMLNode } = require('oniyi-utils-xml');

// internal modules
const xpath = require('../xpath-select');
const rankSchemes = require('../constants/rank-schemes.json');
const { toDate, urnToId, parseUserInfo } = require('./utils');

const linkRelToNameMap = {
  self: 'self',
  alternate: 'alternate',
  edit: 'edit',
  enclosure: 'enclosure',
  related: 'related',
  replies: 'replies',
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

const invertedRankSchemes = _.invert(rankSchemes);

const parseRanks = nodes => _.reduce(nodes, (result, node) => {
  const rank = parseXMLNode(node, {
    scheme: 'string(@scheme)',
    value: 'number(.)',
  }, xpath);
  const { [rank.scheme || '']: name } = invertedRankSchemes;
  /* beautify preserve:start */
  return Object.assign(result, { [name]: rank.value });
  /* beautify preserve:end */
}, {});

const parseContent = node => parseXMLNode(node, {
  src: 'string(./@src)',
}, xpath);

module.exports = xmlNode => parseXMLNode(xmlNode, {
  id: {
    selector: 'string(atom:id)',
    transform: urnToId,
  },
  versionLabel: 'number(td:versionLabel)',
  totalMediaSize: 'number(td:totalMediaSize)',
  versionUuid: 'string(td:versionUuid)',
  title: 'string(atom:title[@type="text"])',
  summary: 'string(atom:summary[@type="text"])',
  content: { selector: 'atom:content[@type="text/html"]', transform: parseContent },
  label: 'string(td:label)',
  published: {
    selector: 'string(atom:published)',
    transform: toDate,
  },
  updated: {
    selector: 'string(atom:updated)',
    transform: toDate,
  },
  created: {
    selector: 'string(atom:created)',
    transform: toDate,
  },
  modified: {
    selector: 'string(atom:modified)',
    transform: toDate,
  },
  visibility: 'string(td:visibility)',
  propagation: 'string(td:propagation)',
  author: { selector: 'atom:author', transform: parseUserInfo },
  modifier: { selector: 'td:modifier', transform: parseUserInfo },
  links: { selector: 'atom:link', transform: parseLinks, multi: true },
  ranks: { selector: 'snx:rank', transform: parseRanks, multi: true },
}, xpath);;
