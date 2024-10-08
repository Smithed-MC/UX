import { ChooseBox, IconInput, IconTextButton } from "components"
import { Edit, Check, Cross, Account } from "components/svg"
import {
	HTTPResponses,
	MinecraftVersion,
	PackBundle,
	PackBundle_v2,
	latestMinecraftVersion,
	supportedMinecraftVersions,
} from "data-types"
import { sanitize } from "formatters"
import { useAppDispatch, useAppSelector, useFirebaseUser } from "hooks"
import { useState } from "react"
import { useNavigate } from "react-router-dom"

interface CreateBundleProps {
	close?: () => void
	finish?: (bundle: PackBundle_v2) => void
	showCloseButton?: boolean
	showEditButton?: boolean
	minecraftVersion?: MinecraftVersion
}

export function CreateBundle({
	close,
	minecraftVersion,
	showCloseButton,
	showEditButton,
	finish: finishCallback,
}: CreateBundleProps) {
	const [name, setName] = useState<string>()
	const [version, setVersion] = useState<MinecraftVersion>()

	const user = useFirebaseUser()

	const dispatch = useAppDispatch()
	const navigate = useNavigate()

	const finish = async () => {
		if (name === undefined) return undefined
		if (version === undefined && minecraftVersion === undefined)
			return undefined

		const bundleData: PackBundle_v2 = {
			schemaVersion: "v2",
			owner: user?.uid ?? "",
			id: sanitize(name),
			display: {
				name: name,
				description: "stes",
				icon: "",
			},
			versions: [
				{
					name: "0.0.1",
					packs: [],
					supports: [
						minecraftVersion ?? version ?? latestMinecraftVersion,
					],
					patches: [],
				},
			],
			categories: [],
			visibility: "private",
		}

		const resp = await fetch(
			import.meta.env.VITE_API_SERVER +
				`/bundles?token=${await user?.getIdToken()}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					data: bundleData,
				}),
			}
		)

		if (resp.status !== HTTPResponses.CREATED) return undefined

		const { uid } = await resp.json()
		bundleData.uid = uid

		if (finishCallback) finishCallback(bundleData)
		return uid
	}
	const finishAndEdit = async () => {
		const uid = await finish()
		if (uid === undefined) return

		navigate(`/browse`)
	}

	if (user == null) {
		return (
			<div className="container" style={{ gap: "1rem" }}>
				<label style={{ fontWeight: 600 }}>
					You must login to create a bundle
				</label>
				<div
					className="container"
					style={{ flexDirection: "row", gap: "1rem" }}
				>
					<IconTextButton
						className="invalidButtonLike"
						icon={Cross}
						text={"Cancel"}
						onClick={close}
					/>
					<IconTextButton
						icon={Account}
						text={"Login"}
						to="/account"
					/>
				</div>
			</div>
		)
	}

	return (
		<div className="container" style={{ gap: "1rem", width: "100%" }}>
			<label style={{ fontWeight: 600 }}>Create a bundle</label>
			<IconInput
				style={{ width: "100%", zIndex: 1 }}
				type="text"
				icon={Edit}
				placeholder="Name..."
				onChange={(e) => setName(e.currentTarget?.value)}
			/>
			{!minecraftVersion && (
				<ChooseBox
					style={{ zIndex: 100 }}
					onChange={(v) => setVersion(v as string)}
					placeholder="Version"
					choices={supportedMinecraftVersions.map((v) => ({
						value: v,
						content: v,
					}))}
				/>
			)}
			<div
				className="container"
				style={{ flexDirection: "row", width: "100%", gap: 16 }}
			>
				{showCloseButton && (
					<IconTextButton
						className="invalidButtonLike"
						icon={Cross}
						text="Cancel"
						onClick={close}
					/>
				)}
				<IconTextButton
					className="accentedButtonLike"
					icon={Check}
					text="Finish"
					onClick={finish}
				/>
				{showEditButton && (
					<IconTextButton
						className="accentedButtonLike"
						icon={Edit}
						text="Edit"
						onClick={finishAndEdit}
					/>
				)}
			</div>
		</div>
	)
}
