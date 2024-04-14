import { Value, ValueError, ValueErrorType } from "@sinclair/typebox/value"
import {
	CategoryBar,
	CategoryChoice,
	ChooseBox,
	IconInput,
	IconTextButton,
	Link,
	MarkdownRenderer,
	Modal,
	Spinner,
} from "components"
import {
	Trash,
	Globe,
	Plus,
	Picture,
	Check,
	Jigsaw,
	Text as TextSvg,
	At,
	Refresh,
	File,
	Account,
	Home,
	Github,
	YouTube,
	Discord,
	ColorPicker,
	Cross,
} from "components/svg"
import {
	PackData,
	PackDataSchema,
	PackDependency,
	PackMetaData,
	PackVersion,
	UserData,
	packCategories,
	supportedMinecraftVersions,
} from "data-types"
import { useFirebaseUser, useQueryParams, useSmithedUser } from "hooks"
import { useEffect, useMemo, useRef, useState } from "react"
import {
	createSearchParams,
	useLoaderData,
	useLocation,
	useNavigate,
	useNavigation,
	useParams,
	useSearchParams,
} from "react-router-dom"
import { coerce, compare, satisfies, inc, valid } from "semver"
import { gzip } from "pako"
import "./edit.css"
import { sanitize } from "formatters"
import {
	TextInput,
	setPropertyByPath,
	LargeTextInput,
	validUrlRegex,
} from "../../editors/inputs"
import GalleryManager from "../../editors/galleryManager"
import { PackEditLoaderData } from "./edit.loader"
import qs from "query-string"
import ReadmePreview from "../../editors/readmePreview"
import {
	useErrorEventHandlers,
	sendErrorEvent,
} from "../../editors/errorEvents"
import "../../editors/common.css"
import VersionSelectOption from "../../editors/versionSelectOption"

interface SavingState {
	mode: "off" | "saving" | "saved" | "error"
	error?: {
		error: string
		statusCode: number
		message: string
	}
}

function SavingModal({
	state,
	changeState,
}: {
	state: SavingState
	changeState: (state: SavingState) => void
}) {
	const modalContainer = useRef<HTMLDivElement>(null)
	const modalBody = useRef<HTMLDivElement>(null)

	const closeModal = (initialDelay: number) =>
		setTimeout(async () => {
			const delay = (delay: number) =>
				new Promise((resolve) => {
					setTimeout(resolve, delay)
				})

			// Have to reset these first for some reason
			modalBody.current?.style.setProperty("animation", "")
			modalContainer.current?.style.setProperty("animation", "")
			await delay(10)
			modalBody.current?.style.setProperty(
				"animation",
				"slideInContent 0.6s reverse"
			)
			modalContainer.current?.style.setProperty(
				"animation",
				"fadeInBackground 1s ease-in-out reverse"
			)
			await delay(0.6 * 1000 - 10)
			changeState({ mode: "off" })
		}, initialDelay)

	useEffect(() => {
		if (state.mode === "saved") {
			var timeout = closeModal(2000)
		}
		return () => {
			clearTimeout(timeout)
		}
	}, [state])

	if (state.mode === "off")
		return <div style={{ display: "none", position: "absolute" }} />

	return (
		<div
			style={{
				display: "flex",
				position: "fixed",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				fontSize: "1.125rem",
				justifyContent: "center",
				alignItems: "center",
				color: "var(--goodAccent)",
				backgroundColor: "rgba(0,0,0,0.5)",
				animation: "fadeInBackground 1s ease-in-out",
				zIndex: 10,
			}}
			ref={modalContainer}
		>
			<div
				className="container"
				style={{
					backgroundColor: "var(--section)",
					border: "0.125rem solid var(--border)",
					width: "100%",
					maxWidth: 384,
					aspectRatio: "2 / 1",
					padding: 16,
					borderRadius: "var(--defaultBorderRadius)",
					gap: 16,
					animation: "slideInContent 1s",
					transition: "transform 0.6s cubic-bezier(0.87, 0, 0.13, 1)",
				}}
				ref={modalBody}
			>
				{state.mode === "saving" && (
					<div>
						<h3 style={{ margin: 0 }}>Saving pack...</h3>
						<Spinner />
					</div>
				)}
				{state.mode === "saved" && (
					<div>
						<label
							style={{
								margin: 0,
								fontSize: "2rem",
								color: "var(--success)",
							}}
						>
							Pack saved!
						</label>
					</div>
				)}
				{state.mode === "error" && (
					<div
						className="container"
						style={{ alignItems: "center", height: "100%" }}
					>
						<h3
							style={{
								margin: 0,
								width: "100%",
								textAlign: "center",
							}}
						>
							An error occured
						</h3>
						<label
							style={{
								color: "var(--subText)",
								width: "100%",
								textAlign: "center",
							}}
						>
							{state.error?.error}
							<label style={{ color: "var(--badAccent)" }}>
								{" "}
								{state.error?.statusCode}
							</label>
						</label>
						<p style={{ flexGrow: 1, width: "100%" }}>
							{state.error?.message.replace("body/data/", "")}
						</p>
						<button
							className="buttonLike invalidButtonLike"
							onClick={() => closeModal(0)}
						>
							Close
						</button>
					</div>
				)}
			</div>
		</div>
	)
}

