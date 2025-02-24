"use client"
import AnimatedComms from '@/components/animator-comms';
import Styles from '@/styles/homePage.module.css';
import React,{useState} from 'react';
import StartSession from "@/components/start-session";
// State Variable 'styles' and its setter function 'setStyles' initialized to 'Styles.centerTyper'.

export default function Home() {

  const fadeIn=()=>{
    const logOnElement = document.getElementById('LogOn');
    logOnElement.classList.add(Styles.fadeIn);
    logOnElement.classList.remove(Styles.disableElement);
  }
  return (
    <body>
      <div className={Styles.Center}>
        <div className={Styles.Typer}>
          <AnimatedComms onComplete={fadeIn}/> 
        </div>
        <div id="LogOn" className={`${Styles.LogOn} ${Styles.disableElement}`}>
          <StartSession />
        </div>
      </div>
    </body>
  );
}
