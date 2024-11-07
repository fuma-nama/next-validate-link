/**
 * Split path into segments, trailing/leading slashes are removed
 */
function splitPath(path: string): string[] {
  return path.split('/').filter((p) => p.length > 0);
}

export function resolveUrl(base: string, relative: string) {
  const v1 = splitPath(base);
  const v2 = splitPath(relative);

  while (v2.length > 0) {
    switch (v2[0]) {
      case '..':
        v1.pop();
        break;
      case '.':
        break;
      default:
        v1.push(v2[0]);
    }

    v2.shift();
  }

  return v1.join('/');
}
