import React from "react";
import './filterButton.css'

interface FilterButtonProps {
    children: React.ReactNode,
    selected?: boolean,
    onClick: () => void
}

export default function FilterButton({onClick, ...props}: FilterButtonProps) {
    let [selected, setSelected] = React.useState(false);

    return <a style={{ display: 'flex', alignItems: 'baseline', flexDirection: 'row' }} className={`filter-button${selected ? " selected" : ""}`} onClick={() => {
        setSelected(!selected);
        onClick();
    }} >
        {props.children}
    </a>
}