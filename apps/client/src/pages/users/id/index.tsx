import {
	MinecraftVersion,
	PackBundle,
	PackData,
	PackMetaData,
	UserData,
} from "data-types"
import { useContext, useEffect, useRef, useState } from "react"
import { useLoaderData, useNavigate, useParams } from "react-router-dom"
import { formatDownloads } from "formatters"
import "./index.css"
import {
	CategoryBar,
	CategoryChoice,
	DownloadButton,
	GalleryPackCard,
	IconTextButton,
	Link,
	MarkdownRenderer,
} from "components"
import {
	useAppDispatch,
	useAppSelector,
	useFirebaseUser,
	useQueryParams,
} from "hooks"
import {
	Account,
	At,
	BackArrow,
	Check,
	Cross,
	Discord,
	Download,
	Edit,
	Folder,
	Home,
	Jigsaw,
	Line,
	Plus,
	Smithed,
	Trash,
	Upload,
} from "components/svg"
import { Helmet } from "react-helmet"
import { getAuth } from "firebase/auth"
import { User as FirebaseUser } from "firebase/auth"
import { prettyTimeDifference } from "formatters"
import { CreateBundle } from "../../../widget/bundle"
import { BundleCard } from "components/BundleCard"
import { UserStats } from "../../../loaders"
import { selectUserData } from "store"
import Smithie from "../../../widget/Smithie"
import { ClientContext } from "../../../context"

interface UserTabComponent {
	editable: boolean
	visible: boolean
	isEditing: boolean
}

function CreationButton({
	text,
	onPress,
}: {
	text: string
	onPress: () => void
}) {
	return (
		<div
			className="container"
			style={{
				gap: 16,
				flexDirection: "row",
				padding: 16,
				borderRadius: "var(--defaultBorderRadius)",
				backgroundColor: "var(--section)",
				fontSize: "1.125rem",
			}}
		>
			{text}
			<button
				className="button container wobbleHover"
				style={{
					fontSize: 48,
					width: 48,
					height: 48,
					justifyContent: "center",
					borderRadius: "50%",
				}}
				onClick={onPress}
			>
				<label>+</label>
			</button>
		</div>
	)
}

function CreateBundleModal({
	user,
	showModal,
	addPack,
}: {
	user: FirebaseUser | null
	showModal: (value: boolean) => void
	addPack: (value: PackBundle) => void
}) {
	const [name, setName] = useState<string | undefined>(undefined)
	const [version, setVersion] = useState<MinecraftVersion | undefined>(
		undefined
	)

	const navigate = useNavigate()

	const isEnabled = name !== undefined && version !== undefined

	const close = () => {
		showModal(false)
	}

	return (
		<div
			className="container"
			style={{
				position: "fixed",
				width: "100%",
				height: "100%",
				top: 0,
				left: 0,
				backgroundColor: "rgba(0, 0, 0, 50%)",
				animation: "fadeInBackground 0.5s",
			}}
		>
			<div
				className="container"
				style={{
					backgroundColor: "var(--background)",
					border: "0.125rem solid var(--border)",
					boxSizing: "border-box",
					padding: 16,
					borderRadius: "var(--defaultBorderRadius)",
					gap: 16,
					animation: "slideInContent 0.5s ease-in-out",
				}}
			>
				<CreateBundle
					close={close}
					finish={close}
					showCloseButton
					showEditButton
				/>
			</div>
		</div>
	)
}

export interface UserProps {
	showBackButton?: boolean
	bundleDownloadButton: DownloadButton
}

function UserPacks({
	user,
	packs,
	editable,
	visible,
}: {
	user: UserData
	packs: { id: string; data: PackData; meta: PackMetaData; owner: UserData }[]
} & UserTabComponent) {
	const navigate = useNavigate()

	return (
		<div
			key="packs"
			className="userContentGrid"
			style={{ display: visible ? "grid" : "none" }}
		>
			{packs
				.sort(
					(a, b) =>
						a.meta.stats.downloads.total -
						b.meta.stats.downloads.total
				)
				.sort((p) => (p.meta.owner === user.uid ? 1 : -1))
				.reverse()
				.map((p) => (
					<GalleryPackCard
						state={editable ? "editable" : undefined}
						id={p.id}
						packData={p.data}
						packMeta={p.meta}
						packAuthor={p.owner.displayName}
						onClick={() => {
							navigate(`../packs/${p}`)
						}}
						key={p.id}
					/>
				))}
			{editable && packs.length == 0 && (
				<div className="container" style={{ gap: "1rem" }}>
					Looks like you don't have any packs!
					<IconTextButton
						icon={Plus}
						text={"Make one here"}
						className="accentedButtonLike"
						href="/packs/new/edit"
					/>
				</div>
			)}
		</div>
	)
}

