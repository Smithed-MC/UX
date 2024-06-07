import { useEffect } from "react";
import * as reactRouter from "react-router-dom";


export default function Link(props: reactRouter.LinkProps) {
    const reloadDocument = props.reloadDocument ?? !import.meta.env.TAURI;

    return <reactRouter.Link {...props} reloadDocument={reloadDocument}/>
}