import { Link } from "react-router-dom"
import './PageSelector.css'

export default function PageSelector({
	totalItems,
	currentPage,
	params,
    itemsPerPage,
	onChange
}: {
	totalItems: number
	currentPage: number
	params: URLSearchParams
    itemsPerPage: number
	onChange?: () => void
}) {
	const numberOfPages = Math.ceil(totalItems / itemsPerPage)

	const formatSelected = (page: number) => `[${page}]`

	currentPage = Math.max(1, Math.min(currentPage, numberOfPages))

	let pageLinks = []

	for (let p = 1; p <= numberOfPages; p++) {
		pageLinks.push(
			<Link
				key={"pageButton" + p}
				className={`pageSelectorButton ${currentPage === p ? "selected" : ""}`}
				to={`?page=${p}&` + params}
				onClick={p !== currentPage ? onChange : undefined}
				unstable_viewTransition
			>
				{p}
			</Link>
		)
	}

	return (
		<div
			className="container"
			key="pages"
			style={{
				flexDirection: "row",
				gap: "0.25rem",
				width: "100%",
				justifyContent: "center",
				flexWrap: 'wrap',
			}}
		>
			{pageLinks}
		</div>
	)
}