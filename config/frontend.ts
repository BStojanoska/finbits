import SuperTokens from "supertokens-web-js";
import Session from "supertokens-web-js/recipe/session";
import { appInfo } from "./appInfo";

export function initSuperTokensUI() {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    (window as any).supertokensUIInit("supertokensui", {
        appInfo,
        recipeList: [
            (window as any).supertokensUIThirdParty.init({
                signInAndUpFeature: {
                    providers: [
                        (window as any).supertokensUIThirdParty.Google.init(),
                    ],

                },
            }),
            (window as any).supertokensUISession.init(),
        ],
    });
}

export function initSuperTokensWebJS() {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    SuperTokens.init({
        appInfo,
        recipeList: [Session.init()],
    });
}
