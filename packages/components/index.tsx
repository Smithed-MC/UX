import Spinner from "./Spinner"
import * as svg from "./svg"
import "./style.css"
import ErrorPage from "./PageError"
import MarkdownRenderer, { markdownComponents } from "./MarkdownRenderer"
import { RootError } from "./RootError"
import FilterButton from "./FilterButton"
import SvgButton from "./SvgButton"
import CategoryBar, { CategoryChoice } from "./CategoryBar"
import { DownloadButton } from "./DownloadButton"
import Modal from "./Modal"
import Link from "./Link"
import loadable from "@loadable/component"

const config = {ssr: import.meta.env.SSR }

export const NavButton = loadable(() => import('./NavButton'), config)
export const NavBar = loadable(() => import('./NavBar'), config)
export const PackCard = loadable(() => import('./PackCard'), config)
export const IconTextButton = loadable(() => import('./IconTextButton'), config)
export const IconInput = loadable(() => import('./IconInput'), config)
export const GalleryPackCard = loadable(() => import('./GalleryPackCard'), config)
export const ChooseBox = loadable(() => import('./ChooseBox'), config)

export {
	Spinner,
	svg,
	ErrorPage,
	MarkdownRenderer,
	markdownComponents as markdownOptions,
	RootError,
	FilterButton,
	SvgButton,
	CategoryBar,
	CategoryChoice,
	type DownloadButton,
	Modal,
	Link
}
