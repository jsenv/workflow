/*
 * This file exports configuration reused by jsenv scripts such as
 *
 * script/importmap/importmap.mjs
 *
 * Read more at https://github.com/jsenv/jsenv-core#configuration
 */

export const projectDirectoryUrl = new URL("./", import.meta.url)
