import React, { useState } from 'react'
import { Download } from './svg'
import saveAs from 'file-saver'
import Spinner from './Spinner'
interface DownloadButtonProps {
    link: string
}

export type DownloadButton = (props: {
    id: string,
    openPopup: (element: JSX.Element) => void,
    closePopup: () => void,
    [key: string]: any
}) => JSX.Element;