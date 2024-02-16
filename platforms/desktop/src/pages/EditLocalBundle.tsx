import "./EditLocalBundle.css"

import { invoke } from "@tauri-apps/api"
import { useNavigate, useParams } from "react-router-dom"
import { LocalBundleConfig } from "../types"
import { IconTextButton, PackCard, svg } from "components"
import { PackData, PackReference } from "data-types"
import { useEffect, useState } from "react"
import BackButton from "client/src/widget/BackButton"

interface BundleData {
	bundle: LocalBundleConfig
	packs: [PackReference, PackData][]
}

function EditLocalBundle({}: EditLocalBundleProps) {
	const params = useParams()
	const bundleId = params.id as string
	const [data, setData] = useState<BundleData | undefined>(undefined)
	const [reload, setReload] = useState(false)
	const navigate = useNavigate()

	useEffect(() => {
		async function get() {
			try {
				const bundle: LocalBundleConfig = await invoke("get_bundle", {
					bundleId: bundleId,
				})
				const packs: [PackReference, PackData][] = await invoke(
					"get_bundle_packs",
					{
						bundleId: bundleId,
					}
				)
				setData({ bundle, packs })
			} catch (e) {
				console.error("Failed to get local bundle data: " + e)
			}
		}

		setReload(false)
		get()
	}, [reload])

	async function deleteBundle() {
		if (data === undefined) {
			return
		}
		try {
			await invoke("remove_bundle", { bundleId: bundleId })
			navigate("/launch")
		} catch (e) {
			console.error("Failed to delete bundle: " + e)
		}
	}

	async function removePack(packId: string) {
		try {
			await invoke("remove_pack_from_bundle", {
				bundleId: bundleId,
				packId: packId,
			})
			setReload(true)
		} catch (e) {
			console.error("Failed to delete pack from bundle: " + e)
		}
	}

	let packElems: JSX.Element[] = []
	if (data !== undefined) {
		for (let [reference, packData] of data.packs) {
			packElems.push(
				<EditLocalPack
					data={packData}
					reference={reference}
					onRemove={() => {
						removePack(reference.id)
					}}
				/>
			)
		}
	}

	return (
		<div className="container editLocalBundleContainer">
			<div
				className="container"
				style={{ flexDirection: "row", gap: "0.8rem" }}
			>
				<BackButton />
				<svg.Edit />
				<div className="bigText">Editing local bundle '{bundleId}'</div>
			</div>
			<div className="container bundleInfoContainer">
				Version:{" "}
				{data !== undefined ? data.bundle.version : "Loading..."}
			</div>
			<br />
			{data === undefined ? (
				<div className="bigText">Loading packs...</div>
			) : packElems.length > 0 ? (
				<div className="bigText">Packs:</div>
			) : (
				<>
					<div className="bigText">No packs in bundle</div>
					<br />
					<IconTextButton
						className="accentedButtonLike"
						text="Browse packs"
						icon={svg.Plus}
						style={{ width: "fit-content" }}
						href="/browse"
					/>
				</>
			)}
			<div className="container bundlePacksContainer">{packElems}</div>
			<br />
			<IconTextButton
				className="disturbingButtonLike"
				text="Delete bundle"
				icon={svg.Cross}
				style={{ width: "fit-content" }}
				onClick={deleteBundle}
			/>
		</div>
	)
}

export interface EditLocalBundleProps {}

function EditLocalPack({ data, reference, onRemove }: EditLocalPackProps) {
	const [open, setOpen] = useState(false)

	return (
		<div className={`container editLocalPackContainer`}>
			<div
				className={`container editLocalPackTitleContainer ${
					open ? "open" : "closed"
				}`}
				onClick={() => {
					if (open) {
						setOpen(false)
					} else {
						setOpen(true)
					}
				}}
			>
				<div
					className="container"
					style={{
						justifyContent: "left",
						flexGrow: "1",
						gap: "1rem",
						flexDirection: "row",
						boxSizing: "border-box",
					}}
				>
					<img
						className="editLocalPackIcon"
						src={data.display.icon}
					/>
					<div className="editLocalPackName">{data.display.name}</div>
					<div className="editLocalPackVersion">
						v{reference.version}
					</div>
				</div>
				<div
					className="container"
					style={{
						justifyContent: "end",
						flexGrow: "1",
						gap: "1rem",
					}}
				>
					<svg.Right
						className={`editLocalPackArrow ${open ? "open" : ""}`}
					/>
				</div>
			</div>
			{open && (
				<div className="container editLocalPackDropdown">
					<div
						className="container"
						style={{
							justifyContent: "left",
							flexGrow: "1",
							gap: "1rem",
							flexDirection: "row",
						}}
					>
						<IconTextButton
							className="highlightButtonLike"
							text="Go to page"
							icon={svg.Right}
							style={{ width: "fit-content" }}
							href={`/packs/${data.id}`}
							reverse={true}
						/>
						<IconTextButton
							className="disturbingButtonLike"
							text="Remove from bundle"
							icon={svg.Cross}
							style={{ width: "fit-content" }}
							onClick={onRemove}
						/>
					</div>
				</div>
			)}
		</div>
	)
}

interface EditLocalPackProps {
	data: PackData
	reference: PackReference
	onRemove: () => void
}

export default EditLocalBundle
