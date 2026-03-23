import { normalizeText } from "./utils/text";

export function matchScenario(input, scenarios) {
  const normalizedInput = normalizeText(input);

  for (const scenario of scenarios) {

    // match bằng regex (cũ)
    if (scenario.patterns?.some(p => p.test(normalizedInput))) {
      return scenario;
    }

    // match bằng keyword (mới - thông minh hơn)
    if (scenario.keywords) {
      const matched = scenario.keywords.some(keyword =>
        normalizedInput.includes(keyword)
      );

      if (matched) return scenario;
    }
  }

  return null;
}