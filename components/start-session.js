import Logo from '@/components/Logo';
import Styles from '@/styles/start-session.module.css';
import Animator from '@/components/animator';
const animateInput=(input)=>{

}
const StartSession = () => {
    const handleSubmit = async (event) => {
        event.preventDefault();
        
        let username = event.target.username.value;
        let code = event.target.code.value;

        if (!username) {
            const response = await fetch('https://usernameapiv1.vercel.app/api/random-usernames');
            const data = await response.json();
            username = data.usernames[0];
        }

        if (!code) {
            code = generateAlphaCode();
        } else if (code.length < 6 || !/\d/.test(code)) {
            animateInput();
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
                            <input className={`${Styles.input} ${Styles.codeInput}`} type="text" id="code" name="code" placeholder="Enter Code" />
                        </div>
                        <div className={Styles.goContainer}>
                            <input type="submit" value="Go" className={Styles.goButton}/>
                        </div>
                    </div>
                </form>
            </div>
            <div className={Styles.tips}>
                <Animator textToAnimate={"Tip : Leaving any of the inputs empty will generate one for you."} startDelay={600} typingDelay={10}/>
            </div>
        </div>
    );
};

export default StartSession;