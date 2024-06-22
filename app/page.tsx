import App from "@/app/components/App";

import LoginForm from "@/app/components/LoginForm";
import {auth} from "@/auth";


export default async function Home() {

    const session = await auth();

    if (session?.user) {
        return (
            <App/>
        );
    }
    else {
        return (
            <div className="flex flex-col justify-center items-center m-4">
                <LoginForm />
            </div>
        );
    }


}
