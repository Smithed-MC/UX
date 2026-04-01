import { IconTextButton, Modal } from "components"
import { Cross, Plus, ShoppingCart } from "components/svg"
import { useEffect, useRef, useState } from "react"

import NINE_MUG from "../assets/merch/9mug.png"
import BRAIN_CORAL_DEAD from "../assets/merch/brain_coral_dead.png"
import CLOSE_ENOUGH from "../assets/merch/Close Enough.png"
import DATAPACK_BIBLE from "../assets/merch/data pack bible.png"
import MOD_MITOSIS from "../assets/merch/do mods do mitosis.png"
import SMITHED_SHIRT from "../assets/merch/image.webp"
import ITS_PEAK from "../assets/merch/its peak.png"
import KYRIUS_SHIRT from "../assets/merch/kyriusshirt.png"
import MELON from "../assets/merch/melon.png"
import MYSTERY_BOX from "../assets/merch/a-mystery-box.png"
import NUCLEAR_BOMB from "../assets/merch/nuclear bomb.png"
import OURPLE from "../assets/merch/ourple.png"
import PHIPHI_COSTUME from "../assets/merch/phiphihead.png"
import SMITHED_CHICKEN_NUGGET from "../assets/merch/rare smithed shaped chicken nugget.png"
import JACO_SHIRT from "../assets/merch/shirt1jaco.png"
import SMIF_TAPESTRY from "../assets/merch/Smif Tapestry.png"
import SUMMIT_SERVERS from "../assets/merch/smithed summit 24 server.png"
import SMITHIE_PLUSHIE from "../assets/merch/smithy plushie.png"
import STRANGE_CREATURE from "../assets/merch/strange creature.png"
import SUMMIT_SOON_POSTER from "../assets/merch/summitsoon.png"
import TOMORROW_FOR_SURE_POSTER from "../assets/merch/tomorrow for sure poster.png"
import WELD_SCRIPTS_SHIRT from "../assets/merch/weld_scripts.png"
import RX_BREAD from "../assets/merch/rx shaped bread.png"

type MerchItem = {
	title: string
	description: string
	image: string
	price: number
}

const ITEMS: Record<string, MerchItem> = {
	"9mug": {
		title: "9-Mug",
		description: "Express your love for 9Minecraft's business!",
		price: 14.99,
		image: NINE_MUG,
	},
	"brain-coral-dead": {
		title: "Brain (Coral) Dead Hoodie",
		description: "Ha. You make my brain (coral) dead. Ha.",
		price: 64.99,
		image: BRAIN_CORAL_DEAD,
	},
	"close-enough": {
		title: "Close Enough T-Shirt",
		description: "Our failings, just for you enjoyment",
		price: 34.99,
		image: CLOSE_ENOUGH,
	},
	"datapack-bible": {
		title: "Datapack Bible",
		description: "A datapacker's guide to JSON",
		price: 0,
		image: DATAPACK_BIBLE,
	},
	"mod-mitosis": {
		title: "Mod-Mitosis T-Shirt",
		description: "What's better than one Jachro?",
		price: 34.99,
		image: MOD_MITOSIS,
	},
	"smithed-shirt": {
		title: "Clean Smithed T-Shirt",
		description: "Represent the best",
		price: 74.99,
		image: SMITHED_SHIRT,
	},
	"its-peak": {
		title: "Summit Peak T-Shirt",
		description: "The real peak was the lag along the way",
		price: 39.99,
		image: ITS_PEAK,
	},
	"kyrius-shirt": {
		title: "Kyrius T-Shirt",
		description: "They're always watching...",
		price: 44.99,
		image: KYRIUS_SHIRT,
	},
	melon: {
		title: "Mono's Melon T-Shirt",
		description: "An interesting decision, immortalized forever",
		price: 24.99,
		image: MELON,
	},
	"a-mystery-box": {
		title: "A Mystery Box",
		description: "Who knows!",
		price: 26,
		image: MYSTERY_BOX,
	},
	"nuclear-bomb": {
		title: "Nuclear Bomb",
		description: "vs. Coughing Baby",
		price: 1000,
		image: NUCLEAR_BOMB,
	},
	ourple: {
		title: "Ourple T-Shirt",
		description: "Everyone loves a good Ourple; especially Kyrius",
		price: 34.99,
		image: OURPLE,
	},
	"phiphi-costume": {
		title: "Phiphi Costume",
		description: "Dress like everyone's favorite penguin",
		price: 49.99,
		image: PHIPHI_COSTUME,
	},
	"smithed-shaped-nugget": {
		title: "Smithed Shaped Chicken Nugget",
		description: "1:1, rare, collector's edition, mint condition",
		price: 1_000_000,
		image: SMITHED_CHICKEN_NUGGET,
	},
	"jaco-shirt": {
		title: "Jaco T-Shirt",
		description: "A lovely sentiment",
		price: 44.99,
		image: JACO_SHIRT,
	},
	"smif-tapestry": {
		title: "Smif Tapestry",
		description: "A piece of Summit, perfect decor",
		price: 120,
		image: SMIF_TAPESTRY,
	},
	"summit-servers": {
		title: "Summit Servers",
		description: "A photo-realistic painting of the Summit 24 servers",
		price: 5,
		image: SUMMIT_SERVERS,
	},
	"smithie-plushie": {
		title: "Smithie Plushie",
		description: "Straight from the Summit Island",
		price: 29.99,
		image: SMITHIE_PLUSHIE,
	},
	"strange-creature": {
		title: "A Strange Creature",
		description: "plz adopt",
		price: 0.0,
		image: STRANGE_CREATURE,
	},
	"summit-soon-poster": {
		title: "Summit Soon Poster",
		description: "Summit just 17 seconds away!",
		price: 30.0,
		image: SUMMIT_SOON_POSTER,
	},
	"tomorrow-for-sure": {
		title: "Tomorrow For Sure Poster",
		description: "One of these days there'll be a yes",
		price: 30,
		image: TOMORROW_FOR_SURE_POSTER,
	},
	"weld-scripts-shirt": {
		title: "Weld Scripts T-Shirt",
		description: "Weld scripts are right around the corner guys...",
		price: 34.99,
		image: WELD_SCRIPTS_SHIRT,
	},
	"rx-bread": {
		title: "Oddly Shaped Bread",
		description: "Reminds me of someone",
		price: 2.99,
		image: RX_BREAD,
	},
}

