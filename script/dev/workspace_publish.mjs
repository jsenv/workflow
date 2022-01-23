/*
 * TODO:
 *
 * This file should:
 * - collect all workspaces packages
 * - diff the local version with the version published on NPM
 * - for each version that needs to be published to NPM
 *   - publish it
 *   - update the major/minor/patch of package using this one
 *   - recursively update the package using this one again
 * The script must happen in 2 phase:
 * first phase checks all what should be done and print a report
 * then ask if it can proceed to perfom all the changes
 * (update package.json + publish all what needs to be)
 * It would be a subset of what "lerna" is doing
 */
