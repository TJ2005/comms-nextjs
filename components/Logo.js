import React, { useState } from 'react';
import Styles from '@/styles/logo.module.css';

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
                className={Styles.ProfilePicture} 
                src='pfp.svg' 
                height="200px" 
                width="200px"
                alt="Profile Picture" 
            />
            <img 
                className={`${Styles.EditProfilePicture} ${isHovered ? Styles.fadeIn : ''}`} 
                src='pfp-edit.png' 
                height="200px" 
                width='200px' 
                alt="Edit Profile Picture" 
            />
        </div>
    );
};

export default Logo;