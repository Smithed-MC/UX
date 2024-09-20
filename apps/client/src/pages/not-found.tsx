import { IconTextButton } from "components"
import { Discord, Home } from "components/svg"
import { HTTPResponses } from "data-types"
import { useQueryParams } from "hooks"
import { isRouteErrorResponse, useLocation, useRouteError } from "react-router-dom"

export default function NotFound() {
    const error = useRouteError()
    const location = useLocation()

    if (!isRouteErrorResponse(error) || error.status !== HTTPResponses.NOT_FOUND)
        throw error

	return (
		<div className="container" style={{height: "100%"}}>
			<h2>Sorry the requested page could not be found!</h2>
			<h3>
				If you think that page '{location.pathname.slice(1)}' should be valid, please report
				it on our <a href="https://github.com/Smithed-MC/UX">Github</a>{" "}
				or our <a href="/discord">Discord</a>
			</h3>
            <div className="container" style={{flexDirection: "row", gap: "1rem"}}>
                <IconTextButton icon={Discord} text="Go to Discord" href="/discord"/>
                <IconTextButton className="accentedButtonLike" icon={Home} text="Go Home" href="/"/>
            </div>
		</div>
	)
}
