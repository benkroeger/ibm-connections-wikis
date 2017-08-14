'use strict';

// node core modules

// 3rd party modules
const { parseXMLNode } = require('oniyi-utils-xml');

// internal modules
const xpath = require('../xpath-select');

const urnRegexp = /([a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12})$/;

const urnToId = (val) => {
  const [, id] = val.match(urnRegexp);
  return id;
};

const toDate = val => val && Date.parse(val);

const parseUserInfo = node => parseXMLNode(node, {
  name: 'string(atom:name/text())',
  userId: 'string(snx:userid/text())',
  state: 'string(snx:userState/text())',
  email: 'string(atom:email/text())',
  external: 'boolean(snx:isExternal/text())',
}, xpath);

module.exports = { urnToId, toDate, parseUserInfo };
