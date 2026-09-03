import path from "node:path";

import { getServerConfig } from "../config.server";

export function getContentMediaRoot() {
  return path.resolve(getServerConfig().uploadDir, "content-media");
}

export function isPathInside(root: string, candidate: string) {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  return resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`);
}

export function buildContentMediaPath(id: string, extension: string) {
  const root = getContentMediaRoot();
  const candidate = path.resolve(root, `${id}${extension}`);
  if (!isPathInside(root, candidate)) throw new Error("Unsafe media path");
  return { root, candidate };
}
