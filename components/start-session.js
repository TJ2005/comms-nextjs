import Logo from '@/components/Logo';
import Styles from '@/styles/start-session.module.css';
import Animator from '@/components/animator';
import { useRef } from 'react';


const animateInput=(input)=>{
    console.log(input);
    console.log("Above element is shaking");
    input.classList.add(Styles.shake);
    setTimeout(()=>{
        input.classList.remove(Styles.shake);
    },500);

}
const StartSession = () => {
    let tip = "Tip : Leaving any of the inputs empty will generate one for you.";
    const codeInputRef = useRef(null);
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        let username = event.target.username.value;
        let codeElem = codeInputRef.current;
        let code= codeInputRef.current.value;

        // generate username if not provided
        if (!username) {
            const response = await fetch('https://usernameapiv1.vercel.app/api/random-usernames');
            const data = await response.json();
            username = data.usernames[0];
        }
        // generate code if not provided or invalid
        if (!code) {
            code = generateAlphaCode(codeElem);
        } else if (code.length < 6) {
            
            animateInput(codeElem);
            return;
        }

        // Handle form submission logic here with username and code
        console.log('Username:', username);
        console.log('Code:', code);
    };

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