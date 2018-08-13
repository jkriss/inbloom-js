const tap = require('tap')
const { BloomFilter, load } = require('../src/index')

// basics
const bf = new BloomFilter(20, 0.01)
// const keys = ["foo"]
const keys = ["foo", "bar", "foosdfsdfs", "fossdfsdfo", "foasdfasdfasdfasdfo", "foasdfasdfasdasdfasdfasdfasdfasdfo"]
const faux = ["goo", "gar", "gaz"]

keys.forEach(k => bf.add(k))

keys.forEach(k => tap.assert(bf.contains(k)))
faux.forEach(k => tap.assertNot(bf.contains(k)))

// dump
const bf2 = new BloomFilter(20, 0.01)
bf2.add("abc")
const expected2 = '620d006400000014000000000020001000080000000000002000100008000400'
const actual2 = bf2.toString('hex')
tap.equal(actual2, expected2)

// load
const bf3 = load('620d006400000014000000000020001000080000000000002000100008000400')
tap.assert(bf3.contains('abc'))
tap.equal(bf3.toString('hex'), '620d006400000014000000000020001000080000000000002000100008000400')
