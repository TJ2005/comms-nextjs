import Logo from '@/components/Logo';
import Styles from '@/styles/start-session.module.css';
import Animator from '@/components/animator';
import { useRef } from 'react';
import Cookies from 'js-cookie';

// Function to handle shaking animation on input fields when there's an error
const animateInput = (input) => {
    console.log("Shaking input field:", input);
    input.classList.add(Styles.shake);
    setTimeout(() => {
        input.classList.remove(Styles.shake);
    }, 500);
};

// Main component to handle the session creation or joining
const StartSession = () => {
    const codeInputRef = useRef(null);
    let tip = "Tip : Leaving any of the inputs empty will generate one for you.";

    // Function to handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        let username = event.target.username.value;
        let code = codeInputRef.current.value;

        // Generate a random username if not provided by the user
        if (!username) {
            const response = await fetch('https://usernameapiv1.vercel.app/api/random-usernames');
            const data = await response.json();
            username = data.usernames[0];
            console.log(`Generated random username: "${username}"`);
        }

        // Generate session code if not provided or invalid
        if (!code) {
            code = generateAlphaCode();
            console.log('Generated new session code:', code);
        } else if (code.length < 6) {
            console.log('Session code is invalid, triggering shake animation.');
            animateInput(codeInputRef.current);
            return;
        }
        
        console.log(`Handling form submission with username: "${username}" and sessionCode: "${code}"`);

        const response = await fetch('/api/Auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Ensures cookies are sent and received
            body: JSON.stringify({ username, sessionCode: code }),
        });

        if (response.ok) {
            localStorage.setItem('username', username);
            localStorage.setItem('sessionCode', code);
            console.log('Username and session code saved to local storage.');
        } else {
            console.log('Failed to authenticate.');
        }
    };

        

    // Function to generate a random alphanumeric session code
    const generateAlphaCode = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    };

    return (
        <div id="user-page" className={Styles.Container}>
            <Logo className={Styles.logo}/>
            <div className="gFrame show-animator">
                <form className={Styles.formDesign} onSubmit={handleSubmit}>
                    <br />
                    <br />
                    <input className={Styles.input} type="text" id="username" name="username" placeholder="username" autoFocus />
                    <br />
                    <div className={Styles.gButton}>
                        <div className="enCode">
                            <input ref={codeInputRef} className={`${Styles.input} ${Styles.codeInput}`} type="text" id="code" name="code" placeholder="Enter Code" />
                        </div>
                        <div className={Styles.goContainer}>
                            <input type="submit" value="Go" className={Styles.goButton}/>
                        </div>
                    </div>
                </form>
            </div>
            <div className={Styles.tips}>
                <Animator textToAnimate={tip} startDelay={600} typingDelay={10}/>
            </div>
        </div>
    );
};

export default StartSession;
