import React from 'react';
import Head from 'next/head';
import styles from '../styles/Home.mowdule.css';

export default function Home() {
    return (
        <div className={styles.container}>
            <div className={styles.codeContainer}>
                <p>Code : </p>
            </div>
        </div>
    );
}