function MerchCard({
	item,
	onClick,
}: {
	item: MerchItem
	onClick: () => void
}) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				backgroundColor: "var(--section)",
				aspectRatio: "1/1",
				borderRadius: "var(--defaultBorderRadius)",
				border: "0.125rem solid var(--border)",
				overflow: "hidden",
			}}
		>
			<div
				className="container"
				style={{
					width: "100%",
					flexGrow: 1,
					position: "relative",
					overflow: "hidden",
					backgroundColor: "var(--bold)",
					justifyContent: "center",
				}}
			>
				<img
					src={item.image}
					style={{ height: "100%", position: "absolute" }}
				/>
			</div>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "0.5rem",
					padding: "0.5rem 1rem 0rem 1rem",
				}}
			>
				<div style={{ fontWeight: 500 }}>{item.title}</div>
				<div style={{ opacity: 0.5 }}>{item.description}</div>
			</div>
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					gap: "1rem",
					justifyContent: "space-between",
					alignItems: "center",
					padding: "0.5rem 1rem",
				}}
			>
				<span>${item.price.toFixed(2)}</span>
				<IconTextButton
					className="accentedButtonLike"
					icon={Plus}
					text={"Add to cart"}
					reverse
					onClick={onClick}
				/>
			</div>
		</div>
	)
}

