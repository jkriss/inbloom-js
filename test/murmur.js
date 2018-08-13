const tap = require('tap')
const murmur = require('../src/murmur')

const expectedHash = 597841616
const a = murmur("foo", 0x9747b28c)

tap.equals(a, expectedHash)

const expectedHash2 = 479470107
const a2 = murmur("abc", 0x9747b28c)
tap.equals(a2, expectedHash2)
