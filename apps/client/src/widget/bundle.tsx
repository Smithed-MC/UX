import { ChooseBox, IconInput, IconTextButton } from "components";
import { Edit, Check, Cross, Account } from "components/svg";
import { HTTPResponses, MinecraftVersion, PackBundle, supportedMinecraftVersions } from 'data-types';
import { useAppDispatch, useAppSelector, useFirebaseUser } from "hooks";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { selectUsersBundles, setSelectedBundle, setUsersBundles } from "store";

interface CreateBundleProps {
    close?: () => void,
    finish?: (bundle: PackBundle) => void,
    showCloseButton?: boolean,
    showEditButton?: boolean,
    minecraftVersion?: MinecraftVersion
}

export function CreateBundle({ close, minecraftVersion, showCloseButton, showEditButton, finish: finishCallback }: CreateBundleProps) {
    const [name, setName] = useState<string>()
    const [version, setVersion] = useState<MinecraftVersion>()

    const user = useFirebaseUser()
    const bundles = useAppSelector(selectUsersBundles)

    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const finish = async () => {
        if (name === undefined)
            return undefined
        if (version === undefined && minecraftVersion === undefined)
            return undefined

        const bundleData: PackBundle = {
            owner: user?.uid ?? '',
            version: minecraftVersion ?? version ?? '',
            name: name,
            packs: [],
            public: false
        }

        const resp = await fetch(`https://api.smithed.dev/v2/bundles?token=${await user?.getIdToken()}`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                data: bundleData
            })
        })

        if (resp.status !== HTTPResponses.CREATED)
            return undefined

        const { uid } = await resp.json()
        bundleData.uid = uid

        dispatch(setUsersBundles([bundleData].concat(bundles)))
        if (finishCallback)
            finishCallback(bundleData)
        return uid
    }
    const finishAndEdit = async () => {
        const uid = await finish()
        if (uid === undefined)
            return
        dispatch(setSelectedBundle(uid))

        navigate(`/browse`)
    }

    if(user == null) {
        return <div className="container" style={{gap: '1rem'}}>
            <label style={{fontWeight: 600}}>You must login to create a bundle</label>
            <div className="container" style={{flexDirection: 'row', gap: '1rem'}}>
                <IconTextButton className="invalidButtonLike" icon={Cross} text={"Cancel"} onClick={close}/>
                <IconTextButton icon={Account} text={"Login"} href="/account"/>
            </div>
        </div>
    }

    return <div className="container" style={{ gap: '1rem', width: '100%' }}>
        <label style={{ fontWeight: 600 }}>Create a bundle</label>
        <IconInput style={{ width: '100%', zIndex: 1 }} type="text" icon={Edit} placeholder='Name...' onChange={(e) => setName(e.currentTarget?.value)} />
        {!minecraftVersion && <ChooseBox style={{ zIndex: 100 }} onChange={(v) => setVersion(v as string)} placeholder="Version" choices={supportedMinecraftVersions.map(v => ({ value: v, content: v }))} />}
        <div className='container' style={{ flexDirection: 'row', width: '100%', gap: 16 }}>
            {showCloseButton && <IconTextButton className="invalidButtonLike" icon={Cross} text="Cancel" onClick={close} />}
            <IconTextButton className="accentedButtonLike" icon={Check} text="Finish" onClick={finish} />
            {showEditButton && <IconTextButton className="accentedButtonLike" icon={Edit} text="Edit" onClick={finishAndEdit} />}
        </div>
    </div>
}
