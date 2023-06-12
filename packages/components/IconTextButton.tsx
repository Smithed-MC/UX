import { ButtonHTMLAttributes, FunctionComponent, SVGProps } from "react";

interface IconTextButtonProps {
    text: string,
    icon?: FunctionComponent<SVGProps<SVGSVGElement>> | string,
    iconElement?: JSX.Element
    reverse?: boolean
}

export function IconTextButton({text, icon: IconSvg, iconElement, reverse, href, style, ...props}: IconTextButtonProps & any ) {
    return <a className={"buttonLike " + props.className} style={{flexDirection: reverse ? 'row-reverse' : 'row', ...style}} href={href}>
        {IconSvg !== undefined && typeof(IconSvg) === 'string' && IconSvg}
        {IconSvg !== undefined && typeof(IconSvg) !== 'string' && <IconSvg/>}
        {iconElement !== undefined && iconElement}
        <div style={{width: 2, height: 20, opacity: 0.15, backgroundColor: 'white'}}/>
        {text}
    </a>
}