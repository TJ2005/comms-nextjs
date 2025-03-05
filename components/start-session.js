import Logo from '@/components/Logo';
import Styles from '@/styles/start-session.module.css';
import Animator from '@/components/animator';
import { useRef } from 'react';
import Cookies from 'js-cookie';

// Function to set a new username-userId pair in the cookie
const setUserPairCookie = (username, userId) => {
    const options = {
        expires: 1, // Cookie will expire in 1 day
        secure: true, // Ensure the cookie is only sent over HTTPS
        sameSite: 'Strict', // Prevent CSRF attacks
    };

    // Retrieve existing user pairs from the cookie, if any
    const existingPairs = Cookies.get('userPairs');
    let userPairs = existingPairs ? JSON.parse(existingPairs) : [];

    // Check if the pair already exists, if not, add it
    if (!userPairs.some(pair => pair.userId === userId && pair.username === username)) {
        userPairs.push({ username, userId });
        console.log(`User pair for username: "${username}" and userId: "${userId}" added to the pairs.`);
    } else {
        console.log(`User pair for username: "${username}" already exists in the cookie.`);
    }

    // Save updated user pairs back into the cookie
    try {
        Cookies.set('userPairs', JSON.stringify(userPairs), options);
        console.log('User pairs saved to cookie:', Cookies.get('userPairs'));
    } catch (error) {
        console.error('Error saving user pair to cookie:', error);
    }
};

// Function to retrieve userId based on the provided username from the cookie
const getUserIdFromCookie = (username) => {
    const userPairs = JSON.parse(Cookies.get('userPairs') || '[]');
    const userPair = userPairs.find(pair => pair.username === username);
    if (userPair) {
        console.log(`UserId for username: "${username}" found in cookie: ${userPair.userId}`);
        return userPair.userId;
    }
    console.log(`UserId for username: "${username}" not found in cookie.`);
    return null;
};

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

        console.log(`Handling form submission with username: "${username}" and code: "${code}"`);

        // Check if user already exists in cookies
        const userId = getUserIdFromCookie(username);

        if (userId) {
            console.log(`User "${username}" exists in cookies. Joining session.`);
            // If the user exists, join the session
            const response = await fetch('/api/createOrJoinSession', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId:userId, sessionCode: code }),
            });
            const result = await response.json();
            console.log('Session join result:', result);
            console.log(`Joined session with session ID: ${result.sessionId}`);
        } else {
            console.log(`User "${username}" doesn't exist in cookies. Creating a new user.`);
            // If the user doesn't exist, create a new user and then join the session
            const userResponse = await fetch('/api/newUser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username }),
            });
            const newUser = await userResponse.json();
            const newUserId = newUser.userId;
            console.log(`New user created with userId: ${newUserId}`);

            const sessionResponse = await fetch('/api/createOrJoinSession', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: newUserId, sessionCode: code }),
            });
            const sessionResult = await sessionResponse.json();
            const sessionId = sessionResult.sessionId;
            console.log(`New session created with session ID: ${sessionId}`);

            // Store user and session data in cookies
            setUserPairCookie(username, newUserId);
            Cookies.set('sessionId', sessionId, { expires: 1, secure: true, sameSite: 'Strict' });
            console.log('User added to cookies and session ID stored.');
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
