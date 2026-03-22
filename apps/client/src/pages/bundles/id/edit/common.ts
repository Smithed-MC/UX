import { compare, inc } from "semver";

export function getNextVersion(
	versions: {
		name: string
		patches: Partial<{ datapack: string; resourcepack: string }>[]
		packs: { id: string; version: string }[]
		supports: string[]
	}[]
) {
	return (
		inc(
			[...versions].sort((a, b) => compare(a.name, b.name)).at(-1)
				?.name ?? "0.0.0",
			"patch"
		) ?? ""
	)
}