"use client";

// This file defines a React component that creates a typing animation effect.
// The TypingEffect component types out the text 'comms//' one character at a time,
// and then calls an optional onComplete callback function once the typing animation is finished.

import StyleSheet from '@/styles/animated-comms.module.css';
import React, { useState, useEffect } from 'react';

const cursor = <span className={StyleSheet.cursor}>_</span>;
// Defining a cursor element using a span tag with the class 'cursor' from the CSS module.

const TypingEffect = ({onComplete}) => {
    const [text, setText] = useState('');
    // Declaring a state variable 'text' initialized to an empty string
    // setText is a function that will update the text state

    const fullText = 'comms//';
    
    const [index, setIndex] = useState(0);
    // Index will be used to keep track of the characters being typed out

    // Using the useEffect hook to perform side effects in the component.
    useEffect(()=>{
        if(index<fullText.length){
            // Checking if the current index is less than the length of the fullText string
            const timeout = setTimeout(()=>{
                setText(text + fullText[index]);
                setIndex(index + 1);
            }, 80);
            // Timeout Variable set to 80 milliseconds
            // Change timeout in line 26 to customize
            return () => clearTimeout(timeout);
            // Cleaning up the timeout to avoid memory leaks

        } else {
            // If the entire text has been typed out
            
            const timeoutId=setTimeout(() => {
                document.getElementById('js-typing').classList.add(StyleSheet.removeAnimation);
                if(onComplete){
                    //checking if oncomplete is provided
                    onComplete();
                    //call the function
                }
            }, 250);
            // Setting a timeoutId to call the onComplete function after 1 second
            return () => clearTimeout(timeoutId);
        }
        
    },[text,index]);

    return <p id="js-typing" className={StyleSheet.typer}>{text}{cursor}</p>
}

export default TypingEffect;