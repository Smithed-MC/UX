import {
	CategoryBar,
	CategoryChoice,
	ChooseBox,
	ErrorPage,
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
	Edit,
	Right,
	Pin,
	List,
	NewFolder,
	Folder,
	Download,
} from "components/svg"
import {
	BundleSchema_v2,
	BundleVersion,
	HTTPResponses,
	PackBundle_v2,
	PackData,
	PackDependency,
	PackDownloadOptions,
	PackMetaData,
	PackReference,
	PackVersion,
	UserData,
	bundleCategories,
	packCategories,
	supportedMinecraftVersions,
} from "data-types"
import { useFirebaseUser, useQueryParams } from "hooks"
import { useEffect, useMemo, useRef, useState } from "react"
import {
	useLoaderData,
	useLocation,
	useNavigate,
	useParams,
	useRouteError,
} from "react-router-dom"
import { coerce, compare, satisfies, inc, valid } from "semver"
import { gzip } from "pako"
import { sanitize } from "formatters"
import {
	TextInput,
	setPropertyByPath,
	LargeTextInput,
} from "../../editors/inputs"
import GalleryManager from "../../editors/galleryManager"
import ReadmePreview from "../../editors/readmePreview"
import { getBadges } from "components/GalleryPackCard"
import { Value } from "@sinclair/typebox/value"
import {
	sendErrorEvent,
	useErrorEventHandlers,
} from "../../editors/errorEvents"
import qs from "query-string"
import "./edit.css"
import "../../editors/common.css"
import { Pack } from "./edit/Pack"
import SearchPacks from "./edit/searchPacks"
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
					<div className="container" style={{ gap: "1rem" }}>
						<h3 style={{ margin: 0 }}>Saving bundle...</h3>
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
							Bundle saved!
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

