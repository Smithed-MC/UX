import { useParams } from "react-router-dom";
import { Bundle } from "./user";

export default function Bundles() {
    const { bundleId } = useParams()

    if (!bundleId) 
        return <div></div>

    return <div className="container" style={{width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', position: 'absolute', left: 0, top: 0}}>
        <div className="container" style={{maxWidth: '75%'}}>
            <Bundle id={bundleId} editable={false} showOwner/>
        </div>
    </div>
}