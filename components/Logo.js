/**
 * @file Logo.js
 * @description This file defines a React functional component named `Logo` that displays a profile picture.
 * The component changes the displayed image when the user hovers over it, using state to manage the hover effect.
 * It imports styles from a CSS module to apply specific styles to the images and the container.
 */
import React, { useState } from 'react';
import Styles from '@/styles/start-session.module.css';

const Logo = () => {
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseEnter = () => {
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return (
        <div 
            className={Styles.Logo} 
            onMouseEnter={handleMouseEnter} 
            onMouseLeave={handleMouseLeave}
        >
            <img 
                className={`${Styles.ProfilePicture} ${Styles.Profile}`} 
                src='pfp.svg' 
                height="200px" 
                width="200px" 
                alt="Profile Picture" 
            />
            <img 
                className={`${Styles.EditProfilePicture} ${Styles.Profile} ${isHovered ? Styles.fadeIn : ''}`} 
                src='pfp-edit.png' 
                height="200px" 
                width='200px' 
                alt="Edit Profile Picture" 
            />
        </div>
    );
};

export default Logo;