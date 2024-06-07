import { ChooseBox } from "components"
import { Refresh } from "components/svg"
import { DARK_THEME, LIGHT_THEME, useSiteSettings } from "hooks"
import { useState } from "react"

const VARIABLES: Record<string, string> = {
	Bold: "bold",
	Background: "background",
	Section: "section",
	Highlight: "highlight",
	Border: "border",
	Foreground: "foreground",
	Accent: "accent",
	"Light Accent": "accent2",

	Warning: "warning",
	Disturbing: "disturbing",
	Success: "success",
	Secondary: "secondary",

	Bundle: "bundle",
}

export default function SiteSettings() {
	const [siteSettings, saveSettings] = useSiteSettings()
	const [theme, setTheme] = useState<string>(siteSettings.theme.type)
	const appStyle = !import.meta.env.SSR
		? getComputedStyle(document.getElementById("app")!)
		: undefined

	return (
		<div className="container" style={{ width: "100%", maxWidth: "32rem", gap: "1rem" }}>
			<h2>Appearance</h2>
			<ChooseBox
				placeholder="Theme"
				choices={[
					{ value: "dark", content: "Dark" },
					{ value: "light", content: "Light" },
					{ value: "custom", content: "Custom" },
				]}
				onChange={(v) => {
					if (v === 'dark')
						siteSettings.theme = DARK_THEME
					else if (v === 'light')
						siteSettings.theme = LIGHT_THEME
					else
						siteSettings.theme = {
							type: "custom",
							variables: {
								...siteSettings.theme.variables
							}
						}
					saveSettings(siteSettings)
					setTheme(v as string)
				}}
				defaultValue={siteSettings.theme.type}
			/>
			{theme === "custom" && (
				<div className="container" style={{ gap: "0.5rem" }}>
					<h3>Variables</h3>
					{Object.entries(VARIABLES).map((variable) => {
						const cssVar = "--" + variable[1]
						const defaultColor = appStyle?.getPropertyValue(cssVar)

						const setColor = (color: string) => {
							siteSettings.theme.variables[variable[1]] = color
							saveSettings(siteSettings)
						}

						return (
							<div
								key={variable[0]}
								className="container"
								style={{
									flexDirection: "row",
									alignItems: "center",
									width: "100%",
									gap: "1rem",
								}}
							>
								<span>{variable[0]}</span>
								<div style={{ flexGrow: 1 }} />
								<input
									id={variable + "_color_input"}
									type="color"
									defaultValue={defaultColor}
									onChange={(e) => {
										setColor(e.currentTarget.value)
									}}
								/>
								<button
									onClick={() => {
										const input = document.getElementById(
											variable + "_color_input"
										) as HTMLInputElement | null

										setColor(defaultColor ?? "")

										if (defaultColor && input)
											input.value = defaultColor
									}}
								>
									<Refresh />
								</button>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}