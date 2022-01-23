/*
 * This file exports configuration reused by jsenv scripts such as
 *
 * script/test/test.mjs
 * script/importmap/importmap.mjs
 *
 * Read more at https://github.com/jsenv/jsenv-core#configuration
 */

export const projectDirectoryUrl = String(new URL("./", import.meta.url))
