const murmur = require('./murmur')
const crc32 = require('crc-32').buf
const denom = 0.480453013918201

const checksumForBuffer = function (buffer) {
  const checksum = crc32(buffer)
  return (checksum&0xFFFF) ^ (checksum>>16)
}

class BloomFilter {
  constructor(entries, error, buffer) {
    if (entries < 1 || error === 0) {
      throw new Error("Invalid params for bloom filter")
    }
    this.entries = entries
    this.error = error
    this.bpe = -(Math.log(error) / denom)
    this.bits = Math.floor(entries * this.bpe)
    this.bytes = Math.floor(this.bits/8)
    this.hashes = Math.ceil(0.693147180559945 * this.bpe) // ln(2)

    if (this.bits%8 != 0) {
      this.bytes++
    }

    if (buffer) {
      if (this.bytes != buffer.length) {
        throw new Error(`Expected ${this.bytes}, got ${buffer.length}`)
      }
      this.buffer = buffer
    } else {
      this.buffer = Buffer.alloc(this.bytes)
    }
  }
  checkAdd(key, add) {
    let hits = 0
    const a = murmur(key, 0x9747b28c)
    const b = murmur(key, a)

    for (let i=0; i<this.hashes; i++) {
      const x = (a + i*b) % this.bits
      const bt = x >> 3

      const c = this.buffer[bt]
      const mask = 0x01 << (x % 8)

      if ((c & mask) != 0) {
        hits++
      } else {
        if (add) {
          this.buffer[bt] = c | mask
        }
      }
    }
    return hits == this.hashes
  }
  add(key) {
    return this.checkAdd(key, true)
  }
  contains(key) {
    return this.checkAdd(key, false)
  }
  checksum() {
    return checksumForBuffer(this.buffer)
  }
  dump() {
    const buf = Buffer.alloc(this.bytes + 8)
    buf.writeUInt16BE(this.checksum(), 0, 2) // 2 bytes
    buf.writeUInt16BE((1.0/this.error), 2) // 2 bytes
    buf.writeUInt32BE(this.entries, 4) // 4 bytes
    this.buffer.copy(buf, 8)
    return buf
  }
  toString(encoding) {
    return this.dump().toString(encoding)
  }
}

const load = function(input, encoding='hex') {
  const buf = Buffer.from(input, encoding)
  const checksum = buf.readUInt16BE()
  const errRate = buf.readUInt16BE(2)
  if (errRate === 0) {
    throw new Error("Error rate cannot be 0")
  }
  const entries = buf.readUInt32BE(4)
  const data = Buffer.alloc(buf.length - 8)
  buf.copy(data, 0, 8)
  if (checksum != checksumForBuffer(data)) {
    throw new Error("Bad checksum")
  }
  return new BloomFilter(entries, 1/errRate, data)
}

module.exports = {
  BloomFilter,
  load
}