function CheckoutScreen({
	items,
	onClose,
}: {
	items: Record<string, number>
	onClose: () => void
}) {
	const subtotal = Object.entries(items)
		.map(([k, v]) => ITEMS[k].price * v)
		.reduce((a, b) => a + b, 0)
	return (
		<div
			className="container"
			style={{
				width: "100%",
				height: "100%",
				position: "fixed",
				top: 0,
				left: 0,
				backgroundColor: "rgba(0,0,0,0.2)",
				justifyContent: "center",
				alignItems: "center",
				backdropFilter: "blur(4px)",
				padding: "2rem",
			}}
		>
			<div
				className="container"
				style={{
					borderRadius: "var(--defaultBorderRadius)",
					border: "0.125rem solid var(--border)",
					backgroundColor: "var(--section)",
					padding: "1rem",
					gap: "0.5rem",
					height: "max-content",
					width: "max-content",
				}}
			>
				<div
					className="container"
					style={{
						flexDirection: "row",
						fontSize: "1.5rem",
						fontWeight: 500,
						width: "100%",
						justifyContent: "space-between",
						gap: "2rem",
					}}
				>
					Checkout
					<button onClick={onClose} style={{ padding: "0.5rem" }}>
						<Cross />
					</button>
				</div>
				<div
					style={{
						width: "100%",
						height: "0.25rem",
						backgroundColor: "var(--border)",
					}}
				/>
				<div
					className="container"
					style={{
						flexDirection: "column",
						padding: "1rem",
						width: "100%",
						gap: "1rem",
					}}
				>
					{Object.entries(items).map(([key, value]) => (
						<div
							className="container"
							style={{
								flexDirection: "row",
								gap: "1rem",
								alignItems: "center",
								width: "100%",
								height: "100%",
							}}
						>
							<div
								className="container"
								style={{
									height: "4rem",
									aspectRatio: "1/1",
									position: "relative",
									overflow: "hidden",
									backgroundColor: "var(--background)",
									borderRadius:
										"calc(var(--defaultBorderRadius) * 0.75)",
								}}
							>
								<img
									src={ITEMS[key].image}
									style={{
										width: "100%",
										aspectRatio: "auto",
										position: "absolute",
									}}
								/>
							</div>
							<div
								className="container"
								style={{ alignItems: "start", flexGrow: 1 }}
							>
								<div style={{ fontWeight: 500 }}>
									{ITEMS[key].title}
								</div>
								<div style={{ opacity: 0.5 }}>
									{ITEMS[key].description}
								</div>
							</div>
							<div className="container">
								<div style={{ opacity: 0.5 }}>
									${ITEMS[key].price.toFixed(2)} x{value}
								</div>
								<div>
									= ${(ITEMS[key].price * value).toFixed(2)}
								</div>
							</div>
						</div>
					))}
				</div>
				<div
					style={{
						width: "100%",
						height: "0.25rem",
						backgroundColor: "var(--border)",
					}}
				/>
				<div className="container" style={{ flexDirection: "row", justifyContent: "space-evenly", width: "100%"}}>
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "1fr 1fr",
							gap: "0.5rem",
						}}
					>
						<span style={{ fontWeight: 500, textAlign: "right" }}>
							Sub Total:
						</span>
						${subtotal.toFixed(2)}
						<span style={{ fontWeight: 500, textAlign: "right" }}>
							Tax:
						</span>
						${(subtotal * 0.125).toFixed(2)}
						<span style={{ fontWeight: 500, textAlign: "right" }}>
							Total:
						</span>
						${(subtotal * 0.125 + subtotal).toFixed(2)}
					</div>
					<div>
						<IconTextButton
							className="accentedButtonLike"
							href={"https://ko-fi.com/smithed"}
							text="Buy"
							icon={ShoppingCart}
							reverse
						/>
					</div>
				</div>
				<p style={{ fontSize: "0.5rem", opacity: 0.5, maxWidth: "28rem" }}>
					Smithed™ makes no guarantee that items will arrive to their
					destination, be what was ordered, or exist at all. By simply
					seeing this checkout page you have automatically accepted
					these terms. P.S. Smithie loves you. P.P.S. Smithie will see
					you at the next summit. P.P.P.S. Smithie has hidden their
					treasure, its all yours! You just have to find it!
				</p>
			</div>
		</div>
	)
}

export default function MerchPage() {
	const order = useRef<Record<string, number>>()
	const [items, setItems] = useState<Record<string, number>>({})
	const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

	if (!order.current) {
		order.current = {}
		Object.keys(ITEMS).forEach(
			(k) => (order.current![k] = Math.random() - 0.5)
		)
	}

	let totalItems = 0
	Object.values(items).map((v) => (totalItems += v))

	return (
		<div
			className="container"
			style={{
				width: "100%",
				boxSizing: "border-box",
				justifyContent: "safe start",
				gap: "4rem",
				paddingBottom: 80,
			}}
		>
			<div
				className="container"
				style={{ width: "100%", alignItems: "end" }}
			>
				<IconTextButton
					icon={ShoppingCart}
					text="Checkout"
					className="accentedButtonLike"
					disabled={totalItems === 0}
					reverse
					onClick={() => setIsCheckoutOpen(true)}
				/>
			</div>
			<div
				style={{
					display: "grid",
					gap: "2rem",
					gridTemplateColumns:
						"repeat(auto-fill, minmax(20rem, 1fr))",
					width: "100%",
				}}
			>
				{Object.entries(ITEMS)
					.sort((a, b) => order.current![a[0]] - order.current![b[0]])
					.map(([key, value]) => (
						<MerchCard
							item={value}
							onClick={() =>
								setItems({
									...items,
									[key]: (items[key] ?? 0) + 1,
								})
							}
						/>
					))}
			</div>
			{isCheckoutOpen && (
				<CheckoutScreen
					items={items}
					onClose={() => setIsCheckoutOpen(false)}
				/>
			)}
		</div>
	)
}
