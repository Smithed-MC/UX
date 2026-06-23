import Alpine from "../../assets/summit/vendors/Alpine.png"
import Animated_Java from "../../assets/summit/vendors/Animated Java.png"
import Aspects from "../../assets/summit/vendors/Aspects.gif"
import AtlasPlays from "../../assets/summit/vendors/AtlasPlays.png"
import Beet from "../../assets/summit/vendors/Beet.png"
import BigSTy_Team from "../../assets/summit/vendors/BigSTy Team.png"
import Bundle_Group from "../../assets/summit/vendors/Bundle Group.png"
import Catenary from "../../assets/summit/vendors/Catenary.png"
import CliffTree from "../../assets/summit/vendors/CliffTree.png"
import CNK_Spiced from "../../assets/summit/vendors/CNK_Spiced.png"
import Crop_And_Kettle from "../../assets/summit/vendors/Crop And Kettle.png"
import Ctarron from "../../assets/summit/vendors/Ctarron.png"
import Custom_Entity_API from "../../assets/summit/vendors/Custom Entity API.png"
import Datapack_Hub from "../../assets/summit/vendors/Datapack Hub.png"
import Datapack_Icons from "../../assets/summit/vendors/Datapack Icons.png"
import Datapack_Toolkit from "../../assets/summit/vendors/Datapack Toolkit.png"
import Enter_The_Bungeon from "../../assets/summit/vendors/Enter The Bungeon.png"
import Error_404_Studio from "../../assets/summit/vendors/Error 404 Studio.png"
import Fingermaps from "../../assets/summit/vendors/Fingermaps.webp"
import Gamemode_4 from "../../assets/summit/vendors/Gamemode 4.png"
import Geophilic from "../../assets/summit/vendors/Geophilic.png"
import Gneiss from "../../assets/summit/vendors/Gneiss.jpg"
import Grimwart from "../../assets/summit/vendors/Grimwart.png"
import Iconic_Tooltips from "../../assets/summit/vendors/Iconic Tooltips.png"
import Kangawooo from "../../assets/summit/vendors/Kangawooo.png"
import Kanokarob from "../../assets/summit/vendors/Kanokarob.jpg"
import Legitimoose from "../../assets/summit/vendors/Legitimoose.png"
import Logdotzip_Studios from "../../assets/summit/vendors/Logdotzip Studios.jpg"
import Mapverse from "../../assets/summit/vendors/Mapverse.png"
import MCPaint from "../../assets/summit/vendors/MCPaint.png"
import Mechanization from "../../assets/summit/vendors/Mechanization.png"
import Minecraft_Commands from "../../assets/summit/vendors/Minecraft Commands.png"
import Minecraft_Middle_Earth from "../../assets/summit/vendors/Minecraft Middle-Earth.png"
import Misode from "../../assets/summit/vendors/Misode.png"
import Mixedbag from "../../assets/summit/vendors/Mixedbag.png"
import Modrinth from "../../assets/summit/vendors/Modrinth.png"
import Need_Cooler_Shoes from "../../assets/summit/vendors/Need Cooler Shoes.png"
import Nitrolaunch from "../../assets/summit/vendors/Nitrolaunch.png"
import Not_Undertale from "../../assets/summit/vendors/Not Undertale.png"
import Omega_Flowey from "../../assets/summit/vendors/Omega Flowey.png"
import OpenNBS from "../../assets/summit/vendors/OpenNBS.png"
import Petrichor from "../../assets/summit/vendors/Petrichor.png"
import Pumpkin_Carving from "../../assets/summit/vendors/Pumpkin Carving.png"
import Quasar from "../../assets/summit/vendors/Quasar.png"
import Quinns_Better_Noteblocks from "../../assets/summit/vendors/Quinns Better Noteblocks.webp"
import Raftblock from "../../assets/summit/vendors/Raftblock.png"
import Recolorful_Containers from "../../assets/summit/vendors/Recolorful Containers.png"
import Ride_And_Dash_Airbikes from "../../assets/summit/vendors/Ride & Dash Airbikes.png"
import Roguecraft from "../../assets/summit/vendors/Roguecraft.png"
import Sandstone from "../../assets/summit/vendors/Sandstone.png"
import Shadowforms from "../../assets/summit/vendors/Shadowforms.png"
import Shardgate_Studios from "../../assets/summit/vendors/Shardgate Studios.png"
import Shingeki_No_Craft from "../../assets/summit/vendors/Shingeki No Craft.png"
import Skade_Gaming from "../../assets/summit/vendors/Skade Gaming.png"
import Sky_Void from "../../assets/summit/vendors/Sky Void.webp"
import Smashing from "../../assets/summit/vendors/Smashing.png"
import Soulings from "../../assets/summit/vendors/Soulings.png"
import Spindle from "../../assets/summit/vendors/Spindle.png"
import Stardust_Labs from "../../assets/summit/vendors/Stardust Labs.png"
import Stewbeet from "../../assets/summit/vendors/Stewbeet.png"
import Super_Smash_Bros_Re_Crafted from "../../assets/summit/vendors/Super Smash Bros. Re Crafted.png"
import Surena_Studio from "../../assets/summit/vendors/Surena Studio.png"
import Table_Games_Plus from "../../assets/summit/vendors/Table Games+.png"
import Tectonic from "../../assets/summit/vendors/Tectonic.webp"
import The_Shulker_Box from "../../assets/summit/vendors/The Shulker Box.png"
import Thorax from "../../assets/summit/vendors/Thorax.png"
import Unbound_Items from "../../assets/summit/vendors/Unbound Items.png"
import Untitled_Rocket_Project from "../../assets/summit/vendors/Untitled Rocket Project.png"
import Vanilla_Ride_Studios from "../../assets/summit/vendors/Vanilla Ride Studios.png"
import Vanilla_Tweaks from "../../assets/summit/vendors/Vanilla Tweaks.png"
import Williams_Battleground from "../../assets/summit/vendors/William's Battleground.png"
import Wilozyx from "../../assets/summit/vendors/Wilozyx.jpg"