function UserBundles({
	bundles,
	editable,
	visible,
}: {
	bundles: string[]
} & UserTabComponent) {
	const clientContext = useContext(ClientContext)
	return (
		<div
			key="bundles"
			className="userContentGrid"
			style={{ display: visible ? "grid" : "none" }}
		>
			{bundles?.map((b) => (
				<BundleCard
					key={b}
					id={b}
					editable={editable}
					bundleDownloadButton={clientContext.bundleDownloadButton}
				/>
			))}
		</div>
	)
}

function UserAbout({
	userStats,
	visible,
	isEditing,
	biography,
	setBiography,
}: {
	userStats: UserStats
	biography: string
	setBiography: (v: string) => void
} & UserTabComponent) {
	function Stat({
		name,
		value,
		icon,
	}: {
		name: string
		value: number | string | undefined
		icon: any
	}) {
		return (
			<div className="statDisplay">
				{icon}
				<div
					style={{
						width: 2,
						backgroundColor: "var(--border)",
						height: "1rem",
					}}
				/>
				<label className="statText">
					{value} {name}
					{value == 1 ? "" : "s"}
				</label>
			</div>
		)
	}

	useEffect(() => {
		const bioElement = document.getElementById("userBiography")
		if (!bioElement) return
		bioElement.innerText = biography
	}, [isEditing])

	return (
		<div
			className="container"
			style={{
				width: "100%",
				display: visible ? "flex" : "none",
				resize: "vertical",
				gap: "2rem",
			}}
		>
			{isEditing && (
				<span
					id="userBiography"
					style={{
						width: "100%",
						padding: "1rem",
						backgroundColor: "var(--section)",
						boxSizing: "border-box",
						borderRadius: "var(--defaultBorderRadius)",
					}}
					contentEditable
					role="textbox"
					onInput={(e) => {
						setBiography(e.currentTarget.innerText ?? "")
						console.log(e.currentTarget.innerText)
					}}
				>
					{biography}
				</span>
			)}
			{!isEditing && (
				<div style={{ width: "100%" }}>
					<MarkdownRenderer>{biography}</MarkdownRenderer>
				</div>
			)}

			<div className="statGrid">
				<span
					className="title"
					style={{
						gridRow: "1 / 3",
						gridColumn: 1,
						alignSelf: "start",
					}}
				>
					<Download /> Downloads
				</span>
				<div className="divider" />
				<span className="title">Total</span>
				<div className="divider" />
				<span className="title">Today</span>
				<div className="divider" />
				<span>{formatDownloads(userStats?.totalDownloads ?? 0)}</span>
				<div className="divider" />
				<span>{formatDownloads(userStats?.dailyDownloads ?? 0)}</span>
			</div>
		</div>
	)
}

