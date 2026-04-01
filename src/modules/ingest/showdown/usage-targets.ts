const DEFAULT_PRODUCTION_USAGE_TARGETS = ['gen9ou', 'gen9uu', 'gen9monotype'] as const

type UsageTargetSelection = {
  selectedFormatKeys: string[]
  missingConfiguredFormatKeys: string[]
  isRestricted: boolean
}

export function getUsageFormatKeyFromStatsFile(file: string) {
  return file.replace(/\.json$/, '').replace(/-\d+$/, '')
}

export function selectUsageTargetFormats(
  files: string[],
  configuredFormatKeys: string[]
): UsageTargetSelection {
  const availableFormatKeys = Array.from(new Set(files.map((file) => getUsageFormatKeyFromStatsFile(file))))

  if (!configuredFormatKeys.length) {
    return {
      selectedFormatKeys: availableFormatKeys,
      missingConfiguredFormatKeys: [],
      isRestricted: false,
    }
  }

  const availableSet = new Set(availableFormatKeys)
  const selectedFormatKeys = configuredFormatKeys.filter((formatKey) => availableSet.has(formatKey))
  const missingConfiguredFormatKeys = configuredFormatKeys.filter((formatKey) => !availableSet.has(formatKey))

  return {
    selectedFormatKeys,
    missingConfiguredFormatKeys,
    isRestricted: true,
  }
}

export function getDefaultProductionUsageTargets() {
  return [...DEFAULT_PRODUCTION_USAGE_TARGETS]
}