import "./vendors.css"
import { useMemo } from "react"

const VENDORS = [
	{ name: "Alpine", icon: Alpine },
	{ name: "Animated Java", icon: Animated_Java },
	{ name: "Aspects", icon: Aspects },
	{ name: "AtlasPlays", icon: AtlasPlays },
	{ name: "Beet", icon: Beet },
	{ name: "BigSTy Team", icon: BigSTy_Team },
	{ name: "Bundle Group", icon: Bundle_Group },
	{ name: "Catenary", icon: Catenary },
	{ name: "Cliff Tree", icon: CliffTree },
	{ name: "CNK: Spiced", icon: CNK_Spiced },
	{ name: "Crop And Kettle", icon: Crop_And_Kettle },
	{ name: "Ctarron", icon: Ctarron },
	{ name: "Custom Entity API", icon: Custom_Entity_API },
	{ name: "Datapack Hub", icon: Datapack_Hub },
	{ name: "Datapack Icons", icon: Datapack_Icons },
	{ name: "Datapack Toolkit", icon: Datapack_Toolkit },
	{ name: "Enter The Bungeon", icon: Enter_The_Bungeon },
	{ name: "Error 404 Studio", icon: Error_404_Studio },
	{ name: "Fingermaps", icon: Fingermaps },
	{ name: "Gamemode 4", icon: Gamemode_4 },
	{ name: "Geophilic", icon: Geophilic },
	{ name: "Gneiss Name", icon: Gneiss },
	{ name: "Grimwart", icon: Grimwart },
	{ name: "Iconic Tooltips", icon: Iconic_Tooltips },
	{ name: "Kangawooo", icon: Kangawooo },
	{ name: "Kanokarob", icon: Kanokarob },
	{ name: "Legitimoose", icon: Legitimoose },
	{ name: "Logdotzip Studios", icon: Logdotzip_Studios },
	{ name: "Mapverse", icon: Mapverse },
	{ name: "MCPaint", icon: MCPaint },
	{ name: "Mechanization", icon: Mechanization },
	{ name: "Minecraft Commands", icon: Minecraft_Commands },
	{ name: "Minecraft Middle-Earth", icon: Minecraft_Middle_Earth },
	{ name: "Misode", icon: Misode },
	{ name: "Mixedbag", icon: Mixedbag },
	{ name: "Modrinth", icon: Modrinth },
	{ name: "Need Cooler Shoes", icon: Need_Cooler_Shoes },
	{ name: "Nitrolaunch", icon: Nitrolaunch },
	{ name: "Not Undertale", icon: Not_Undertale },
	{ name: "Omega Flowey Remastered", icon: Omega_Flowey },
	{ name: "OpenNBS", icon: OpenNBS },
	{ name: "Petrichor", icon: Petrichor },
	{ name: "Pumpkin Carving", icon: Pumpkin_Carving },
	{ name: "Quasar", icon: Quasar },
	{ name: "Quinn's Better Noteblocks", icon: Quinns_Better_Noteblocks },
	{ name: "Raftblock", icon: Raftblock },
	{ name: "Recolorful Containers", icon: Recolorful_Containers },
	{ name: "Ride & Dash: Airbikes", icon: Ride_And_Dash_Airbikes },
	{ name: "Roguecraft", icon: Roguecraft },
	{ name: "Sandstone", icon: Sandstone },
	{ name: "Shadowforms", icon: Shadowforms },
	{ name: "Shardgate Studios", icon: Shardgate_Studios },
	{ name: "Shingeki No Craft", icon: Shingeki_No_Craft },
	{ name: "Skade Gaming", icon: Skade_Gaming },
	{ name: "Sky Void", icon: Sky_Void },
	{ name: "Smashing", icon: Smashing },
	{ name: "Soulings", icon: Soulings },
	{ name: "Spindle", icon: Spindle },
	{ name: "Stardust Labs", icon: Stardust_Labs },
	{ name: "Stewbeet", icon: Stewbeet },
	{ name: "Super Smash Bros. Re:Crafted", icon: Super_Smash_Bros_Re_Crafted },
	{ name: "Surena Studio", icon: Surena_Studio },
	{ name: "Table Games+", icon: Table_Games_Plus },
	{ name: "Tectonic", icon: Tectonic },
	{ name: "The Shulker Box", icon: The_Shulker_Box },
	{ name: "Thorax", icon: Thorax },
	{ name: "Unbound Items", icon: Unbound_Items },
	{ name: "Untitled Rocket Project", icon: Untitled_Rocket_Project },
	{ name: "Vanilla Ride Studios", icon: Vanilla_Ride_Studios },
	{ name: "Vanilla Tweaks", icon: Vanilla_Tweaks },
	{ name: "William's Battleground", icon: Williams_Battleground },
	{ name: "Wilozyx", icon: Wilozyx },
]

export function VendorGallery() {
	const vendors = useMemo(
		() => [...VENDORS].sort(() => Math.random() - 0.5),
		[]
	)

	return (
		<div className="vendorMarquee">
			<div className="vendorTrack">
				{vendors.map((vendor, index) => (
					<div
						className="vendorItem"
						key={`${vendor.name}-1-${index}`}
					>
						<div className="vendorCard">
							<img
								src={vendor.icon}
								alt={vendor.name}
								className="vendorIcon"
							/>
							<span className="vendorName">{vendor.name}</span>
						</div>
					</div>
				))}
				{vendors.map((vendor, index) => (
					<div
						className="vendorItem"
						key={`${vendor.name}-2-${index}`}
					>
						<div className="vendorCard">
							<img
								src={vendor.icon}
								alt={vendor.name}
								className="vendorIcon"
							/>
							<span className="vendorName">{vendor.name}</span>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