let depUidToRaw: Record<string, string> = {}
let initialContributors: string[] = []

export default function PackEdit() {
	const user = useSmithedUser()
	const firebaseUser = useFirebaseUser()

	const { id: packIdParam } = useParams()

	const isNew = packIdParam === "new"

	const location = useLocation()

	const { tab: currentTab } = qs.parse(
		import.meta.env.SSR ? location.search : window.location.search
	)
	const defaultTab = currentTab ?? "editProjectDetails"
	const navigate = useNavigate()

	const { packData, packMetaData } = useLoaderData() as PackEditLoaderData

	const [savingState, setSavingState] = useState<SavingState>({ mode: "off" })

	async function onLoad() {
		if (user == null) return

		packData.versions.sort((a, b) =>
			compare(
				valid(a.name) ? a.name : coerce(a.name) ?? "0.0.1",
				valid(b.name) ? b.name : coerce(b.name) ?? "0.0.1"
			)
		)

		packData.versions.forEach((v) => {
			v.name = valid(v.name)
				? v.name
				: ((coerce(v.name)?.format() ?? "0.0.0") as string)
			v.dependencies ??= []
		})

		packData.categories ??= []

		packData.id = packMetaData.rawId

		initialContributors = [...packMetaData.contributors]
	}

	useEffect(() => {
		onLoad()
	}, [packData, packMetaData, user])

	async function savePack() {
		if (packData === undefined) return

		const errors = [...Value.Errors(PackDataSchema, packData)]
		if (errors.length >= 1) {
			for (const e of errors) {
				const path = e.path.slice(1)

				if (path.endsWith("/downloads")) {
					if (e.type === ValueErrorType.ObjectMinProperties) {
						e.message = "At least one is required"
					}
					sendErrorEvent(path + "/datapack", e)
					sendErrorEvent(path + "/resourcepack", e)
				} else {
					sendErrorEvent(path, e)
				}
			}
			return
		}

		setSavingState({ mode: "saving" })

		const token = await firebaseUser!.getIdToken(true)

		const packId = isNew ? packData.id : packIdParam

		const uri = isNew
			? `/packs?id=${packId}&token=${token}`
			: `/packs/${packId}?token=${token}`

		console.log(uri)
		const body = gzip(
			JSON.stringify({
				data: packData,
			})
		)
		console.log(body.byteLength)

		const mainSaveResp = await fetch(
			import.meta.env.VITE_API_SERVER + uri,
			{
				method: isNew ? "POST" : "PATCH",
				headers: {
					"Content-Type": "application/json",
					"Content-Encoding": "gzip",
				},
				body: body,
			}
		)

		if (!mainSaveResp.ok) {
			setSavingState({
				mode: "error",
				error: await mainSaveResp.json(),
			})
			return
		}

		if (
			packMetaData &&
			packMetaData.owner === user?.uid &&
			packMetaData.contributors !== initialContributors
		) {
			const newContributors = packMetaData.contributors.filter(
				(c) => !initialContributors.includes(c)
			)

			const postContributorsResp = await fetch(
				import.meta.env.VITE_API_SERVER +
					`/packs/${packId}/contributors?token=${token}&contributors=` +
					newContributors.join("&contributors="),
				{
					method: "POST",
				}
			)

			if (!postContributorsResp.ok) {
				setSavingState({
					mode: "error",
					error: await postContributorsResp.json(),
				})
				return
			}

			const removedContributors = initialContributors.filter(
				(c) => !packMetaData.contributors.includes(c)
			)

			const delContributorsResp = await fetch(
				import.meta.env.VITE_API_SERVER +
					`/packs/${packId}/contributors?token=${token}&contributors=` +
					removedContributors.join("&contributors="),
				{
					method: "DELETE",
				}
			)

			if (!delContributorsResp.ok) {
				setSavingState({
					mode: "error",
					error: await delContributorsResp.json(),
				})
				return
			}
		}

		setSavingState({ mode: "saved" })
	}

	function Dependencies({ version }: { version: PackVersion }) {
		const [dependencies, setDependencies] = useState<PackDependency[]>(
			version.dependencies
		)

		async function getResolvedDep(
			id: string,
			version: string
		): Promise<PackDependency> {
			// Grab the cached value if present
			if (id in depUidToRaw)
				return {
					id: depUidToRaw[id],
					version: version,
				}

			const resp = await fetch(
				import.meta.env.VITE_API_SERVER + `/packs/${id}/meta`
			)
			const data: PackMetaData = await resp.json()

			depUidToRaw[id] = data.rawId

			return {
				id: data.rawId,
				version: version,
			}
		}

		async function getDependencies() {
			const resolvedDependencies = await Promise.all(
				version.dependencies.map((d) => getResolvedDep(d.id, d.version))
			)

			setDependencies(
				resolvedDependencies.sort((a, b) => a.id.localeCompare(b.id))
			)
		}

		useMemo(() => {
			getDependencies()
		}, [version.dependencies.length])

		return (
			<div className="dependencies">
				<IconInput
					className="inputField"
					id="new_dep_id"
					icon={At}
					placeholder="Dependency ID"
					onChange={(v) => {
						v.currentTarget.parentElement!.classList.remove(
							"invalidInput"
						)
					}}
				/>
				<IconInput
					className="inputField"
					id="new_dep_version"
					icon={ColorPicker}
					placeholder="Version ID"
					onChange={(v) => {
						v.currentTarget.parentElement!.classList.remove(
							"invalidInput"
						)
					}}
				/>
				<button style={{ backgroundColor: "transparent" }}>
					<Trash />
				</button>

				{dependencies.map((d, i) => (
					<>
						<IconInput
							className="inputField"
							key={"dep_" + i + "_id"}
							icon={At}
							placeholder="Dependency ID"
							value={d.id}
							disabled
						/>
						<IconInput
							className="inputField"
							key={"dep_" + i + "_ve"}
							icon={At}
							placeholder="Version ID"
							value={d.version}
							onChange={(v) => {
								version.dependencies[i].version =
									v.currentTarget.value
							}}
						/>
						<button
							key={"dep_" + i + "_de"}
							style={{ backgroundColor: "transparent" }}
							onClick={() => {
								version.dependencies.splice(i)
							}}
						>
							<Trash />
						</button>
					</>
				))}

				<div
					className="container"
					style={{ width: "100%", gridColumn: "1/4" }}
				>
					<IconTextButton
						icon={Plus}
						text="Add"
						reverse
						style={{ backgroundColor: "transparent" }}
						onClick={async () => {
							const idElement = document.getElementById(
								"new_dep_id"
							)! as HTMLInputElement
							const id = idElement.value
							const versionElement = document.getElementById(
								"new_dep_version"
							)! as HTMLInputElement
							const versionName = versionElement.value

							if (id === "" || versionName === "") return

							const packDataResp = await fetch(
								import.meta.env.VITE_API_SERVER + `/packs/${id}`
							)
							if (!packDataResp.ok) {
								idElement.parentElement!.classList.add(
									"invalidInput"
								)
								return alert(`Invalid pack id ${id}`)
							}
							const packData: PackData = await packDataResp.json()

							const versions = packData.versions
								.map((v) => v.name)
								.filter((v) => satisfies(v, versionName))

							if (versions.length === 0) {
								versionElement.parentElement!.classList.add(
									"invalidInput"
								)
								return alert(
									`Invalid version ${versionName}, does not exist on pack ${id}`
								)
							}

							const metaDataResp = await fetch(
								import.meta.env.VITE_API_SERVER +
									`/packs/${id}/meta`
							)
							const metaData: PackMetaData =
								await metaDataResp.json()

							version.dependencies.push({
								id: metaData.docId,
								version: versionName,
							})

							idElement.value = ""
							versionElement.value = ""
						}}
					/>
				</div>
			</div>
		)
	}

	function VersionInfo({
		version,
		index,
	}: {
		version?: PackVersion
		index: number
	}) {
		if (version === undefined)
			return (
				<div className="container" style={{ gridColumn: "1/3" }}>
					No versions
				</div>
			)

		return (
			<>
				<TextInput
					dataRef={version}
					area="name"
					pathPrefix={`versions/${index}/`}
					path="name"
					icon={At}
					placeholder="Version x.y.z"
					validate={(newName) => {
						if (
							(
								packData?.versions.filter(
									(v) => v.name === newName
								) ?? []
							).length > 1
						)
							return "Duplicate version!"
						if (valid(newName) == null) return "Invalid SemVer!"

						return undefined
					}}
				/>
				<ChooseBox
					style={{ gridArea: "supports" }}
					placeholder="Supported Versions"
					choices={supportedMinecraftVersions.map((version) => ({
						value: version,
						content: version,
					}))}
					onChange={(v) => {
						version.supports = typeof v === "string" ? [v] : v
					}}
					defaultValue={version.supports ?? []}
					multiselect
				/>
				<TextInput
					dataRef={version}
					area="datapack"
					pathPrefix={`versions/${index}/`}
					path="downloads/datapack"
					icon={Globe}
					insetError
					placeholder="Datapack URL"
					validate={(url) =>
						!validUrlRegex.test(url) ? "Invalid url" : undefined
					}
				/>
				<TextInput
					dataRef={version}
					area="resourcepack"
					pathPrefix={`versions/${index}/`}
					path="downloads/resourcepack"
					icon={Globe}
					insetError
					placeholder="Resourcepack URL (Optional)"
					validate={(url) =>
						!validUrlRegex.test(url) ? "Invalid url" : undefined
					}
				/>
				<span
					style={{
						fontWeight: 500,
						gridArea: "dependencyHeader",
						width: "100%",
					}}
				>
					Dependencies:
				</span>
				<Dependencies version={version} />
			</>
		)
	}

	const closeGithubModal = () =>
		document
			.getElementById("githubImportModal")!
			.style.setProperty("display", "none")

	function updateValue(path: string, content: string) {
		const input = document.getElementById(path) as HTMLInputElement | null
		if (input != null) {
			input.value = content
			input.src = content
			console.log(input)
		}

		setPropertyByPath(packData, path, content)
	}

	function ProjectDetails() {
		const ref = useRef<HTMLDivElement>(null)

		useErrorEventHandlers(ref, (hasError) => {
			const button = document.getElementById("editProjectDetailsChoice")
			button?.dispatchEvent(
				new CustomEvent("setError", { detail: hasError })
			)
		})

		return (
			<div
				className={`editTab editProjectDetails ${defaultTab === "editProjectDetails" ? "selected" : "none"}`}
				ref={ref}
			>
				<div className="main">
					{/* <StringInput reference={packData} attr={'id'} disabled={!isNew} svg={Star}
                description='Unique ID that others can reference your pack by' /> */}
					<TextInput
						area="id"
						path="id"
						icon={At}
						placeholder="Project id"
						dataRef={packData}
					/>
					<div className="iconGrid">
						<Modal
							style={{ gridArea: "icon", cursor: "pointer" }}
							offset="1rem"
							trigger={
								<div
									style={{
										gridArea: "icon",
										width: "8rem",
										height: "8rem",
										borderRadius:
											"var(--defaultBorderRadius)",
										backgroundColor: "var(--bold)",
										border: "0.125rem solid var(--border)",
										overflow: "hidden",
									}}
								>
									<img
										id="display/icon/img"
										src={packData.display.icon}
										style={{
											width: "100%",
											height: "100%",
											display: packData.display.icon
												? "initial"
												: "none",
										}}
										onError={(e) => {
											e.currentTarget.style.setProperty(
												"display",
												"none"
											)
										}}
									/>
								</div>
							}
							content={() => (
								<>
									<TextInput
										dataRef={packData}
										area=""
										path="display/icon"
										icon={Picture}
										placeholder="Project icon"
										onChange={(v) => {
											const img = document.getElementById(
												"display/icon/img"
											)! as HTMLImageElement

											img.setAttribute(
												"src",
												v.currentTarget.value
											)
											img.style.setProperty(
												"display",
												"initial"
											)
										}}
									/>
								</>
							)}
						/>
						<TextInput
							dataRef={packData}
							area="name"
							path="display/name"
							icon={Jigsaw}
							placeholder="Project name"
						/>
						<LargeTextInput
							dataRef={packData}
							area="description"
							path="display/description"
							placeholder="Short project description"
						/>
					</div>
					<IconTextButton
						icon={Github}
						className="inputField"
						style={{ gridArea: "import" }}
						text="Import from github"
						reverse
						onClick={() =>
							document
								.getElementById("githubImportModal")
								?.style.setProperty("display", "flex")
						}
					/>
					<div
						id="githubImportModal"
						className="container"
						style={{
							display: "none",
							position: "fixed",
							top: 0,
							left: 0,
							backgroundColor: "rgba(0,0,0,0.25)",
							width: "100%",
							height: "100%",
							zIndex: 10,
						}}
					>
						<div style={{ width: "min-content" }}>
							<div
								className="container"
								style={{
									gap: "1rem",
									backgroundColor: "var(--section)",
									padding: "1rem",
									borderRadius:
										"calc(var(--defaultBorderRadius) * 1.5)",
									border: "0.125rem solid var(--border)",
								}}
							>
								<IconInput
									id="githubUrl"
									type="url"
									icon={Globe}
									placeholder="Github URL"
								/>
								<div
									className="container"
									style={{
										flexDirection: "row",
										gap: "1rem",
									}}
								>
									<IconTextButton
										className="invalidButtonLike"
										icon={Cross}
										text={"Cancel"}
										onClick={closeGithubModal}
									/>
									<IconTextButton
										className="successButtonLike"
										icon={Check}
										text={"Confirm"}
										onClick={async () => {
											const url = (
												document.getElementById(
													"githubUrl"
												) as HTMLInputElement
											).value
											const match =
												/https:\/\/(?:www.)?github.com\/([^\/]+)\/([^\/]+)/g.exec(
													url
												)

											if (match == null) {
												alert("Invalid github url!")
												return
											}

											const [_, owner, repo] = match

											let resp = await fetch(
												`https://api.github.com/repos/${owner}/${repo}/contents`
											)

											if (!resp.ok) {
												return alert(
													"Failed to fetch files in github repo!\nUrl may be invalid or the repo is private"
												)
											}

											let files: {
												name: string
												path: string
												download_url: string
												type: string
											}[] = await resp.json()
											let rootReadme = files.find(
												(f) =>
													f.name.toLowerCase() ===
													"readme.md"
											)?.download_url

											for (let file of files) {
												if (
													file.name === "pack.png" ||
													file.name === "icon.png"
												) {
													updateValue(
														"display/icon",
														file.download_url
													)

													const img =
														document.getElementById(
															"display/icon/img"
														)! as HTMLInputElement

													img.src = file.download_url
													img.style.setProperty(
														"display",
														null
													)

													break
												}

												if (file.type === "dir") {
													files.push(
														...(await (
															await fetch(
																`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`
															)
														).json())
													)
												}
											}

											if (rootReadme)
												updateValue(
													"display/webPage",
													rootReadme
												)

											resp = await fetch(
												`https://api.github.com/repos/${owner}/${repo}`
											)

											if (!resp.ok) {
												return alert(
													"Failed to fetch info about github repo!\nUrl may be invalid or the repo is private"
												)
											}

											const repoInfo: {
												name: string
												description: string
												homepage: string
											} = await resp.json()
											const name = repoInfo.name.replace(
												/([a-z])([A-Z])/g,
												"$1 $2"
											)

											updateValue("id", sanitize(name))
											updateValue("display/name", name)
											updateValue(
												"display/description",
												repoInfo.description
											)
											updateValue(
												"display/urls/source",
												`https://github.com/${owner}/${repo}`
											)
											updateValue(
												"display/urls/homepage",
												repoInfo.homepage
											)

											closeGithubModal()
										}}
									/>
								</div>
							</div>
						</div>
					</div>
					<ChooseBox
						style={{ gridArea: "visibility" }}
						placeholder="Visibility"
						choices={[
							{ content: "Public", value: "false" },
							{ content: "Unlisted", value: "true" },
						]}
						onChange={(v) =>
							(packData.display.hidden =
								v === "true" ? true : false)
						}
						defaultValue={
							packData.display.hidden ? "true" : "false"
						}
					/>
					<TextInput
						dataRef={packData}
						area="website"
						path="display/urls/homepage"
						icon={Globe}
						placeholder="Project website"
					/>
					<TextInput
						dataRef={packData}
						area="sourceCode"
						path="display/urls/source"
						icon={Github}
						placeholder="Source code"
					/>
					<TextInput
						dataRef={packData}
						area="video"
						path="display/urls/video"
						icon={YouTube}
						placeholder="YouTube showcase"
					/>
					<TextInput
						dataRef={packData}
						area="discord"
						path="display/urls/discord"
						icon={Discord}
						placeholder="Discord server"
					/>
				</div>
				<div className="categories">
					<span
						style={{
							gridColumn: "1/3",
							width: "100%",
							textAlign: "center",
							fontWeight: 500,
						}}
					>
						Categories
					</span>
					{packCategories.map((c) => (
						<span
							className={`categoryChoice ${packData.categories.includes(c) ? "selected" : ""}`}
							key={"categoryChoice" + c.replace(" ", "")}
							onClick={(e) => {
								if (packData.categories.includes(c)) {
									e.currentTarget.classList.remove("selected")
									packData.categories =
										packData.categories.filter(
											(cat) => cat != c
										)
								} else {
									e.currentTarget.classList.add("selected")
									packData.categories.push(c)
								}
							}}
						>
							{c}
							<Check />
						</span>
					))}
				</div>
				<div className="gallery">
					<GalleryManager
						display={packData.display}
						packId={packIdParam!}
					/>
				</div>
				<div className="readme">
					<ReadmePreview dataRef={packData} />
				</div>
			</div>
		)
	}

	function Versions() {
		const ref = useRef<HTMLDivElement>(null)

		const [versions, setVersions] = useState<PackVersion[]>([])
		const [selectedVersion, setSelectedVersion] = useState<PackVersion>()

		useErrorEventHandlers(ref, (hasError) => {
			const button = document.getElementById("editVersionsChoice")
			button?.dispatchEvent(
				new CustomEvent("setError", { detail: hasError })
			)
		})

		const updateVersions = () => {
			console.log(packData.versions)
			let versions = [...(packData?.versions ?? [])].sort((a, b) =>
				compare(
					valid(a.name) ? a.name : coerce(a.name) ?? "0.0.1",
					valid(b.name) ? b.name : coerce(b.name) ?? "0.0.1"
				)
			)

			setVersions(versions)
		}
		useEffect(() => {
			updateVersions()
			setSelectedVersion(packData?.versions[0])
		}, [packData])
	

		function VersionSelect({ packData }: { packData: PackData }) {
			return (
				<>
					{[...versions]
						.sort((a, b) =>
							compare(
								valid(a.name)
									? a.name
									: coerce(a.name) ?? "0.0.1",
								valid(b.name)
									? b.name
									: coerce(b.name) ?? "0.0.1"
							)
						)
						.map((v, i) => (
							<VersionSelectOption
								key={`version_option_${i}`}
								index={i}
								version={v}
								setSelectedVersion={setSelectedVersion} 
								allVersions={packData.versions} 
								onDelete={updateVersions}								
							/>
						))}

					{versions.length > 0 && <div style={{ flexGrow: 1 }} />}

					<div className="container" style={{ width: "100%" }}>
						<IconTextButton
							icon={Plus}
							text="Add"
							reverse
							style={{ backgroundColor: "transparent" }}
							onClick={() => {
								const nextVersion =
									inc(
										[...versions]
											.sort((a, b) =>
												compare(
													valid(a.name)
														? a.name
														: coerce(a.name) ??
																"0.0.1",
													valid(b.name)
														? b.name
														: coerce(b.name) ??
																"0.0.1"
												)
											)
											.at(-1)?.name ?? "0.0.0",
										"patch"
									) ?? ""
								packData.versions.push({
									name: nextVersion,
									downloads: {},
									dependencies: [],
									supports: [],
								})
								updateVersions()
								// setVersions(packData.versions.map(v => v.name))
							}}
						/>
					</div>
				</>
			)
		}
		return (
			<div
				className={`editTab editVersions ${defaultTab === "editVersions" ? "selected" : "none"}`}
				ref={ref}
			>
				<div className="versionSelect">
					<VersionSelect packData={packData} />
				</div>
				{versions.map((v, i) => (
					<div
						key={`version_info_${v.name}`}
						id={`versions/${i}`}
						className="versionInfo"
						style={{
							gridArea: v !== selectedVersion ? "" : undefined,
							display: v !== selectedVersion ? "none" : undefined,
						}}
					>
						<VersionInfo version={v} index={i} />
					</div>
				))}
			</div>
		)
	}

	function Management() {
		const [contributors, setContributors] =
			useState<{ name: string; id: string }[]>()
		const [showConfirmDeletion, setShowConfirmDeletion] = useState(false)

		async function getPrettyNames() {
			if (!packMetaData) return

			async function fetchName(id: string) {
				const resp = await fetch(
					import.meta.env.VITE_API_SERVER + `/users/${id}`
				)
				return { id: id, name: (await resp.json()).displayName }
			}

			const contributors = await Promise.all(
				packMetaData.contributors
					.filter((c) => c !== "")
					.map((c) => fetchName(c))
			)
			setContributors(contributors)
		}

		useEffect(() => {
			getPrettyNames()
		}, [packMetaData?.contributors])

		return (
			<div
				className={`editTab editManagement ${defaultTab === "editManagement" ? "selected" : "none"}`}
			>
				<div
					className="container"
					style={{
						width: "min-content",
						backgroundColor: "var(--bold)",
						padding: "1rem",
						gap: "1rem",
						borderRadius: "calc(var(--defaultBorderRadius) * 1.5)",
					}}
				>
					<div
						className="container"
						style={{ flexDirection: "row", gap: "1rem" }}
					>
						<IconInput
							id="contributorId"
							icon={Account}
							placeholder="Contributor"
						/>
						<button
							style={{ backgroundColor: "transparent" }}
							onClick={async () => {
								const input = document.getElementById(
									"contributorId"
								)! as HTMLInputElement
								if (input.value === "") return

								const userResp = await fetch(
									import.meta.env.VITE_API_SERVER +
										`/users/${input.value}`
								)

								if (!userResp.ok) return

								const user: UserData = await userResp.json()

								if (
									packMetaData?.contributors.includes(
										user.uid
									)
								)
									return

								packMetaData?.contributors.push(user.uid)
								setContributors([
									...(contributors ?? []),
									{
										id: user.uid,
										name: user.displayName,
									},
								])

								input.value = ""
							}}
						>
							<Plus />
						</button>
					</div>

					{contributors
						?.sort((a, b) =>
							a.id === packMetaData?.owner
								? -1
								: a.name.localeCompare(b.name)
						)
						.map((c, i) => (
							<div
								className="container"
								key={c.id}
								style={{ flexDirection: "row", width: "100%" }}
							>
								<span>
									{c.name}
									{c.id === packMetaData?.owner && (
										<span
											style={{
												opacity: 0.3,
												paddingLeft: "1rem",
											}}
										>
											(Owner)
										</span>
									)}
								</span>
								<div style={{ flexGrow: 1 }} />
								<button
									style={{ backgroundColor: "transparent" }}
									disabled={c.id === packMetaData?.owner}
									onClick={() => {
										const curContributors =
											packMetaData?.contributors
										curContributors?.splice(
											curContributors.findIndex(
												(id) => id === c.id
											),
											1
										)

										contributors.splice(i, 1)
										setContributors([...contributors])
									}}
								>
									<Cross />
								</button>
							</div>
						))}
				</div>
				{!isNew && (
					<>
						{!showConfirmDeletion && (
							<IconTextButton
								className="buttonLike invalidButtonLike"
								text={"Delete Pack"}
								icon={Trash}
								onClick={(e) => {
									alert(
										"This action is irreversible, type the pack id to confirm."
									)
									setShowConfirmDeletion(true)
								}}
							/>
						)}
						{showConfirmDeletion && (
							<div
								className="container"
								style={{ flexDirection: "row", gap: "1rem" }}
							>
								<IconInput
									id="confirmationId"
									icon={At}
									placeholder="Project id"
								/>
								<a
									className="buttonLike invalidButtonLike"
									onClick={async () => {
										const input = document.getElementById(
											"confirmationId"
										)! as HTMLInputElement

										if (input.value != packData?.id) return

										const deleteResp = await fetch(
											import.meta.env.VITE_API_SERVER +
												`/packs/${packIdParam}?token=${await firebaseUser?.getIdToken(true)}`,
											{
												method: "DELETE",
											}
										)

										if (deleteResp.ok) {
											alert("Pack has been deleted.")
											navigate("/" + user?.uid)
										} else {
											alert("Failed to delete pack.")
										}
									}}
								>
									<Trash />
								</a>
							</div>
						)}
					</>
				)}
			</div>
		)
	}

	return (
		<div
			className="container"
			style={{
				width: "100%",
				height: "100%",
				flexDirection: "column",
				alignItems: "start",
				justifyContent: "center",
				boxSizing: "border-box",
				gap: "4rem",
			}}
		>
			<CategoryBar
				defaultValue={(defaultTab ?? "project-details") as string}
				onChange={(v) => {
					document.querySelectorAll(".editTab").forEach((element) => {
						element.classList.remove("selected")
					})
					document.querySelector("." + v)?.classList.add("selected")
					window.history.pushState(null, "", "?tab=" + v)
				}}
			>
				<CategoryChoice
					text="Details"
					icon={<TextSvg />}
					value="editProjectDetails"
					id={"editProjectDetailsChoice"}
				/>
				<CategoryChoice
					text="Versions"
					icon={<File />}
					value="editVersions"
					id={"editVersionsChoice"}
				/>
				<CategoryChoice
					text="Management"
					icon={<Account />}
					value="editManagement"
					hidden={user?.uid !== packMetaData?.owner}
				/>
			</CategoryBar>
			<div className="editorOrganizer">
				<ProjectDetails />
				<Versions />
				<Management />
			</div>
			<div
				className="container"
				style={{ flexDirection: "row", width: "100%", gap: "1rem" }}
			>
				<IconTextButton
					className="buttonLike invalidButtonLike"
					text="Cancel"
					icon={Cross}
					onClick={() => {
						navigate(-1)
					}}
				/>
				<IconTextButton
					className="buttonLike successButtonLike"
					text="Save"
					icon={Check}
					onClick={savePack}
				/>
			</div>
			<SavingModal state={savingState} changeState={setSavingState} />
		</div>
	)
}