export default function BundleEdit() {
	const user = useFirebaseUser()
	const { id: packIdParam } = useParams()
	const isNew = packIdParam === "new"

	const {
		bundleData,
		packData: cachedPackData,
	}: {
		bundleData: PackBundle_v2
		packData: Record<string, PackData & { author: string }>
	} = useLoaderData() as any

	const navigate = useNavigate()
	const [savingState, setSavingState] = useState<SavingState | undefined>()
	const [selectedVersion, setSelectedVersion] = useState<BundleVersion>()
	const [versions, setVersions] = useState<BundleVersion[]>(
		bundleData.versions
	)

	const location = useLocation()
	const { tab: currentTab } = qs.parse(
		import.meta.env.SSR ? location.search : window.location.search
	)
	const defaultTab = currentTab ?? "editBundleDetails"

	const updateVersions = () => {
		let versions = [...(bundleData?.versions ?? [])].sort((a, b) =>
			compare(a.name, b.name)
		)

		setVersions(versions)
	}

	useEffect(() => {
		updateVersions()
		setSelectedVersion(bundleData?.versions[0])
	}, [bundleData])

	async function saveBundle() {
		if (bundleData === undefined) return

		const errors = [...Value.Errors(BundleSchema_v2, bundleData)]
		if (errors.length >= 1) {
			console.log(errors)
			for (const e of errors) {
				const path = e.path.slice(1)
				sendErrorEvent(path, e)
			}
			return
		}

		setSavingState({ mode: "saving" })

		const token = await user?.getIdToken(true)

		const uri = isNew
			? `/bundles?token=${token}`
			: `/bundles/${bundleData.uid}?token=${token}`

		console.log(uri)
		console.log(bundleData)
		if (bundleData.id === "") bundleData.id = Date.now().toString()

		const mainSaveResp = await fetch(
			import.meta.env.VITE_API_SERVER + uri,
			{
				method: isNew ? "POST" : "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					data: bundleData,
				}),
			}
		)

		if (!mainSaveResp.ok) {
			setSavingState({
				mode: "error",
				error: await mainSaveResp.json(),
			})
			return
		}

		if (isNew) {
			const { uid } = await mainSaveResp.json()
			navigate(`/bundles/${uid}/edit`)
		}

		setSavingState({ mode: "saved" })
	}

	function Patch({
		options,
		onDelete,
	}: {
		options: PackDownloadOptions
		onDelete: () => void
	}) {
		return (
			<div
				className="container"
				style={{
					backgroundColor: "var(--section)",
					borderRadius: "var(--defaultBorderRadius)",
					padding: "1rem",
					width: "100%",
					gap: "1rem",
					flexDirection: "row",
					boxSizing: "border-box",
				}}
			>
				<IconInput
					icon={Globe}
					placeholder="Datapack URL"
					defaultValue={options.datapack}
					onChange={(e) => (options.datapack = e.currentTarget.value)}
					style={{ width: "100%" }}
				/>
				<IconInput
					icon={Globe}
					placeholder="Resourcepack URL"
					defaultValue={options.resourcepack}
					onChange={(e) =>
						(options.resourcepack = e.currentTarget.value)
					}
					style={{ width: "100%" }}
				/>
				<button onClick={onDelete}>
					<Trash />
				</button>
			</div>
		)
	}

	function Patches({ version }: { version: BundleVersion }) {
		const [patches, setPatches] = useState<PackDownloadOptions[]>(
			version.patches
		)

		return (
			<div className="patches">
				{patches.map((d, i) => (
					<Patch
						options={d}
						key={"patch_" + i}
						onDelete={() => {
							version.patches.splice(i, 1)
							setPatches([...version.patches])
						}}
					/>
				))}

				<IconTextButton
					style={{ backgroundColor: "transparent" }}
					icon={Plus}
					text="Add"
					reverse
					onClick={() => {
						version.patches.push({})
						setPatches([...version.patches])
					}}
				/>
			</div>
		)
	}

	function SelectedPacks({ version }: { version: BundleVersion }) {
		return (
			<div className="packs">
				{version.packs
					.sort((a, b) =>
						cachedPackData[a.id].display.name.localeCompare(
							cachedPackData[b.id].display.name
						)
					)
					.map((p, i) => (
						<Pack
							key={"pack_" + i}
							packData={cachedPackData[p.id]}
							packRef={p}
							selectedVersion={selectedVersion}
							cachedPacks={cachedPackData}
						/>
					))}
			</div>
		)
	}

	function ProjectDetails() {
		const ref = useRef<HTMLDivElement>(null)

		useErrorEventHandlers(ref, (hasError) => {
			const button = document.getElementById("editBundleDetailsChoice")
			button?.dispatchEvent(
				new CustomEvent("setError", { detail: hasError })
			)
		})
		return (
			<div
				className={`editTab editBundleDetails ${defaultTab === "editBundleDetails" ? "selected" : ""}`}
				ref={ref}
			>
				<div className="main">
					<div className="iconGrid">
						<TextInput
							area="id"
							path="id"
							icon={At}
							placeholder="Project id"
							dataRef={bundleData}
						/>
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
										src={bundleData.display.icon}
										style={{
											width: "100%",
											height: "100%",
											display: bundleData.display.icon
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
										dataRef={bundleData}
										area=""
										path="display/icon"
										icon={Picture}
										placeholder="Bundle icon"
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
							dataRef={bundleData}
							area="name"
							path="display/name"
							icon={Jigsaw}
							placeholder="Bundle name"
						/>
						<LargeTextInput
							dataRef={bundleData}
							area="description"
							path="display/description"
							placeholder="Short bundle description"
						/>
					</div>
					<ChooseBox
						style={{ gridArea: "visibility" }}
						placeholder="Visibility"
						choices={[
							...(user?.uid === "z4nRZh8OWFXwvaNo2wiszKoxJhj2"
								? [{ content: "Public", value: "public" }]
								: []),
							{ content: "Unlisted", value: "unlisted" },
							{ content: "Private", value: "private" },
						]}
						onChange={(v) =>
							(bundleData.visibility = v as
								| "public"
								| "unlisted"
								| "private")
						}
						defaultValue={bundleData.visibility}
					/>
					<TextInput
						dataRef={bundleData}
						area="website"
						path="display/urls/homepage"
						icon={Globe}
						placeholder="Project website"
					/>
					<TextInput
						dataRef={bundleData}
						area="video"
						path="display/urls/video"
						icon={YouTube}
						placeholder="YouTube showcase"
					/>
					<TextInput
						dataRef={bundleData}
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
					{bundleCategories.map((c) => (
						<span
							className={`categoryChoice ${bundleData.categories.includes(c) ? "selected" : ""}`}
							key={"categoryChoice" + c.replace(" ", "")}
							onClick={(e) => {
								if (bundleData.categories.includes(c)) {
									e.currentTarget.classList.remove("selected")
									bundleData.categories =
										bundleData.categories.filter(
											(cat) => cat != c
										)
								} else {
									e.currentTarget.classList.add("selected")
									bundleData.categories.push(c)
								}
							}}
						>
							{c}
							<Check />
						</span>
					))}
				</div>
				<div className="readme">
					<ReadmePreview dataRef={bundleData} />
				</div>
			</div>
		)
	}

	function Versions() {
		const ref = useRef<HTMLDivElement>(null)
		
		useErrorEventHandlers(ref, (hasError) => {
			const button = document.getElementById("editBundleVersionsChoice")
			button?.dispatchEvent(
				new CustomEvent("setError", { detail: hasError })
			)
		})

		function VersionSelect({ data }: { data: PackBundle_v2 }) {
			const select = (version: BundleVersion) => {
				const matches = data.versions.filter(
					(v) => v.name === selectedVersion?.name
				)

				if (matches.length > 1)
					return alert("Resolve version name conflict!")

				if (
					selectedVersion !== undefined &&
					valid(selectedVersion?.name) == null
				)
					return alert("Selected version name is not valid SemVer")

				setSelectedVersion(version)
			}

			return (
				<>
					{[...versions]
						.sort((a, b) => compare(a.name, b.name))
						.map((v, i) => (
							<VersionSelectOption
								key={"bundle_version_" + v.name}
								version={v}
								index={i}
								setSelectedVersion={setSelectedVersion}
								allVersions={bundleData.versions}
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
												compare(a.name, b.name)
											)
											.at(-1)?.name ?? "0.0.0",
										"patch"
									) ?? ""
								data.versions.push({
									name: nextVersion,
									patches: [],
									packs: [],
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

		function VersionInfo({
			index,
			version,
		}: {
			index: number
			version?: BundleVersion
		}) {
			const [addContent, setAddContent] = useState(false)

			if (version === undefined)
				return (
					<div className="container" style={{ gridColumn: "1/3" }}>
						No versions
					</div>
				)

			return (
				<>
					<div
						key={"version_info_" + version.name}
						id={"versions/" + index}
						className="versionInfo"
						style={{
							display: selectedVersion !== version ? "none" : "",
						}}
					>
						<TextInput
							dataRef={version}
							area="name"
							path="name"
							pathPrefix={`versions/${index}`}
							icon={At}
							placeholder="Version x.y.z"
							validate={(newName) => {
								if (
									(
										bundleData?.versions.filter(
											(v) => v.name === newName
										) ?? []
									).length > 1
								)
									return "Duplicate version!"
								if (valid(newName) == null)
									return "Invalid SemVer!"

								return undefined
							}}
						/>
						<ChooseBox
							style={{ gridArea: "supports" }}
							placeholder="Supported Versions"
							choices={supportedMinecraftVersions.map(
								(version) => ({
									value: version,
									content: version,
								})
							)}
							onChange={(v) => {
								version.supports =
									typeof v === "string" ? [v] : v
							}}
							defaultValue={version.supports ?? []}
							multiselect
						/>

						<span
							style={{
								fontWeight: 500,
								gridArea: "patchesHeader",
								width: "100%",
							}}
						>
							Patches
						</span>
						<Patches version={version} />
					</div>
					<div
						key={"version_packs_" + version.name}
						className="versionPacks"
						style={{
							display: selectedVersion !== version ? "none" : "",
						}}
					>
						<div
							style={{
								fontWeight: 500,
								gridArea: "packsHeader",
								width: "100%",
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
							}}
						>
							Packs
							<div style={{ flexGrow: 1 }} />
							{!addContent && (
								<IconTextButton
									icon={NewFolder}
									text={"Add content"}
									reverse
									onClick={() => setAddContent(true)}
								/>
							)}
							{addContent && (
								<IconTextButton
									icon={Folder}
									text={"Current content"}
									reverse
									onClick={() => setAddContent(false)}
								/>
							)}
						</div>
						{!addContent && <SelectedPacks version={version} />}
						{addContent && (
							<SearchPacks
								selectedVersion={selectedVersion}
								cachedPacks={cachedPackData}
							/>
						)}
					</div>
				</>
			)
		}

		return (
			<div
				className={`editTab editBundleVersions ${defaultTab === "editBundleVersions" ? "selected" : ""}`}
				ref={ref}
			>
				<div className="versionSelect">
					<VersionSelect data={bundleData} />
				</div>
				{versions.map((v, i) => (
					<VersionInfo
						key={"version_info_" + v.name}
						version={v}
						index={i}
					/>
				))}
			</div>
		)
	}

	// function Management() {
	// 	const [contributors, setContributors] =
	// 		useState<{ name: string; id: string }[]>()
	// 	const [showConfirmDeletion, setShowConfirmDeletion] = useState(false)

	// 	async function getPrettyNames() {
	// 		if (!packMetaData) return

	// 		async function fetchName(id: string) {
	// 			const resp = await fetch(
	// 				import.meta.env.VITE_API_SERVER + `/users/${id}`
	// 			)
	// 			return { id: id, name: (await resp.json()).displayName }
	// 		}

	// 		const contributors = await Promise.all(
	// 			packMetaData.contributors
	// 				.filter((c) => c !== "")
	// 				.map((c) => fetchName(c))
	// 		)
	// 		setContributors(contributors)
	// 	}

	// 	useEffect(() => {
	// 		getPrettyNames()
	// 	}, [packMetaData?.contributors])

	// 	return (
	// 		<div className="editManagement">
	// 			<div
	// 				className="container"
	// 				style={{
	// 					width: "min-content",
	// 					backgroundColor: "var(--bold)",
	// 					padding: "1rem",
	// 					gap: "1rem",
	// 					borderRadius: "calc(var(--defaultBorderRadius) * 1.5)",
	// 				}}
	// 			>
	// 				<div
	// 					className="container"
	// 					style={{ flexDirection: "row", gap: "1rem" }}
	// 				>
	// 					<IconInput
	// 						id="contributorId"
	// 						icon={Account}
	// 						placeholder="Contributor"
	// 					/>
	// 					<button
	// 						style={{ backgroundColor: "transparent" }}
	// 						onClick={async () => {
	// 							const input = document.getElementById(
	// 								"contributorId"
	// 							)! as HTMLInputElement
	// 							if (input.value === "") return

	// 							const userResp = await fetch(
	// 								import.meta.env.VITE_API_SERVER +
	// 									`/users/${input.value}`
	// 							)

	// 							if (!userResp.ok) return

	// 							const user: UserData = await userResp.json()

	// 							if (
	// 								packMetaData?.contributors.includes(
	// 									user.uid
	// 								)
	// 							)
	// 								return

	// 							packMetaData?.contributors.push(user.uid)
	// 							setContributors([
	// 								...(contributors ?? []),
	// 								{
	// 									id: user.uid,
	// 									name: user.displayName,
	// 								},
	// 							])

	// 							input.value = ""
	// 						}}
	// 					>
	// 						<Plus />
	// 					</button>
	// 				</div>

	// 				{contributors
	// 					?.sort((a, b) =>
	// 						a.id === packMetaData?.owner
	// 							? -1
	// 							: a.name.localeCompare(b.name)
	// 					)
	// 					.map((c, i) => (
	// 						<div
	// 							className="container"
	// 							key={c.id}
	// 							style={{ flexDirection: "row", width: "100%" }}
	// 						>
	// 							<span>
	// 								{c.name}
	// 								{c.id === packMetaData?.owner && (
	// 									<span
	// 										style={{
	// 											opacity: 0.3,
	// 											paddingLeft: "1rem",
	// 										}}
	// 									>
	// 										(Owner)
	// 									</span>
	// 								)}
	// 							</span>
	// 							<div style={{ flexGrow: 1 }} />
	// 							<button
	// 								style={{ backgroundColor: "transparent" }}
	// 								disabled={c.id === packMetaData?.owner}
	// 								onClick={() => {
	// 									const curContributors =
	// 										packMetaData?.contributors
	// 									curContributors?.splice(
	// 										curContributors.findIndex(
	// 											(id) => id === c.id
	// 										),
	// 										1
	// 									)

	// 									contributors.splice(i, 1)
	// 									setContributors([...contributors])
	// 								}}
	// 							>
	// 								<Cross />
	// 							</button>
	// 						</div>
	// 					))}
	// 			</div>
	// 			{!isNew && (
	// 				<>
	// 					{!showConfirmDeletion && (
	// 						<IconTextButton
	// 							className="buttonLike invalidButtonLike"
	// 							text={"Delete Pack"}
	// 							icon={Trash}
	// 							onClick={(e) => {
	// 								alert(
	// 									"This action is irreversible, type the pack id to confirm."
	// 								)
	// 								setShowConfirmDeletion(true)
	// 							}}
	// 						/>
	// 					)}
	// 					{showConfirmDeletion && (
	// 						<div
	// 							className="container"
	// 							style={{ flexDirection: "row", gap: "1rem" }}
	// 						>
	// 							<IconInput
	// 								id="confirmationId"
	// 								icon={At}
	// 								placeholder="Project id"
	// 							/>
	// 							<Link
	// 								className="buttonLike invalidButtonLike"
	// 								onClick={async () => {
	// 									const input = document.getElementById(
	// 										"confirmationId"
	// 									)! as HTMLInputElement

	// 									if (input.value != bundleData?.id)
	// 										return

	// 									const deleteResp = await fetch(
	// 										import.meta.env.VITE_API_SERVER +
	// 											`/packs/${packIdParam}?token=${await user?.getIdToken()}`,
	// 										{
	// 											method: "DELETE",
	// 										}
	// 									)

	// 									if (deleteResp.ok) {
	// 										alert("Pack has been deleted.")
	// 										navigate("/" + user?.uid)
	// 									} else {
	// 										alert("Failed to delete pack.")
	// 									}
	// 								}}
	// 							>
	// 								<Trash />
	// 							</Link>
	// 						</div>
	// 					)}
	// 				</>
	// 			)}
	// 		</div>
	// 	)
	// }

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
				defaultValue={(defaultTab ?? "editBundleDetails") as string}
				onChange={(v) => {
					document.querySelectorAll(".editTab").forEach((element) => {
						element.classList.remove("selected")
					})
					document.querySelector("." + v)?.classList.add("selected")
					window.history.pushState(null, "", "?tab=" + v)
					// navigate(`?tab=${v}${pack != null ? '&pack=' + pack : ''}${isNew != null ? '&new=' + isNew : ''}`)
				}}
			>
				<CategoryChoice
					text="Details"
					icon={<TextSvg />}
					value="editBundleDetails"
					id="editBundleDetailsChoice"
				/>
				<CategoryChoice
					text="Versions"
					icon={<File />}
					value="editBundleVersions"
					id="editBundleVersionsChoice"
				/>
				{/* <CategoryChoice
					text="Management"
					icon={<Account />}
					value="management"
					hidden={user?.uid !== bundleData.owner}
				/> */}
			</CategoryBar>
			<div className="editorOrganizer">
				<ProjectDetails />
				<Versions />
				{/* {tab === "management" && <Management />} */}
			</div>
			<div
				className="container"
				style={{
					flexDirection: "row",
					width: "100%",
					justifyContent: "end",
					position: "sticky",
					bottom: "1rem",
					right: "1rem",
				}}
			>
				<div
					className="container"
					style={{
						flexDirection: "row",
						gap: "1rem",
						backgroundColor: "var(--background)",
						borderRadius: "calc(1.5 * var(--defaultBorderRadius))",
						padding: "0.5rem",
					}}
				>
					<IconTextButton
						className="buttonLike invalidButtonLike"
						text="Cancel"
						icon={Cross}
						onClick={() => {
							navigate(-1)
						}}
						reverse
					/>
					<IconTextButton
						className="buttonLike accentedButtonLike"
						text={isNew ? "Publish" : "Save"}
						iconElement={
							<Right style={{ transform: "rotate(90deg)" }} />
						}
						onClick={saveBundle}
						reverse
					/>
				</div>
			</div>
			{savingState && (
				<SavingModal state={savingState} changeState={setSavingState} />
			)}
		</div>
	)
}