export default function User() {
	const { owner: userId } = useParams()
	const { tab: defaultTab } = useQueryParams()
	const firebaseUser = useFirebaseUser()

	const clientContext = useContext(ClientContext)

	const navigate = useNavigate()
	const {
		user,
		userStats,
	}: { user: UserData | undefined; userStats: UserStats } =
		useLoaderData() as any

	const [tab, setTab] = useState(defaultTab ?? "userPacks")

	const [editable, setEditable] = useState<boolean>(false)
	const [editingUserData, setEditingUserData] = useState(false)

	const [pfp, setPFP] = useState(user?.pfp)
	const [banner, setBanner] = useState(user?.banner)
	const [biography, setBiography] = useState(user?.biography)

	const [showBundleCreationModal, setShowBundleCreationModal] =
		useState(false)
	const [showFallbackPFP, setShowFallbackPFP] = useState(false)

	const dispatch = useAppDispatch()
	const viewingUser = useAppSelector(selectUserData)

	const pfpUploadRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		if (!("uid" in viewingUser)) return

		setEditable(
			userId === viewingUser.uid ||
				(user !== undefined && viewingUser.uid === user.uid)
		)
	}, [viewingUser])

	async function convertToDataURL(file: File | null | undefined) {
		if (file == null || file === undefined) return undefined

		if (file.size > 1024 * 1024) {
			alert("Selected image exceeds 1MB")
			return undefined
		}

		return await new Promise<string>((resolve) => {
			const fileReader = new FileReader()
			fileReader.readAsDataURL(file)
			fileReader.onloadend = () => {
				resolve(fileReader.result as string)
			}
		})
	}

	if (user === undefined) {
		return (
			<div className="container" style={{ height: "100%" }}>
				<h1>Looks like this page or user doesn't exist!</h1>
				<div
					className="container"
					style={{ flexDirection: "row", gap: "1rem" }}
				>
					<IconTextButton
						icon={Home}
						text={"Take me home"}
						className="accentedButtonLike"
						href="/"
					/>
					<IconTextButton
						icon={Discord}
						text={"Report a problem"}
						href="/discord"
					/>
				</div>
			</div>
		)
	}

	let pageDescription = `Check out ${user?.displayName}'s page!`
	if (userStats.packs.length >= 1)
		pageDescription +=
			` They've published ${userStats.packs.length} pack` +
			(userStats.packs.length != 1 ? "s" : "") +
			"!"

	if (userStats === undefined) return <div></div>
	return (
		<div
			className="container"
			style={{ gap: "5rem", boxSizing: "border-box", width: "100%" }}
		>
			<Helmet>
				<meta name="og:site_name" content="Smithed" />
				<title>{user?.displayName}</title>
				<meta name="description" content={pageDescription} />
				{user?.pfp && (
					<meta
						name="og:image"
						content={
							import.meta.env.VITE_API_SERVER +
							`/users/${user?.uid}/pfp`
						}
					/>
				)}
			</Helmet>

			<div
				className="flexDirection"
				style={{
					width: "100%",
					backgroundColor: "var(--backgroundAccent)",
					borderRadius: "var(--defaultBorderRadius)",
					gap: 16,
					boxSizing: "border-box",
				}}
			>
				<div
					className="container"
					style={{ width: "100%", gap: "2rem" }}
				>
					{(banner || editingUserData) && (
						<div
							className="container"
							style={{
								width: "100%",
								height: "10rem",
								overflow: "hidden",
								position: "relative",
								borderRadius: "var(--defaultBorderRadius)",
							}}
						>
							{banner && (
								<img
									src={
										(typeof banner === "string"
											? banner
											: null) ??
										import.meta.env.VITE_API_SERVER +
											"/users/" +
											userId +
											"/banner"
									}
									style={{
										position: "absolute",
										width: "100%",
									}}
								/>
							)}

							{editingUserData && (
								<div
									className="container"
									style={{
										zIndex: 0,
										width: "100%",
										height: "100%",
										backgroundColor: `rgba(0,0,0,${banner ? "0.6" : "1"})`,
										position: "relative",
									}}
								>
									<button
										className="container"
										style={{
											width: "6rem",
											height: "6rem",
											background: "none",
											justifyContent: "center",
											alignItems: "center",
										}}
										onClick={() => {
											document
												.getElementById(
													"userProfileBannerUpload"
												)
												?.click()
										}}
									>
										<Upload
											style={{
												width: "3rem",
												height: "3rem",
												position: "absolute",
											}}
										/>
									</button>

									<button
										className="invalidButtonLike"
										style={{
											position: "absolute",
											top: "1rem",
											right: "1rem",
											boxSizing: "content-box",
											width: "1rem",
											height: "1rem",
										}}
										onClick={() => {
											setBanner("")
										}}
									>
										<Trash
											style={{
												width: "1rem",
												height: "1rem",
												position: "absolute",
											}}
										/>
									</button>

									<input
										hidden
										id="userProfileBannerUpload"
										type="file"
										accept="image/png, image/jpeg"
										onChange={async (e) => {
											const file =
												e.currentTarget.files?.item(0)
											const result =
												await convertToDataURL(file)

											if (result === undefined) return
											setBanner(result)
										}}
									/>
								</div>
							)}
						</div>
					)}

					<div
						className="container"
						style={{
							width: "100%",
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
						}}
					>
						<div className="userIconAndName">
							<div
								style={{
									gridArea: "image",
									width: 64,
									height: 64,
									overflow: "hidden",
									borderRadius: "var(--defaultBorderRadius)",
									display: "flex",
								}}
							>
								{!showFallbackPFP && (
									<img
										src={
											typeof pfp === "string"
												? pfp
												: null ??
													import.meta.env
														.VITE_API_SERVER +
														"/users/" +
														userId +
														"/pfp"
										}
										style={{
											width: 64,
											height: 64,
											margin: 0,
										}}
										width={64}
										height={64}
										onError={(e) =>
											setShowFallbackPFP(true)
										}
									/>
								)}
								{showFallbackPFP && (
									<div className="userFallbackPFP">
										<Account
											style={{ width: 32, height: 32 }}
										/>
									</div>
								)}

								{editingUserData && (
									<button
										className="uploadPfpButton"
										style={{
											width: 64,
											height: 64,
											position: "absolute",
										}}
										onClick={() => {
											pfpUploadRef.current?.click()
										}}
									>
										<Upload
											fill="var(--foreground)"
											style={{ width: 32, height: 32 }}
										/>
										<input
											ref={pfpUploadRef}
											type="file"
											accept="image/png, image/jpeg"
											style={{ display: "none" }}
											onChange={async (e) => {
												const file =
													e.currentTarget.files?.item(
														0
													)
												const result =
													await convertToDataURL(file)

												if (result === undefined) return

												setPFP(result)
												setShowFallbackPFP(false)
											}}
										/>
									</button>
								)}
							</div>
							<label className="userName">
								{user?.displayName}
							</label>
							<label className="userJoinTime">
								Joined{" "}
								{prettyTimeDifference(user?.creationTime ?? 0)}{" "}
								ago
							</label>
						</div>
						{editable && (
							<div className="container profileControlContainer">
								{!editingUserData && (
									<IconTextButton
										className="accentedButtonLike profileControl last"
										text={"Edit"}
										icon={Edit}
										reverse={true}
										onClick={() => {
											setEditingUserData(true)
											setTab("about")
										}}
									/>
								)}
								{editingUserData && (
									<IconTextButton
										className="successButtonLike profileControl last"
										text={"Save"}
										icon={Check}
										reverse={true}
										onClick={async () => {
											if (firebaseUser == null) return
											const resp = await fetch(
												import.meta.env
													.VITE_API_SERVER +
													`/users/${firebaseUser.uid}?token=${await firebaseUser.getIdToken()}`,
												{
													method: "PATCH",
													body: JSON.stringify({
														data: {
															pfp: pfp,
															banner: banner,
															biography:
																biography,
														},
													}),
													headers: {
														"Content-Type":
															"application/json",
													},
												}
											)

											if (!resp.ok)
												alert(await resp.text())

											if (user !== undefined) {
												user.pfp = pfp
												user.banner = banner
												user.biography = biography
											}
											setEditingUserData(false)
										}}
									/>
								)}
								{editingUserData && (
									<button
										className="buttonLike invalidButtonLike"
										onClick={() => {
											setPFP(user?.pfp)
											setBanner(user?.banner)
											setBiography(user?.biography)
											setShowFallbackPFP(false)
											setEditingUserData(false)
										}}
									>
										<Cross />
									</button>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
			<div className="container" style={{ gap: "2rem", width: "100%" }}>
				<CategoryBar
					onChange={(v) => {
						setTab(v)
						navigate("?tab=" + v)
					}}
					defaultValue={tab as string}
				>
					<CategoryChoice
						value="userPacks"
						text="Packs"
						icon={<Jigsaw />}
						disabled={userStats.packs.length === 0}
					>
						{editable && (
							<div
								className="container"
								style={{
									position: "absolute",
									right: "1rem",
									height: "100%",
									zIndex: 1,
								}}
							>
								<Link
									className="container newContentButton"
									to="/packs/new/edit"
								>
									<Plus />
								</Link>
							</div>
						)}
					</CategoryChoice>
					<CategoryChoice
						value="userBundles"
						text="Bundles"
						icon={<Folder />}
						disabled={userStats.bundles.length === 0 && !editable}
					>
						{editable && (
							<div
								className="container"
								style={{
									position: "absolute",
									right: "1rem",
									height: "100%",
									zIndex: 1,
								}}
							>
								<Link
									className="container newContentButton"
									to="/bundles/new/edit"
								>
									<Plus />
								</Link>
							</div>
						)}
					</CategoryChoice>
					<CategoryChoice value="about" text="About" icon={<At />} />
				</CategoryBar>

				<UserPacks
					isEditing={editingUserData}
					visible={tab === "userPacks"}
					user={user}
					packs={userStats.packs}
					editable={editable}
				/>
				<UserBundles
					isEditing={editingUserData}
					visible={tab === "userBundles"}
					bundles={userStats.bundles}
					editable={editable}
				/>
				<UserAbout
					isEditing={editingUserData}
					visible={tab === "about"}
					userStats={userStats}
					biography={user.biography!}
					setBiography={setBiography}
					editable={editable}
				/>
			</div>

			{showBundleCreationModal && firebaseUser && (
				<CreateBundleModal
					showModal={setShowBundleCreationModal}
					addPack={(value: PackBundle) => {
						navigate("")
					}}
					user={firebaseUser}
				/>
			)}

			{[
				"6HLRqeMx3zZQO4iWQcEfQMBMK8m2",
				"ACICebloi6dIVDTcmo3pieZkadc2",
			].includes(user.uid) && <Smithie />}
		</div>
	)
}
