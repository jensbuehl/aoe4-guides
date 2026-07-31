// Refuses installs from anything but npm.
//
// pnpm and yarn ignore package-lock.json and re-resolve every semver range
// themselves. That silently drifts node_modules away from the committed lock
// file — a pnpm install here pulled vite ^6.2.5 up to 6.4.3 and
// vite-plugin-node-polyfills ^0.23.0 up to 0.23.1, and 0.23.1 aliases Node
// shims to unenv/* without depending on unenv, which breaks `npm run dev` with
// "Cannot find module 'unenv/mock/empty'". The build still passed, so the
// breakage only showed up in the dev server.
//
// The packageManager field in package.json covers the same ground, but only on
// machines with corepack enabled. This check needs no setup.

const userAgent = process.env.npm_config_user_agent ?? "";

// npm sets e.g. "npm/10.9.7 node/v22.22.2 win32 x64"; pnpm and yarn lead with
// their own name. An empty value means we were run directly, not via install.
if (userAgent && !userAgent.startsWith("npm/")) {
  const tool = userAgent.split("/")[0];
  console.error(
    `\n  This project uses npm, not ${tool}.\n\n` +
      `  ${tool} ignores package-lock.json and re-resolves dependency ranges,\n` +
      `  which drifts node_modules from the committed lock file and breaks the\n` +
      `  dev server. Run "npm ci" (or "npm install") instead.\n`
  );
  process.exit(1);
}
