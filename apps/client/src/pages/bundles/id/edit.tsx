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
	useNavigate,
	useParams,
	useRouteError,
} from "react-router-dom"
import { coerce, compare, satisfies, inc, valid } from "semver"
import { gzip } from "pako"
import "./edit.css"
import { sanitize } from "formatters"
import {
	TextInput,
	setPropertyByPath,
	LargeTextInput,
} from "../../../components/editor/inputs"
import GalleryManager from "../../../components/editor/galleryManager"
import ReadmePreview from "../../../components/editor/readmePreview"
import { getBadges } from "components/GalleryPackCard"

const validUrlRegex =
	/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/g

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

export function BundleEditError() {
	const error = useRouteError() as any

	return (
		<div className="container" style={{ height: "100%" }}>
			<h1>{error.data}</h1>
			<div
				className="container"
				style={{ flexDirection: "row", gap: "1rem" }}
			>
				<Link className="buttonLike accentedButtonLike" to="/">
					Go Home
				</Link>
				{error.status === HTTPResponses.UNAUTHORIZED && (
					<Link
						className="buttonLike accentedButtonLike"
						to="/account"
					>
						Go to sign-in
					</Link>
				)}
			</div>
		</div>
	)
}

export default function BundleEdit() {
	const user = useFirebaseUser()
	const { id: packIdParam } = useParams()
	const isNew = packIdParam === "new"

	const { tab: currentTab } = useQueryParams()

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

	const [tab, setTab] = useState<string>(
		(currentTab ?? "project-details") as string
	)

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

		setSavingState({ mode: "saving" })

		const token = await user?.getIdToken()

		const uri = isNew
			? `/bundles?token=${token}`
			: `/bundles/${bundleData.uid}?token=${token}`

		console.log(uri)
		console.log(bundleData)
		if (bundleData.id === '')
			bundleData.id = Date.now().toString()
		
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

	function PackVersionOption({
		version,
		selected,
		onClick,
	}: {
		version: PackVersion
		selected: boolean
		onClick: () => void
	}) {
		return (
			<button
				key={version.name}
				style={{
					width: "100%",
					color: selected ? "var(--warning)" : undefined,
					backgroundColor: "transparent",
					justifyContent: "start",
					display: "flex",
					flexDirection: "row",
				}}
				onClick={onClick}
			>
				{version.name}

				{selected && (
					<>
						<div style={{ flexGrow: 1 }} />
						<div
							style={{
								height: "1.125rem",
								border: "0.075rem solid var(--warning)",
								opacity: 0.5,
							}}
						/>
						<Pin style={{ color: "var(--warning)" }} />
					</>
				)}
			</button>
		)
	}

	function RenderPackVersionOptions({
		packRef,
		versions: initialVersions,
		openState,
		setPackVersion,
	}: {
		packRef: { id: string; version?: string }
		versions: PackVersion[]
		openState: boolean
		setPackVersion: (v: string) => void
	}) {
		const versionsSort = (a: PackVersion, b: PackVersion) =>
			a.name === packRef.version
				? -1
				: b.name === packRef.version
					? 1
					: -compare(coerce(a.name) ?? "", coerce(b.name) ?? "")

		const [showAllVersions, setShowAllVersions] = useState(false)
		const [versions, setVersions] = useState(initialVersions)

		const versionsInCurrentRange = versions
			.sort(versionsSort)
			.filter(
				(v) =>
					selectedVersion?.supports.find((mcVersion) =>
						v.supports.includes(mcVersion)
					) || v.name === packRef.version
			)

		useEffect(() => {
			if (!openState) setShowAllVersions(false)
		}, [openState])

		const displayedVersions = showAllVersions
			? versions
			: versionsInCurrentRange.slice(0, 5)

		return (
			<div
				className="container"
				style={{
					gap: "1rem",
					minWidth: "8rem",
					overflowY:
						displayedVersions.length > 5 ? "auto" : undefined,
					height: "max-content",
					maxHeight:
						displayedVersions.length > 5
							? "calc((2.25rem * 5) + 4rem)"
							: undefined,
				}}
			>
				{displayedVersions.map((v) => (
					<PackVersionOption
						key={v.name}
						version={v}
						selected={v.name === packRef.version}
						onClick={() => {
							setPackVersion(v.name)
							setVersions([...versions].sort(versionsSort))
						}}
					/>
				))}
				{!showAllVersions &&
					versionsInCurrentRange.length < versions.length && (
						<IconTextButton
							iconElement={
								<List
									style={{
										color: "color-mix(in srgb, var(--foreground) 50%, transparent)",
									}}
								/>
							}
							text={`...${versions.length - versionsInCurrentRange.length} more`}
							reverse
							style={{
								backgroundColor: "transparent",
								color: "color-mix(in srgb, var(--foreground) 50%, transparent)",
							}}
							onClick={() => setShowAllVersions(true)}
						/>
					)}
			</div>
		)
	}

	function Pack({
		packData,
		packRef,
	}: {
		packData: PackData & { author: string }
		packRef: { id: string; version?: string }
	}) {
		const [packVersion, setPackVersion] = useState(packRef.version)

		return (
			<div
				className="container"
				style={{
					padding: "1rem",
					borderRadius: "var(--defaultBorderRadius)",
					backgroundColor: "var(--section)",
					flexDirection: "column",
					width: "100%",
					boxSizing: "border-box",
					justifyContent: "start",
					alignItems: "start",
					gap: "0.5rem",
				}}
			>
				<div
					className="container"
					style={{
						boxSizing: "border-box",
						flexDirection: "row",
						gap: "0.5rem",
						width: "100%",
					}}
				>
					<Link
						to={"/packs/" + packRef.id}
						style={{
							fontWeight: 600,
							fontSize: "1.5rem",
							color: "var(--foreground)",
							textDecoration: "none",
							height: "2rem",
							maxHeight: "2rem",
							lineHeight: "2rem",
							WebkitLineClamp: 1,
							textOverflow: "ellipsis",
							WebkitBoxOrient: "vertical",
							display: "-webkit-box",
							overflow: "hidden",
						}}
					>
						{packData.display.name}
					</Link>
					{packVersion && (
						<div
							style={{
								padding: "0.5rem 1rem",
								borderRadius: "var(--defaultBorderRadius)",
								backgroundColor: "var(--highlight)",
								boxSizing: "border-box",
								color: "color-mix(in srgb, var(--foreground) 50%, transparent)",
							}}
						>
							{packVersion.startsWith("v") ? "" : "v"}
							{packVersion}
						</div>
					)}
					<div style={{ flexGrow: 1 }} />
					{(() => {
						const badges = getBadges(packData, "")

						if (badges.length == 0) return <></>

						return (
							<div
								className="container"
								style={{
									padding: "0.5rem 1rem",
									borderRadius: "var(--defaultBorderRadius)",
									backgroundColor: "var(--bold)",
									boxSizing: "border-box",
									height: "2.25rem",
									alignItems: "center",
									flexDirection: "row",
									gap: "0.5rem",
								}}
							>
								{badges}
							</div>
						)
					})()}
				</div>
				<div
					style={{
						height: "2.5rem",
						maxHeight: "2.5rem",
						lineHeight: "1.25rem",
						WebkitLineClamp: 2,
						textOverflow: "ellipsis",
						WebkitBoxOrient: "vertical",
						display: "-webkit-box",
						overflow: "hidden",
					}}
				>
					{packData.display.description}
				</div>
				<div
					className="container"
					style={{
						gap: "0.5rem",
						flexDirection: "row",
						width: "100%",
					}}
				>
					<span style={{ opacity: 0.5 }}>
						by{" "}
						<Link
							style={{ color: "var(--foreground)" }}
							to={"/" + packData.author}
						>
							{packData.author}
						</Link>
					</span>
					<div style={{ flexGrow: 1 }} />
					{packVersion && (
						<button
							className="buttonLike"
							style={{
								backgroundColor: "var(--highlight)",
							}}
						>
							<Trash />
						</button>
					)}
					<Modal
						trigger={
							<IconTextButton
								className="accentedButtonLike"
								iconElement={
									<Right
										style={{ transform: "rotate(90deg)" }}
									/>
								}
								text={packVersion ? "Edit" : "Add"}
								reverse
							/>
						}
						content={({ openState }) => (
							<RenderPackVersionOptions
								packRef={packRef}
								versions={packData.versions}
								openState={openState}
								setPackVersion={(v) => {
									if (packRef.version === undefined) {
										selectedVersion?.packs.push(
											packRef as PackReference
										)
										cachedPackData[packRef.id] = packData
									}

									packRef.version = v
									setPackVersion(v)
								}}
							/>
						)}
					/>
				</div>
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
						/>
					))}
			</div>
		)
	}

	let pendingTimeout: NodeJS.Timeout | undefined = undefined
	function SearchPacks({ version }: { version: BundleVersion }) {
		const [search, setSearch] = useState("")
		const [packs, setPacks] = useState<
			[PackData & { author: string }, { id: string }][]
		>([])
		const [total, setTotal] = useState(0)
		const [page, setPage] = useState(1)

		async function loadPacks() {
			const packsResp = await fetch(
				import.meta.env.VITE_API_SERVER +
					"/packs?" +
					"scope=data.display.name" +
					"&scope=data.display.description" +
					"&scope=data.versions" +
					"&scope=owner.displayName" +
					`&search=${encodeURIComponent(search)}&page=${page}`
			)
			const packs: {
				id: string
				data: PackData
				owner: { displayName: string }
			}[] = await packsResp.json()

			setPacks(
				packs.map((p) => [
					{
						...p.data,
						author: p.owner.displayName,
					},
					{ id: p.id },
				])
			)
			document
				.getElementById("packsContainer")
				?.style.setProperty("opacity", "1")
		}

		async function loadTotalPacks() {
			const countResp = await fetch(
				import.meta.env.VITE_API_SERVER +
					`/packs/count?search=${encodeURIComponent(search)}`
			)
			setTotal(await countResp.json())
		}

		useEffect(() => {
			document
				.getElementById("packsContainer")
				?.style.setProperty("opacity", "0.5")
		}, [search, page])

		useEffect(() => {
			if (pendingTimeout !== undefined) {
				clearTimeout(pendingTimeout)
			}

			pendingTimeout = setTimeout(async () => {
				await Promise.allSettled([loadPacks(), loadTotalPacks()])
			}, 100)
		}, [search])

		useEffect(() => {
			loadPacks()
		}, [page])

		const pages = []
		for (let i = 1; i <= Math.ceil(total / 20); i++) {
			pages.push(
				<button
					className={`browsePageButton ${page === i ? "selected" : ""}`}
					onClick={() => setPage(i)}
				>
					{i}
				</button>
			)
		}

		return (
			<div className="packs">
				<IconInput
					icon={Globe}
					placeholder="Search"
					onChange={(e) => setSearch(e.currentTarget.value)}
					style={{ width: "100%" }}
				/>
				<div
					className="container"
					style={{ flexDirection: "row", gap: "0.25rem" }}
				>
					{pages}
				</div>
				<div
					id="packsContainer"
					className="container"
					style={{ gap: "1rem", transition: "all 0.25s ease-in-out" }}
				>
					{packs.map((p) => (
						<Pack
							key={p[1].id}
							packData={p[0]}
							packRef={
								selectedVersion?.packs.find(
									(cur) => cur.id === p[1].id
								) ?? p[1]
							}
						/>
					))}
				</div>
			</div>
		)
	}

	function VersionInfo({ version }: { version?: BundleVersion }) {
		const [addContent, setAddContent] = useState(false)

		if (version === undefined)
			return (
				<div className="container" style={{ gridColumn: "1/3" }}>
					No versions
				</div>
			)

		return (
			<>
				<div className="versionInfo">
					<TextInput
						dataRef={version}
						area="name"
						path="name"
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
				<div className="versionPacks">
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
					{addContent && <SearchPacks version={version} />}
				</div>
			</>
		)
	}

	function updateValue(path: string, content: string) {
		const input = document.getElementById(path) as HTMLInputElement | null
		if (input != null) {
			input.value = content
			input.src = content
			console.log(input)
		}

		setPropertyByPath(bundleData, path, content)
	}

	const ProjectDetails = () => (
		<div className="editBundleDetails">
			<div className="main">
				{/* <StringInput reference={packData} attr={'id'} disabled={!isNew} svg={Star}
                description='Unique ID that others can reference your pack by' /> */}
				{/* <TextInput
					area="id"
					path="id"
					icon={At}
					placeholder="Project id"
					dataRef={bundleData}
				/> */}
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
									borderRadius: "var(--defaultBorderRadius)",
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
						<span
							className={`versionChoice ${v === selectedVersion ? "selected" : ""}`}
							key={v.name}
							onClick={(e) => {
								if (!(e.target instanceof HTMLSpanElement))
									return
								select(v)
							}}
						>
							<span id={`packVersionOption${v.name}`}>
								{v.name}
							</span>
							{versions.length > 1 && (
								<div
									id="trashButton"
									className="container"
									style={{
										position: "absolute",
										right: "0.75rem",
										top: 0,
										height: "100%",
										transition: "all 0.2s ease-in-out",
									}}
								>
									<button
										style={{
											backgroundColor: "transparent",
											width: "2rem",
											height: "2rem",
											padding: 0,
										}}
										onClick={(e) => {
											e.preventDefault()
											const idx = data.versions.findIndex(
												(version) => version === v
											)
											data.versions.splice(idx, 1)

											if (selectedVersion === v) {
												setSelectedVersion(
													data.versions[
														data.versions.length ===
														idx
															? idx - 1
															: idx
													]
												)
											}

											updateVersions()
										}}
									>
										<Trash />
									</button>
								</div>
							)}
						</span>
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
										.sort((a, b) => compare(a.name, b.name))
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

	const Versions = () => (
		<div className="editBundleVersions">
			<div className="versionSelect">
				<VersionSelect data={bundleData} />
			</div>
			<VersionInfo version={selectedVersion} />
		</div>
	)

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
				defaultValue={(currentTab ?? "project-details") as string}
				onChange={(v) => {
					setTab(v)
					// navigate(`?tab=${v}${pack != null ? '&pack=' + pack : ''}${isNew != null ? '&new=' + isNew : ''}`)
				}}
			>
				<CategoryChoice
					text="Details"
					icon={<TextSvg />}
					value="project-details"
				/>
				<CategoryChoice
					text="Versions"
					icon={<File />}
					value="versions"
				/>
				{/* <CategoryChoice
					text="Management"
					icon={<Account />}
					value="management"
					hidden={user?.uid !== bundleData.owner}
				/> */}
			</CategoryBar>
			<div className="editorOrganizer">
				{tab === "project-details" && <ProjectDetails />}
				{tab === "versions" && <Versions />}
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
					{!isNew && tab === "versions" && selectedVersion && (
						<IconTextButton
							text="Download"
							icon={Download}
							onClick={async (e) => {
								e.preventDefault()
								alert('This will only download saved changes.')
								const token = await user?.getIdToken()
								window.open(
									import.meta.env.VITE_API_SERVER +
										`/bundles/${bundleData.uid}/download?token=${token}&version=${selectedVersion.name}`
								)
							}}
							href={
								import.meta.env.VITE_API_SERVER +
								`/bundles/${bundleData.uid}/download?version=${selectedVersion.name}`
							}
							reverse
						/>
					)}
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
