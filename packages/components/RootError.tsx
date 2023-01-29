import { useRouteError } from "react-router-dom";

export function RootError() {
    const error: any = useRouteError()

    console.error(error)
    return <div>
        {error.message}
    </div>
}