import test from "node:test";
import assert from "node:assert/strict";
import { gunzipSync } from "node:zlib";
import { createTarGz, createZip, sha256 } from "../scripts/lib/release-archive.mjs";

const entries = [
  { path: "bundle/hello.txt", data: Buffer.from("hello\n"), executable: false },
  { path: "bundle/bin/tool.mjs", data: Buffer.from("#!/usr/bin/env node\n"), executable: true }
];

test("release archives are byte-for-byte deterministic", () => {
  assert.deepEqual(createZip(entries, 0), createZip(entries, 0));
  assert.deepEqual(createTarGz(entries, 0), createTarGz(entries, 0));
});

test("gzip header is host-neutral for cross-platform reproducibility", () => {
  const gzip = createTarGz(entries, 0);
  assert.equal(gzip[9], 255, "RFC 1952 OS byte must not identify Windows or Unix");
});

test("zip archive contains the allowlisted paths and payload", () => {
  const zip = createZip(entries, 0);
  assert.equal(zip.readUInt32LE(0), 0x04034b50);
  assert.match(zip.toString("latin1"), /bundle\/hello\.txt/);
  assert.match(zip.toString("latin1"), /hello\n/);
});

test("tar.gz archive expands to a valid ustar stream", () => {
  const tar = gunzipSync(createTarGz(entries, 0));
  assert.equal(tar.subarray(257, 262).toString(), "ustar");
  assert.equal(tar.subarray(0, 100).toString().replace(/\0.*$/, ""), "bundle/hello.txt");
  assert.equal(tar.subarray(512, 518).toString(), "hello\n");
});

test("sha256 helper returns a stable lowercase digest", () => {
  assert.equal(sha256(Buffer.from("hello\n")), "5891b5b522d5df086d0ff0b110fbd9d21bb4fc7163af34d08286a2e846f6be03");
});
