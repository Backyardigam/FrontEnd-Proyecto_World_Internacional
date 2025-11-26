interface ButonProps{
    text:string;
    style?:string;
    onPress?: ()=>void;
}
export default function Boton({text,style,onPress}:ButonProps){
    const defaulStyle=" text-sm hover:opacity-50 text-white rounded-sm w-fit h-fit px-2 py-1"
    style+=defaulStyle;
    return(
        <button className={style} onClick={onPress}>
            {text}
        </button>
    )
}