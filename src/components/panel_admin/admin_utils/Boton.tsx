import React from 'react';

// Extiende las propiedades de un botón HTML nativo
interface ButonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    text: string;
    styleClass?: string;
    onPress?: () => void; // Mantenemos onPress para compatibilidad con clics simples
}

export default function Boton({ text, styleClass, onPress, ...props }: ButonProps) {
    const defaultStyle = " text-sm hover:opacity-50 text-white rounded-sm w-fit h-fit px-2 py-1";
    const finalStyle = `${styleClass || ''} ${defaultStyle}`;
    return (
        <button className={finalStyle} onClick={onPress} {...props}>
            {text}
        </button>
    )
}