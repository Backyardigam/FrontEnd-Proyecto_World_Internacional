import React, { useEffect, useState } from "react";

export default function ButtonUser(){
    const [user, setUser]=useState(null)
    useEffect(()=>{
        const stored=localStorage.getItem("user");
        if (stored){
            try{
                setUser(JSON.parse(stored));
            }
            catch{
                setUser(null)
            }
        }
    },[]);
    
    const handleLogout= () =>{
        localStorage.removeItem("user");
        setUser(null)
    };

    if (user){
        
    }
}