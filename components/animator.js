/*

// This file defines a React component called TypingEffect that animates the typing of a given text string.
// The component takes in several props: textToAnimate, typingDelay, completionDelay, startDelay, and onComplete.
// It uses useState and useEffect hooks to manage the typing animation and cursor display.
// The text is typed out one character at a time with a specified delay, and a cursor is shown at the end of the text.

*/
"use client";
import React, { useState, useEffect } from 'react';
import StyleSheet from '@/styles/animated-comms.module.css';

const TypingEffect = ({ textToAnimate, typingDelay = 80, completionDelay = 1000, startDelay = 0, onComplete }) => {
    const [text, setText] = useState('');
    const [index, setIndex] = useState(0);
    const [started, setStarted] = useState(false);
    const [cursor, setCursor] = useState(false);

    useEffect(() => {
        const startTimeout = setTimeout(() => {
            setStarted(true);
        }, startDelay);

        return () => clearTimeout(startTimeout);
    }, [startDelay]);

    useEffect(() => {
        if (!started) return;

        if (index < textToAnimate.length) {
            const timeout = setTimeout(() => {
                setText(text + textToAnimate[index]);
                setIndex(index + 1);
            }, typingDelay);
            return () => clearTimeout(timeout);
        } else {
            const timeoutId = setTimeout(() => {
                if (onComplete) {
                    onComplete();
                }
                setCursor(true);
                console.log("cursor is being disabled.")
            }, completionDelay);
            return () => clearTimeout(timeoutId);
        }
    }, [text, index, textToAnimate, typingDelay, completionDelay, onComplete, started]);

    return <p>{text}<span id="cursor" className={`${StyleSheet.cursor} ${cursor ? StyleSheet.disabled : ''}`}>_</span></p>;

}

export default TypingEffect;
