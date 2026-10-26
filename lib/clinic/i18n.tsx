'use client';
import React,{createContext,useContext,useEffect,useState} from 'react';
import {Locale,locales} from './types';
import {translate} from './messages';
const Context=createContext<{locale:Locale;setLocale:(l:Locale)=>void;t:(key:string,vars?:Record<string,string|number>)=>string}>({locale:'en',setLocale:()=>{},t:k=>k});
export function LocaleProvider({children,initial}:{children:React.ReactNode;initial?:Locale}){
  const [locale,setLanguage]=useState<Locale>(initial||'en');
  useEffect(()=>{if(initial){setLanguage(initial);return;}try{const saved=localStorage.getItem('aurea-language');if(saved&&locales.includes(saved as Locale))setLanguage(saved as Locale);}catch{}},[initial]);
  useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==='ar'?'rtl':'ltr';},[locale]);
  const setLocale=(l:Locale)=>{setLanguage(l);try{localStorage.setItem('aurea-language',l);}catch{}};
  return <Context.Provider value={{locale,setLocale,t:(k,v)=>translate(locale,k,v)}}>{children}</Context.Provider>;
}
export const useLocale=()=>useContext(Context);
