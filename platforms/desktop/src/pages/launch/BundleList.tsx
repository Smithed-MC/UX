import { FunctionComponent, SVGProps, useEffect, useState } from "react";
import { ConfiguredLocalBundles, LocalBundleConfig } from "../../types";
import "./BundleList.css";
import { invoke } from "@tauri-apps/api";
import libraries_box from "client/src/assets/libraries_box.png";
import { IconTextButton, svg } from "components";
import { MinecraftVersion } from 'data-types';
import CreateBundle from "../../components/CreateBundle";

function BundleList({ onSelect }: BundleListProps) {
	const [list, setList] = useState<ConfiguredLocalBundles | undefined>(
		undefined
	);
	const [selected, setSelected] = useState<string | undefined>(undefined);
	const [bundleToAdd, setBundleToAdd] = useState<
		[string, MinecraftVersion] | undefined
	>(undefined);

	useEffect(() => {
		async function get() {
			if (bundleToAdd !== undefined) {
				try {
					const config: LocalBundleConfig = {
						version: bundleToAdd[1],
						packs: [],
					};
					await invoke("add_bundle", {
						bundleId: bundleToAdd[0],
						bundle: config,
					});
					setBundleToAdd(undefined);
				} catch (e) {
					console.error("Failed to get local bundle list: " + e);
				}
			}
			try {
				const newList: ConfiguredLocalBundles = await invoke("list_bundles");
				setList(newList);
			} catch (e) {
				console.error("Failed to get local bundle list: " + e);
			}
		}

		get();
	}, [bundleToAdd]);

	let mappedList: JSX.Element[] = [];
	for (let i in list) {
		mappedList.push(
			<BundleCard
				id={i}
				config={list[i]}
				selectedId={selected}
				onSelect={(id) => {
					setSelected(id);
					onSelect(id);
				}}
			/>
		);
	}
	mappedList.push(
		<CreateBundleCard
			onCreate={(name, version) => {
				if (name !== undefined && version !== undefined) {
					setBundleToAdd([name, version]);
				}
			}}
		/>
	);

	return (
		<div className="container">
			<div className="container bundleListContainer">{mappedList}</div>
		</div>
	);
}

export interface BundleListProps {
	onSelect: (id: string | undefined) => void;
}

function BundleCard({ id, config, selectedId, onSelect }: BundleCardProps) {
	const isSelected = id === selectedId;

	return (
		<div className={`container bundleCard ${isSelected && "selected"}`}>
			<BundleThumbnail src={libraries_box} scale="60%" />
			<br />
			<div className="container bundleCardInfoContainer">
				<div className="bundleCardName">{id}</div>
				<div className="bundleCardVersion">{config.version}</div>
			</div>
			<br />
			<IconTextButton
				className={isSelected ? "highlightButtonLike" : "highlightButtonLike"}
				text={isSelected ? "Selected" : "Select"}
				style={{ width: "fit-content" }}
				onClick={() => {
					if (isSelected) {
						onSelect(undefined);
					} else {
						onSelect(id);
					}
				}}
			/>
		</div>
	);
}

interface BundleCardProps {
	id: string;
	config: LocalBundleConfig;
	selectedId: string | undefined;
	onSelect: (id: string | undefined) => void;
}

function BundleThumbnail({ src, svg, scale }: BundleThumbnailProps) {
	const style = { scale: scale === undefined ? "100%" : scale };
	return (
		<div className="bundleThumbnailContainer">
			{src && <img src={src} style={style} />}
			{svg && svg}
		</div>
	);
}

interface BundleThumbnailProps {
	src?: string;
	svg?: JSX.Element;
	scale?: string;
}

function CreateBundleCard({ onCreate }: CreateBundleCardProps) {
	let [showCreate, setShowCreate] = useState(false);

	return (
		<>
			{showCreate && (
				<CreateBundle
					onFinish={(name, version) => {
						onCreate(name, version);
						setShowCreate(false);
					}}
				/>
			)}
			<div className={`container bundleCard`}>
				{/* <BundleThumbnail
				svg={<svg.Plus style={{ scale: "500%", fill: "var(--accent)" }} />}
			/> */}
				<br />
				<IconTextButton
					className="accentedButtonLike"
					text="Create new"
					icon={svg.Plus}
					style={{ width: "fit-content" }}
					onClick={() => {
						setShowCreate(true);
					}}
				/>
			</div>
		</>
	);
}

interface CreateBundleCardProps {
	onCreate: (
		id: string | undefined,
		version: MinecraftVersion | undefined
	) => void;
}

export default BundleList;
