"use client"
import AnimatedComms from '@/components/animator-comms';
import Styles from '@/styles/homePage.module.css';
import React, { useState } from 'react';
import StartSession from "@/components/start-session";
import { motion } from "framer-motion";

export default function Home() {
  const [showLogOn, setShowLogOn] = useState(false);

  const fadeIn = () => {
    setShowLogOn(true);
  };

  return (
    <div className={Styles.Center}>
      <div className={Styles.Typer}>
        <AnimatedComms onComplete={fadeIn} />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showLogOn ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className={Styles.LogOn}
      >
        {showLogOn && <StartSession />}
      </motion.div>
    </div>
  );
}