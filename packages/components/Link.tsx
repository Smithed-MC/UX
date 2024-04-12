import * as reactRouter from "react-router-dom";


export default function Link(props: reactRouter.LinkProps) {
    return <reactRouter.Link {...props} reloadDocument={props.reloadDocument ?? !import.meta.env.TAURI}/>
}