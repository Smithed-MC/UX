import { HTTPResponses } from "data-types"
import { useRouteError, Link } from "react-router-dom"

export default function Error() {
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
