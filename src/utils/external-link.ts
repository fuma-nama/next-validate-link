export interface ExternalLinkConfig {
  validate?: (url: URL) => Promise<ExternalLinkResult>;
}

export type ExternalLinkResult =
  | {
      success: true;
    }
  | {
      success: false;
      message?: string;
    };

export function externalLink(config: ExternalLinkConfig) {
  const { validate } = config;

  return async (url: string): Promise<ExternalLinkResult> => {
    const parsed = new URL(url);
    if (validate) return validate(parsed);

    if (parsed.hostname === "localhost") return { success: true };

    try {
      const res = await fetch(parsed, {
        method: "HEAD",
      });

      if (!res.ok) {
        if (res.status === 404) return { success: false, message: "not found" };
        // ignore redirect etc.
        if (res.status >= 300 && res.status < 400) return { success: true };

        return {
          success: false,
          message: `${url} responded status ${res.status}`,
        };
      }

      return { success: true };
    } catch (e) {
      if (e instanceof Error) return { success: false, message: e.message };
      return { success: false };
    }
  };
}
