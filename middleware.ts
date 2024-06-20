// src/middleware.ts
import { withAuth } from "next-auth/middleware";

export default withAuth({
    pages: {
        signIn: "/auth/signin", // Redirect to this page if not authenticated
    },
});

export const config = { matcher: ["/api/meal-plan"] }; // Adjust the matcher to include all routes you want to protect
