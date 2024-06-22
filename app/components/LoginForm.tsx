import { doSocialLogin } from "@/app/actions";

const LoginForm = () => {
    return (
        <form action={doSocialLogin}>
            <button className="bg-pink-400 text-white p-1 rounded-md m-1 text-lg" type="submit" name="action" value="google">
                Sign In
            </button>
        </form>
    );
};

export default LoginForm;